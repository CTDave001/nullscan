"use client"

import Link from "next/link"

interface NullscanLogoProps {
  size?: "sm" | "md" | "lg"
  iconOnly?: boolean
}

const sizeConfig = {
  sm: { icon: 20, text: "text-xs" },
  md: { icon: 24, text: "text-sm" },
  lg: { icon: 32, text: "text-base" },
}

export function NullscanLogo({ size = "md", iconOnly = false }: NullscanLogoProps) {
  const config = sizeConfig[size]

  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      {/* Geometric mark */}
      <div
        className="relative flex items-center justify-center transition-all group-hover:scale-105"
        style={{
          width: config.icon,
          height: config.icon,
        }}
      >
        <svg
          width={config.icon}
          height={config.icon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Outer ring */}
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="var(--cyan)"
            strokeWidth="1.5"
            fill="none"
            className="opacity-60"
          />
          {/* Inner glow ring */}
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="var(--cyan)"
            strokeWidth="0.5"
            fill="none"
            className="opacity-30"
            style={{ filter: "blur(2px)" }}
          />
          {/* Null stroke */}
          <line
            x1="6"
            y1="18"
            x2="18"
            y2="6"
            stroke="var(--cyan)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            boxShadow: "0 0 20px var(--cyan-glow-intense)",
          }}
        />
      </div>

      {/* Wordmark */}
      {!iconOnly && (
        <span className={`font-mono uppercase tracking-widest ${config.text}`}>
          <span style={{ color: "var(--cyan)" }} className="glow-text-cyan">null</span>
          <span style={{ color: "var(--text-secondary)" }}>scan</span>
        </span>
      )}
    </Link>
  )
}
