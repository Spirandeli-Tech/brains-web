import { Outlet } from "react-router-dom";
import { Sidebar, AppHeader } from "@/components/organisms";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-bg-page">
      <Sidebar />
      <AppHeader />
      <main className="ml-[var(--sidebar-width)] pt-[var(--header-height)] min-h-screen">
        <div className="max-w-[var(--content-max-width)] mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
