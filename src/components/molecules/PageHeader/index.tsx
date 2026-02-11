import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-[22px] font-semibold text-text-primary leading-tight m-0">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-text-muted mt-1 m-0">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
