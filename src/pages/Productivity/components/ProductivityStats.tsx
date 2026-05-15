import { useMemo } from "react";
import type { AggregatedStats } from "@/lib/clients/productivity";

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-xl shadow-card overflow-hidden">
      <div className="h-1.5" style={{ backgroundColor: color }} />
      <div className="p-5">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide m-0">{label}</p>
        <p className="text-2xl font-semibold text-text-primary m-0 mt-1">{value}</p>
      </div>
    </div>
  );
}

interface ProductivityStatsProps {
  stats: AggregatedStats;
}

export function ProductivityStats({ stats }: ProductivityStatsProps) {
  const codeChanges = useMemo(() => {
    return `+${stats.total_additions.toLocaleString()} / -${stats.total_deletions.toLocaleString()}`;
  }, [stats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="Total Commits" value={String(stats.total_commits)} color="#7CB342" />
      <StatCard label="Total PRs" value={String(stats.total_prs)} color="#42A5F5" />
      <StatCard label="Code Changes" value={codeChanges} color="#AB47BC" />
    </div>
  );
}
