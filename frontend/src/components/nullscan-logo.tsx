interface NullscanLogoProps {
  size?: "sm" | "md" | "lg";
  iconOnly?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 24, text: 14, gap: 6 },
  md: { icon: 32, text: 18, gap: 8 },
  lg: { icon: 48, text: 24, gap: 10 },
};

export function NullscanLogo({
  size = "md",
  iconOnly = false,
  className = "",
}: NullscanLogoProps) {
  const { icon, text, gap } = sizes[size];
  const strokeWidth = size === "sm" ? 1.5 : size === "lg" ? 2.5 : 2;

  return (
    <div className={`flex items-center ${className}`} style={{ gap }}>
      {/* Null set symbol (∅) */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Nullscan logo"
      >
        {/* Circle */}
        <circle
          cx="16"
          cy="16"
          r="11"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Diagonal line with gradient fade */}
        <defs>
          <linearGradient id="diagonalFade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="20%" stopColor="var(--accent)" stopOpacity="1" />
            <stop offset="80%" stopColor="var(--accent)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <line
          x1="8"
          y1="8"
          x2="24"
          y2="24"
          stroke="url(#diagonalFade)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>

      {/* Wordmark */}
      {!iconOnly && (
        <span
          className="font-medium tracking-tight"
          style={{ fontSize: text, letterSpacing: "-0.02em" }}
        >
          <span style={{ color: "var(--accent)" }}>null</span>
          <span style={{ color: "var(--text)" }}>scan</span>
        </span>
      )}
    </div>
  );
}
