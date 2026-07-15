import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TerminalInput } from "@/components/terminal-input"
import { Shield, Zap, Lock, Globe, Server, AlertTriangle, CheckCircle, ArrowRight, KeyRound } from "lucide-react"

export const metadata: Metadata = {
  title: "Vibe Coding Security Scanner — Test AI-Built Apps Free | Nullscan",
  description:
    "Free security scanner for apps built with Cursor, Lovable, Bolt, v0, and Replit. AI agents run real penetration tests on your vibe-coded app — find SQL injection, XSS, auth bypass, and exposed secrets in minutes.",
  alternates: {
    canonical: "https://nullscan.io/vibe-coding-security-scanner",
  },
  openGraph: {
    title: "Vibe Coding Security Scanner — Test AI-Built Apps Free",
    description:
      "The security scanner built for AI-generated apps. Paste your URL and AI agents run real penetration tests on code built with Cursor, Lovable, Bolt, v0, and Replit.",
    url: "https://nullscan.io/vibe-coding-security-scanner",
    siteName: "Nullscan",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibe Coding Security Scanner — Test AI-Built Apps Free",
    description:
      "The security scanner built for AI-generated apps. Real penetration tests for code built with Cursor, Lovable, Bolt, v0, and Replit.",
    images: ["/og-image.png"],
  },
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://nullscan.io" },
    {
      "@type": "ListItem",
      position: 2,
      name: "Vibe Coding Security Scanner",
      item: "https://nullscan.io/vibe-coding-security-scanner",
    },
  ],
}

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Nullscan — Vibe Coding Security Scanner",
  url: "https://nullscan.io/vibe-coding-security-scanner",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free security scan for AI-built apps" },
  description:
    "AI-powered penetration testing for applications built with AI coding tools like Cursor, Lovable, Bolt, v0, and Replit. Detects SQL injection, XSS, authentication bypass, IDOR, SSRF, and exposed secrets.",
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do apps built with AI coding tools have security vulnerabilities?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Frequently, yes. AI coding tools optimize for working code, not secure code. Apps built with Cursor, Lovable, Bolt, v0, or Replit commonly ship with missing authorization checks, exposed API keys, SQL injection, and insecure direct object references (IDOR) because the model generates the happy path and rarely adds the security controls a human engineer would.",
      },
    },
    {
      "@type": "Question",
      name: "Which AI coding tools does the scanner work with?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The scanner is tool-agnostic — it tests your deployed application from the outside, so it works with anything built by Cursor, Lovable, Bolt, v0, Replit, Windsurf, Claude, ChatGPT, or hand-written code. If it has a public URL, Nullscan can test it.",
      },
    },
    {
      "@type": "Question",
      name: "Is the vibe coding security scan free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The free scan runs real penetration tests and returns the vulnerabilities found — their titles, severity, and affected endpoints. Reproduction steps, proof-of-concept code, and fix guidance are available with a $39 unlock.",
      },
    },
    {
      "@type": "Question",
      name: "Is it safe to scan my AI-built app?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Nullscan performs non-destructive testing only — no denial-of-service, no credential brute forcing, no data exfiltration. It probes for vulnerabilities the way a real attacker would, but safely.",
      },
    },
  ],
}

const TOOLS = ["Cursor", "Lovable", "Bolt", "v0", "Replit", "Windsurf", "Claude", "ChatGPT"]

export default function VibeCodingSecurityScannerPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <Navbar />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 lg:pt-36 pb-16">
        <div className="text-center mb-12">
          <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: "var(--cyan)" }}>
            Vibe Coding Security Scanner
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Is Your <span style={{ color: "var(--cyan)" }}>AI-Built App</span> Secure?
            <br />
            Find Out in Minutes — Free
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Apps shipped with Cursor, Lovable, Bolt, v0, and Replit look done — but AI writes
            the happy path, not the security controls. Paste your URL and AI agents run real
            penetration tests against your app, the way an attacker would.
          </p>
        </div>

        <div className="max-w-3xl mx-auto" id="terminal">
          <TerminalInput />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {TOOLS.map((tool) => (
            <span
              key={tool}
              className="px-3 py-1 rounded-full font-mono text-xs"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              {tool}
            </span>
          ))}
        </div>
      </section>

      {/* Why AI-built apps are vulnerable */}
      <section className="border-y" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-4">Why Vibe-Coded Apps Ship With Security Holes</h2>
          <p className="text-center text-sm mb-12 max-w-2xl mx-auto" style={{ color: "var(--text-muted)" }}>
            AI coding tools are trained to produce code that runs. Security is invisible when
            everything works in the demo — so it gets skipped. These are the patterns we find
            over and over in AI-generated apps.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: KeyRound,
                title: "Exposed secrets & API keys",
                desc: "Keys hardcoded in client-side code or committed to the repo — visible to anyone who opens dev tools.",
              },
              {
                icon: Lock,
                title: "Missing authorization checks",
                desc: "Endpoints that authenticate the user but never check whether they're allowed to access the specific record.",
              },
              {
                icon: Shield,
                title: "IDOR / broken access control",
                desc: "Changing an ID in the URL returns another user's data because the query trusts the client.",
              },
              {
                icon: Server,
                title: "SQL injection",
                desc: "String-built queries the model wrote for speed, with no parameterization or input validation.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-lg flex gap-4"
                style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <item.icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--cyan)" }} />
                <div>
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm mt-8" style={{ color: "var(--text-secondary)" }}>
            Read the deeper breakdown in{" "}
            <Link href="/blog/common-vulnerabilities-vibe-coded-apps" className="underline" style={{ color: "var(--cyan)" }}>
              the most common vulnerabilities in vibe-coded apps
            </Link>{" "}
            and{" "}
            <Link href="/blog/why-ai-coding-tools-ignore-security" className="underline" style={{ color: "var(--cyan)" }}>
              why AI coding tools ignore security
            </Link>.
          </p>
        </div>
      </section>

      {/* What it tests */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-4">What the Scanner Tests For</h2>
        <p className="text-center text-sm mb-12 max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
          Real penetration testing across the OWASP Top 10 categories that matter most for
          AI-generated web apps — not just a header check.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Server, title: "SQL Injection", desc: "Tests database queries for injection that could expose or modify your data." },
            { icon: AlertTriangle, title: "Cross-Site Scripting", desc: "Checks for XSS where attackers inject scripts into pages your users load." },
            { icon: Lock, title: "Auth Bypass", desc: "Attempts to reach protected resources without proper authentication." },
            { icon: Shield, title: "IDOR / Access Control", desc: "Checks whether changing an ID exposes another user's data." },
            { icon: Globe, title: "SSRF", desc: "Tests whether your server can be tricked into making internal requests." },
            { icon: AlertTriangle, title: "Path Traversal", desc: "Tests for access to files outside the intended scope." },
            { icon: Zap, title: "Rate Limiting", desc: "Checks whether login and reset endpoints resist brute force." },
            { icon: CheckCircle, title: "Security Headers", desc: "Verifies CSP, HSTS, and X-Frame-Options are configured." },
          ].map((item) => (
            <div key={item.title} className="p-5 rounded-lg" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
              <item.icon className="w-5 h-5 mb-3" style={{ color: "var(--cyan)" }} />
              <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
        <p className="text-center text-sm mt-8" style={{ color: "var(--text-secondary)" }}>
          See the full coverage on{" "}
          <Link href="/what-we-test" className="underline" style={{ color: "var(--cyan)" }}>
            what we test
          </Link>.
        </p>
      </section>

      {/* Free vs paid */}
      <section className="border-y" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-12">Free Scan vs Full Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" style={{ color: "var(--cyan)" }} />
                Free Scan
              </h3>
              <ul className="space-y-3">
                {["Vulnerability titles and severity", "Affected endpoints identified", "Impact assessment per finding", "Risk level rating", "Attack surface mapping"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--low)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-lg" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--cyan)" }}>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" style={{ color: "var(--cyan)" }} />
                Full Report — $39
              </h3>
              <ul className="space-y-3">
                {["Everything in the free scan", "Step-by-step reproduction", "Proof-of-concept exploit code", "Fix guidance per finding", "PDF report export"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--cyan)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            {
              q: "Do apps built with AI coding tools have security vulnerabilities?",
              a: "Frequently. AI coding tools optimize for working code, not secure code. Apps built with Cursor, Lovable, Bolt, v0, or Replit commonly ship with missing authorization checks, exposed API keys, SQL injection, and IDOR — because the model generates the happy path and rarely adds the controls a security-minded engineer would.",
            },
            {
              q: "Which AI coding tools does the scanner work with?",
              a: "All of them. The scanner tests your deployed app from the outside, so it's tool-agnostic — Cursor, Lovable, Bolt, v0, Replit, Windsurf, Claude, ChatGPT, or hand-written code. If it has a public URL, Nullscan can test it.",
            },
            {
              q: "Is the vibe coding security scan free?",
              a: "Yes. The free scan runs real penetration tests and returns the vulnerabilities found — titles, severity, and affected endpoints. Reproduction steps, proof-of-concept code, and fix guidance unlock for $39.",
            },
            {
              q: "Is it safe to scan my AI-built app?",
              a: "Yes. Nullscan performs non-destructive testing only — no denial-of-service, no credential brute forcing, no data exfiltration. It probes the way a real attacker would, but safely.",
            },
          ].map((item) => (
            <details key={item.q} className="group p-4 rounded-lg" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
              <summary className="cursor-pointer font-semibold text-sm flex items-center justify-between">
                {item.q}
                <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-open:rotate-90" style={{ color: "var(--text-muted)" }} />
              </summary>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Scan Your Vibe-Coded App Now</h2>
        <p className="text-sm mb-8 max-w-lg mx-auto" style={{ color: "var(--text-muted)" }}>
          Find out what an attacker would find first. Free scan, no signup, results in minutes.
        </p>
        <a
          href="#terminal"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-mono text-sm uppercase tracking-wider transition-all"
          style={{ backgroundColor: "var(--cyan)", color: "var(--void)" }}
        >
          Start Free Scan
          <ArrowRight className="w-4 h-4" />
        </a>
      </section>

      <Footer />
    </main>
  )
}
