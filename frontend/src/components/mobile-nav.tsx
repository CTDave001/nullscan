"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  const close = useCallback(() => setIsOpen(false), [])

  // Close on escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isOpen, close])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const handleLaunchScan = () => {
    close()
    setTimeout(() => {
      const terminal = document.getElementById("terminal")
      if (terminal) {
        terminal.scrollIntoView({ behavior: "smooth", block: "center" })
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("launch-scan"))
          const input = terminal.querySelector("input")
          input?.focus()
        }, 500)
      }
    }, 100)
  }

  return (
    <div className="lg:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-11 h-11 rounded-[var(--radius-sm)] transition-colors"
        style={{ color: "var(--text-muted)" }}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay + Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />

          {/* Drawer from right */}
          <div
            className="absolute top-0 right-0 bottom-0 w-72 flex flex-col safe-area-bottom"
            style={{
              backgroundColor: "var(--surface)",
              borderLeft: "1px solid var(--border)",
            }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-5 h-14"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <span
                className="font-mono text-[10px] uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Menu
              </span>
              <button
                onClick={close}
                className="flex items-center justify-center w-11 h-11 rounded-[var(--radius-sm)] transition-colors"
                style={{ color: "var(--text-muted)" }}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 flex flex-col px-5 py-6 gap-1">
              <Link
                href="/#pricing"
                onClick={close}
                className="flex items-center h-11 px-3 rounded-[var(--radius-sm)] font-mono text-sm uppercase tracking-wider transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                Pricing
              </Link>
              <Link
                href="/scope"
                onClick={close}
                className="flex items-center h-11 px-3 rounded-[var(--radius-sm)] font-mono text-sm uppercase tracking-wider transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                Scope
              </Link>
            </nav>

            {/* CTA */}
            <div className="px-5 pb-6">
              <button
                onClick={handleLaunchScan}
                className="w-full h-11 rounded-[var(--radius-sm)] font-mono text-sm uppercase tracking-wider transition-all cursor-pointer"
                style={{
                  backgroundColor: "var(--cyan)",
                  color: "var(--void)",
                }}
              >
                Launch Scan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
