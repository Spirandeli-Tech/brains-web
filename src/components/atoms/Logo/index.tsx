interface LogoProps {
  className?: string
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2z"
          fill="#1677ff"
        />
        <path
          d="M11 12a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM17 12a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM11 18a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM17 18a2 2 0 1 1 4 0 2 2 0 0 1-4 0z"
          fill="white"
        />
      </svg>
      <span className="text-xl font-bold text-blue-600">brains</span>
    </div>
  )
}
