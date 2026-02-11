import type { ReactNode } from "react";

interface DataCardProps {
  children: ReactNode;
  className?: string;
}

export function DataCard({ children, className = "" }: DataCardProps) {
  return (
    <div
      className={`bg-bg-card border border-border-subtle rounded-xl shadow-card p-4 ${className}`}
    >
      {children}
    </div>
  );
}
