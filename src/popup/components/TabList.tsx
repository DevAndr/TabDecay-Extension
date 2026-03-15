import { useState, useEffect, useCallback } from "react";
import { TabItem } from "./TabItem";
import { Trash2, Loader2, Inbox } from "lucide-react";
import type { StaleTab, TabSettings } from "../../types";

export function TabList() {
  const [staleTabs, setStaleTabs] = useState<StaleTab[]>([]);
  const [settings, setSettings] = useState<TabSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTabs = useCallback(() => {
    chrome.runtime.sendMessage({ type: "GET_STALE_TABS" }, (res) => {
      if (res) {
        setStaleTabs(res.stale || []);
        setSettings(res.settings || null);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

  const handleSnooze = (tabId: number) => {
    chrome.runtime.sendMessage({ type: "SNOOZE_TAB", tabId }, () => {
      setStaleTabs((prev) => prev.filter((t) => t.tabId !== tabId));
    });
  };

  const handleClose = (tabId: number) => {
    chrome.runtime.sendMessage({ type: "CLOSE_TAB", tabId }, () => {
      setStaleTabs((prev) => prev.filter((t) => t.tabId !== tabId));
    });
  };

  const handleGoTo = (tabId: number) => {
    chrome.tabs.update(tabId, { active: true });
    window.close();
  };

  const handleCloseAll = () => {
    chrome.runtime.sendMessage({ type: "CLOSE_ALL_STALE" }, () => {
      setStaleTabs([]);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  const thresholdHours = settings?.thresholdHours ?? 48;

  return (
    <div className="flex flex-col">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/50 border-b border-zinc-800/50">
        <span className="text-xs text-zinc-400">
          {staleTabs.length > 0
            ? `${staleTabs.length} ${declOfNum(staleTabs.length, ["вкладка", "вкладки", "вкладок"])} старше ${thresholdHours}ч`
            : "Все вкладки свежие"}
        </span>
        {staleTabs.length > 0 && (
          <button
            onClick={handleCloseAll}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Закрыть все
          </button>
        )}
      </div>

      {/* Tab list */}
      {staleTabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-3">
          <Inbox className="w-10 h-10 text-zinc-700" />
          <p className="text-sm">Нет устаревших вкладок</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-800/50">
          {staleTabs.map((tab) => (
            <TabItem
              key={tab.tabId}
              tab={tab}
              thresholdMs={thresholdHours * 60 * 60 * 1000}
              onSnooze={handleSnooze}
              onClose={handleClose}
              onGoTo={handleGoTo}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function declOfNum(n: number, titles: [string, string, string]): string {
  const cases = [2, 0, 1, 1, 1, 2];
  return titles[
    n % 100 > 4 && n % 100 < 20 ? 2 : cases[Math.min(n % 10, 5)]
  ];
}
