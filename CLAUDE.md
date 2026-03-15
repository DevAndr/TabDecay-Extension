# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tab Decay is a Chrome extension (Manifest V3) that tracks tab staleness — tabs unused beyond a configurable threshold fade visually and can be bookmarked and closed automatically. The popup UI is still scaffolded from the Vite+React template and hasn't been built out yet.

## Commands

- `yarn dev` — Start Vite dev server with HMR (uses @crxjs/vite-plugin for live extension reloading)
- `yarn build` — TypeScript check + production build (`tsc -b && vite build`)
- `yarn lint` — Run ESLint across the project
- No test framework is configured yet

## Architecture

**Build pipeline:** Vite + @crxjs/vite-plugin. The manifest is defined programmatically in `src/manifest.ts` using `defineManifest()` — not a static JSON file. Vite config composes React, Tailwind CSS v4, and CRX plugins.

**Background service worker** (`src/background/background.ts`): The core logic lives here — plain TypeScript, no framework. It:
- Tracks every tab's `lastAccessed` timestamp in `chrome.storage.local` under the `tabData` key
- Uses `chrome.alarms` for periodic staleness checks
- Computes decay (0→1 float) and sends `DECAY_UPDATE` messages to content scripts
- Handles all popup communication via `chrome.runtime.onMessage` with message types: `GET_STALE_TABS`, `CLOSE_TAB`, `CLOSE_ALL_STALE`, `SAVE_SETTINGS`, `GET_SETTINGS`, `SNOOZE_TAB`
- Bookmarks stale tabs into a dedicated folder before closing them
- Settings stored in `chrome.storage.local` under the `settings` key with defaults: 48h threshold, 30min check interval

**Popup UI** (`src/popup/`): React 19 + Tailwind CSS 4 app rendered into `index.html`. Currently still the Vite starter template — needs to be replaced with actual extension UI. Entry point is `src/popup/main.tsx`.

**Key dependencies:** React Query (for data fetching), Radix UI + shadcn (component library), Recharts (charting), React Router, Lucide icons.

## Chrome Extension Notes

- Permissions: `storage`, `tabs`, `activeTab`, `clipboardWrite`, `bookmarks`, `alarms`, `notifications`, `offscreen`
- Host permissions configured for localhost dev servers
- The background script is untyped JS-style TypeScript (no type annotations on functions like `getTabData`, `saveTabData`) — the `@types/chrome` package provides Chrome API types
- Package manager is **yarn** (yarn.lock present)

# 🍂 Tab Decay

Расширение для Chrome, которое помогает бороться с бесконечными вкладками.

Вкладки, которые вы давно не посещали, визуально тускнеют — а расширение предлагает их закрыть, предварительно сохранив в закладки.

## Возможности

- **Бейдж-счётчик** — на иконке расширения показано количество устаревших вкладок
- **Визуальное затухание** — старые вкладки постепенно теряют цвет (десатурация + overlay)
- **Favicon decay** — иконки старых вкладок тускнеют
- **Сохранение в закладки** — перед закрытием вкладка автоматически сохраняется в папку закладок
- **Настраиваемый порог** — задайте, через сколько часов вкладка считается старой
- **Snooze** — можно «отложить» вкладку, сбросив её таймер

## Установка

1. Откройте `chrome://extensions/`
2. Включите **Режим разработчика** (переключатель в правом верхнем углу)
3. Нажмите **Загрузить распакованное расширение**
4. Выберите папку `tab-decay`

## Использование

- Кликните на иконку расширения — откроется список устаревших вкладок
- Для каждой вкладки доступны действия:
    - **↻** — Snooze (сбросить таймер)
    - **→** — Перейти к вкладке
    - **✕** — Закрыть (с сохранением в закладки)
- Кнопка **Закрыть все старые** — массовое закрытие
- **⚙** — настройки (порог в часах, интервал проверки, имя папки закладок)

В разработке применить tailwindcss, lucide-react, react-router