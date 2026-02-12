"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { StatusBar } from "@/components/status-bar"
import { GridOverlay, CornerMarkers } from "@/components/grid-overlay"
import { NullscanLogo } from "@/components/nullscan-logo"
import { ScanTabs, type ScanTab } from "@/components/scan-tabs"
import { AlertTriangle, CheckCircle, ExternalLink } from "lucide-react"

const PHASES = [
  { id: "init", label: "Initialize", short: "INIT" },
  { id: "recon", label: "Reconnaissance", short: "RECON" },
  { id: "probe", label: "Endpoint Probing", short: "PROBE" },
  { id: "attack", label: "Attack Vectors", short: "ATTACK" },
  { id: "analyze", label: "Response Analysis", short: "ANALYZE" },
  { id: "report", label: "Report Generation", short: "REPORT" },
]

interface Scan {
  id: string
  status: string
  target_url: string
  created_at: string
  scan_type: string
}

interface Finding {
  title: string
  severity: string
}

interface ActiveAgent {
  label: string
  description: string
  status: string
}

interface ActivityEntry {
  ts: string
  description: string
  status: string
  line?: number
}

interface Progress {
  agents?: number
  active_agents?: number
  tools?: number
  input_tokens?: number
  output_tokens?: number
  cost?: number
  vulnerabilities_found?: number
  findings_so_far?: Finding[]
  active_agent_list?: ActiveAgent[]
  recent_activity?: ActivityEntry[]
  current_phase?: string
}

function ElapsedTimer({ createdAt }: { createdAt?: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!createdAt) return
    const raw = createdAt.endsWith("Z") ? createdAt : createdAt + "Z"
    const start = new Date(raw).getTime()
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    update()
    const tick = setInterval(update, 1000)
    return () => clearInterval(tick)
  }, [createdAt])

  const m = Math.floor(elapsed / 60)
  const sec = elapsed % 60
  return (
    <span style={{ color: "var(--cyan)" }}>
      {String(m).padStart(2, "0")}:{String(sec).padStart(2, "0")}
    </span>
  )
}

