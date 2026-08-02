import type { ReactNode } from "react";

interface DataCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DataCard({ children, className = "", onClick }: DataCardProps) {
  return (
    <div
      className={`bg-bg-card border border-border-subtle rounded-xl shadow-card p-4 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
