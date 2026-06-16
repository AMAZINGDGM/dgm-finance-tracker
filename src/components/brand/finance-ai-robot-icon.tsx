import { cn } from "@/lib/utils";

type FinanceAiRobotIconProps = {
  className?: string;
};

export function FinanceAiRobotIcon({ className }: FinanceAiRobotIconProps) {
  return (
    <svg
      className={cn("h-6 w-6", className)}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M24 6.4v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="24" cy="4.9" r="2.35" fill="#67E8F9" />
      <rect
        x="10"
        y="12"
        width="28"
        height="24"
        rx="8.5"
        fill="url(#robotBody)"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M15.5 25.8c2 2.1 4.7 3.1 8.5 3.1s6.5-1 8.5-3.1"
        stroke="#A5F3FC"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <rect x="15.7" y="18.4" width="6.1" height="5.3" rx="2.4" fill="#67E8F9" />
      <rect x="26.2" y="18.4" width="6.1" height="5.3" rx="2.4" fill="#C4B5FD" />
      <circle cx="18.75" cy="21.05" r="0.9" fill="#020617" opacity="0.75" />
      <circle cx="29.25" cy="21.05" r="0.9" fill="#020617" opacity="0.75" />
      <path
        d="M8 21h-2.2A2.8 2.8 0 0 0 3 23.8v4.4A2.8 2.8 0 0 0 5.8 31H8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M40 21h2.2a2.8 2.8 0 0 1 2.8 2.8v4.4a2.8 2.8 0 0 1-2.8 2.8H40"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="6.7"
        y="31.1"
        width="13.1"
        height="8.2"
        rx="2.4"
        fill="#052E3F"
        stroke="#67E8F9"
        strokeWidth="1.35"
        transform="rotate(-9 6.7 31.1)"
      />
      <path
        d="M10 34.8h6.8M10.5 37h4.2"
        stroke="#A5F3FC"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <circle
        cx="34.5"
        cy="34.5"
        r="7"
        fill="url(#coinGlow)"
        stroke="#67E8F9"
        strokeWidth="1.7"
      />
      <path
        d="M34.5 30.8v7.4M31.8 32.2h3.7a2 2 0 0 1 0 4h-3.2M30.9 36.2h4.6"
        stroke="#ECFEFF"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M37.4 9.4l1.1 2.2 2.4 1-2.4 1-1.1 2.2-1.1-2.2-2.4-1 2.4-1 1.1-2.2Z"
        fill="#A5F3FC"
      />
      <defs>
        <linearGradient id="robotBody" x1="13" y1="14" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0E7490" stopOpacity="0.72" />
          <stop offset="0.48" stopColor="#1E1B4B" stopOpacity="0.92" />
          <stop offset="1" stopColor="#020617" />
        </linearGradient>
        <radialGradient id="coinGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 31) rotate(48) scale(11)">
          <stop stopColor="#22D3EE" />
          <stop offset="0.55" stopColor="#2563EB" />
          <stop offset="1" stopColor="#312E81" />
        </radialGradient>
      </defs>
    </svg>
  );
}
