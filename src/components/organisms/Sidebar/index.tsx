import { useLocation, useNavigate } from "react-router-dom";
import { NAV_OPTIONS } from "@/constants/navigation";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="w-24 bg-white border-r border-gray-200 flex flex-col items-center py-0 fixed left-0 top-16 bottom-0 z-10">
      <nav className="flex flex-col items-center w-full">
        {NAV_OPTIONS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-3 px-2 w-full transition-colors cursor-pointer border-none bg-transparent
                ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              style={
                isActive
                  ? { borderRight: "2px solid #2563eb", background: "#eff6ff" }
                  : {}
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
