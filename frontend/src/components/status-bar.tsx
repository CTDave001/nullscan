"use client"

import { useEffect, useState } from "react"

export function StatusBar() {
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString("en-US", { hour12: false }))
      setDate(now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase())
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-8 flex items-center justify-between px-4 font-mono text-[10px] uppercase tracking-wider safe-area-top"
      style={{
        backgroundColor: "var(--void)",
        borderBottom: "1px solid var(--border)",
        color: "var(--text-muted)"
      }}
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full animate-status-pulse"
            style={{ backgroundColor: "var(--online)" }}
          />
          <span>System Online</span>
        </div>
        <span className="hidden sm:inline" style={{ color: "var(--text-dim)" }}>|</span>
        <span className="hidden sm:inline">Secure Connection</span>
      </div>

      <div className="flex items-center gap-6">
        <span className="hidden sm:inline">{date}</span>
        <span style={{ color: "var(--cyan)" }}>{time}</span>
      </div>
    </div>
  )
}
