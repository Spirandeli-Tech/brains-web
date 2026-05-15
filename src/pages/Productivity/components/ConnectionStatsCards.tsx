import { useMemo } from "react";
import type { ConnectionStats } from "@/lib/clients/productivity";

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide m-0">{label}</p>
      <p className="text-lg font-semibold text-text-primary m-0 mt-1">{value}</p>
    </div>
  );
}

interface ConnectionStatsCardsProps {
  stats: ConnectionStats | null;
}

export function ConnectionStatsCards({ stats }: ConnectionStatsCardsProps) {
  const codeChanges = useMemo(() => {
    if (!stats) return "+0 / -0";
    return `+${stats.total_additions.toLocaleString()} / -${stats.total_deletions.toLocaleString()}`;
  }, [stats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      <MiniStat label="Commits" value={String(stats?.commits_count ?? 0)} />
      <MiniStat label="Pull Requests" value={String(stats?.prs_count ?? 0)} />
      <MiniStat label="Code Changes" value={codeChanges} />
    </div>
  );
}
