import { useState } from "react";
import { Dashboard } from "./pages/Dashboard";
import { Equipment } from "./pages/Equipment";
import { Analytics } from "./pages/Analytics";
import { DataImport } from "./pages/DataImport";
import { Sidebar } from "./components/Sidebar";

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 p-6 overflow-auto">
        {activePage === 'dashboard' && <Dashboard />}
        {activePage === 'equipment' && <Equipment />}
        {activePage === 'analytics' && <Analytics />}
        {activePage === 'import' && <DataImport />}
      </div>
    </div>
  );
}