import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TerminalInput } from "@/components/terminal-input"
import { Shield, AlertTriangle, Code, Zap, ArrowRight, Lock, CheckCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Vibe Coding Security Scanner | Nullscan",
  description:
    "Built your app with AI? It probably has vulnerabilities. Scan apps built with Cursor, Lovable, Bolt, v0, and other AI tools for security issues. Free.",
  alternates: {
    canonical: "https://nullscan.io/vibe-coding-security",
  },
  openGraph: {
    title: "Security for AI-Built Apps | Nullscan",
    description:
      "Built your app with AI? It probably has security vulnerabilities. Free security scan for apps built with Cursor, Lovable, Bolt, and other AI tools.",
    url: "https://nullscan.io/vibe-coding-security",
    siteName: "Nullscan",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Security for AI-Built Apps | Nullscan",
    description:
      "Built your app with AI? It probably has security vulnerabilities. Free security scan for vibe coded apps.",
    images: ["/og-image.png"],
  },
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://nullscan.io",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Security for AI-Built Apps",
      item: "https://nullscan.io/vibe-coding-security",
    },
  ],
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Are AI-built apps less secure than manually coded apps?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AI coding tools prioritize functionality over security. They generate code that works, but often miss security best practices like input validation, rate limiting, proper authentication flows, and security headers. This makes AI-built apps more likely to have exploitable vulnerabilities.",
      },
    },
    {
      "@type": "Question",
      name: "Which AI coding tools produce vulnerable code?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "This is not specific to any one tool. Apps built with Cursor, Lovable, Bolt, v0, Replit, Windsurf, and other AI coding assistants can all produce code with security vulnerabilities. The issue is that AI tools optimize for getting features working, not for making them secure.",
      },
    },
    {
      "@type": "Question",
      name: "How do I secure my AI-built app?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Start by running an automated security scan to identify existing vulnerabilities. Nullscan offers a free scan that tests for the most common issues. From there, fix the identified issues and consider running deeper scans as your app grows. Regular scanning is important since every new feature could introduce new vulnerabilities.",
      },
    },
    {
      "@type": "Question",
      name: "Can Nullscan scan apps built with any AI tool?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Nullscan is an external scanner that tests your live application regardless of how it was built. It works with apps built using Cursor, Lovable, Bolt, v0, Replit, Windsurf, GitHub Copilot, or any other tool. All it needs is your app's URL.",
      },
    },
  ],
}

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Security for AI-Built Apps: Why Vibe Coded Apps Are Vulnerable",
  description:
    "AI coding tools build features fast but leave security gaps. Learn why vibe coded apps are vulnerable and how to find and fix the issues.",
  author: {
    "@type": "Organization",
    name: "Nullscan",
    url: "https://nullscan.io",
  },
  publisher: {
    "@type": "Organization",
    name: "Nullscan",
    url: "https://nullscan.io",
  },
}

