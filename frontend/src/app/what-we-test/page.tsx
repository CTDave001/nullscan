import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowRight, Shield, AlertTriangle, Lock, Globe, Server, Zap, Code, CheckCircle, Eye } from "lucide-react"

export const metadata: Metadata = {
  title: "What We Test — OWASP Top 10 Vulnerability Scanner | Nullscan",
  description:
    "SQL injection, XSS, auth bypass, SSRF, IDOR, path traversal, rate limiting, and security headers. OWASP Top 10 coverage with AI pentesting.",
  alternates: {
    canonical: "https://nullscan.io/what-we-test",
  },
  openGraph: {
    title: "What We Test — OWASP Top 10 Coverage | Nullscan",
    description:
      "Full vulnerability coverage: SQL injection, XSS, auth bypass, SSRF, IDOR, path traversal, and more. AI-powered penetration testing.",
    url: "https://nullscan.io/what-we-test",
    siteName: "Nullscan",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "What We Test — OWASP Top 10 Coverage | Nullscan",
    description:
      "SQL injection, XSS, auth bypass, SSRF, IDOR, and more. AI-powered penetration testing.",
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
      name: "What We Test",
      item: "https://nullscan.io/what-we-test",
    },
  ],
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Does Nullscan cover the OWASP Top 10?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Nullscan tests for the most critical OWASP Top 10 vulnerability categories including injection attacks (A03), broken access control (A01), authentication failures (A07), SSRF (A10), and security misconfiguration (A05).",
      },
    },
    {
      "@type": "Question",
      name: "How does Nullscan test for SQL injection?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nullscan's AI agents identify input points across your application — forms, URL parameters, API endpoints, headers — and attempt various SQL injection payloads including union-based, blind, and time-based techniques to determine if your database queries are vulnerable.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between a vulnerability scanner and a penetration test?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A vulnerability scanner checks for known issues using predefined rules, like checking if security headers are present. A penetration test actively tries to exploit your application, attempting real attacks to find vulnerabilities. Nullscan performs actual penetration testing using AI agents, not just vulnerability scanning.",
      },
    },
  ],
}

