"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { StatusBar } from "@/components/status-bar"
import { GridOverlay, CornerMarkers } from "@/components/grid-overlay"
import { NullscanLogo } from "@/components/nullscan-logo"
import { Footer } from "@/components/footer"
import { CheckoutModal } from "@/components/checkout-modal"
import {
  Lock,
  Check,
  Copy,
  CheckCheck,
  AlertTriangle,
  Shield,
  Globe,
  Server,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  FileText,
  ExternalLink,
  X,
  Mail,
  Zap,
} from "lucide-react"

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Finding {
  title: string
  severity: string
  endpoint: string
  impact: string
  reproduction_steps?: string
  poc?: string
  fix_guidance?: string
}

interface ScanStats {
  endpoints_discovered: number
  endpoints_tested: number
  subdomains_found: number
  requests_sent: number
  duration_minutes: number
  technologies_identified: number
}

interface CategoryResult {
  name: string
  status: string
  findings_count: number
  note?: string
}

interface AreaOfInterest {
  title: string
  severity: string
  teaser: string
  affected_component: string
  technical_detail?: string
  recommendation?: string
}

interface Recommendation {
  priority: number
  title: string
  description?: string
  effort?: string
  impact?: string
}

interface Constraint {
  description: string
  impact: string
}

interface AttackSurface {
  subdomains: string[]
  key_routes: string[]
  technologies: string[]
  auth_mechanisms: string[]
  external_services: string[]
}

interface StructuredReport {
  executive_summary: string
  risk_level: string
  risk_rationale: string
  scan_stats: ScanStats
  categories_tested: CategoryResult[]
  attack_surface: AttackSurface
  areas_of_interest: AreaOfInterest[]
  recommendations: Recommendation[]
  constraints: Constraint[]
  deep_scan_value_prop?: string
  what_deep_scan_covers?: string[]
}

interface ScanResults {
  scan_id: string
  target_url: string
  risk_level: string
  findings: Finding[]
  scan_type: string
  paid_tier: string | null
  structured_report?: StructuredReport
  expired?: boolean
  expires_in_days?: number | null
}

// ============================================================================
// HELPERS
// ============================================================================

const getThreatColor = (severity: string) => {
  const colors: Record<string, string> = {
    critical: "var(--critical)",
    high: "var(--high)",
    medium: "var(--medium)",
    low: "var(--low)",
  }
  return colors[severity.toLowerCase()] || "var(--text-muted)"
}

const getRiskColor = (level: string) => {
  const colors: Record<string, string> = {
    critical: "var(--critical)",
    high: "var(--high)",
    medium: "var(--medium)",
    low: "var(--low)",
    clean: "var(--low)",
    indeterminate: "var(--text-muted)",
  }
  return colors[level.toLowerCase()] || "var(--text-muted)"
}

