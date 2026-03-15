// ============================================================
// Tab Decay — Background Service Worker
// ============================================================

import type { TabSettings, TabData, TabEntry, StaleTab, BackgroundMessage } from "../types";

const DEFAULT_SETTINGS: TabSettings = {
    thresholdHours: 48,
    checkIntervalMinutes: 30,
    bookmarkFolderName: "Tab Decay — Закрытые",
    enabled: true
};

// ---- Helpers ------------------------------------------------

async function getSettings(): Promise<TabSettings> {
    const data = await chrome.storage.local.get("settings");
    return { ...DEFAULT_SETTINGS, ...(data.settings as Partial<TabSettings> || {}) };
}

async function getTabData(): Promise<TabData> {
    const data = await chrome.storage.local.get("tabData");
    return (data.tabData as TabData) || {};
}

async function saveTabData(tabData: TabData): Promise<void> {
    await chrome.storage.local.set({ tabData });
}

// ---- Tab tracking -------------------------------------------

chrome.tabs.onCreated.addListener(async (tab: chrome.tabs.Tab) => {
    const tabData = await getTabData();
    if (tab.id == null) return;
    tabData[tab.id] = {
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        url: tab.url || tab.pendingUrl || "",
        title: tab.title || ""
    };
    await saveTabData(tabData);
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tabData = await getTabData();
    if (tabData[activeInfo.tabId]) {
        tabData[activeInfo.tabId].lastAccessed = Date.now();
    }
    await saveTabData(tabData);
    updateBadge();
    updateFavicons();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const tabData = await getTabData();
    if (!tabData[tabId]) {
        tabData[tabId] = {
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            url: "",
            title: ""
        };
    }
    if (changeInfo.url) tabData[tabId].url = changeInfo.url;
    if (changeInfo.title) tabData[tabId].title = changeInfo.title;
    if (changeInfo.status === "complete") {
        tabData[tabId].url = tab.url || tabData[tabId].url;
        tabData[tabId].title = tab.title || tabData[tabId].title;
    }
    await saveTabData(tabData);
});

chrome.tabs.onRemoved.addListener(async (tabId: number) => {
    const tabData = await getTabData();
    delete tabData[tabId];
    await saveTabData(tabData);
    updateBadge();
});

// ---- Init existing tabs on install / startup ----------------

async function initExistingTabs(): Promise<void> {
    const tabs = await chrome.tabs.query({});
    const tabData = await getTabData();
    for (const tab of tabs) {
        if (tab.id == null) continue;
        if (!tabData[tab.id]) {
            tabData[tab.id] = {
                createdAt: Date.now(),
                lastAccessed: tab.lastAccessed || Date.now(),
                url: tab.url || "",
                title: tab.title || ""
            };
        }
    }
    // Clean up entries for tabs that no longer exist
    const existingIds = new Set(tabs.map(t => t.id));
    for (const id of Object.keys(tabData)) {
        if (!existingIds.has(Number(id))) {
            delete tabData[id];
        }
    }
    await saveTabData(tabData);
}

chrome.runtime.onInstalled.addListener(() => {
    initExistingTabs();
    setupAlarm();
});

chrome.runtime.onStartup.addListener(() => {
    initExistingTabs();
    setupAlarm();
});

// ---- Periodic check via alarms ------------------------------

async function setupAlarm(): Promise<void> {
    const settings = await getSettings();
    chrome.alarms.create("tabDecayCheck", {
        periodInMinutes: settings.checkIntervalMinutes
    });
}

chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
    if (alarm.name === "tabDecayCheck") {
        await updateBadge();
        await updateFavicons();
    }
});

// ---- Badge --------------------------------------------------

async function updateBadge(): Promise<void> {
    const settings = await getSettings();
    if (!settings.enabled) {
        chrome.action.setBadgeText({ text: "" });
        return;
    }

    const stale = await getStaleTabs(settings);
    const count = stale.length;

    chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
    chrome.action.setBadgeBackgroundColor({
        color: count > 10 ? "#E53935" : count > 5 ? "#FB8C00" : "#43A047"
    });
}

// ---- Stale tabs list ----------------------------------------

