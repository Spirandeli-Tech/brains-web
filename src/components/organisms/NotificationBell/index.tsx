import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge, Empty, Popover, Spin } from "antd";
import {
  AuditOutlined,
  BellOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  EyeOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import briefingClient from "@/lib/clients/briefing";
import type { BriefingEvent } from "@/lib/clients/briefing";
import { SOURCE_LABELS } from "@/constants/platform-events";

const POLL_INTERVAL_MS = 60000;

// Same icon per source as its dedicated nav item (constants/navigation.tsx) —
// one visual vocabulary for "this is an implementation/review/etc" across
// the whole app, not a second one invented for this popover.
const SOURCE_ICON: Record<string, ReactNode> = {
  implementation: <ThunderboltOutlined />,
  code_review: <AuditOutlined />,
  address_pr: <CommentOutlined />,
  automation: <ClockCircleOutlined />,
  watcher: <EyeOutlined />,
  system: <SettingOutlined />,
};

const SOURCE_COLOR: Record<string, string> = {
  implementation: "#42A5F5",
  code_review: "#7CB342",
  address_pr: "#AB47BC",
  automation: "#FBC02D",
  watcher: "#26A69A",
  system: "#78909C",
};

function formatEventTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EventRow({ event, onNavigate }: { event: BriefingEvent; onNavigate: () => void }) {
  const unread = !event.seen_at;
  const color = SOURCE_COLOR[event.source] ?? "#94A3B8";

  return (
    <Link
      to={event.url_path || "/dashboard"}
      onClick={onNavigate}
      className="flex items-start gap-4 px-5 py-4 no-underline transition-colors duration-150 hover:bg-bg-hover focus-visible:outline-none focus-visible:bg-bg-hover"
    >
      <div className="relative shrink-0">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-[18px]"
          style={{ backgroundColor: `${color}1A`, color }}
        >
          {SOURCE_ICON[event.source] ?? <SettingOutlined />}
        </div>
        {unread && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-brand-primary ring-2 ring-white" />
        )}
      </div>
      <div className="flex flex-col gap-1 min-w-0 pt-0.5">
        <span
          className={`text-[15px] leading-normal ${
            unread ? "text-text-primary font-medium" : "text-text-secondary"
          }`}
        >
          {event.title}
        </span>
        <span className="text-xs text-text-muted truncate">
          {SOURCE_LABELS[event.source] ?? event.source}
          {event.connection_name ? ` · ${event.connection_name}` : ""} · {formatEventTime(event.occurred_at)}
        </span>
      </div>
    </Link>
  );
}

export function NotificationBell() {
  const [events, setEvents] = useState<BriefingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("all");
  const pollRef = useRef<number | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await briefingClient.getRecentEvents(50);
      setEvents(data);
    } catch {
      // best-effort — a failed poll just keeps the last known state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    pollRef.current = window.setInterval(fetchEvents, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [fetchEvents]);

  const unreadCount = events.filter((e) => !e.seen_at).length;

  // Only categories that actually have something in them — an "Automations"
  // tab that's always empty is dead UI, not a feature.
  const tabs = useMemo(() => {
    const present = Array.from(new Set(events.map((e) => e.source)));
    return ["all", ...present];
  }, [events]);

  const unreadCountFor = (key: string) =>
    key === "all" ? unreadCount : events.filter((e) => e.source === key && !e.seen_at).length;

  const filteredEvents = tab === "all" ? events : events.filter((e) => e.source === tab);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) fetchEvents();
  };

  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      await briefingClient.markSeen();
      await fetchEvents();
    } catch {
      // best-effort
    } finally {
      setMarking(false);
    }
  };

  const closePopover = () => setOpen(false);

  const content = (
    <div className="w-[440px] flex flex-col">
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <h3 className="text-lg font-semibold text-text-primary m-0 tracking-tight">Notificações</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={marking}
            className="text-xs font-medium text-brand-primary bg-transparent border-none cursor-pointer hover:text-brand-primary-hover disabled:opacity-50 disabled:cursor-default focus-visible:outline-none focus-visible:underline"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="flex items-center gap-6 px-6 border-b border-border-divider">
        {tabs.map((key) => {
          const active = tab === key;
          const count = unreadCountFor(key);
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative flex items-center gap-1.5 py-3 text-sm border-none bg-transparent cursor-pointer whitespace-nowrap transition-colors duration-150 focus-visible:outline-none ${
                active ? "text-brand-primary font-medium" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {key === "all" ? "Todas" : SOURCE_LABELS[key] ?? key}
              {count > 0 && (
                <Badge
                  count={count}
                  size="small"
                  style={{ backgroundColor: active ? "#2563EB" : "#9CA3AF" }}
                />
              )}
              {active && (
                <span className="absolute left-0 right-0 -bottom-px h-[2.5px] bg-brand-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="max-h-[440px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border-subtle [&::-webkit-scrollbar-thumb]:rounded-full">
        {loading && events.length === 0 ? (
          <div className="flex justify-center py-14">
            <Spin size="small" />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="flex flex-col divide-y divide-border-divider">
            {filteredEvents.map((event) => (
              <EventRow key={event.id} event={event} onNavigate={closePopover} />
            ))}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Tudo em dia por aqui."
            className="py-14"
          />
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={handleOpenChange}
      arrow={false}
      overlayInnerStyle={{ padding: 0 }}
    >
      <button className="relative flex items-center justify-center w-9 h-9 rounded-[10px] border-none bg-transparent hover:bg-bg-hover transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40">
        <Badge count={unreadCount}>
          <BellOutlined className="text-lg text-text-secondary" />
        </Badge>
      </button>
    </Popover>
  );
}
