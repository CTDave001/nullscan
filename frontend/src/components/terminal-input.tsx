"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

type ScanTier = "free" | "pro" | "deep"

const TIER_INFO: Record<ScanTier, { name: string; price: number; desc: string }> = {
  free: { name: "Free Scan", price: 0, desc: "Quick scan with basic findings" },
  pro: { name: "Pro Scan", price: 250, desc: "300 iterations, 25 agents, detailed report" },
  deep: { name: "Deep Analysis", price: 899, desc: "500 iterations, 40 agents, full coverage" },
}

export function TerminalInput() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [email, setEmail] = useState("")
  const [consentInput, setConsentInput] = useState("")
  const [tierInput, setTierInput] = useState("")
  const [selectedTier, setSelectedTier] = useState<ScanTier>("free")
  const [step, setStep] = useState<"url" | "email" | "tier" | "consent" | "confirm">("url")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showHint, setShowHint] = useState(false)
  const [lines, setLines] = useState<string[]>([
    "NULLSCAN v2.0.0 - Autonomous Penetration Testing",
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    "",
    "Initializing secure connection...",
    "Connection established.",
    "",
    "Enter target URL to begin reconnaissance:",
  ])
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Listen for launch-scan event from navbar
  useEffect(() => {
    const handleLaunchScan = () => {
      setShowHint(true)
      setTimeout(() => setShowHint(false), 3000)
    }
    window.addEventListener("launch-scan", handleLaunchScan)
    return () => window.removeEventListener("launch-scan", handleLaunchScan)
  }, [])

  // Auto-focus on mount and step change
  useEffect(() => {
    inputRef.current?.focus()
  }, [step])

  // Focus on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step === "url") {
      if (!url.trim()) return
      const formattedUrl = url.startsWith("http") ? url : `https://${url}`
      setUrl(formattedUrl)
      setLines(prev => [
        ...prev,
        `> ${formattedUrl}`,
        "",
        `Target acquired: ${formattedUrl}`,
        "Validating domain...",
        "Domain verified.",
        "",
        "Enter notification email:",
      ])
      setStep("email")
    } else if (step === "email") {
      if (!email.trim() || !email.includes("@")) return
      setLines(prev => [
        ...prev,
        `> ${email}`,
        "",
        "Select scan type:",
        "",
        "  [1] Free   — Quick scan, basic findings ($0)",
        "  [2] Pro    — 300 iterations, detailed report ($250)",
        "  [3] Deep   — 500 iterations, full coverage ($899)",
        "",
        "Enter 1, 2, or 3:",
      ])
      setStep("tier")
    } else if (step === "tier") {
      const input = tierInput.trim()
      const tierMap: Record<string, ScanTier> = { "1": "free", "2": "pro", "3": "deep", "free": "free", "pro": "pro", "deep": "deep" }
      const tier = tierMap[input.toLowerCase()]
      if (!tier) {
        setLines(prev => [...prev, `> ${input}`, "", "ERROR: Enter 1, 2, or 3."])
        setTierInput("")
        return
      }
      setSelectedTier(tier)
      setTierInput("")
      const info = TIER_INFO[tier]
      setLines(prev => [
        ...prev,
        `> ${input}`,
        "",
        `Selected: ${info.name}${info.price > 0 ? ` ($${info.price})` : ""}`,
        "",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        `\u2502  TARGET: ${url.slice(0, 28).padEnd(28)}\u2502`,
        `\u2502  EMAIL:  ${email.slice(0, 28).padEnd(28)}\u2502`,
        `\u2502  TYPE:   ${info.name.slice(0, 28).padEnd(28)}\u2502`,
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "",
        "AUTHORIZATION REQUIRED:",
        "Type 'confirm' to authorize security testing",
        "(You must own or have permission to test this target)",
      ])
      setStep("consent")
    } else if (step === "consent") {
      const input = consentInput.trim().toLowerCase()
      if (input === "cancel") {
        setConsentInput("")
        setLines(prev => [
          ...prev,
          "> cancel",
          "",
          "Operation cancelled by user.",
          "",
        ])
        resetTerminal()
        return
      }
      if (input !== "confirm") {
        setLines(prev => [
          ...prev,
          `> ${consentInput}`,
          "",
          "ERROR: Please type 'confirm' to authorize, or 'cancel' to abort.",
        ])
        setConsentInput("")
        return
      }
      setConsentInput("")
      setLines(prev => [
        ...prev,
        "> confirm",
        "",
        "Authorization confirmed.",
        "",
        "Press ENTER to initiate scan:",
      ])
      setStep("confirm")
    } else if (step === "confirm") {
      setLines(prev => [
        ...prev,
        "> INITIATE",
        "",
        selectedTier !== "free" ? "Processing payment..." : "Launching scan agents...",
      ])
      setIsLoading(true)
      setError("")

      try {
        // Create scan first
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scans/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            target_url: url,
            consent: true,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.detail || "Failed to start scan")
        }

        const data = await res.json()
        const scanId = data.id

        if (selectedTier !== "free") {
          // Create Stripe checkout session for pro/deep
          const payRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/scans/${scanId}/checkout?tier=${selectedTier}`,
            { method: "POST" }
          )
          if (!payRes.ok) throw new Error("Failed to create payment session")
          const payData = await payRes.json()

          setLines(prev => [...prev, "Redirecting to payment..."])
          window.location.href = payData.checkout_url
          return
        }

        // Free scan — go straight to scan page
        setLines(prev => [
          ...prev,
          "Agents deployed successfully.",
          `Scan ID: ${scanId.slice(0, 8)}`,
          "",
          "Redirecting to operations center...",
        ])
        setTimeout(() => router.push(`/scan/${scanId}`), 1500)
      } catch (err) {
        setIsLoading(false)
        const message = err instanceof Error ? err.message : "Something went wrong"
        setError(message)
        setLines(prev => [
          ...prev,
          "",
          `ERROR: ${message}`,
          "",
          "Type 'retry' to try again or 'reset' to start over:",
        ])
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && step !== "url") {
      resetTerminal()
    }
  }

  const resetTerminal = () => {
    setStep("url")
    setUrl("")
    setEmail("")
    setTierInput("")
    setConsentInput("")
    setSelectedTier("free")
    setError("")
    setLines([
      "NULLSCAN v2.0.0 - Autonomous Penetration Testing",
      "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
      "",
      "Session reset.",
      "",
      "Enter target URL to begin reconnaissance:",
    ])
  }

  const getInputValue = () => {
    if (step === "url") return url
    if (step === "email") return email
    if (step === "tier") return tierInput
    if (step === "consent") return consentInput
    return ""
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (step === "url") setUrl(val)
    else if (step === "email") setEmail(val)
    else if (step === "tier") setTierInput(val)
    else if (step === "consent") setConsentInput(val)
  }

  const handleBlur = () => {
    // Auto-format URL with https:// when user leaves the input
    if (step === "url" && url.trim() && !url.startsWith("http://") && !url.startsWith("https://")) {
      setUrl(`https://${url}`)
    }
  }

  return (
    <div className="relative" ref={containerRef} id="terminal">
      {/* Hint tooltip */}
      {showHint && (
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 animate-fade-in-up"
          style={{ animation: "fade-in-up 0.3s ease-out" }}
        >
          <div
            className="px-4 py-2 rounded-[var(--radius)] font-mono text-sm whitespace-nowrap"
            style={{
              backgroundColor: "var(--cyan)",
              color: "var(--void)",
              boxShadow: "0 0 30px var(--cyan-glow-intense)"
            }}
          >
            Enter your website URL below to start
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0"
            style={{
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "8px solid var(--cyan)"
            }}
          />
        </div>
      )}

      <div
        className={`terminal-panel rounded-[var(--radius)] overflow-hidden transition-all ${showHint ? "ring-2 ring-[var(--cyan)] ring-offset-2 ring-offset-[var(--bg)]" : ""}`}
        style={{
          boxShadow: showHint
            ? "0 0 80px var(--cyan-glow-intense), inset 0 1px 0 var(--border-bright)"
            : "0 0 60px var(--cyan-glow), inset 0 1px 0 var(--border-bright)",
        }}
      >
      {/* Terminal header */}
      <div
        className="flex items-center gap-2 px-4 py-2 2xl:px-5 2xl:py-3"
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)"
        }}
      >
        <div className="flex gap-1.5 2xl:gap-2">
          <div className="w-2.5 h-2.5 2xl:w-3 2xl:h-3 rounded-full" style={{ backgroundColor: "var(--critical)" }} />
          <div className="w-2.5 h-2.5 2xl:w-3 2xl:h-3 rounded-full" style={{ backgroundColor: "var(--medium)" }} />
          <div className="w-2.5 h-2.5 2xl:w-3 2xl:h-3 rounded-full" style={{ backgroundColor: "var(--low)" }} />
        </div>
        <span className="ml-2 text-[10px] 2xl:text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          nullscan://terminal
        </span>
      </div>

      {/* Terminal content */}
      <div
        ref={terminalRef}
        className="p-4 2xl:p-6 h-[220px] sm:h-[280px] lg:h-[320px] 2xl:h-[420px] overflow-y-auto font-mono text-xs sm:text-sm 2xl:text-base"
        style={{ backgroundColor: "var(--bg)" }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            className="leading-relaxed"
            style={{
              color: line.startsWith(">") ? "var(--cyan)" :
                     line.includes("ERROR") ? "var(--critical)" :
                     line.includes("Target") || line.includes("verified") || line.includes("complete") || line.includes("confirmed") || line.includes("successfully") ? "var(--low)" :
                     line.includes("\u2501") || line.includes("\u250C") || line.includes("\u2502") || line.includes("\u2514") ? "var(--text-dim)" :
                     line.includes("AUTHORIZATION") || line.includes("Scan ID") ? "var(--medium)" :
                     "var(--text-secondary)"
            }}
          >
            {line || "\u00A0"}
          </div>
        ))}

        {/* Input line */}
        {!isLoading && (
          <form
            onSubmit={handleSubmit}
            className="flex items-center mt-2 -mx-2 px-2 py-1.5 min-h-[44px] rounded-[var(--radius-sm)] transition-all"
            style={{
              backgroundColor: step === "url" ? "var(--cyan-glow)" : "transparent",
              border: step === "url" ? "1px solid var(--cyan)" : "1px solid transparent",
            }}
          >
            <span style={{ color: "var(--cyan)" }}>{">"}</span>
            <input
              ref={inputRef}
              type={step === "email" ? "email" : "text"}
              value={getInputValue()}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="flex-1 ml-2 bg-transparent outline-none font-mono text-xs sm:text-sm 2xl:text-base"
              style={{ color: "var(--text)", caretColor: "var(--cyan)" }}
              placeholder={
                step === "url" ? "example.com" :
                step === "email" ? "you@email.com" :
                step === "tier" ? "1, 2, or 3" :
                step === "consent" ? "type 'confirm'" :
                ""
              }
              autoComplete="off"
              spellCheck={false}
              disabled={isLoading}
            />
            <span className="animate-status-pulse" style={{ color: "var(--cyan)" }}>{"\u258C"}</span>
          </form>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 mt-1" style={{ color: "var(--cyan)" }}>
            <span className="animate-spin">{"\u25D0"}</span>
            <span>Deploying agents...</span>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
