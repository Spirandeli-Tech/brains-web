import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CloseOutlined } from "@ant-design/icons";
import { NAV_OPTIONS } from "@/constants/navigation";
import type { NavOption } from "@/constants/navigation";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);

  const isChildActive = (item: NavOption) => {
    if (!item.children) return false;
    return item.children.some((child) => location.pathname === child.path);
  };

  const isActive = (item: NavOption) => {
    if (item.children) {
      return isChildActive(item);
    }
    return location.pathname === item.path;
  };

  const handleNavClick = (item: NavOption) => {
    if (item.children) {
      setOpenSubMenu((prev) => (prev === item.path ? null : item.path));
    } else {
      setOpenSubMenu(null);
      navigate(item.path);
    }
  };

  const handleSubItemClick = (path: string) => {
    setOpenSubMenu(null);
    navigate(path);
  };

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (openSubMenu === null) return;
      const target = event.target as Node;
      const isOutsideSidebar =
        sidebarRef.current && !sidebarRef.current.contains(target);
      const isOutsideSubmenu =
        submenuRef.current && !submenuRef.current.contains(target);
      if (isOutsideSidebar && isOutsideSubmenu) {
        setOpenSubMenu(null);
      }
    },
    [openSubMenu],
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const activeSubmenu = NAV_OPTIONS.find(
    (item) => item.path === openSubMenu && item.children,
  );

  return (
    <>
      <aside
        ref={sidebarRef}
        className="w-24 bg-white border-r border-gray-200 flex flex-col items-center py-0 fixed left-0 top-16 bottom-0 z-22"
      >
        <nav className="flex flex-col items-center w-full">
          {NAV_OPTIONS.map((item) => {
            const active = isActive(item);
            const submenuOpen = openSubMenu === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item)}
                className={`flex flex-col items-center gap-1 py-3 px-2 w-full transition-colors cursor-pointer border-none bg-transparent
                  ${
                    active || submenuOpen
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                style={
                  active || submenuOpen
                    ? {
                        borderRight: "2px solid #2563eb",
                        background: "#eff6ff",
                      }
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

      {/* Submenu slide-out panel */}
      <div
        ref={submenuRef}
        className="fixed top-16 bottom-0 z-20 transition-all duration-300 ease-in-out"
        style={{
          left: "6rem",
          width: "15rem",
          transform: activeSubmenu ? "translateX(0)" : "translateX(-100%)",
          opacity: activeSubmenu ? 1 : 0,
          pointerEvents: activeSubmenu ? "auto" : "none",
        }}
      >
        {activeSubmenu && (
          <div className="h-full bg-white border-r border-gray-200 shadow-lg flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-semibold text-gray-800 text-base">
                {activeSubmenu.label}
              </span>
              <button
                onClick={() => setOpenSubMenu(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent p-1"
              >
                <CloseOutlined />
              </button>
            </div>
            <div className="flex flex-col py-1">
              {activeSubmenu.children!.map((child) => {
                const childActive = location.pathname === child.path;
                return (
                  <button
                    key={child.path}
                    onClick={() => handleSubItemClick(child.path)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm border-none cursor-pointer transition-colors duration-200 bg-transparent text-left
                      ${
                        childActive
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                  >
                    <span className="text-base">{child.icon}</span>
                    <span>{child.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
