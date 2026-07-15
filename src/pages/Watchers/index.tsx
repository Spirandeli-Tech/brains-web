import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Empty, Spin, Switch, Tag, Tooltip, message } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import watchersClient from "@/lib/clients/watchers";
import type { Watcher } from "@/lib/clients/watchers";
import { PageHeader, DataCard } from "@/components/molecules";
import { WatcherFormModal } from "./WatcherFormModal";

const KIND_LABELS: Record<string, string> = {
  github_review_requested: "PRs aguardando sua review",
};

const POLL_INTERVAL_MS = 15000;

// The API sends naive UTC timestamps (no "Z"/offset) — `new Date(iso)` would
// otherwise parse them as local time and skew every countdown by the
// browser's UTC offset.
function parseApiDate(iso: string): Date {
  const hasTz = /Z$|[+-]\d{2}:\d{2}$/.test(iso);
  return new Date(hasTz ? iso : `${iso}Z`);
}

function formatDateTime(iso: string | null) {
  if (!iso) return null;
  return parseApiDate(iso).toLocaleString("pt-BR");
}

/** Ticks every `intervalMs` so countdowns re-render without polling the API. */
function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function WatcherCard({
  watcher,
  now,
  onToggle,
  onEdit,
  onDelete,
  toggling,
  deleting,
}: {
  watcher: Watcher;
  now: number;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (watcher: Watcher) => void;
  onDelete: (id: string) => void;
  toggling: string | null;
  deleting: string | null;
}) {
  // last_run_at doubles as the claim lease (watcher_service.claim_next_watcher)
  // — null means it's never run yet, so it's already due.
  const nextCheckAt = watcher.last_run_at
    ? parseApiDate(watcher.last_run_at).getTime() + watcher.interval_minutes * 60_000
    : now;
  const msRemaining = nextCheckAt - now;
  const countdownLabel = !watcher.enabled
    ? "Watcher desabilitado"
    : msRemaining <= 0
      ? "Verificando agora…"
      : `Próxima checagem em ${formatCountdown(msRemaining)}`;

  return (
    <div className="border border-border-subtle rounded-lg p-4 flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{KIND_LABELS[watcher.kind] ?? watcher.kind}</span>
          {watcher.last_status === "error" && <Tag color="error">erro</Tag>}
        </div>
        <span className="text-xs text-text-muted">
          Org: {watcher.connection_name ?? "—"} · a cada {watcher.interval_minutes} min
        </span>
        <span className="text-xs text-text-muted">{countdownLabel}</span>
        {watcher.last_run_at && (
          <span className="text-xs text-text-muted">
            Última checagem: {formatDateTime(watcher.last_run_at)}
          </span>
        )}
        {watcher.last_status === "error" && watcher.last_error && (
          <Tooltip title={watcher.last_error}>
            <span className="text-xs text-red-500 truncate max-w-md">{watcher.last_error}</span>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Switch
          checked={watcher.enabled}
          loading={toggling === watcher.id}
          onChange={(checked) => onToggle(watcher.id, checked)}
          size="small"
        />
        <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(watcher)} />
        <Button
          icon={<DeleteOutlined />}
          size="small"
          danger
          loading={deleting === watcher.id}
          onClick={() => onDelete(watcher.id)}
        />
      </div>
    </div>
  );
}

export function WatchersPage() {
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWatcher, setEditingWatcher] = useState<Watcher | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const now = useNow(1000);
  const pollRef = useRef<number | null>(null);

  const fetchWatchers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await watchersClient.listWatchers();
      setWatchers(data);
    } catch (error) {
      if (!silent) {
        message.error(error instanceof Error ? error.message : "Failed to load watchers");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchers();
  }, [fetchWatchers]);

  // Keep last_run_at/last_status fresh so the countdown resets on its own
  // once the runner actually ticks, instead of requiring a manual reload.
  useEffect(() => {
    const hasEnabled = watchers.some((w) => w.enabled);
    if (hasEnabled) {
      pollRef.current = window.setInterval(() => fetchWatchers(true), POLL_INTERVAL_MS);
    }
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [watchers, fetchWatchers]);

  const handleToggle = async (id: string, enabled: boolean) => {
    setToggling(id);
    try {
      await watchersClient.updateWatcher(id, { enabled });
      await fetchWatchers(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to update watcher");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await watchersClient.deleteWatcher(id);
      message.success("Watcher removido");
      await fetchWatchers(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to delete watcher");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Watchers"
        subtitle="A plataforma detecta sozinha PRs aguardando sua review e prepara a review, parando pra você aprovar."
        actions={
          <div className="flex items-center gap-2">
            <Button icon={<ReloadOutlined />} size="small" onClick={() => fetchWatchers()} loading={loading}>
              Reload
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              Novo watcher
            </Button>
          </div>
        }
      />

      <DataCard>
        {loading && watchers.length === 0 ? (
          <div className="flex justify-center py-12">
            <Spin />
          </div>
        ) : watchers.length > 0 ? (
          <div className="flex flex-col gap-3">
            {watchers.map((watcher) => (
              <WatcherCard
                key={watcher.id}
                watcher={watcher}
                now={now}
                onToggle={handleToggle}
                onEdit={setEditingWatcher}
                onDelete={handleDelete}
                toggling={toggling}
                deleting={deleting}
              />
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nenhum watcher configurado.">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              Novo watcher
            </Button>
          </Empty>
        )}
      </DataCard>

      <WatcherFormModal
        open={modalOpen || !!editingWatcher}
        watcher={editingWatcher}
        onClose={() => {
          setModalOpen(false);
          setEditingWatcher(null);
        }}
        onSaved={() => {
          setModalOpen(false);
          setEditingWatcher(null);
          fetchWatchers(true);
        }}
      />
    </div>
  );
}
