"use client"

import Link from "next/link"
import { NullscanLogo } from "./nullscan-logo"

interface NavbarProps {
  withStatusBar?: boolean
}

export function Navbar({ withStatusBar = false }: NavbarProps) {
  const handleLaunchScan = () => {
    const terminal = document.getElementById("terminal")
    if (terminal) {
      terminal.scrollIntoView({ behavior: "smooth", block: "center" })
      // Dispatch event to show hint and focus input after scroll
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("launch-scan"))
        const input = terminal.querySelector("input")
        input?.focus()
      }, 500)
    }
  }

  return (
    <header
      className="fixed left-0 right-0 z-40 h-14 2xl:h-16 flex items-center"
      style={{
        top: withStatusBar ? "2rem" : 0,
        backgroundColor: "transparent",
      }}
    >
      <nav className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 2xl:px-12 flex items-center justify-between">
        <NullscanLogo size="md" />

        <div className="flex items-center gap-8 2xl:gap-10 font-mono text-xs 2xl:text-sm uppercase tracking-wider">
          <Link
            href="/#pricing"
            className="transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cyan)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            Pricing
          </Link>
          <Link
            href="/scope"
            className="transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cyan)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            Scope
          </Link>
          <button
            onClick={handleLaunchScan}
            className="px-3 py-1.5 rounded-[var(--radius-sm)] transition-all cursor-pointer"
            style={{
              backgroundColor: "var(--cyan)",
              color: "var(--void)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 0 20px var(--cyan-glow-intense)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            Launch Scan
          </button>
        </div>
      </nav>
    </header>
  )
}
