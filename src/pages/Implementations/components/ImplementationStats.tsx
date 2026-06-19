import type { ImplementationStats as Stats } from "@/lib/clients/implementations";

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

interface ImplementationStatsProps {
  stats: Stats;
}

export function ImplementationStats({ stats }: ImplementationStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Active" value={String(stats.active)} color="#42A5F5" />
      <StatCard label="Awaiting Approval" value={String(stats.awaiting_approval)} color="#FBC02D" />
      <StatCard label="Completed" value={String(stats.completed)} color="#7CB342" />
      <StatCard label="Failed" value={String(stats.failed)} color="#EF5350" />
    </div>
  );
}
