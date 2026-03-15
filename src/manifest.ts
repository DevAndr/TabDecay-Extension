import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
    manifest_version: 3,
    name: "Tab Decay",
    version: "1.0.0",
    description: "Старые вкладки тускнеют и предлагают себя закрыть. Забытые страницы сохраняются в закладки.",
    permissions: ["storage", "tabs", "activeTab", "clipboardWrite", "bookmarks", "alarms", "notifications"],
    host_permissions: ["http://localhost:3030/*"],
    background: {
        service_worker: "src/background/background.ts",
        type: "module"
    },
    action: {
        default_popup: "index.html",
        default_icon: {
            "16": "src/assets/icons/icon16.png",
            "48": "src/assets/icons/icon48.png",
            "128": "src/assets/icons/icon128.png"
        }
    },
    icons: {
        "16": "src/assets/icons/icon16.png",
        "48": "src/assets/icons/icon48.png",
        "128": "src/assets/icons/icon128.png"
    },
});