export default function VibeCodingSecurityPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <Navbar />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 lg:pt-36 pb-16">
        <div className="text-center mb-12">
          <p
            className="font-mono text-xs uppercase tracking-widest mb-4"
            style={{ color: "var(--high)" }}
          >
            AI App Security
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Built Your App with AI?
            <br />
            <span style={{ color: "var(--high)" }}>It Probably Has Vulnerabilities.</span>
          </h1>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            AI coding tools like Cursor, Lovable, Bolt, and v0 are great at building
            features fast. They&apos;re not great at making them secure. Nullscan finds
            the vulnerabilities AI left behind.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="border-y" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold mb-4">Why AI-Generated Code Is Vulnerable</h2>
          <p
            className="text-sm mb-10 max-w-2xl"
            style={{ color: "var(--text-muted)" }}
          >
            AI coding assistants optimize for one thing: making your feature work. Security
            is an afterthought — if it&apos;s a thought at all. Here&apos;s what that looks like
            in practice.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Code,
                title: "No Input Validation",
                desc: "AI-generated API routes often accept user input directly without sanitization. This opens the door to SQL injection, XSS, and other injection attacks.",
                severity: "critical",
              },
              {
                icon: Lock,
                title: "Weak Authentication",
                desc: "Default auth configurations, missing rate limiting on login endpoints, and predictable session handling are common in AI-built apps.",
                severity: "high",
              },
              {
                icon: Shield,
                title: "Missing Security Headers",
                desc: "AI tools rarely add CSP, HSTS, X-Frame-Options, or other headers that protect against common web attacks.",
                severity: "medium",
              },
              {
                icon: AlertTriangle,
                title: "Exposed Endpoints",
                desc: "Admin routes, debug endpoints, and internal APIs that should be restricted often end up publicly accessible.",
                severity: "high",
              },
              {
                icon: Zap,
                title: "No Rate Limiting",
                desc: "Password reset, login, and API endpoints without rate limiting are trivial to brute force.",
                severity: "medium",
              },
              {
                icon: Code,
                title: "Insecure Defaults",
                desc: "AI uses default configurations that work for development but are insecure in production — verbose error messages, CORS wildcards, debug modes left on.",
                severity: "high",
              },
            ].map((item) => {
              const severityColor =
                item.severity === "critical"
                  ? "var(--critical)"
                  : item.severity === "high"
                  ? "var(--high)"
                  : "var(--medium)"
              return (
                <div
                  key={item.title}
                  className="p-5 rounded-lg"
                  style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <item.icon className="w-5 h-5" style={{ color: severityColor }} />
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    <span
                      className="ml-auto text-[10px] font-mono uppercase px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${severityColor}20`,
                        color: severityColor,
                      }}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {item.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Which Tools */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold mb-4">
          This Applies to All AI Coding Tools
        </h2>
        <p
          className="text-sm mb-8 max-w-2xl"
          style={{ color: "var(--text-muted)" }}
        >
          Regardless of which AI tool you used to build your app, the security gaps
          are similar. Nullscan works with all of them.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            "Cursor",
            "Lovable",
            "Bolt",
            "v0",
            "Replit",
            "Windsurf",
            "GitHub Copilot",
            "Claude Code",
            "GPT Engineer",
            "Devin",
            "Cline",
          ].map((tool) => (
            <span
              key={tool}
              className="px-4 py-2 rounded-lg font-mono text-sm"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              {tool}
            </span>
          ))}
        </div>
      </section>

      {/* How Nullscan Helps */}
      <section className="border-y" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold mb-4">
            How Nullscan Finds What AI Missed
          </h2>
          <p
            className="text-sm mb-10 max-w-2xl"
            style={{ color: "var(--text-muted)" }}
          >
            Nullscan doesn&apos;t just check headers or run a list of known exploits. It deploys
            AI agents that think like real attackers — probing your app for weaknesses
            the same way a human pentester would.
          </p>
          <div className="space-y-4">
            {[
              {
                title: "Real Penetration Testing",
                desc: "AI agents actively probe your endpoints, attempt injection attacks, try to bypass authentication, and test access controls. This is not a static analysis tool.",
              },
              {
                title: "Covers the OWASP Top 10",
                desc: "SQL injection, XSS, broken access control, SSRF, path traversal, security misconfigurations — every critical vulnerability category is tested.",
              },
              {
                title: "Results You Can Act On",
                desc: "Every finding includes the affected endpoint, severity level, and impact assessment. Paid reports include step-by-step reproduction and fix guidance you can hand directly to your AI tool to fix.",
              },
              {
                title: "No Setup Required",
                desc: "Nullscan scans your live app externally. No code access, no agents to install, no CI/CD integration needed. Paste your URL and go.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-lg flex items-start gap-4"
                style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--cyan)" }} />
                <div>
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + Terminal */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-4">
            Scan Your AI-Built App Now
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "var(--text-muted)" }}>
            Find out what your AI coding tool missed. Free scan, no signup.
          </p>
        </div>
        <div className="max-w-3xl mx-auto" id="terminal">
          <TerminalInput />
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Are AI-built apps less secure than manually coded apps?",
                a: "AI coding tools prioritize functionality over security. They generate code that works, but often miss input validation, rate limiting, proper auth flows, and security headers. This makes AI-built apps more likely to have exploitable vulnerabilities than apps built by security-conscious developers.",
              },
              {
                q: "Which AI coding tools produce vulnerable code?",
                a: "This isn't specific to any one tool. Apps built with Cursor, Lovable, Bolt, v0, Replit, Windsurf, and other AI tools can all produce code with security gaps. The core issue is that AI optimizes for features, not security.",
              },
              {
                q: "How do I secure my AI-built app?",
                a: "Start by running an automated security scan to identify existing vulnerabilities. Fix the issues found, then run scans regularly as you add features. Each new feature your AI tool generates could introduce new vulnerabilities.",
              },
              {
                q: "Can Nullscan scan apps built with any AI tool?",
                a: "Yes. Nullscan is an external scanner that tests your live application regardless of how it was built. It works with apps built using any AI coding tool, framework, or language. All it needs is your app's URL.",
              },
              {
                q: "I used AI to build my app but I'm not technical. Can I still use Nullscan?",
                a: "Yes. The free scan gives you a clear report showing what's wrong and how severe it is. If you unlock the full report, you get fix guidance written in plain language that you can paste directly into your AI coding tool to fix the issues.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group p-4 rounded-lg"
                style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <summary className="cursor-pointer font-semibold text-sm flex items-center justify-between">
                  {item.q}
                  <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-open:rotate-90" style={{ color: "var(--text-muted)" }} />
                </summary>
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Internal Links */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <a href="/free-website-security-scanner" className="underline" style={{ color: "var(--text-muted)" }}>
            Free Security Scanner
          </a>
          <a href="/what-we-test" className="underline" style={{ color: "var(--text-muted)" }}>
            What We Test
          </a>
          <a href="/scope" className="underline" style={{ color: "var(--text-muted)" }}>
            Testing Scope
          </a>
        </div>
      </section>

      <Footer />
    </main>
  )
}
