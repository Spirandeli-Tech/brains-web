interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <img src="/full-brain-black-logo.png" alt="Brains" className="h-10" />
    </div>
  );
}