const VULNERABILITIES = [
  {
    icon: Server,
    title: "SQL Injection",
    owasp: "A03:2021 — Injection",
    severity: "critical",
    description:
      "SQL injection occurs when user input is inserted into database queries without proper sanitization. Attackers can read, modify, or delete data, and in some cases gain full control of the database server.",
    howWeTest: [
      "Identify all input points: forms, URL parameters, API bodies, headers, cookies",
      "Attempt union-based, boolean-blind, and time-based injection payloads",
      "Test for error-based information disclosure",
      "Check for second-order injection where input is stored and executed later",
      "Verify ORM and parameterized query usage",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Cross-Site Scripting (XSS)",
    owasp: "A03:2021 — Injection",
    severity: "high",
    description:
      "XSS vulnerabilities allow attackers to inject malicious scripts into web pages viewed by other users. This can lead to session hijacking, credential theft, defacement, and malware distribution.",
    howWeTest: [
      "Test reflected XSS in URL parameters, search fields, and error messages",
      "Check for stored XSS in user-generated content areas",
      "Attempt DOM-based XSS through client-side JavaScript manipulation",
      "Test various encoding and filter bypass techniques",
      "Verify Content Security Policy (CSP) configuration",
    ],
  },
  {
    icon: Lock,
    title: "Authentication Bypass",
    owasp: "A07:2021 — Identification and Authentication Failures",
    severity: "critical",
    description:
      "Authentication bypass allows attackers to access protected resources without valid credentials. This includes broken login flows, predictable session tokens, and missing authentication on sensitive endpoints.",
    howWeTest: [
      "Attempt to access protected endpoints without authentication",
      "Test for authentication state confusion and session fixation",
      "Check for predictable or weak session token generation",
      "Test password reset flow for account takeover vulnerabilities",
      "Verify multi-step authentication can't be skipped",
    ],
  },
  {
    icon: Eye,
    title: "IDOR / Broken Access Control",
    owasp: "A01:2021 — Broken Access Control",
    severity: "high",
    description:
      "Insecure Direct Object References (IDOR) and broken access control allow users to access data or perform actions belonging to other users by manipulating IDs, paths, or parameters.",
    howWeTest: [
      "Enumerate object IDs and attempt to access other users' resources",
      "Test horizontal privilege escalation between same-role users",
      "Test vertical privilege escalation to admin-level actions",
      "Check for missing function-level access control on API endpoints",
      "Verify authorization is enforced server-side, not just client-side",
    ],
  },
  {
    icon: Globe,
    title: "Server-Side Request Forgery (SSRF)",
    owasp: "A10:2021 — Server-Side Request Forgery",
    severity: "high",
    description:
      "SSRF allows attackers to make the server send requests to unintended destinations — accessing internal services, cloud metadata endpoints, or other systems behind the firewall.",
    howWeTest: [
      "Identify parameters that accept URLs or hostnames",
      "Attempt to reach internal network addresses and cloud metadata endpoints",
      "Test URL parsing inconsistencies and redirect chains",
      "Check for SSRF through file upload, webhooks, and import features",
      "Verify allowlist/blocklist implementations for outbound requests",
    ],
  },
  {
    icon: Code,
    title: "Path Traversal",
    owasp: "A01:2021 — Broken Access Control",
    severity: "high",
    description:
      "Path traversal allows attackers to access files and directories outside the intended scope — reading configuration files, source code, credentials, or other sensitive data on the server.",
    howWeTest: [
      "Test file parameters with directory traversal sequences (../, %2e%2e/, etc.)",
      "Attempt to read known sensitive files (/etc/passwd, .env, config files)",
      "Check for path traversal in file upload and download features",
      "Test various encoding and null byte bypass techniques",
      "Verify file access is restricted to intended directories",
    ],
  },
  {
    icon: Zap,
    title: "Rate Limiting",
    owasp: "A07:2021 — Identification and Authentication Failures",
    severity: "medium",
    description:
      "Missing rate limiting on sensitive endpoints allows attackers to brute force passwords, enumerate users, abuse password reset flows, or overwhelm API endpoints.",
    howWeTest: [
      "Test login endpoints for brute force protection",
      "Check password reset for rate limiting and token expiration",
      "Test API endpoints for request throttling",
      "Verify account lockout mechanisms after failed attempts",
      "Check for rate limit bypass through header manipulation",
    ],
  },
  {
    icon: Shield,
    title: "Security Headers",
    owasp: "A05:2021 — Security Misconfiguration",
    severity: "medium",
    description:
      "Missing or misconfigured security headers leave your application vulnerable to clickjacking, MIME sniffing, cross-site attacks, and protocol downgrade attacks.",
    howWeTest: [
      "Check for Content-Security-Policy (CSP) header and policy strength",
      "Verify Strict-Transport-Security (HSTS) is present with appropriate max-age",
      "Test X-Frame-Options to prevent clickjacking",
      "Check X-Content-Type-Options to prevent MIME sniffing",
      "Verify CORS configuration isn't overly permissive",
      "Check for Referrer-Policy and Permissions-Policy headers",
    ],
  },
]

export default function WhatWeTestPage() {
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

      <Navbar />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 lg:pt-36 pb-16">
        <div className="text-center mb-6">
          <p
            className="font-mono text-xs uppercase tracking-widest mb-4"
            style={{ color: "var(--cyan)" }}
          >
            Vulnerability Coverage
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            What Nullscan Tests For
          </h1>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Comprehensive penetration testing covering the most exploited vulnerability
            categories in web applications, aligned with{" "}
            <strong style={{ color: "var(--text)" }}>OWASP Top 10</strong> standards.
          </p>
        </div>
      </section>

      {/* Overview Grid */}
      <section className="border-y" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { n: "8", label: "Attack Categories" },
              { n: "50+", label: "Test Vectors" },
              { n: "OWASP", label: "Top 10 Aligned" },
              { n: "AI", label: "Powered Agents" },
            ].map((item) => (
              <div key={item.label} className="p-4">
                <p className="text-2xl font-bold mb-1" style={{ color: "var(--cyan)" }}>
                  {item.n}
                </p>
                <p className="text-xs font-mono uppercase" style={{ color: "var(--text-muted)" }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vulnerability Deep Dives */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold mb-10">
          Vulnerability Categories
        </h2>
        <div className="space-y-8">
          {VULNERABILITIES.map((vuln) => {
            const severityColor =
              vuln.severity === "critical"
                ? "var(--critical)"
                : vuln.severity === "high"
                ? "var(--high)"
                : "var(--medium)"
            return (
              <article
                key={vuln.title}
                id={vuln.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
              >
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <vuln.icon className="w-6 h-6" style={{ color: severityColor }} />
                      <div>
                        <h3 className="text-lg font-bold">{vuln.title}</h3>
                        <p className="text-xs font-mono" style={{ color: "var(--text-dim)" }}>
                          {vuln.owasp}
                        </p>
                      </div>
                    </div>
                    <span
                      className="shrink-0 text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded"
                      style={{
                        backgroundColor: `${severityColor}20`,
                        color: severityColor,
                      }}
                    >
                      {vuln.severity}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {vuln.description}
                  </p>
                </div>

                {/* How We Test */}
                <div
                  className="px-6 py-5 border-t"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
                >
                  <h4
                    className="font-mono text-[10px] uppercase tracking-wider mb-3"
                    style={{ color: "var(--text-dim)" }}
                  >
                    How Nullscan Tests This
                  </h4>
                  <ul className="space-y-2">
                    {vuln.howWeTest.map((step) => (
                      <li
                        key={step}
                        className="flex items-start gap-2 text-xs leading-relaxed"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <CheckCircle
                          className="w-3.5 h-3.5 shrink-0 mt-0.5"
                          style={{ color: "var(--cyan)" }}
                        />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* How It Differs */}
      <section className="border-y" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold mb-4">
            Penetration Testing, Not Just Scanning
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Most &quot;vulnerability scanners&quot; check for known signatures and missing headers.
            Nullscan is different.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="p-5 rounded-lg"
              style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <h3
                className="font-mono text-xs uppercase tracking-wider mb-3"
                style={{ color: "var(--text-dim)" }}
              >
                Typical Vulnerability Scanners
              </h3>
              <ul className="space-y-2">
                {[
                  "Check for known CVEs and signatures",
                  "Verify security headers are present",
                  "Match against predefined rule sets",
                  "Surface-level automated checks",
                  "Same tests on every website",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <span style={{ color: "var(--text-dim)" }}>-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="p-5 rounded-lg"
              style={{ backgroundColor: "var(--bg)", border: "1px solid var(--cyan)" }}
            >
              <h3
                className="font-mono text-xs uppercase tracking-wider mb-3"
                style={{ color: "var(--cyan)" }}
              >
                Nullscan
              </h3>
              <ul className="space-y-2">
                {[
                  "AI agents actively probe and exploit vulnerabilities",
                  "Tests are adapted to your specific application",
                  "Attempts real attack chains, not just signature matching",
                  "Discovers application-specific logic flaws",
                  "Simulates how a real attacker would approach your app",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <CheckCircle
                      className="w-3.5 h-3.5 shrink-0 mt-0.5"
                      style={{ color: "var(--cyan)" }}
                    />
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
        <h2 className="text-2xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {[
            {
              q: "Does Nullscan cover the OWASP Top 10?",
              a: "Yes. Nullscan tests for the most critical OWASP Top 10 categories including injection attacks (A03), broken access control (A01), authentication failures (A07), SSRF (A10), and security misconfiguration (A05).",
            },
            {
              q: "How does Nullscan test for SQL injection?",
              a: "AI agents identify input points across your application — forms, URL parameters, API endpoints, headers — and attempt various SQL injection techniques including union-based, blind, and time-based payloads to determine if your database queries are vulnerable.",
            },
            {
              q: "What's the difference between a vulnerability scanner and a penetration test?",
              a: "A vulnerability scanner checks for known issues using predefined rules. A penetration test actively tries to exploit your application with real attacks. Nullscan performs actual penetration testing using AI agents — it thinks and acts like an attacker, not just a checklist.",
            },
            {
              q: "Will the scan break my website?",
              a: "No. All tests are non-destructive. Nullscan does not perform denial-of-service attacks, delete data, or make permanent changes to your application. It identifies vulnerabilities without exploiting them in harmful ways.",
            },
            {
              q: "How often should I scan my application?",
              a: "At minimum, scan after every significant feature release or code change. New features — especially those built with AI tools — can introduce new vulnerabilities. Regular scanning catches issues before they become incidents.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group p-4 rounded-lg"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
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
      </section>

      {/* Bottom CTA */}
      <section
        className="border-t"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Test Your Application Now
          </h2>
          <p
            className="text-sm mb-8 max-w-lg mx-auto"
            style={{ color: "var(--text-muted)" }}
          >
            Find out if your application is vulnerable. Free scan covers all 8
            attack categories — results in minutes.
          </p>
          <a
            href="/#terminal"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-mono text-sm uppercase tracking-wider transition-all"
            style={{ backgroundColor: "var(--cyan)", color: "var(--void)" }}
          >
            Start Free Scan
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Internal Links */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <a href="/free-website-security-scanner" className="underline" style={{ color: "var(--text-muted)" }}>
            Free Security Scanner
          </a>
          <a href="/vibe-coding-security" className="underline" style={{ color: "var(--text-muted)" }}>
            AI App Security
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
