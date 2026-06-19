import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({ className, size = 36, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        aria-hidden="true"
        className="rounded-lg shadow-sm"
      >
        <defs>
          <linearGradient id="rr-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="url(#rr-gradient)" />
        <path
          d="M18 36a10 10 0 1 1 2.5-19.6 13 13 0 0 1 25 3 8.5 8.5 0 0 1-1 16.6H18z"
          fill="#e0f2fe"
        />
        <g stroke="#38bdf8" strokeWidth="3" strokeLinecap="round">
          <line x1="22" y1="42" x2="19" y2="52" />
          <line x1="32" y1="42" x2="29" y2="52" />
          <line x1="42" y1="42" x2="39" y2="52" />
        </g>
        <path
          d="M12 56 L32 44 L52 56"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-tight sm:text-lg">
            RainRoute
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Rain · Route · Ride
          </span>
        </div>
      )}
    </div>
  );
}
