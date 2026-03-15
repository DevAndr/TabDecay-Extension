import { Leaf, Settings as SettingsIcon } from "lucide-react";

interface HeaderProps {
  page: "tabs" | "settings";
  onNavigate: (page: "tabs" | "settings") => void;
}

export function Header({ page, onNavigate }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
      <button
        onClick={() => onNavigate("tabs")}
        className="flex items-center gap-2 text-zinc-100 hover:text-amber-400 transition-colors"
      >
        <Leaf className="w-5 h-5 text-amber-500" />
        <span className="font-semibold text-sm">Tab Decay</span>
      </button>
      <button
        onClick={() => onNavigate(page === "settings" ? "tabs" : "settings")}
        className={`p-1.5 rounded-md transition-colors ${
          page === "settings"
            ? "bg-zinc-800 text-amber-400"
            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
        }`}
        title="Настройки"
      >
        <SettingsIcon className="w-4 h-4" />
      </button>
    </header>
  );
}
