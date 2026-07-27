import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Tooltip } from "antd";
import runnerClient from "@/lib/clients/runner";
import type { RunnerOverview } from "@/lib/clients/runner";

// Ambient header widget — polled less aggressively than the dedicated Runner
// page (which needs near-live updates) since this one is mounted everywhere.
const POLL_INTERVAL_MS = 15000;

export function RunnerStatusPill() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<RunnerOverview | null>(null);
  const pollRef = useRef<number | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      const data = await runnerClient.getOverview();
      setOverview(data);
    } catch {
      // best-effort — a failed poll just keeps the last known state
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    pollRef.current = window.setInterval(fetchOverview, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [fetchOverview]);

  const runners = overview?.runners ?? [];
  const current = overview?.current ?? [];
  const queued = overview?.queued ?? [];
  const anyOnline = runners.some((r) => r.online);

  const badgeStatus = !overview ? "default" : anyOnline ? "success" : "error";

  const label = !overview
    ? "Runner"
    : current.length > 0
      ? current[0].title
      : anyOnline
        ? "Ocioso"
        : "Offline";

  const tooltip = !overview
    ? "Carregando status do runner…"
    : !anyOnline
      ? "Nenhum runner online — nada vai rodar até religar"
      : current.length > 0
        ? `Rodando: ${current[0].title}`
        : queued.length > 0
          ? `Ocioso · ${queued.length} na fila`
          : "Ocioso · fila vazia";

  return (
    <Tooltip title={tooltip}>
      <button
        onClick={() => navigate("/runner")}
        className="flex items-center gap-2 h-9 px-3 rounded-[10px] border-none bg-transparent hover:bg-bg-hover transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
      >
        <Badge status={badgeStatus} />
        <span className="text-sm text-text-secondary truncate max-w-[160px]">
          {label}
        </span>
        {queued.length > 0 && (
          <Badge count={queued.length} size="small" style={{ backgroundColor: "#9CA3AF" }} />
        )}
      </button>
    </Tooltip>
  );
}
