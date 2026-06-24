import type { ImplementationStats as Stats } from "@/lib/clients/implementations";

interface StatCardProps {
  label: string;
  value: string;
  color: string;
  filterValue: string;
  activeFilter: string;
  onFilter: (filter: string) => void;
}

function StatCard({ label, value, color, filterValue, activeFilter, onFilter }: StatCardProps) {
  const isActive = activeFilter === filterValue;
  return (
    <div
      className="bg-bg-card border border-border-subtle rounded-xl shadow-card overflow-hidden cursor-pointer select-none transition-shadow hover:shadow-md"
      style={isActive ? { outline: `2px solid ${color}`, outlineOffset: "2px" } : undefined}
      onClick={() => onFilter(filterValue)}
    >
      <div style={{ height: isActive ? 6 : 4, backgroundColor: color, transition: "height 0.15s" }} />
      <div className="p-5">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide m-0">{label}</p>
        <p className="text-2xl font-semibold text-text-primary m-0 mt-1">{value}</p>
      </div>
    </div>
  );
}

interface ImplementationStatsProps {
  stats: Stats;
  activeFilter: string;
  onFilter: (filter: string) => void;
}

export function ImplementationStats({ stats, activeFilter, onFilter }: ImplementationStatsProps) {
  const total = stats.active + stats.awaiting_approval + stats.completed + stats.failed;
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard label="All" value={String(total)} color="#9CA3AF" filterValue="all" activeFilter={activeFilter} onFilter={onFilter} />
      <StatCard label="Active" value={String(stats.active)} color="#42A5F5" filterValue="active" activeFilter={activeFilter} onFilter={onFilter} />
      <StatCard label="Awaiting Approval" value={String(stats.awaiting_approval)} color="#FBC02D" filterValue="awaiting_approval" activeFilter={activeFilter} onFilter={onFilter} />
      <StatCard label="Completed" value={String(stats.completed)} color="#7CB342" filterValue="done" activeFilter={activeFilter} onFilter={onFilter} />
      <StatCard label="Failed" value={String(stats.failed)} color="#EF5350" filterValue="failed" activeFilter={activeFilter} onFilter={onFilter} />
    </div>
  );
}
