import { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import type { TabSettings } from "../../types";

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [settings, setSettings] = useState<TabSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (res) => {
      if (res?.settings) setSettings(res.settings);
    });
  }, []);

  const handleSave = () => {
    if (!settings) return;
    setSaving(true);
    chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings }, () => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/50 border-b border-zinc-800/50">
        <button
          onClick={onBack}
          className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-zinc-400 font-medium">Настройки</span>
      </div>

      {/* Form */}
      <div className="p-4 space-y-4">
        <Field
          label="Порог устаревания (часы)"
          value={settings.thresholdHours}
          onChange={(v) => setSettings({ ...settings, thresholdHours: v })}
          min={1}
          max={720}
        />
        <Field
          label="Интервал проверки (мин)"
          value={settings.checkIntervalMinutes}
          onChange={(v) => setSettings({ ...settings, checkIntervalMinutes: v })}
          min={1}
          max={1440}
        />
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">
            Папка закладок
          </label>
          <input
            type="text"
            value={settings.bookmarkFolderName}
            onChange={(e) =>
              setSettings({ ...settings, bookmarkFolderName: e.target.value })
            }
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-zinc-400">Расширение включено</label>
          <button
            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              settings.enabled ? "bg-amber-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.enabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save button */}
      <div className="px-4 pb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? "Сохранено!" : "Сохранить"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n) && n >= min && n <= max) onChange(n);
        }}
        min={min}
        max={max}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50"
      />
    </div>
  );
}
