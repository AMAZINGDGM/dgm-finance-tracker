import { cn } from "@/lib/utils";

type DftLogoSize = "xs" | "sm" | "md" | "lg";

type DftLogoProps = {
  size?: DftLogoSize;
  showWordmark?: boolean;
  className?: string;
};

const sizeClasses: Record<DftLogoSize, string> = {
  xs: "h-10 w-10",
  sm: "h-11 w-11",
  md: "h-16 w-16",
  lg: "h-20 w-20"
};

export function DftLogo({ size = "md", showWordmark = false, className }: DftLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div className={cn("dft-logo-mark dft-logo-premium relative shrink-0", sizeClasses[size])}>
        <svg
          className="h-full w-full"
          viewBox="0 0 96 96"
          role="img"
          aria-label="DFT logo"
        >
          <defs>
            <linearGradient id="dft-logo-core" x1="12" y1="10" x2="84" y2="86">
              <stop offset="0%" stopColor="#67E8F9" />
              <stop offset="45%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
            <linearGradient id="dft-logo-edge" x1="5" y1="12" x2="91" y2="84">
              <stop offset="0%" stopColor="#A5F3FC" stopOpacity="0.95" />
              <stop offset="54%" stopColor="#38BDF8" stopOpacity="0.58" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.88" />
            </linearGradient>
            <filter id="dft-logo-glow" x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur stdDeviation="4.2" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="0 0 0 0 0.13 0 0 0 0 0.83 0 0 0 0 0.93 0 0 0 0.7 0"
              />
              <feBlend in="SourceGraphic" />
            </filter>
          </defs>
          <path
            d="M48 5 78 16.5 91 46.5 78 78.5 48 91 18 78.5 5 46.5 18 16.5 48 5Z"
            fill="rgba(2, 6, 23, 0.82)"
            stroke="url(#dft-logo-edge)"
            strokeWidth="2.2"
            filter="url(#dft-logo-glow)"
          />
          <path
            d="M48 14 72 23.5 82 47.5 72 72.5 48 82 24 72.5 14 47.5 24 23.5 48 14Z"
            fill="url(#dft-logo-core)"
            opacity="0.18"
          />
          <path
            className="dft-logo-orbit"
            d="M19 58C29 37 54 26 76 31"
            fill="none"
            stroke="#67E8F9"
            strokeLinecap="round"
            strokeWidth="2"
            opacity="0.78"
          />
          <path
            className="dft-logo-orbit dft-logo-orbit-delay"
            d="M77 40C67 61 43 72 20 66"
            fill="none"
            stroke="#A78BFA"
            strokeLinecap="round"
            strokeWidth="1.8"
            opacity="0.62"
          />
          <circle cx="76" cy="31" r="3" fill="#A5F3FC" />
          <circle cx="20" cy="66" r="2.6" fill="#C4B5FD" />
          <text
            x="48"
            y="56"
            textAnchor="middle"
            fill="#F8FAFC"
            fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
            fontSize="22"
            fontWeight="900"
            letterSpacing="1.4"
          >
            DFT
          </text>
        </svg>
      </div>
      {showWordmark ? (
        <div className="min-w-0 text-left">
          <p className="text-xl font-black tracking-[0.12em] text-white">DFT</p>
          <p className="truncate text-xs text-muted">Dgm Finance Tracker</p>
        </div>
      ) : null}
    </div>
  );
}
