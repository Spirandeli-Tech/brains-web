import type { AddressPrStats } from "@/lib/clients/address-pr";

interface FixStatsProps {
  stats: AddressPrStats;
  activeFilter: string;
  onFilter: (value: string) => void;
}

interface StatCardProps {
  label: string;
  value: number;
  filterKey: string;
  color: string;
  activeFilter: string;
  onFilter: (v: string) => void;
}

function StatCard({ label, value, filterKey, color, activeFilter, onFilter }: StatCardProps) {
  const isActive = activeFilter === filterKey;
  return (
    <div
      className="flex-1 bg-bg-card border border-border-subtle rounded-xl shadow-card overflow-hidden cursor-pointer select-none transition-shadow hover:shadow-md"
      style={isActive ? { outline: `2px solid ${color}`, outlineOffset: "2px" } : undefined}
      onClick={() => onFilter(filterKey)}
    >
      <div style={{ height: isActive ? 6 : 4, backgroundColor: color, transition: "height 0.15s" }} />
      <div className="p-5">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide m-0">{label}</p>
        <p className="text-2xl font-semibold text-text-primary m-0 mt-1">{value}</p>
      </div>
    </div>
  );
}

export function FixStats({ stats, activeFilter, onFilter }: FixStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Active"
        value={stats.active}
        filterKey="active"
        color="#42A5F5"
        activeFilter={activeFilter}
        onFilter={onFilter}
      />
      <StatCard
        label="Awaiting Approval"
        value={stats.awaiting_approval}
        filterKey="awaiting_approval"
        color="#FBC02D"
        activeFilter={activeFilter}
        onFilter={onFilter}
      />
      <StatCard
        label="Completed"
        value={stats.completed}
        filterKey="done"
        color="#7CB342"
        activeFilter={activeFilter}
        onFilter={onFilter}
      />
      <StatCard
        label="Failed"
        value={stats.failed}
        filterKey="failed"
        color="#EF5350"
        activeFilter={activeFilter}
        onFilter={onFilter}
      />
    </div>
  );
}
