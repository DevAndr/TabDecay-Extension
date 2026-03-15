export interface TabSettings {
  thresholdHours: number;
  checkIntervalMinutes: number;
  bookmarkFolderName: string;
  enabled: boolean;
}

export interface TabEntry {
  createdAt: number;
  lastAccessed: number;
  url: string;
  title: string;
}

export interface StaleTab extends TabEntry {
  tabId: number;
  ageMs: number;
}

export type TabData = Record<string, TabEntry>;

// Background message types
export type BackgroundMessage =
  | { type: "GET_STALE_TABS" }
  | { type: "CLOSE_TAB"; tabId: number }
  | { type: "CLOSE_ALL_STALE" }
  | { type: "SAVE_SETTINGS"; settings: TabSettings }
  | { type: "GET_SETTINGS" }
  | { type: "SNOOZE_TAB"; tabId: number };

export type DecayMessage = {
  type: "DECAY_UPDATE";
  decay: number;
};
