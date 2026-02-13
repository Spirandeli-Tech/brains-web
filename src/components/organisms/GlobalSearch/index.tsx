import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Input, Spin } from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  UserOutlined,
  BankOutlined,
  ToolOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import { searchClient } from "@/lib/clients/search";
import { SearchResultType } from "@/lib/clients/search";
import type { SearchResultGroup } from "@/lib/clients/search";

const CATEGORY_CONFIG: Record<
  SearchResultType,
  { label: string; icon: React.ReactNode; path: string }
> = {
  [SearchResultType.INVOICES]: {
    label: "Invoices",
    icon: <FileTextOutlined />,
    path: "/invoices",
  },
  [SearchResultType.CUSTOMERS]: {
    label: "Customers",
    icon: <UserOutlined />,
    path: "/invoices/customers",
  },
  [SearchResultType.BANKS]: {
    label: "Bank Accounts",
    icon: <BankOutlined />,
    path: "/invoices/bank-accounts",
  },
  [SearchResultType.SERVICES]: {
    label: "Services",
    icon: <ToolOutlined />,
    path: "/invoices/services",
  },
  [SearchResultType.USERS]: {
    label: "Users",
    icon: <TeamOutlined />,
    path: "/users",
  },
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await searchClient.search(q);
      setResults(response.data.filter((group) => group.items.length > 0));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useMemo(
    () => debounce((q: string) => performSearch(q), 400),
    [performSearch],
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      debouncedSearch.cancel();
      return;
    }

    setOpen(true);
    setLoading(true);
    debouncedSearch(value);
  };

  const handleItemClick = (type: SearchResultType) => {
    const config = CATEGORY_CONFIG[type];
    setOpen(false);
    setQuery("");
    setResults([]);
    navigate(config.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = results.length > 0;
  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="flex-1 max-w-md relative">
      <Input
        placeholder="Search..."
        prefix={<SearchOutlined className="text-text-disabled" />}
        value={query}
        onChange={handleChange}
        onFocus={() => {
          if (query.trim() && (hasResults || loading)) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        allowClear
      />

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-subtle rounded-[10px] shadow-lg z-50 max-h-[420px] overflow-y-auto">
          {loading && !hasResults ? (
            <div className="flex items-center justify-center py-8">
              <Spin size="small" />
            </div>
          ) : !hasResults && !loading ? (
            <div className="py-6 text-center text-text-muted text-sm">
              No results found
            </div>
          ) : (
            <div className="py-1">
              {results.map((group) => {
                const config = CATEGORY_CONFIG[group.type];
                if (!config) return null;

                return (
                  <div key={group.type}>
                    <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wide flex items-center gap-1.5">
                      <span className="text-text-disabled">{config.icon}</span>
                      {config.label}
                    </div>
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(group.type)}
                        className="w-full text-left px-3 py-2 hover:bg-bg-hover cursor-pointer border-none bg-transparent flex items-center gap-2 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-text-primary m-0 truncate">
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p className="text-xs text-text-muted m-0 truncate">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
