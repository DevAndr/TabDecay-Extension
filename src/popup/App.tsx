import { useState } from "react";
import { TabList } from "./components/TabList";
import { Settings } from "./components/Settings";
import { Header } from "./components/Header";

type Page = "tabs" | "settings";

export default function App() {
  const [page, setPage] = useState<Page>("tabs");

  return (
    <div className="flex flex-col min-h-[500px] bg-zinc-950 text-zinc-100">
      <Header page={page} onNavigate={setPage} />
      <main className="flex-1 overflow-y-auto">
        {page === "tabs" ? <TabList /> : <Settings onBack={() => setPage("tabs")} />}
      </main>
    </div>
  );
}
