"use client"

import { useState } from "react"

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

export function MobileProcessSection() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section className="lg:hidden py-16 px-4 sm:px-6" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-md mx-auto">
        <p
          className="font-mono text-[10px] uppercase tracking-wider mb-8"
          style={{ color: "var(--cyan)" }}
        >
          Process
        </p>

        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const isActive = i === activeStep
            return (
              <button
                key={step.num}
                onClick={() => setActiveStep(i)}
                className="w-full text-left p-4 rounded-[var(--radius)] transition-all"
                style={{
                  backgroundColor: isActive ? "var(--surface)" : "transparent",
                  border: isActive ? "1px solid var(--cyan)" : "1px solid var(--border)",
                  boxShadow: isActive ? "0 0 30px var(--cyan-glow)" : "none",
                }}
              >
                <div className="flex gap-4">
                  <span
                    className="font-mono text-2xl font-bold shrink-0 transition-colors"
                    style={{
                      color: isActive ? "var(--cyan)" : "var(--text-ghost)",
                    }}
                  >
                    {step.num}
                  </span>
                  <div>
                    <h3
                      className="text-base font-semibold mb-1 transition-colors"
                      style={{
                        color: isActive ? "var(--text)" : "var(--text-muted)",
                      }}
                    >
                      {step.title}
                    </h3>
                    {isActive && (
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className="h-1 rounded-full transition-all"
              style={{
                width: i === activeStep ? "32px" : "8px",
                backgroundColor: i <= activeStep ? "var(--cyan)" : "var(--border)",
                opacity: i <= activeStep ? 1 : 0.5,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
