import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DownOutlined } from "@ant-design/icons";
import { NAV_OPTIONS } from "@/constants/navigation";
import type { NavOption } from "@/constants/navigation";
import { Logo } from "@/components/atoms";
import { useAuth } from "@/context/auth";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  const visibleOptions = useMemo(
    () => NAV_OPTIONS.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin],
  );
  const [expandedGroup, setExpandedGroup] = useState<string | null>(() => {
    const match = NAV_OPTIONS.find((item) =>
      item.children?.some((child) => location.pathname === child.path),
    );
    return match?.path ?? null;
  });

  const isChildActive = (item: NavOption) => {
    if (!item.children) return false;
    return item.children.some((child) => location.pathname === child.path);
  };

  const isActive = (item: NavOption) => {
    if (item.children) return isChildActive(item);
    return location.pathname === item.path;
  };

  const handleNavClick = (item: NavOption) => {
    if (item.children) {
      setExpandedGroup((prev) => (prev === item.path ? null : item.path));
    } else {
      navigate(item.path);
    }
  };

  return (
    <aside className="w-[var(--sidebar-width)] bg-white border-r border-border-subtle flex flex-col fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="h-[var(--header-height)] flex items-center px-5 border-b border-border-divider shrink-0">
        <Logo />
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
        {visibleOptions.map((item) => {
          const active = isActive(item);
          const isExpanded = expandedGroup === item.path;
          const hasChildren = !!item.children;

          return (
            <div key={item.path}>
              <button
                onClick={() => handleNavClick(item)}
                className={`flex items-center gap-3 w-full h-10 px-3 rounded-[10px] text-sm font-medium transition-colors cursor-pointer border-none
                  ${
                    active
                      ? "bg-bg-selected text-brand-primary"
                      : "bg-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                  }`}
              >
                <span className="text-[18px] flex items-center shrink-0">
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {hasChildren && (
                  <DownOutlined
                    className={`text-[10px] text-text-muted transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {/* Inline sub-items */}
              {hasChildren && isExpanded && (
                <div className="flex flex-col gap-0.5 mt-0.5 ml-4 pl-4 border-l border-border-divider">
                  {item.children!.map((child) => {
                    const childActive = location.pathname === child.path;
                    return (
                      <button
                        key={child.path}
                        onClick={() => navigate(child.path)}
                        className={`flex items-center gap-2.5 w-full h-9 px-3 rounded-lg text-[13px] transition-colors cursor-pointer border-none
                          ${
                            childActive
                              ? "bg-bg-selected text-brand-primary font-medium"
                              : "bg-transparent text-text-muted hover:bg-bg-hover hover:text-text-primary font-normal"
                          }`}
                      >
                        <span className="text-[16px] flex items-center shrink-0">
                          {child.icon}
                        </span>
                        <span>{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
