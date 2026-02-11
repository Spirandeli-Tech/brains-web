type StatusVariant = "success" | "warning" | "danger" | "info" | "default";

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-status-success-bg text-status-success-text",
  warning: "bg-status-warning-bg text-status-warning-text",
  danger: "bg-status-danger-bg text-status-danger-text",
  info: "bg-status-info-bg text-status-info-text",
  default: "bg-bg-hover text-text-secondary",
};

interface StatusPillProps {
  variant?: StatusVariant;
  children: React.ReactNode;
}

export function StatusPill({
  variant = "default",
  children,
}: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
