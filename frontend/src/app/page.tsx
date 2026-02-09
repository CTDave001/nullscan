"use client"

import { StatusBar } from "@/components/status-bar"
import { GridOverlay, CornerMarkers } from "@/components/grid-overlay"
import { Navbar } from "@/components/navbar"
import { TerminalInput } from "@/components/terminal-input"
import { ScanTicker } from "@/components/scan-ticker"
import { ProcessSection } from "@/components/process-section"
import { MobileProcessSection } from "@/components/mobile-process-section"
import { Footer } from "@/components/footer"
import { Check, X } from "lucide-react"
import { useState } from "react"

const ATTACK_VECTORS = [
  "SQL Injection",
  "Cross-Site Scripting",
  "Authentication Bypass",
  "IDOR / Broken Access Control",
  "Server-Side Request Forgery",
  "Path Traversal",
  "Rate Limiting",
  "Security Headers",
]

export default function LandingPage() {
  const [selectedTier, setSelectedTier] = useState<"pro" | "deep" | null>(null)

  const selectTierAndScroll = (tier: "pro" | "deep") => {
    setSelectedTier(tier)
    const terminal = document.getElementById("terminal")
    if (terminal) {
      terminal.scrollIntoView({ behavior: "smooth", block: "center" })
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("launch-scan"))
        const input = terminal.querySelector("input")
        input?.focus()
      }, 500)
    }
  }

  return (
    <div className="min-h-screen relative">
      <StatusBar />
      <GridOverlay />
      <CornerMarkers />
      <Navbar withStatusBar />

      <main className="relative z-10 pt-24 lg:pt-32 2xl:pt-40 pb-20">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 2xl:px-12 mb-16 lg:mb-32 2xl:mb-40">
          <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 2xl:gap-24 items-start">
              {/* Left Column - Copy */}
              <div className="space-y-6 sm:space-y-8 2xl:space-y-10 stagger-children">
                {/* Label */}
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 2xl:px-4 2xl:py-2 rounded-[var(--radius-sm)] font-mono text-[10px] 2xl:text-xs uppercase tracking-wider"
                  style={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)"
                  }}
                >
                  <div className="w-1.5 h-1.5 2xl:w-2 2xl:h-2 rounded-full animate-status-pulse" style={{ backgroundColor: "var(--online)" }} />
                  Autonomous Security Testing
                </div>

                {/* Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl 2xl:text-7xl font-bold leading-[1.1] tracking-tight">
                  <span style={{ color: "var(--text)" }}>See what</span>
                  <br />
                  <span className="glow-text-cyan" style={{ color: "var(--cyan)" }}>attackers see.</span>
                </h1>

                {/* Subheadline */}
                <p
                  className="text-base sm:text-lg 2xl:text-xl max-w-md 2xl:max-w-lg leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  AI-powered penetration testing that probes your application like a real adversary.
                  No agents. No credentials. Just results.
                </p>

                {/* Attack Vectors */}
                <div className="pt-2 sm:pt-4 2xl:pt-6">
                  <p className="font-mono text-[10px] 2xl:text-xs uppercase tracking-wider mb-4" style={{ color: "var(--text-dim)" }}>
                    Attack Vectors
                  </p>
                  <div className="flex flex-nowrap overflow-x-auto snap-x gap-2 pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0 2xl:gap-3 scrollbar-none">
                    {ATTACK_VECTORS.map((vector) => (
                      <span
                        key={vector}
                        className="shrink-0 snap-center px-2.5 py-1 2xl:px-3 2xl:py-1.5 font-mono text-[11px] 2xl:text-xs rounded-[var(--radius-sm)] transition-colors hover:border-[var(--cyan)]"
                        style={{
                          backgroundColor: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text-muted)"
                        }}
                      >
                        {vector}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Terminal */}
              <div className="lg:pt-8 2xl:pt-12">
                <TerminalInput paidTier={selectedTier} />
              </div>
            </div>
          </div>
        </section>

        {/* Recent Scans Ticker */}
        <ScanTicker />

      </main>

      {/* How It Works - Mobile: simple stepper */}
      <MobileProcessSection />

      {/* How It Works - Desktop: Scroll-driven (outside main for sticky to work) */}
      <div className="hidden lg:block">
        <ProcessSection />
      </div>

      <main className="relative z-10">
        {/* Pricing */}
        <section id="pricing" className="py-16 sm:py-24 2xl:py-32 px-4 sm:px-6 2xl:px-12">
          <div className="max-w-5xl 2xl:max-w-[1400px] mx-auto">
            <div className="text-center mb-12 sm:mb-16 2xl:mb-20">
              <p
                className="font-mono text-[10px] 2xl:text-xs uppercase tracking-wider mb-4"
                style={{ color: "var(--cyan)" }}
              >
                Pricing
              </p>
              <h2
                className="text-2xl sm:text-3xl md:text-4xl 2xl:text-5xl font-bold mb-4"
                style={{ color: "var(--text)" }}
              >
                Simple, transparent pricing
              </h2>
              <p
                className="text-sm sm:text-base 2xl:text-lg max-w-md 2xl:max-w-lg mx-auto"
                style={{ color: "var(--text-muted)" }}
              >
                Start free, upgrade when you need detailed reports and remediation guidance.
              </p>
            </div>

            {/* Pricing cards: horizontal scroll on mobile, grid on md+ */}
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-4 2xl:gap-6 scrollbar-none">
              {/* Free Tier */}
              <div
                className="min-w-[280px] snap-center shrink-0 md:min-w-0 md:shrink rounded-[var(--radius)] p-6 2xl:p-8 flex flex-col"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="mb-6 2xl:mb-8">
                  <p
                    className="text-sm 2xl:text-base font-medium mb-3"
                    style={{ color: "var(--text)" }}
                  >
                    Free Scan
                  </p>
                  <p
                    className="text-3xl 2xl:text-4xl font-bold mb-2"
                    style={{ color: "var(--text)" }}
                  >
                    $0
                  </p>
                  <p
                    className="text-sm 2xl:text-base"
                    style={{ color: "var(--text-muted)" }}
                  >
                    See if you have vulnerabilities
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    { text: "Quick external scan", included: true },
                    { text: "Finding titles and severity", included: true },
                    { text: "Affected endpoints", included: true },
                    { text: "Impact description", included: true },
                    { text: "Reproduction steps", included: false },
                    { text: "Proof-of-concept code", included: false },
                  ].map((feature) => (
                    <li
                      key={feature.text}
                      className={`flex items-center gap-2.5 text-sm ${feature.included ? "" : "opacity-50"}`}
                      style={{ color: feature.included ? "var(--text-secondary)" : "var(--text-dim)" }}
                    >
                      {feature.included ? (
                        <Check size={14} style={{ color: "var(--low)" }} />
                      ) : (
                        <X size={14} />
                      )}
                      <span className={feature.included ? "" : "line-through"}>{feature.text}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#terminal"
                  className="block w-full py-2.5 rounded-[var(--radius-sm)] font-mono text-xs uppercase tracking-wider text-center transition-all"
                  style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
                >
                  Start Free Scan
                </a>
              </div>

              {/* Unlock Tier */}
              <div
                className="min-w-[280px] snap-center shrink-0 md:min-w-0 md:shrink rounded-[var(--radius)] p-6 2xl:p-8 flex flex-col"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="mb-6 2xl:mb-8">
                  <p
                    className="text-sm 2xl:text-base font-medium mb-3"
                    style={{ color: "var(--text)" }}
                  >
                    Unlock Report
                  </p>
                  <p
                    className="text-3xl 2xl:text-4xl font-bold mb-2"
                    style={{ color: "var(--text)" }}
                  >
                    $39
                  </p>
                  <p
                    className="text-sm 2xl:text-base"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Full report with fixes
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Everything in Free",
                    "Full reproduction steps",
                    "Proof-of-concept code",
                    "Fix guidance per finding",
                    "PDF export",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <Check size={14} style={{ color: "var(--low)" }} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="#terminal"
                  className="block w-full py-2.5 rounded-[var(--radius-sm)] font-mono text-xs uppercase tracking-wider text-center transition-all"
                  style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
                >
                  Start Scan — Unlock Later
                </a>
              </div>

              {/* Pro Tier - Highlighted */}
              <div
                className="min-w-[280px] snap-center shrink-0 md:min-w-0 md:shrink rounded-[var(--radius)] p-6 2xl:p-8 flex flex-col relative"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--cyan)",
                  boxShadow: "0 0 40px var(--cyan-glow)"
                }}
              >
                <div
                  className="absolute -top-3 right-4 text-[10px] 2xl:text-xs font-bold uppercase px-2 py-0.5 rounded"
                  style={{ backgroundColor: "var(--cyan)", color: "var(--void)" }}
                >
                  Most popular
                </div>
                <div className="mb-6 2xl:mb-8">
                  <p
                    className="text-sm 2xl:text-base font-medium mb-3"
                    style={{ color: "var(--cyan)" }}
                  >
                    Pro Scan
                  </p>
                  <p
                    className="text-3xl 2xl:text-4xl font-bold mb-2"
                    style={{ color: "var(--text)" }}
                  >
                    $250
                  </p>
                  <p
                    className="text-sm 2xl:text-base"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Unlock + new comprehensive scan
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Everything in Unlock",
                    "300-iteration scan",
                    "More attack vectors",
                    "Detailed report",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <Check size={14} style={{ color: "var(--cyan)" }} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => selectTierAndScroll("pro")}
                  className="block w-full py-2.5 rounded-[var(--radius-sm)] font-mono text-xs uppercase tracking-wider text-center transition-all cursor-pointer"
                  style={{ backgroundColor: "var(--cyan)", color: "var(--void)" }}
                >
                  Start Pro Scan
                </button>
              </div>

              {/* Deep Analysis Tier */}
              <div
                className="min-w-[280px] snap-center shrink-0 md:min-w-0 md:shrink rounded-[var(--radius)] p-6 2xl:p-8 flex flex-col"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="mb-6 2xl:mb-8">
                  <p
                    className="text-sm 2xl:text-base font-medium mb-3"
                    style={{ color: "var(--text)" }}
                  >
                    Deep Analysis
                  </p>
                  <p
                    className="text-3xl 2xl:text-4xl font-bold mb-2"
                    style={{ color: "var(--text)" }}
                  >
                    $899
                  </p>
                  <p
                    className="text-sm 2xl:text-base"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Unlock + thorough security audit
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Everything in Pro",
                    "500-iteration deep scan",
                    "Full attack coverage",
                    "Executive summary",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <Check size={14} style={{ color: "var(--low)" }} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => selectTierAndScroll("deep")}
                  className="block w-full py-2.5 rounded-[var(--radius-sm)] font-mono text-xs uppercase tracking-wider text-center transition-all cursor-pointer"
                  style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
                >
                  Start Deep Scan
                </button>
              </div>
            </div>

            <p
              className="text-center text-sm mt-8"
              style={{ color: "var(--text-dim)" }}
            >
              No credit card required for free scans. All scans are one-time purchases.
            </p>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  )
}
