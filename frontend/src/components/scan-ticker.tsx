"use client"

import { useEffect, useState } from "react"

const ATTACK_CATEGORIES = [
  { label: "SQL Injection Testing", status: "active" },
  { label: "XSS Probe Vectors", status: "active" },
  { label: "Auth Bypass Checks", status: "active" },
  { label: "IDOR Enumeration", status: "active" },
  { label: "SSRF Detection", status: "active" },
  { label: "Path Traversal Scan", status: "active" },
  { label: "CSRF Token Analysis", status: "active" },
  { label: "Rate Limit Testing", status: "active" },
  { label: "Security Header Audit", status: "active" },
  { label: "API Endpoint Fuzzing", status: "active" },
]

export function ScanTicker() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => prev + 0.5)
    }, 30)
    return () => clearInterval(interval)
  }, [])

  // Double the items for seamless loop
  const items = [...ATTACK_CATEGORIES, ...ATTACK_CATEGORIES]

  return (
    <div
      className="w-full overflow-hidden border-y py-3"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)"
      }}
    >
      <div
        className="flex items-center gap-8 whitespace-nowrap"
        style={{
          transform: `translateX(-${offset % (ATTACK_CATEGORIES.length * 280)}px)`,
        }}
      >
        {items.map((cat, i) => (
          <div
            key={i}
            className="flex items-center gap-3 font-mono text-xs"
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-status-pulse"
              style={{ backgroundColor: "var(--cyan)" }}
            />
            <span style={{ color: "var(--text-muted)" }}>
              {cat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
