import { useEffect } from "react";
import { Outlet } from "react-router";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { seedAllIfEmpty } from "../../store/seedAll";

export function MainLayout() {
  useEffect(() => {
    seedAllIfEmpty();
  }, []);

  return (
    <div className="app-backdrop flex h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
