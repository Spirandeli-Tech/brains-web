interface AgentAvatarProps {
  name: string;
  colorClass: string;
  size?: "sm" | "md";
}

/** Avatar circular com a inicial do nome, cor definida pela área do agente. */
export function AgentAvatar({ name, colorClass, size = "md" }: AgentAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const sizeClass = size === "sm" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base";
  return (
    <div
      className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
    >
      {initial}
    </div>
  );
}
