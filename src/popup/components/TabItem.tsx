import { RotateCcw, ExternalLink, X } from "lucide-react";
import type { StaleTab } from "../../types";

interface TabItemProps {
  tab: StaleTab;
  thresholdMs: number;
  onSnooze: (tabId: number) => void;
  onClose: (tabId: number) => void;
  onGoTo: (tabId: number) => void;
}

export function TabItem({ tab, thresholdMs, onSnooze, onClose, onGoTo }: TabItemProps) {
  const decay = Math.min(1, tab.ageMs / thresholdMs);
  const ageText = formatAge(tab.ageMs);
  const title = tab.title || tab.url || "Без названия";

  return (
    <li
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/40 transition-colors group"
      style={{ opacity: 1 - decay * 0.4 }}
    >
      {/* Favicon placeholder */}
      <div
        className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500 shrink-0"
        style={{ filter: `grayscale(${decay * 100}%)` }}
      >
        {getFaviconLetter(tab.title, tab.url)}
      </div>

      {/* Title & URL */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 truncate leading-tight" title={title}>
          {title}
        </p>
        <p className="text-[11px] text-zinc-500 truncate leading-tight mt-0.5">
          {formatUrl(tab.url)} · {ageText}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onSnooze(tab.tabId)}
          className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-700/50 rounded transition-colors"
          title="Отложить (сбросить таймер)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onGoTo(tab.tabId)}
          className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-zinc-700/50 rounded transition-colors"
          title="Перейти к вкладке"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onClose(tab.tabId)}
          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-700/50 rounded transition-colors"
          title="Закрыть (сохранить в закладки)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}

function getFaviconLetter(title: string, url: string): string {
  if (title) return title[0].toUpperCase();
  try {
    return new URL(url).hostname[0].toUpperCase();
  } catch {
    return "?";
  }
}

function formatUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatAge(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 24) return `${hours}ч`;
  const days = Math.floor(hours / 24);
  return `${days}д`;
}