const formatNumber = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ResultsPage() {
  const params = useParams()
  const scanId = params.id as string

  const [results, setResults] = useState<ScanResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [expandedArea, setExpandedArea] = useState<number | null>(0)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [checkoutTier, setCheckoutTier] = useState<"pro" | "deep" | undefined>(undefined)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [childStatus, setChildStatus] = useState<{
    has_child: boolean
    status?: string
    scan_type?: string
    progress?: Record<string, unknown>
  } | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/scans/${scanId}/results`
        )
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.detail || "Failed to load results")
        }
        const data = await res.json()
        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [scanId])

  // Poll child scan status
  useEffect(() => {
    const fetchChildStatus = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/scans/${scanId}/child-status`
        )
        if (res.ok) {
          const data = await res.json()
          setChildStatus(data)
          // Auto-refresh results when child scan completes
          if (data.has_child && data.status === "completed") {
            const resultsRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/scans/${scanId}/results`
            )
            if (resultsRes.ok) {
              setResults(await resultsRes.json())
            }
          }
        }
      } catch {
        // Ignore child status errors
      }
    }
    fetchChildStatus()
    const interval = setInterval(fetchChildStatus, 10000)
    return () => clearInterval(interval)
  }, [scanId])

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handlePdfClick = () => {
    if (results?.paid_tier) {
      setShowPdfModal(true)
    } else {
      openCheckout()
    }
  }

  const openCheckout = (tier?: "pro" | "deep") => {
    setCheckoutTier(tier)
    setShowCheckoutModal(true)
  }

  const handleCheckoutSuccess = () => {
    setShowCheckoutModal(false)
    setCheckoutTier(undefined)
    // Refresh the page to show unlocked content
    window.location.reload()
  }

  const handleSendPdf = async () => {
    setSendingEmail(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scans/${scanId}/send-pdf`,
        { method: "POST" }
      )
      if (!res.ok) throw new Error("Failed to send PDF")
      setEmailSent(true)
      setTimeout(() => {
        setShowPdfModal(false)
        setEmailSent(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send PDF")
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--void)" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "var(--border)", borderTopColor: "var(--cyan)" }} />
          <p className="font-mono text-xs uppercase" style={{ color: "var(--text-muted)" }}>Loading Intelligence</p>
        </div>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--void)" }}>
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4" style={{ color: "var(--critical)" }} />
          <p className="font-mono text-xs uppercase mb-4" style={{ color: "var(--text-muted)" }}>{error || "Results Not Found"}</p>
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

  // Handle expired free reports
  if (results.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--void)" }}>
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
            <Lock className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
          </div>
          <h2 className="font-mono text-lg uppercase tracking-wider mb-3" style={{ color: "var(--text)" }}>Report Expired</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Free reports expire after 30 days. Your scan results for <strong style={{ color: "var(--text-secondary)" }}>{results.target_url}</strong> are no longer available.
          </p>
          <div className="space-y-3">
            <a
              href="/"
              className="block w-full py-3 rounded-[var(--radius-sm)] font-mono text-xs uppercase tracking-wider text-center"
              style={{ backgroundColor: "var(--cyan)", color: "var(--void)" }}
            >
              Run a New Scan
            </a>
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>
              Paid reports never expire. Unlock any scan to keep it permanently.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const isPaid = results.paid_tier !== null
  const report = results.structured_report
  const stats = report?.scan_stats
  const areasOfInterest = report?.areas_of_interest ?? []

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "var(--void)" }}>
      <StatusBar />
      <GridOverlay />
      <CornerMarkers />

      <main className="relative z-10 pt-16">
        {/* Header Bar */}
        <div
          className="border-b px-6 py-3 flex items-center justify-between"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-4">
            <NullscanLogo size="sm" iconOnly />
            <div className="h-4 w-px" style={{ backgroundColor: "var(--border)" }} />
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Intelligence Report
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase" style={{ color: "var(--text-dim)" }}>
              ID: {scanId.slice(0, 8)}
            </span>
            <button
              onClick={handlePdfClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] font-mono text-[10px] uppercase tracking-wider transition-all hover:border-[var(--cyan)]"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <FileText className="w-3 h-3" />
              Send PDF Report
            </button>
          </div>
        </div>

        {/* Free Scan Expiration Warning */}
        {!isPaid && results.expires_in_days != null && results.expires_in_days <= 30 && (
          <div
            className="px-6 py-2.5 flex items-center justify-between"
            style={{ backgroundColor: "#422006", borderBottom: "1px solid #854d0e" }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#eab308" }} />
              <span className="font-mono text-xs" style={{ color: "#fde68a" }}>
                Free report expires in {results.expires_in_days} day{results.expires_in_days !== 1 ? "s" : ""}. Unlock to keep it permanently.
              </span>
            </div>
            <button
              onClick={() => openCheckout()}
              className="px-3 py-1 rounded-[var(--radius-sm)] font-mono text-[10px] uppercase tracking-wider"
              style={{ backgroundColor: "#eab308", color: "#09090b" }}
            >
              Unlock — $39
            </button>
          </div>
        )}

        {/* Risk Banner */}
        <div
          className="px-6 py-6 border-b"
          style={{
            backgroundColor: "var(--bg)",
            borderColor: "var(--border)",
            boxShadow: `inset 0 -1px 0 ${getRiskColor(results.risk_level)}20`
          }}
        >
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
                Target
              </p>
              <p className="font-mono text-xl" style={{ color: "var(--text)" }}>
                {results.target_url}
              </p>
            </div>

            <div className="flex items-center gap-8">
              {/* Risk Level */}
              <div className="text-center">
                <p className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-dim)" }}>
                  Risk Assessment
                </p>
                <div
                  className="px-4 py-2 rounded-[var(--radius)] font-mono text-lg font-bold uppercase"
                  style={{
                    backgroundColor: `${getRiskColor(results.risk_level)}20`,
                    color: getRiskColor(results.risk_level),
                    border: `1px solid ${getRiskColor(results.risk_level)}40`,
                    boxShadow: `0 0 30px ${getRiskColor(results.risk_level)}20`
                  }}
                >
                  {results.risk_level}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Child scan in-progress banner */}
        {childStatus?.has_child && childStatus.status !== "completed" && childStatus.status !== "failed" && (
          <div
            className="px-6 py-3 border-b flex items-center justify-center gap-3"
            style={{
              backgroundColor: "rgba(6, 182, 212, 0.05)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="w-2 h-2 rounded-full animate-status-pulse"
              style={{ backgroundColor: "var(--cyan)" }}
            />
            <span className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--cyan)" }}>
              {childStatus.scan_type === "deep" ? "Deep" : "Pro"} scan in progress — results will update automatically
            </span>
          </div>
        )}

        {/* Stats strip */}
        {stats && (
          <div className="border-b" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="max-w-6xl mx-auto px-6 py-3">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[13px] font-mono" style={{ color: "var(--text-muted)" }}>
                <span>
                  <span style={{ color: "var(--text)" }}>{formatNumber(stats.endpoints_tested)}</span> endpoints tested
                </span>
                <span style={{ color: "var(--text-dim)" }}>{"\u00B7"}</span>
                <span>
                  <span style={{ color: "var(--text)" }}>{formatNumber(stats.requests_sent)}</span> requests
                </span>
                <span style={{ color: "var(--text-dim)" }}>{"\u00B7"}</span>
                <span>
                  <span style={{ color: "var(--text)" }}>{stats.duration_minutes}</span> min
                </span>
                <span style={{ color: "var(--text-dim)" }}>{"\u00B7"}</span>
                <span>
                  <span style={{ color: "var(--text)" }}>{areasOfInterest.length || results.findings.length}</span> areas of interest
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-6">
              {/* Executive Summary */}
              {report && (
                <section className="p-6 rounded-[var(--radius)]" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                  <h2 className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--text-dim)" }}>
                    Executive Summary
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {report.executive_summary}
                  </p>
                  {report.risk_rationale && (
                    <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
                      <span style={{ color: "var(--text)" }}>Risk rationale:</span> {report.risk_rationale}
                    </p>
                  )}
                </section>
              )}

              {/* Areas of Interest / Findings */}
              {areasOfInterest.length > 0 ? (
                <section>
                  <h2 className="font-mono text-[10px] uppercase tracking-wider mb-4" style={{ color: "var(--text-dim)" }}>
                    Areas of Interest
                  </h2>
                  <div className="space-y-3">
                    {areasOfInterest.map((area, i) => {
                      const isExpanded = expandedArea === i
                      const color = getThreatColor(area.severity)

                      return (
                        <div
                          key={i}
                          className="rounded-[var(--radius)] overflow-hidden transition-all"
                          style={{
                            backgroundColor: "var(--surface)",
                            border: `1px solid ${isExpanded ? color + "40" : "var(--border)"}`,
                            boxShadow: isExpanded ? `0 0 30px ${color}20` : "none"
                          }}
                        >
                          {/* Header */}
                          <button
                            onClick={() => setExpandedArea(isExpanded ? null : i)}
                            className="w-full px-4 py-4 flex items-center gap-4 text-left"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                            ) : (
                              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                            )}
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate" style={{ color: "var(--text)" }}>{area.title}</p>
                              <p className="font-mono text-xs truncate" style={{ color: "var(--cyan)" }}>{area.affected_component}</p>
                            </div>
                            <span
                              className="shrink-0 px-2 py-0.5 rounded-[var(--radius-sm)] font-mono text-[10px] uppercase font-bold"
                              style={{ backgroundColor: `${color}20`, color }}
                            >
                              {area.severity}
                            </span>
                          </button>

                          {/* Details */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-2 space-y-4 border-t animate-fade-in-up" style={{ borderColor: "var(--border)" }}>
                              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{area.teaser}</p>

                              {/* Locked content for free tier */}
                              {!isPaid ? (
                                <div className="relative p-4 rounded-[var(--radius)] overflow-hidden" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
                                  <div className="filter blur-sm opacity-30 select-none pointer-events-none space-y-2">
                                    <div className="h-3 rounded" style={{ backgroundColor: "var(--text-dim)", width: "60%" }} />
                                    <div className="h-3 rounded" style={{ backgroundColor: "var(--text-dim)", width: "80%" }} />
                                    <div className="h-3 rounded" style={{ backgroundColor: "var(--text-dim)", width: "40%" }} />
                                  </div>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                      <Lock className="w-5 h-5 mx-auto mb-2" style={{ color: "var(--cyan)" }} />
                                      <p className="font-mono text-[10px] uppercase" style={{ color: "var(--text-muted)" }}>
                                        Technical details locked
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {area.technical_detail && (
                                    <div>
                                      <h4 className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-dim)" }}>
                                        Technical Analysis
                                      </h4>
                                      <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                                        {area.technical_detail}
                                      </p>
                                    </div>
                                  )}
                                  {area.recommendation && (
                                    <div>
                                      <h4 className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-dim)" }}>
                                        Recommendation
                                      </h4>
                                      <p className="text-sm" style={{ color: "var(--low)" }}>
                                        {area.recommendation}
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              ) : results.findings.length > 0 ? (
                // Legacy findings if no structured report
                <section>
                  <h2 className="font-mono text-[10px] uppercase tracking-wider mb-4" style={{ color: "var(--text-dim)" }}>
                    Findings
                  </h2>
                  <div className="space-y-3">
                    {results.findings.map((finding, i) => {
                      const color = getThreatColor(finding.severity)
                      return (
                        <div
                          key={i}
                          className="p-5 rounded-[var(--radius)]"
                          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h3 className="font-semibold mb-1" style={{ color: "var(--text)" }}>{finding.title}</h3>
                              <p className="font-mono text-[13px]" style={{ color: "var(--cyan)" }}>{finding.endpoint}</p>
                            </div>
                            <span
                              className="shrink-0 px-2 py-0.5 rounded-[var(--radius-sm)] font-mono text-[10px] uppercase font-bold"
                              style={{ backgroundColor: `${color}20`, color }}
                            >
                              {finding.severity}
                            </span>
                          </div>
                          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>{finding.impact}</p>

                          {!isPaid ? (
                            <div className="relative p-4 rounded-[var(--radius)] overflow-hidden" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
                              <div className="filter blur-sm opacity-30 select-none pointer-events-none space-y-2 mb-4">
                                <p>1. Send a POST request to the endpoint...</p>
                                <p>2. Observe that the response contains...</p>
                              </div>
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg)]/80 backdrop-blur-[2px] rounded-[var(--radius)]">
                                <Lock className="w-4 h-4 mb-2" style={{ color: "var(--text-muted)" }} />
                                <p className="font-mono text-[10px] uppercase" style={{ color: "var(--text-muted)" }}>
                                  POC and fix guidance locked
                                </p>
                              </div>
                            </div>
                          ) : (
                            <>
                              {finding.reproduction_steps && (
                                <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                                  <h4 className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-dim)" }}>
                                    Reproduction Steps
                                  </h4>
                                  <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                                    {finding.reproduction_steps}
                                  </p>
                                </div>
                              )}
                              {finding.poc && (
                                <div className="mt-4">
                                  <h4 className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-dim)" }}>
                                    Proof of Concept
                                  </h4>
                                  <div className="relative">
                                    <pre className="p-4 rounded-[var(--radius)] font-mono text-xs overflow-x-auto" style={{ backgroundColor: "var(--void)", color: "var(--cyan)" }}>
                                      {finding.poc}
                                    </pre>
                                    <button
                                      onClick={() => copyToClipboard(finding.poc!, i)}
                                      className="absolute top-2 right-2 p-1.5 rounded transition-colors"
                                      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                                    >
                                      {copiedIndex === i ? (
                                        <CheckCheck className="w-3 h-3" style={{ color: "var(--low)" }} />
                                      ) : (
                                        <Copy className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                              {finding.fix_guidance && (
                                <div className="mt-4">
                                  <h4 className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-dim)" }}>
                                    Fix Guidance
                                  </h4>
                                  <p className="text-sm" style={{ color: "var(--low)" }}>
                                    {finding.fix_guidance}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              ) : (
                // No findings
                <section className="p-8 rounded-[var(--radius)] text-center" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                  <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--low)" }} />
                  <p className="font-mono text-sm mb-2" style={{ color: "var(--low)" }}>No Vulnerabilities Detected</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Your application passed all tests in the {results.scan_type} scan.
                  </p>
                </section>
              )}

              {/* Attack Surface */}
              {report && (
                <section className="p-6 rounded-[var(--radius)]" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                  <h2 className="font-mono text-[10px] uppercase tracking-wider mb-4" style={{ color: "var(--text-dim)" }}>
                    Discovered Attack Surface
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {report.attack_surface.subdomains.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <Globe className="w-3.5 h-3.5" style={{ color: "var(--cyan)" }} />
                          Subdomains
                        </div>
                        <div className="space-y-1">
                          {report.attack_surface.subdomains.slice(0, 5).map((sub, i) => (
                            <p key={i} className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
                          ))}
                          {report.attack_surface.subdomains.length > 5 && (
                            <p className="text-xs" style={{ color: "var(--text-dim)" }}>+{report.attack_surface.subdomains.length - 5} more</p>
                          )}
                        </div>
                      </div>
                    )}

                    {report.attack_surface.key_routes.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <Server className="w-3.5 h-3.5" style={{ color: "var(--cyan)" }} />
                          Key Routes
                        </div>
                        <div className="space-y-1">
                          {report.attack_surface.key_routes.slice(0, 5).map((route, i) => (
                            <p key={i} className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{route}</p>
                          ))}
                          {report.attack_surface.key_routes.length > 5 && (
                            <p className="text-xs" style={{ color: "var(--text-dim)" }}>+{report.attack_surface.key_routes.length - 5} more</p>
                          )}
                        </div>
                      </div>
                    )}

                    {report.attack_surface.technologies.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <Shield className="w-3.5 h-3.5" style={{ color: "var(--cyan)" }} />
                          Technologies
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {report.attack_surface.technologies.map((tech, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.attack_surface.auth_mechanisms.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <Lock className="w-3.5 h-3.5" style={{ color: "var(--cyan)" }} />
                          Auth Mechanisms
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {report.attack_surface.auth_mechanisms.map((auth, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
                              {auth}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Recommendations */}
              {report && report.recommendations.length > 0 && (
                <section className="p-6 rounded-[var(--radius)]" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                  <h2 className="font-mono text-[10px] uppercase tracking-wider mb-4" style={{ color: "var(--text-dim)" }}>
                    Recommendations
                  </h2>
                  <div className="space-y-3">
                    {report.recommendations.sort((a, b) => a.priority - b.priority).map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: "var(--bg)" }}>
                        <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold" style={{ backgroundColor: `${getThreatColor("low")}20`, color: "var(--cyan)" }}>
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-sm" style={{ color: "var(--text)" }}>{rec.title}</p>
                          {isPaid && rec.description && (
                            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{rec.description}</p>
                          )}
                          {!isPaid && (
                            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--text-dim)" }}>
                              <Lock className="w-2.5 h-2.5" /> Details locked
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Unlock Card */}
              {!isPaid && (areasOfInterest.length > 0 || results.findings.length > 0) && (
                <div
                  className="p-5 rounded-[var(--radius)]"
                  style={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--cyan)",
                    boxShadow: "0 0 40px var(--cyan-glow)"
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4" style={{ color: "var(--cyan)" }} />
                    <span className="font-mono text-xs uppercase" style={{ color: "var(--cyan)" }}>
                      Unlock Full Report
                    </span>
                  </div>
                  <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                    Get technical details, proof-of-concept exploits, and remediation guidance.
                  </p>
                  <button
                    onClick={() => openCheckout()}
                    className="w-full py-2.5 rounded-[var(--radius-sm)] font-mono text-xs uppercase tracking-wider transition-all"
                    style={{ backgroundColor: "var(--cyan)", color: "var(--void)" }}
                  >
                    Unlock for $39
                  </button>
                </div>
              )}

              {/* Upgrade Upsell for paid unlock users */}
              {isPaid && results.paid_tier === "unlock" && results.scan_type === "quick" && (
                <div
                  className="p-5 rounded-[var(--radius)]"
                  style={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4" style={{ color: "var(--medium)" }} />
                    <span className="font-mono text-xs uppercase" style={{ color: "var(--text)" }}>
                      Go Deeper
                    </span>
                  </div>
                  <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                    Your quick scan covered the basics. Upgrade for comprehensive testing with more attack vectors and iterations.
                  </p>

                  {/* Pro option */}
                  <button
                    onClick={() => openCheckout("pro")}
                    className="w-full p-3 rounded-[var(--radius)] text-left mb-2 transition-all hover:border-[var(--cyan)]"
                    style={{ backgroundColor: "var(--bg)", border: "1px solid var(--cyan)" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-sm font-bold" style={{ color: "var(--cyan)" }}>
                        Pro Scan
                      </span>
                      <span className="font-mono text-sm font-bold" style={{ color: "var(--text)" }}>
                        $250
                      </span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                      300 iterations, 25 concurrent agents
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {["More attack vectors", "Deeper analysis", "Detailed report"].map((f) => (
                        <span key={f} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--surface)", color: "var(--text-dim)" }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </button>

                  {/* Deep option */}
                  <button
                    onClick={() => openCheckout("deep")}
                    className="w-full p-3 rounded-[var(--radius)] text-left transition-all hover:border-[var(--medium)]"
                    style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-bold" style={{ color: "var(--text)" }}>
                          Deep Analysis
                        </span>
                        <Zap className="w-3 h-3" style={{ color: "var(--medium)" }} />
                      </div>
                      <span className="font-mono text-sm font-bold" style={{ color: "var(--text)" }}>
                        $899
                      </span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                      500 iterations, 40 agents, full coverage
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {["Full attack surface", "Executive report", "Priority support"].map((f) => (
                        <span key={f} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--surface)", color: "var(--text-dim)" }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </button>
                </div>
              )}

              {/* Categories Tested */}
              {report && report.categories_tested.length > 0 && (
                <div className="p-5 rounded-[var(--radius)]" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                  <h3 className="font-mono text-[10px] uppercase tracking-wider mb-4" style={{ color: "var(--text-dim)" }}>
                    Attack Categories Tested
                  </h3>
                  <div className="space-y-2">
                    {report.categories_tested.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{cat.name}</span>
                        {cat.status === "tested" ? (
                          <Check className="w-3.5 h-3.5" style={{ color: "var(--low)" }} />
                        ) : cat.status === "findings" ? (
                          <AlertTriangle className="w-3.5 h-3.5" style={{ color: "var(--high)" }} />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: "var(--border)" }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scan Metadata */}
              <div className="p-5 rounded-[var(--radius)]" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                <h3 className="font-mono text-[10px] uppercase tracking-wider mb-4" style={{ color: "var(--text-dim)" }}>
                  Scan Details
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Scan ID", value: scanId.slice(0, 12) },
                    { label: "Scan Type", value: results.scan_type },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase" style={{ color: "var(--text-muted)" }}>{item.label}</span>
                      <span className="font-mono text-xs" style={{ color: "var(--text)" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deep Scan Upsell */}
              {report?.deep_scan_value_prop && (
                <div className="p-5 rounded-[var(--radius)]" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>Want deeper insights?</h3>
                  <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{report.deep_scan_value_prop}</p>
                  {report.what_deep_scan_covers && (
                    <div className="space-y-2 mb-4">
                      {report.what_deep_scan_covers.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                          <ChevronRight className="w-3 h-3" style={{ color: "var(--cyan)" }} />
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => openCheckout("deep")}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[var(--radius-sm)] font-mono text-xs uppercase tracking-wider transition-all"
                    style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
                  >
                    Deep Analysis — $899
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <a
                  href="/"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[var(--radius-sm)] font-mono text-xs uppercase tracking-wider transition-all"
                  style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
                >
                  <ExternalLink className="w-3 h-3" />
                  New Scan
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* PDF Email Modal (for paid users only) */}
      {showPdfModal && isPaid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPdfModal(false)}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-md rounded-[var(--radius)] overflow-hidden animate-fade-in-up"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowPdfModal(false)}
              className="absolute top-4 right-4 p-1 rounded transition-colors hover:bg-[var(--bg)]"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--low-glow, rgba(34, 197, 94, 0.1))", border: "1px solid var(--low)" }}
                >
                  <Mail className="w-5 h-5" style={{ color: "var(--low)" }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                    Send PDF Report
                  </h3>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    We&apos;ll email the full report to you
                  </p>
                </div>
              </div>

              {emailSent ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Check className="w-5 h-5" style={{ color: "var(--low)" }} />
                  <span style={{ color: "var(--low)" }}>Report sent to your email!</span>
                </div>
              ) : (
                <>
                  <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                    The complete PDF report with all findings, technical details, and remediation guidance will be sent to the email you used for this scan.
                  </p>

                  <button
                    onClick={handleSendPdf}
                    disabled={sendingEmail}
                    className="w-full py-3 rounded-[var(--radius-sm)] font-mono text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: "var(--cyan)", color: "var(--void)" }}
                  >
                    {sendingEmail ? (
                      <>
                        <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--void)", borderTopColor: "transparent" }} />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send PDF Report
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Checkout Modal */}
      {results && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => { setShowCheckoutModal(false); setCheckoutTier(undefined) }}
          scanId={scanId}
          targetUrl={results.target_url}
          onSuccess={handleCheckoutSuccess}
          preselectedTier={checkoutTier}
        />
      )}

      <Footer />
    </div>
  )
}
