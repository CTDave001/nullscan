"use client"

import { Activity, Terminal, AlertTriangle } from "lucide-react"

export type ScanTab = "status" | "log" | "findings"

interface ScanTabsProps {
  activeTab: ScanTab
  onTabChange: (tab: ScanTab) => void
  findingsCount: number
}

export function ScanTabs({ activeTab, onTabChange, findingsCount }: ScanTabsProps) {
  const tabs: { id: ScanTab; label: string; icon: typeof Activity }[] = [
    { id: "status", label: "Status", icon: Activity },
    { id: "log", label: "Log", icon: Terminal },
    { id: "findings", label: "Findings", icon: AlertTriangle },
  ]

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden safe-area-bottom"
      style={{
        backgroundColor: "var(--surface)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center h-14">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center h-full gap-1 relative transition-colors"
              style={{ color: isActive ? "var(--cyan)" : "var(--text-muted)" }}
            >
              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute top-0 left-1/4 right-1/4 h-0.5"
                  style={{ backgroundColor: "var(--cyan)" }}
                />
              )}
              <div className="relative">
                <Icon className="w-5 h-5" />
                {/* Findings badge */}
                {tab.id === "findings" && findingsCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold"
                    style={{
                      backgroundColor: "var(--critical)",
                      color: "var(--void)",
                    }}
                  >
                    {findingsCount}
                  </span>
                )}
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider">
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
