import { ScanForm } from "@/components/scan-form";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Check, X } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
            {/* Left column - Copy */}
            <div className="lg:w-[55%] mb-10 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
                Your app.{" "}
                <span className="text-[var(--accent)]">Their perspective.</span>
              </h1>
              <p className="text-lg text-[var(--text-secondary)] mb-6 max-w-lg">
                Automated penetration testing that shows you what attackers
                actually find.
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--text-muted)]">
                <span>No agents to install</span>
                <span className="text-[var(--text-dim)]">·</span>
                <span>No source code needed</span>
                <span className="text-[var(--text-dim)]">·</span>
                <span>Results in minutes</span>
              </div>
            </div>

            {/* Right column - Form */}
            <div className="lg:w-[45%]">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-[0_0_80px_var(--accent-glow),0_0_20px_var(--accent-glow)]">
                <ScanForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: 1,
                title: "Enter your URL",
                description:
                  "Paste your app's URL and your email. We only test publicly accessible endpoints — no credentials needed.",
              },
              {
                step: 2,
                title: "AI agents attack",
                description:
                  "Specialized agents probe for SQL injection, XSS, SSRF, authentication bypass, IDOR, and more. Watch them work in real-time.",
              },
              {
                step: 3,
                title: "Get a real report",
                description:
                  "Verified findings only. Every vulnerability includes proof-of-concept code and specific fix guidance. No false positives.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 border-2 border-[var(--accent)] bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[var(--accent)] font-bold">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free Scan */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2">Free Scan</h3>
              <p className="text-3xl font-bold mb-4">$0</p>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  Quick external scan
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  Finding titles and severity
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  Affected endpoints
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  Impact description
                </li>
                <li className="flex items-center gap-2 text-[var(--text-dim)]">
                  <X size={14} />
                  <span className="line-through">Reproduction steps</span>
                </li>
                <li className="flex items-center gap-2 text-[var(--text-dim)]">
                  <X size={14} />
                  <span className="line-through">Proof-of-concept code</span>
                </li>
                <li className="flex items-center gap-2 text-[var(--text-dim)]">
                  <X size={14} />
                  <span className="line-through">Fix guidance</span>
                </li>
              </ul>
            </div>

            {/* Unlock Report - Highlighted */}
            <div className="relative bg-[var(--surface)] border-2 border-[var(--accent)] rounded-xl p-6 shadow-[0_0_40px_var(--accent-glow)]">
              <div className="absolute -top-3 right-4 bg-[var(--accent)] text-[var(--bg)] text-[11px] font-semibold px-2 py-0.5 rounded">
                Most popular
              </div>
              <h3 className="font-semibold text-lg mb-2 text-[var(--accent)]">
                Unlock Report
              </h3>
              <p className="text-3xl font-bold mb-4">$149</p>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  Everything in Free
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  Full reproduction steps
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  Proof-of-concept code
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  Fix guidance per finding
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  PDF export
                </li>
              </ul>
            </div>

            {/* Deep Analysis */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2">Deep Analysis</h3>
              <p className="text-3xl font-bold mb-4">$399</p>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  Everything in Unlock
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  1-4 hour thorough deep scan
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  7+ vulnerability categories
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  Executive summary
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  Security certificate
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  One free rescan
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
