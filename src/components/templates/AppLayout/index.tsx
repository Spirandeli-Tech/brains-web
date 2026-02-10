import { Outlet } from "react-router-dom";
import { Sidebar, AppHeader } from "@/components/organisms";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <AppHeader />
      <Sidebar />
      <main className="bg-cross-pattern min-h-[calc(100vh-4rem)]">
        <div className="ml-24 mr-3 md:ml-32 md:mr-16 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
