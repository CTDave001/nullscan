"use client"

import { useEffect, useRef, useState } from "react"

const STEPS = [
  {
    num: "01",
    title: "Target Acquisition",
    description:
      "Enter your application URL. We map the attack surface automatically — no credentials or source code required.",
  },
  {
    num: "02",
    title: "Autonomous Attack",
    description:
      "AI agents probe for vulnerabilities using real attacker techniques. Watch the operation unfold in real-time.",
  },
  {
    num: "03",
    title: "Verified Intelligence",
    description:
      "Receive confirmed findings with proof-of-concept exploits and remediation guidance. Zero false positives.",
  },
]

export function ProcessSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const rect = container.getBoundingClientRect()
      const containerHeight = container.offsetHeight
      const viewportHeight = window.innerHeight

      // Calculate how far we've scrolled through the container
      const scrolled = -rect.top
      const totalScrollable = containerHeight - viewportHeight
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollable))

      setScrollProgress(progress)

      // Determine active step (divide into thirds)
      if (progress < 0.33) {
        setActiveStep(0)
      } else if (progress < 0.66) {
        setActiveStep(1)
      } else {
        setActiveStep(2)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section ref={containerRef} className="relative" style={{ height: "300vh" }}>
      {/* Sticky Container */}
      <div className="sticky top-0 h-screen flex items-center z-10" style={{ backgroundColor: "var(--bg)" }}>
        <div className="w-full max-w-6xl 2xl:max-w-[1600px] mx-auto px-6 2xl:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 2xl:gap-32 items-center">
            {/* Left - Visual */}
            <div className="order-2 lg:order-1">
              <ProcessVisual activeStep={activeStep} progress={scrollProgress} />
            </div>

            {/* Right - Content */}
            <div className="order-1 lg:order-2 space-y-6 2xl:space-y-8">
              <p
                className="font-mono text-[10px] 2xl:text-xs uppercase tracking-wider"
                style={{ color: "var(--cyan)" }}
              >
                Process
              </p>

              <div className="space-y-8 2xl:space-y-10">
                {STEPS.map((step, i) => {
                  const isActive = i === activeStep
                  const isPast = i < activeStep

                  return (
                    <div
                      key={step.num}
                      className="transition-all duration-500"
                      style={{
                        opacity: isActive ? 1 : isPast ? 0.3 : 0.15,
                        transform: isActive ? "translateX(0)" : "translateX(-8px)",
                      }}
                    >
                      <div className="flex gap-6 2xl:gap-8">
                        <div className="shrink-0">
                          <span
                            className="font-mono text-3xl 2xl:text-4xl font-bold transition-colors duration-500"
                            style={{
                              color: isActive ? "var(--cyan)" : "var(--text-ghost)",
                            }}
                          >
                            {step.num}
                          </span>
                        </div>
                        <div className="space-y-2 2xl:space-y-3">
                          <h3
                            className="text-xl 2xl:text-2xl font-semibold transition-colors duration-500"
                            style={{ color: isActive ? "var(--text)" : "var(--text-muted)" }}
                          >
                            {step.title}
                          </h3>
                          <p
                            className="text-sm 2xl:text-base leading-relaxed max-w-md 2xl:max-w-lg transition-colors duration-500"
                            style={{
                              color: isActive ? "var(--text-secondary)" : "var(--text-dim)",
                            }}
                          >
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Progress Dots */}
              <div className="flex items-center gap-2 pt-4">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: i === activeStep ? "32px" : "8px",
                      backgroundColor: i === activeStep ? "var(--cyan)" : i < activeStep ? "var(--cyan)" : "var(--border)",
                      opacity: i <= activeStep ? 1 : 0.5,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProcessVisual({ activeStep, progress }: { activeStep: number; progress: number }) {
  const [tick, setTick] = useState(0)

  // Tick counter for micro-animations
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="relative aspect-[4/3] rounded-[var(--radius-lg)] overflow-hidden"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 0 60px var(--cyan-glow)",
      }}
    >
      {/* Terminal Header */}
      <div
        className="flex items-center justify-between px-4 py-3 2xl:px-5 2xl:py-4 border-b"
        style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 2xl:gap-2">
            <div className="w-2.5 h-2.5 2xl:w-3 2xl:h-3 rounded-full" style={{ backgroundColor: "var(--critical)" }} />
            <div className="w-2.5 h-2.5 2xl:w-3 2xl:h-3 rounded-full" style={{ backgroundColor: "var(--medium)" }} />
            <div className="w-2.5 h-2.5 2xl:w-3 2xl:h-3 rounded-full" style={{ backgroundColor: "var(--low)" }} />
          </div>
          <span className="font-mono text-[10px] 2xl:text-xs ml-2" style={{ color: "var(--text-dim)" }}>
            nullscan-terminal
          </span>
        </div>
        {/* Animated status indicator */}
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 2xl:w-2 2xl:h-2 rounded-full animate-status-pulse"
            style={{ backgroundColor: activeStep === 2 ? "var(--low)" : "var(--cyan)" }}
          />
          <span className="font-mono text-[9px] 2xl:text-[11px]" style={{ color: "var(--text-dim)" }}>
            {activeStep === 0 ? "INIT" : activeStep === 1 ? "SCANNING" : "COMPLETE"}
          </span>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-4 2xl:p-6 font-mono text-xs 2xl:text-sm relative h-[calc(100%-44px)] 2xl:h-[calc(100%-56px)] overflow-hidden">
        {/* Step 1: Target Input */}
        <div
          className="absolute inset-4 2xl:inset-6 transition-all duration-700"
          style={{
            opacity: activeStep === 0 ? 1 : 0,
            transform: activeStep === 0 ? "translateY(0)" : "translateY(-20px)",
          }}
        >
          <div className="space-y-3 2xl:space-y-4">
            <p style={{ color: "var(--text-dim)" }}>
              <span style={{ color: "var(--cyan)" }}>$</span> nullscan init
            </p>
            <p style={{ color: "var(--cyan)" }}>
              <span style={{ opacity: tick % 2 === 0 ? 1 : 0.5 }}>→</span> Initializing secure sandbox...
            </p>
            <p style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--text-dim)" }}>target:</span> https://app.example.com
            </p>
            <div className="flex items-center gap-2 2xl:gap-3 mt-4 2xl:mt-6">
              <span style={{ color: "var(--cyan)" }}>$</span>
              <span style={{ color: "var(--text)" }}>Mapping attack surface</span>
              <span
                className="inline-block w-2 2xl:w-2.5 h-4 2xl:h-5 ml-1"
                style={{
                  backgroundColor: "var(--cyan)",
                  opacity: tick % 2 === 0 ? 1 : 0,
                }}
              />
            </div>

            {/* URL visual with typing cursor */}
            <div
              className="mt-6 2xl:mt-8 p-3 2xl:p-4 rounded-[var(--radius-sm)] transition-all"
              style={{
                backgroundColor: "var(--bg)",
                border: "1px solid var(--border)",
                boxShadow: tick % 3 === 0 ? "0 0 10px var(--cyan-glow)" : "none"
              }}
            >
              <p className="text-[10px] 2xl:text-xs mb-2" style={{ color: "var(--text-dim)" }}>TARGET URL</p>
              <p className="flex items-center" style={{ color: "var(--cyan)" }}>
                https://app.example.com
                <span
                  className="inline-block w-1.5 2xl:w-2 h-3.5 2xl:h-4 ml-0.5"
                  style={{
                    backgroundColor: "var(--cyan)",
                    opacity: tick % 2 === 0 ? 0.8 : 0,
                  }}
                />
              </p>
            </div>

            {/* Discovery animation with counting numbers */}
            <div className="grid grid-cols-3 gap-2 2xl:gap-3 mt-4 2xl:mt-6">
              {[
                { num: 18 + (tick % 6), label: "endpoints" },
                { num: 3 + (tick % 2), label: "APIs" },
                { num: 8 + (tick % 5), label: "params" },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className="p-2 2xl:p-3 rounded-[var(--radius-sm)] text-center transition-all"
                  style={{
                    backgroundColor: "var(--bg)",
                    border: `1px solid ${i === tick % 3 ? "var(--cyan)" : "var(--border)"}`,
                  }}
                >
                  <p className="text-sm 2xl:text-base font-mono font-bold" style={{ color: "var(--text)" }}>
                    {item.num}
                  </p>
                  <p className="text-[9px] 2xl:text-xs" style={{ color: "var(--text-dim)" }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Attack Phase */}
        <div
          className="absolute inset-4 2xl:inset-6 transition-all duration-700"
          style={{
            opacity: activeStep === 1 ? 1 : 0,
            transform: activeStep === 1 ? "translateY(0)" : activeStep < 1 ? "translateY(20px)" : "translateY(-20px)",
          }}
        >
          <div className="space-y-2 2xl:space-y-3">
            <p style={{ color: "var(--text-dim)" }}>
              <span style={{ color: "var(--cyan)" }}>$</span> nullscan attack --mode=full
            </p>
            <p style={{ color: "var(--cyan)" }}>
              <span style={{ opacity: tick % 2 === 0 ? 1 : 0.5 }}>→</span> Deploying AI agents...
            </p>

            {/* Agent Grid with animated activation */}
            <div className="grid grid-cols-3 gap-2 2xl:gap-3 mt-4 2xl:mt-5">
              {[
                { id: "S", name: "SQLi", activeAt: 0 },
                { id: "X", name: "XSS", activeAt: 1 },
                { id: "A", name: "Auth", activeAt: 2 },
                { id: "I", name: "IDOR", activeAt: 4 },
                { id: "F", name: "SSRF", activeAt: 6 },
                { id: "R", name: "Rate", activeAt: 8 },
              ].map((agent) => {
                const isActive = tick >= agent.activeAt
                const isPulsing = tick % 6 === agent.activeAt % 6 && isActive
                return (
                  <div
                    key={agent.id}
                    className="p-2 2xl:p-3 rounded-[var(--radius-sm)] text-center transition-all duration-300"
                    style={{
                      backgroundColor: isActive ? "var(--surface)" : "var(--bg)",
                      border: `1px solid ${isActive ? "var(--cyan)" : "var(--border)"}`,
                      boxShadow: isPulsing ? "0 0 20px var(--cyan-glow-intense)" : isActive ? "0 0 10px var(--cyan-glow)" : "none",
                      transform: isPulsing ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    <p
                      className="text-lg 2xl:text-xl font-bold transition-colors"
                      style={{ color: isActive ? "var(--cyan)" : "var(--text-ghost)" }}
                    >
                      {agent.id}
                    </p>
                    <p className="text-[9px] 2xl:text-xs" style={{ color: "var(--text-dim)" }}>{agent.name}</p>
                  </div>
                )
              })}
            </div>

            {/* Activity Log with live updates */}
            <div className="mt-4 2xl:mt-5 space-y-1 2xl:space-y-1.5 font-mono">
              {[
                { text: "[SQLi] Testing id parameter...", status: "info", showAt: 0 },
                { text: "[SQLi] VULN FOUND: SQL Injection", status: "vuln", showAt: 2 },
                { text: "[XSS] Probing input fields...", status: "info", showAt: 3 },
                { text: "[Auth] Checking session tokens...", status: "info", showAt: 5 },
              ]
                .filter((log) => tick >= log.showAt)
                .map((log, i) => (
                  <p
                    key={i}
                    className="text-[11px] 2xl:text-sm"
                    style={{
                      color: log.status === "vuln" ? "var(--critical)" : "var(--text-muted)",
                    }}
                  >
                    {log.text}
                  </p>
                ))}
              <p className="text-[11px] 2xl:text-sm flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: "var(--cyan)",
                    opacity: tick % 2 === 0 ? 1 : 0.3,
                  }}
                />
                Scanning in progress...
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Report */}
        <div
          className="absolute inset-4 2xl:inset-6 transition-all duration-700"
          style={{
            opacity: activeStep === 2 ? 1 : 0,
            transform: activeStep === 2 ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <div className="space-y-3 2xl:space-y-4">
            <p style={{ color: "var(--text-dim)" }}>
              <span style={{ color: "var(--low)" }}>$</span> nullscan report --format=full
            </p>
            <p style={{ color: "var(--low)" }}>
              <span style={{ opacity: tick % 2 === 0 ? 1 : 0.7 }}>✓</span> Scan complete. Generating report...
            </p>

            {/* Report Summary with animated border */}
            <div
              className="mt-4 2xl:mt-5 p-3 2xl:p-4 rounded-[var(--radius-sm)] transition-all"
              style={{
                backgroundColor: "var(--bg)",
                border: "1px solid var(--border)",
                boxShadow: tick % 4 === 0 ? "0 0 15px var(--high-glow)" : "none"
              }}
            >
              <div className="flex items-center justify-between mb-3 2xl:mb-4">
                <span className="text-[10px] 2xl:text-xs" style={{ color: "var(--text-dim)" }}>THREAT ASSESSMENT</span>
                <span
                  className="px-2 2xl:px-3 py-0.5 2xl:py-1 text-[9px] 2xl:text-xs font-bold uppercase rounded-[var(--radius-sm)] transition-all"
                  style={{
                    backgroundColor: "var(--high)",
                    color: "var(--void)",
                    boxShadow: tick % 3 === 0 ? "0 0 10px var(--high-glow)" : "none"
                  }}
                >
                  High Risk
                </span>
              </div>

              <div className="space-y-2 2xl:space-y-3">
                {[
                  { severity: "critical", title: "SQL Injection - User ID", delay: 0 },
                  { severity: "high", title: "Rate Limit Bypass", delay: 1 },
                  { severity: "medium", title: "Missing Security Headers", delay: 2 },
                ].map((finding, i) => (
                  <div
                    key={finding.title}
                    className="flex items-center gap-2 2xl:gap-3 transition-all"
                    style={{
                      opacity: tick >= finding.delay ? 1 : 0,
                      transform: tick >= finding.delay ? "translateX(0)" : "translateX(-10px)",
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 2xl:w-2 2xl:h-2 rounded-full transition-all"
                      style={{
                        backgroundColor:
                          finding.severity === "critical"
                            ? "var(--critical)"
                            : finding.severity === "high"
                              ? "var(--high)"
                              : "var(--medium)",
                        boxShadow: tick % 3 === i ? `0 0 8px ${finding.severity === "critical" ? "var(--critical-glow)" : finding.severity === "high" ? "var(--high-glow)" : "var(--medium-glow)"}` : "none"
                      }}
                    />
                    <span className="text-[11px] 2xl:text-sm" style={{ color: "var(--text-secondary)" }}>
                      {finding.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions with hover simulation */}
            <div className="flex gap-2 2xl:gap-3 mt-4 2xl:mt-5">
              <div
                className="flex-1 py-2 2xl:py-2.5 rounded-[var(--radius-sm)] text-center text-[10px] 2xl:text-xs uppercase font-bold transition-all"
                style={{
                  backgroundColor: "var(--cyan)",
                  color: "var(--void)",
                  boxShadow: tick % 5 === 0 ? "0 0 20px var(--cyan-glow-intense)" : "none",
                  transform: tick % 5 === 0 ? "scale(1.02)" : "scale(1)"
                }}
              >
                View Full Report
              </div>
              <div
                className="px-3 2xl:px-4 py-2 2xl:py-2.5 rounded-[var(--radius-sm)] text-center text-[10px] 2xl:text-xs uppercase transition-all"
                style={{
                  border: `1px solid ${tick % 7 === 0 ? "var(--cyan)" : "var(--border)"}`,
                  color: tick % 7 === 0 ? "var(--cyan)" : "var(--text-muted)"
                }}
              >
                Export
              </div>
            </div>
          </div>
        </div>

        {/* Scan Line Effect */}
        <div
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{
            top: `${(progress * 100) % 100}%`,
            background: "linear-gradient(90deg, transparent, var(--cyan-glow-intense), transparent)",
            boxShadow: "0 0 10px var(--cyan-glow)",
            opacity: 0.5,
          }}
        />
      </div>
    </div>
  )
}