async function getStaleTabs(settings: TabSettings): Promise<StaleTab[]> {
    const tabData = await getTabData();
    const thresholdMs = settings.thresholdHours * 60 * 60 * 1000;
    const now = Date.now();
    const stale: StaleTab[] = [];

    for (const [idStr, data] of Object.entries(tabData)) {
        const age = now - data.lastAccessed;
        if (age >= thresholdMs) {
            stale.push({
                tabId: Number(idStr),
                ...data,
                ageMs: age
            });
        }
    }

    stale.sort((a, b) => b.ageMs - a.ageMs);
    return stale;
}

// ---- Favicon decay (send message to content script) ---------

async function updateFavicons(): Promise<void> {
    const settings = await getSettings();
    if (!settings.enabled) return;

    const tabData = await getTabData();
    const thresholdMs = settings.thresholdHours * 60 * 60 * 1000;
    const now = Date.now();

    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
        if (tab.id == null) continue;
        const data = tabData[tab.id];
        if (!data) continue;

        const age = now - data.lastAccessed;
        const decay = Math.min(1, age / thresholdMs);

        if (decay > 0.2) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: "DECAY_UPDATE",
                    decay
                });
            } catch {
                // Content script not loaded (e.g. chrome:// pages)
            }
        }
    }
}

// ---- Bookmark & close ---------------------------------------

async function getOrCreateBookmarkFolder(folderName: string): Promise<string> {
    const results = await chrome.bookmarks.search({ title: folderName });
    const folder = results.find(b => b.url === undefined);
    if (folder) return folder.id;

    const created = await chrome.bookmarks.create({ title: folderName });
    return created.id;
}

async function bookmarkAndCloseTab(tabId: number): Promise<void> {
    const settings = await getSettings();
    const tabData = await getTabData();
    const data: TabEntry | undefined = tabData[tabId];
    const tab = await chrome.tabs.get(tabId).catch(() => null);

    const url = tab?.url || data?.url || "";
    const title = tab?.title || data?.title || url;

    if (url && !url.startsWith("chrome://") && !url.startsWith("chrome-extension://")) {
        const folderId = await getOrCreateBookmarkFolder(settings.bookmarkFolderName);
        await chrome.bookmarks.create({
            parentId: folderId,
            title: `[${new Date().toLocaleDateString()}] ${title}`,
            url
        });
    }

    await chrome.tabs.remove(tabId);
}

async function bookmarkAndCloseAll(tabIds: number[]): Promise<void> {
    for (const id of tabIds) {
        await bookmarkAndCloseTab(id);
    }
    await updateBadge();
}

// ---- Message handling from popup ----------------------------

chrome.runtime.onMessage.addListener((msg: BackgroundMessage, _sender, sendResponse) => {
    (async () => {
        switch (msg.type) {
            case "GET_STALE_TABS": {
                const settings = await getSettings();
                const stale = await getStaleTabs(settings);
                sendResponse({ stale, settings });
                break;
            }
            case "CLOSE_TAB": {
                await bookmarkAndCloseTab(msg.tabId);
                sendResponse({ ok: true });
                break;
            }
            case "CLOSE_ALL_STALE": {
                const settings = await getSettings();
                const stale = await getStaleTabs(settings);
                await bookmarkAndCloseAll(stale.map(t => t.tabId));
                sendResponse({ ok: true });
                break;
            }
            case "SAVE_SETTINGS": {
                await chrome.storage.local.set({ settings: msg.settings });
                await setupAlarm();
                await updateBadge();
                await updateFavicons();
                sendResponse({ ok: true });
                break;
            }
            case "GET_SETTINGS": {
                const s = await getSettings();
                sendResponse({ settings: s });
                break;
            }
            case "SNOOZE_TAB": {
                const tabData = await getTabData();
                if (tabData[msg.tabId]) {
                    tabData[msg.tabId].lastAccessed = Date.now();
                    await saveTabData(tabData);
                    await updateBadge();
                    await updateFavicons();
                }
                sendResponse({ ok: true });
                break;
            }
            default:
                sendResponse({ error: "Unknown message type" });
        }
    })();
    return true;
});
