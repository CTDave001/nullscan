import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TerminalInput } from "@/components/terminal-input"
import { Shield, Zap, Lock, Globe, Server, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Free Website Security Scanner | Nullscan — AI-Powered Vulnerability Testing",
  description:
    "Scan your website for vulnerabilities for free. Nullscan uses AI agents to run real penetration tests — SQL injection, XSS, auth bypass, SSRF, and more. No signup, results in minutes.",
  alternates: {
    canonical: "https://nullscan.io/free-website-security-scanner",
  },
  openGraph: {
    title: "Free Website Security Scanner | Nullscan",
    description:
      "Scan your website for vulnerabilities for free. AI agents run real penetration tests against your app — results in minutes.",
    url: "https://nullscan.io/free-website-security-scanner",
    siteName: "Nullscan",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Website Security Scanner | Nullscan",
    description:
      "Scan your website for vulnerabilities for free. AI agents run real penetration tests — results in minutes.",
    images: ["/og-image.png"],
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Nullscan",
  url: "https://nullscan.io",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free website security scan",
  },
  description:
    "AI-powered penetration testing tool that scans websites for vulnerabilities including SQL injection, XSS, authentication bypass, and more.",
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is the security scan really free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Nullscan offers a free scan that runs real penetration tests against your website. You get a report with vulnerability titles, severity levels, and affected endpoints. Detailed reproduction steps and fix guidance are available with a paid unlock.",
      },
    },
    {
      "@type": "Question",
      name: "How long does a scan take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most scans complete in 5-15 minutes depending on the size of your application. The free scan runs 50 iterations with multiple AI agents testing your endpoints simultaneously.",
      },
    },
    {
      "@type": "Question",
      name: "Is it safe to scan my website?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Nullscan performs non-destructive testing only. It does not perform denial-of-service attacks, brute force credentials, or exfiltrate data. All tests are designed to identify vulnerabilities without causing damage to your application.",
      },
    },
    {
      "@type": "Question",
      name: "What vulnerabilities does it test for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nullscan tests for SQL injection, cross-site scripting (XSS), authentication bypass, IDOR and broken access control, server-side request forgery (SSRF), path traversal, rate limiting issues, and security header misconfigurations.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to install anything?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Nullscan is an external scanner. Just paste your website URL and the scan runs from our servers. No agents, plugins, or code changes required.",
      },
    },
  ],
}