export default function ScanStatusPage() {
  const params = useParams()
  const router = useRouter()
  const scanId = params.id as string

  const [scan, setScan] = useState<Scan | null>(null)
  const [progress, setProgress] = useState<Progress>({})
  const [error, setError] = useState("")
  const [maxTokens, setMaxTokens] = useState(0)
  const [activeTab, setActiveTab] = useState<ScanTab>("log")
  const activityRef = useRef<HTMLDivElement>(null)
  const userScrolledUp = useRef(false)
  const routerRef = useRef(router)

  const formatBigNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
    return String(n)
  }

  const getPhaseIndex = (phaseName?: string) => {
    const phaseMap: Record<string, number> = {
      init: 0,
      recon: 1,
      probe: 2,
      attack: 3,
      analyze: 4,
      report: 5,
    }
    return phaseMap[phaseName || "init"] ?? 0
  }

  const getThreatColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "var(--critical)",
      high: "var(--high)",
      medium: "var(--medium)",
      low: "var(--low)",
    }
    return colors[severity.toLowerCase()] || "var(--text-muted)"
  }

  // Auto-scroll activity log (freeze when user scrolls up, resume at bottom)
  useEffect(() => {
    if (activityRef.current && !userScrolledUp.current) {
      activityRef.current.scrollTop = activityRef.current.scrollHeight
    }
  }, [progress.recent_activity])

  const handleActivityScroll = useCallback(() => {
    const el = activityRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    userScrolledUp.current = distanceFromBottom > 40
  }, [])

  // Fetch scan and progress
  const fetchData = useCallback(async () => {
    try {
      const [scanRes, progressRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/scans/${scanId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/scans/${scanId}/progress`),
      ])

      if (!scanRes.ok) throw new Error("Scan not found")
      const scanData = await scanRes.json()
      setScan(scanData)

      if (progressRes.ok) {
        const progressData = await progressRes.json()
        if (progressData.progress && Object.keys(progressData.progress).length > 0) {
          setProgress(progressData.progress)
          const newTokens = progressData.progress.input_tokens ?? 0
          setMaxTokens(prev => Math.max(prev, newTokens))
        }
      }

      if (scanData.status === "completed") {
        setTimeout(() => routerRef.current.push(`/results/${scanId}`), 2000)
      } else if (scanData.status === "failed") {
        setError("Scan failed. Please try again.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }, [scanId])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  const displayTokens = Math.max(maxTokens, progress.input_tokens ?? 0)
  const currentPhase = getPhaseIndex(progress.current_phase)
  const isComplete = scan?.status === "completed"
  const isFailed = scan?.status === "failed"
  const hasProgress = progress.agents !== undefined
  const activeAgents = progress.active_agent_list ?? []
  const recentActivity = progress.recent_activity ?? []
  const findings = progress.findings_so_far ?? []

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--void)" }}>
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4" style={{ color: "var(--critical)" }} />
          <p className="font-mono text-xs uppercase mb-4" style={{ color: "var(--text-muted)" }}>{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-2 rounded-[var(--radius-sm)] font-mono text-xs uppercase"
            style={{ backgroundColor: "var(--cyan)", color: "var(--void)" }}
          >
            New Scan
          </a>
        </div>
      </div>
    )
  }

  // ===== Shared panel sub-components =====

  const StatusPanel = () => (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Target Info */}
      <div className="space-y-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-dim)" }}>
            Target
          </p>
          <p className="font-mono text-sm truncate" style={{ color: "var(--text)" }}>
            {scan?.target_url || "Loading..."}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-dim)" }}>
            Status
          </p>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${!isComplete && !isFailed ? "animate-status-pulse" : ""}`}
              style={{ backgroundColor: isComplete ? "var(--low)" : isFailed ? "var(--critical)" : "var(--cyan)" }}
            />
            <span className="font-mono text-sm uppercase" style={{ color: isComplete ? "var(--low)" : isFailed ? "var(--critical)" : "var(--cyan)" }}>
              {isComplete ? "Complete" : isFailed ? "Failed" : "Scanning"}
            </span>
          </div>
        </div>
      </div>

      {/* Phase Progress */}
      <div className="space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
          Scan Phase
        </p>
        <div className="space-y-1">
          {PHASES.map((phase, i) => {
            const isActive = i === currentPhase
            const isCompleted = i < currentPhase
            return (
              <div
                key={phase.id}
                className="flex items-center gap-3 py-1"
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isActive ? "animate-status-pulse" : ""}`}
                  style={{
                    backgroundColor: isActive ? "var(--cyan)" : isCompleted ? "var(--low)" : "var(--text-ghost)"
                  }}
                />
                <span
                  className="font-mono text-[11px] uppercase"
                  style={{
                    color: isActive ? "var(--cyan)" : isCompleted ? "var(--text-muted)" : "var(--text-ghost)"
                  }}
                >
                  {phase.short}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Agents */}
      <div className="space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
          Active Agents ({progress.active_agents ?? 0}/{progress.agents ?? 0})
        </p>
        <div className="space-y-2 max-h-[40vh] overflow-y-auto scrollbar-none">
          {activeAgents.length > 0 ? (
            activeAgents.map((agent, i) => (
              <div
                key={i}
                className="p-2 rounded-[var(--radius-sm)]"
                style={{
                  backgroundColor: "var(--bg)",
                  border: agent.status === "running" ? "1px solid var(--cyan)" : "1px solid var(--border)"
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${agent.status === "running" ? "animate-status-pulse" : ""}`}
                    style={{ backgroundColor: agent.status === "running" ? "var(--online)" : "var(--text-dim)" }}
                  />
                  <span className="font-mono text-[11px]" style={{ color: "var(--text)" }}>
                    {agent.label}
                  </span>
                </div>
                {agent.description && (
                  <p className="font-mono text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                    {agent.description}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="font-mono text-[10px]" style={{ color: "var(--text-ghost)" }}>
              {hasProgress ? "Deploying agents..." : "Initializing sandbox..."}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
          Metrics
        </p>
        <div className="space-y-2">
          {[
            { label: "Tools Executed", value: formatBigNumber(progress.tools ?? 0) },
            { label: "Tokens Processed", value: formatBigNumber(displayTokens) },
            { label: "Findings", value: String(progress.vulnerabilities_found ?? 0) },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </span>
              <span className="font-mono text-sm" style={{ color: "var(--text)" }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const LogPanel = ({ heightClass }: { heightClass: string }) => (
    <div className="flex flex-col" style={{ borderColor: "var(--border)" }}>
      <div
        className="px-4 sm:px-6 py-3 border-b flex items-center justify-between"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Scan Log
        </span>
        <span className="font-mono text-[10px]" style={{ color: "var(--text-dim)" }}>
          {recentActivity.length} events
        </span>
      </div>
      <div
        ref={activityRef}
        onScroll={handleActivityScroll}
        className={`p-4 overflow-y-auto scrollbar-none font-mono text-xs ${heightClass}`}
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="py-1" style={{ color: "var(--text-muted)" }}>
          <span style={{ color: "var(--text-dim)" }}>000</span> Nullscan engine initialized. Target: {scan?.target_url ?? "..."}
        </div>

        {!hasProgress && (
          <div className="py-1" style={{ color: "var(--cyan)" }}>
            <span style={{ color: "var(--text-dim)" }}>001</span> Setting up sandbox and deploying agents...
          </div>
        )}

        {recentActivity.map((entry, i) => {
          const lineNum = entry.line ?? i + 1
          const isFinding =
            entry.description?.includes("VULN") ||
            entry.description?.toLowerCase().includes("vulnerability")
          return (
            <div
              key={i}
              className={`py-1 animate-fade-in-up ${isFinding ? "bg-[var(--critical)]/10 -mx-2 px-2 rounded" : ""}`}
              style={{
                color: isFinding ? "var(--critical)" :
                       entry.description?.startsWith("[INIT]") || entry.description?.startsWith("[RECON]") ? "var(--cyan)" :
                       entry.description?.startsWith("[SQLI]") || entry.description?.startsWith("[XSS]") ? "var(--medium)" :
                       "var(--text-secondary)"
              }}
            >
              <span style={{ color: "var(--text-dim)" }}>{String(lineNum).padStart(3, "0")}</span>
              {" "}
              {entry.description}
            </div>
          )
        })}

        {hasProgress && !isComplete && !isFailed && (
          <div className="py-1 flex items-center gap-2" style={{ color: "var(--cyan)" }}>
            <span style={{ color: "var(--text-dim)" }}>{String((recentActivity.length > 0 ? (recentActivity[recentActivity.length - 1].line ?? recentActivity.length) : 0) + 1).padStart(3, "0")}</span>
            <span className="animate-status-pulse">_</span>
          </div>
        )}

        {/* Spacer so the last entry rests in the middle of the viewport */}
        <div style={{ height: "40vh" }} />
      </div>
    </div>
  )

  const FindingsPanel = () => (
    <div className="flex flex-col">
      <div
        className="px-4 sm:px-6 py-3 border-b flex items-center justify-between"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Threat Intelligence
        </span>
        <span
          className="font-mono text-sm font-bold"
          style={{ color: (progress.vulnerabilities_found ?? 0) > 0 ? "var(--critical)" : "var(--text-dim)" }}
        >
          {progress.vulnerabilities_found ?? 0}
        </span>
      </div>
      <div className="flex-1 p-4 space-y-3" style={{ backgroundColor: "var(--bg)" }}>
        {findings.length > 0 ? (
          findings.map((finding, i) => (
            <div
              key={i}
              className="p-3 rounded-[var(--radius)] animate-fade-in-up"
              style={{
                backgroundColor: "var(--surface)",
                border: `1px solid ${getThreatColor(finding.severity)}40`,
                boxShadow: `0 0 20px ${getThreatColor(finding.severity)}20`
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3 h-3" style={{ color: getThreatColor(finding.severity) }} />
                <span
                  className="font-mono text-[10px] uppercase font-bold"
                  style={{ color: getThreatColor(finding.severity) }}
                >
                  {finding.severity}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--text)" }}>
                {finding.title}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="font-mono text-[10px] uppercase" style={{ color: "var(--text-ghost)" }}>
              No threats detected yet
            </p>
          </div>
        )}

        {/* Completion State */}
        {isComplete && (
          <div
            className="p-4 rounded-[var(--radius)] text-center mt-4"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--low)"
            }}
          >
            <CheckCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--low)" }} />
            <p className="font-mono text-xs uppercase mb-3" style={{ color: "var(--low)" }}>
              Scan Complete
            </p>
            <button
              onClick={() => router.push(`/results/${scanId}`)}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-[var(--radius-sm)] font-mono text-xs uppercase"
              style={{ backgroundColor: "var(--cyan)", color: "var(--void)" }}
            >
              View Report
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Failed State */}
        {isFailed && (
          <div
            className="p-4 rounded-[var(--radius)] text-center mt-4"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--critical)"
            }}
          >
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--critical)" }} />
            <p className="font-mono text-xs uppercase mb-3" style={{ color: "var(--critical)" }}>
              Scan Failed
            </p>
            <a
              href="/"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-[var(--radius-sm)] font-mono text-xs uppercase"
              style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              New Scan
            </a>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "var(--void)" }}>
      <StatusBar />
      <GridOverlay dense />
      <CornerMarkers />

      {/* Scan line animation */}
      {!isComplete && !isFailed && (
        <div
          className="fixed left-0 right-0 h-px pointer-events-none z-30 animate-scan-line"
          style={{
            background: "linear-gradient(90deg, transparent, var(--cyan-glow-intense), transparent)",
            boxShadow: "0 0 30px var(--cyan-glow-intense)"
          }}
        />
      )}

      <main className="relative z-10 pt-16 min-h-screen">
        {/* Top bar */}
        <div
          className="border-b px-4 sm:px-6 py-3 flex items-center justify-between"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <NullscanLogo size="sm" iconOnly />
            <div className="h-4 w-px" style={{ backgroundColor: "var(--border)" }} />
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Scan Active
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6 font-mono text-[10px] uppercase tracking-wider">
            <span className="hidden sm:inline" style={{ color: "var(--text-dim)" }}>
              ID: {scanId.slice(0, 8)}
            </span>
            <span className="sm:hidden" style={{ color: "var(--text-dim)" }}>
              {scanId.slice(0, 4)}
            </span>
            <ElapsedTimer createdAt={scan?.created_at} />
          </div>
        </div>

        {/* Desktop: original 3-column layout */}
        <div className="hidden lg:grid lg:grid-cols-12 min-h-[calc(100vh-8rem)]">
          {/* Left Panel - Status & Agents */}
          <div
            className="lg:col-span-3 border-r p-6 space-y-6"
            style={{ borderColor: "var(--border)" }}
          >
            {StatusPanel()}
          </div>

          {/* Center Panel - Activity Log */}
          <div
            className="lg:col-span-6 border-r flex flex-col"
            style={{ borderColor: "var(--border)" }}
          >
            {LogPanel({ heightClass: "h-[calc(100vh-8rem-41px)]" })}
          </div>

          {/* Right Panel - Findings */}
          <div className="lg:col-span-3 flex flex-col">
            {FindingsPanel()}
          </div>
        </div>

        {/* Mobile: tab-based single panel view */}
        <div className="lg:hidden pb-16">
          {activeTab === "status" && StatusPanel()}
          {activeTab === "log" && LogPanel({ heightClass: "h-[calc(100dvh-8rem-56px)]" })}
          {activeTab === "findings" && FindingsPanel()}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <ScanTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        findingsCount={progress.vulnerabilities_found ?? 0}
      />
    </div>
  )
}