export default function FreeSecurityScannerPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Navbar />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 lg:pt-36 pb-16">
        <div className="text-center mb-12">
          <p
            className="font-mono text-xs uppercase tracking-widest mb-4"
            style={{ color: "var(--cyan)" }}
          >
            Free Security Scanner
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Scan Your Website for{" "}
            <span style={{ color: "var(--cyan)" }}>Vulnerabilities</span>
            <br />
            in Minutes — Free
          </h1>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Paste your URL below. AI agents run real penetration tests against your
            application and report every vulnerability they find. No signup, no
            setup, no agents to install.
          </p>
        </div>

        <div className="max-w-3xl mx-auto" id="terminal">
          <TerminalInput />
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-12">
            How the Free Security Scan Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                step: "01",
                title: "Paste Your URL",
                desc: "Enter your website or web app URL. Nullscan runs externally — no code access or installation needed.",
              },
              {
                icon: Zap,
                step: "02",
                title: "AI Agents Attack",
                desc: "Multiple AI agents run real penetration tests simultaneously — testing for injection, auth bypass, XSS, and more.",
              },
              {
                icon: Shield,
                step: "03",
                title: "Get Your Report",
                desc: "Receive a detailed report with every vulnerability found, severity ratings, and affected endpoints.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div
                  className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
                >
                  <item.icon className="w-6 h-6" style={{ color: "var(--cyan)" }} />
                </div>
                <p className="font-mono text-xs mb-2" style={{ color: "var(--cyan)" }}>
                  {item.step}
                </p>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Test */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-4">
          What the Scanner Tests For
        </h2>
        <p
          className="text-center text-sm mb-12 max-w-xl mx-auto"
          style={{ color: "var(--text-muted)" }}
        >
          Nullscan covers the most exploited vulnerability categories in web
          applications, aligned with OWASP Top 10 standards.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Server,
              title: "SQL Injection",
              desc: "Tests database queries for injection vulnerabilities that could expose or modify your data.",
            },
            {
              icon: AlertTriangle,
              title: "Cross-Site Scripting",
              desc: "Checks for XSS vulnerabilities where attackers could inject malicious scripts into your pages.",
            },
            {
              icon: Lock,
              title: "Auth Bypass",
              desc: "Attempts to access protected resources without proper authentication or authorization.",
            },
            {
              icon: Globe,
              title: "SSRF",
              desc: "Tests for server-side request forgery where your server could be tricked into making internal requests.",
            },
            {
              icon: Shield,
              title: "IDOR / Access Control",
              desc: "Checks for insecure direct object references and broken access control between users.",
            },
            {
              icon: AlertTriangle,
              title: "Path Traversal",
              desc: "Tests if attackers can access files or directories outside the intended scope.",
            },
            {
              icon: Zap,
              title: "Rate Limiting",
              desc: "Checks if sensitive endpoints like login and password reset are protected against brute force attacks.",
            },
            {
              icon: CheckCircle,
              title: "Security Headers",
              desc: "Verifies that essential security headers like CSP, HSTS, and X-Frame-Options are properly configured.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-5 rounded-lg"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <item.icon className="w-5 h-5 mb-3" style={{ color: "var(--cyan)" }} />
              <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Free vs Paid */}
      <section className="border-y" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-12">
            Free Scan vs Full Report
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="p-6 rounded-lg"
              style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" style={{ color: "var(--cyan)" }} />
                Free Scan
              </h3>
              <ul className="space-y-3">
                {[
                  "Vulnerability titles and severity levels",
                  "Affected endpoints identified",
                  "Impact assessment for each finding",
                  "Risk level rating",
                  "Attack surface mapping",
                  "Categories tested overview",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--low)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="p-6 rounded-lg"
              style={{ backgroundColor: "var(--bg)", border: "1px solid var(--cyan)" }}
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" style={{ color: "var(--cyan)" }} />
                Full Report — $39
              </h3>
              <ul className="space-y-3">
                {[
                  "Everything in the free scan",
                  "Step-by-step reproduction instructions",
                  "Proof-of-concept exploit code",
                  "Fix guidance and remediation steps",
                  "Full technical analysis",
                  "PDF report export",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--cyan)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-4">
          Why Developers Trust Nullscan
        </h2>
        <p
          className="text-center text-sm mb-12 max-w-xl mx-auto"
          style={{ color: "var(--text-muted)" }}
        >
          Nullscan uses autonomous AI agents to simulate real-world attacks — the
          same techniques actual attackers use, but safely and non-destructively.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            {
              stat: "Real Pentesting",
              desc: "Not just header checks. AI agents actively probe your endpoints, inputs, and authentication flows.",
            },
            {
              stat: "Non-Destructive",
              desc: "All tests are safe. No data exfiltration, no denial of service, no credential brute forcing.",
            },
            {
              stat: "No Setup Required",
              desc: "External scanning only. No code access, no agents to install, no configuration needed.",
            },
          ].map((item) => (
            <div key={item.stat} className="p-6">
              <h3
                className="font-mono text-sm uppercase tracking-wider mb-3"
                style={{ color: "var(--cyan)" }}
              >
                {item.stat}
              </h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {item.desc}
              </p>
            </div>
          ))}
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
                q: "Is the security scan really free?",
                a: "Yes. The free scan runs real penetration tests against your website. You get vulnerability titles, severity levels, and affected endpoints. Detailed reproduction steps, proof-of-concept code, and fix guidance are available when you unlock the full report for $39.",
              },
              {
                q: "How long does a scan take?",
                a: "Most scans complete in 5-15 minutes depending on the size of your application. AI agents test multiple endpoints simultaneously to keep scan times short.",
              },
              {
                q: "Is it safe to scan my website?",
                a: "Yes. Nullscan performs non-destructive testing only. It does not run denial-of-service attacks, brute force credentials, or exfiltrate any data. All tests are designed to identify vulnerabilities without harming your application or its users.",
              },
              {
                q: "What vulnerabilities does it test for?",
                a: "Nullscan tests for SQL injection, cross-site scripting (XSS), authentication bypass, IDOR and broken access control, server-side request forgery (SSRF), path traversal, rate limiting issues, and security header misconfigurations — covering the most critical OWASP Top 10 categories.",
              },
              {
                q: "Do I need to install anything?",
                a: "No. Nullscan is a fully external scanner. Just enter your URL and the scan runs from our infrastructure. No agents, browser extensions, or code modifications required.",
              },
              {
                q: "Can I scan any website?",
                a: "You can scan any publicly accessible website that you own or have explicit permission to test. Nullscan requires consent confirmation before every scan.",
              },
              {
                q: "What happens after the free scan?",
                a: "After the scan completes, you can view the results immediately. If vulnerabilities are found, you can unlock the full report with reproduction steps and fix guidance for $39, or run a deeper Pro ($250) or Deep Analysis ($899) scan for more comprehensive testing.",
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

      {/* Bottom CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">
          Ready to Scan Your Website?
        </h2>
        <p
          className="text-sm mb-8 max-w-lg mx-auto"
          style={{ color: "var(--text-muted)" }}
        >
          Find out if your website has security vulnerabilities. Free scan, no
          signup, results in minutes.
        </p>
        <a
          href="/#terminal"
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
