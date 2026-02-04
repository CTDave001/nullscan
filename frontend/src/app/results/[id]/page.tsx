"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Lock, Check, Copy, CheckCheck } from "lucide-react";

interface Finding {
  title: string;
  severity: string;
  endpoint: string;
  impact: string;
  reproduction_steps?: string;
  poc?: string;
  fix_guidance?: string;
}

interface ScanResults {
  scan_id: string;
  target_url: string;
  risk_level: string;
  findings: Finding[];
  scan_type: string;
  paid_tier: string | null;
}

const severityColors: Record<string, string> = {
  Critical: "var(--severity-critical)",
  High: "var(--severity-high)",
  Medium: "var(--severity-medium)",
  Low: "var(--severity-low)",
};

const riskBadgeColors: Record<string, string> = {
  Critical: "bg-[var(--severity-critical)] text-white",
  High: "bg-[var(--severity-high)] text-white",
  Medium: "bg-[var(--severity-medium)] text-black",
  Low: "bg-[var(--severity-low)] text-white",
  Clean: "bg-[var(--success)] text-white",
};

const ATTACK_CATEGORIES = [
  "SQL Injection",
  "Cross-Site Scripting",
  "Authentication Bypass",
  "IDOR / Access Control",
  "SSRF",
  "Directory Traversal",
  "Security Headers",
];

export default function ResultsPage() {
  const params = useParams();
  const [results, setResults] = useState<ScanResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/scans/${params.id}/results`
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Failed to load results");
        }
        const data = await res.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [params.id]);

  const handleCheckout = async (tier: "unlock" | "deep") => {
    setCheckoutLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scans/${params.id}/checkout?tier=${tier}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to create checkout");
      const data = await res.json();
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--bg)]">
        <Navbar />
        <div className="pt-24 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 text-center max-w-md">
            <h1 className="text-xl font-semibold text-[var(--severity-critical)] mb-2">
              Error
            </h1>
            <p className="text-[var(--text-muted)]">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!results) return null;

  const isPaid = results.paid_tier !== null;
  const showUnlockCTA = results.findings.length > 0 && !isPaid;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      {/* Header banner */}
      <div className="pt-16 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Scan Report
              </p>
              <p className="font-mono text-lg">{results.target_url}</p>
            </div>
            <div
              className={`px-4 py-2 rounded-lg text-sm font-bold uppercase ${
                riskBadgeColors[results.risk_level] || riskBadgeColors.Clean
              }`}
            >
              {results.risk_level} Risk
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13px] font-mono text-[var(--text-muted)]">
            <span>
              <span className="text-[var(--text)]">
                {results.findings.length}
              </span>{" "}
              findings
            </span>
            <span className="text-[var(--text-dim)]">·</span>
            <span>
              <span className="text-[var(--text)]">7</span> attack categories
            </span>
            <span className="text-[var(--text-dim)]">·</span>
            <span>{results.scan_type} scan</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Findings */}
        {results.findings.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto mb-4">
              <Check className="text-[var(--success)]" size={24} />
            </div>
            <h2 className="text-xl font-semibold text-[var(--success)] mb-2">
              No vulnerabilities detected
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Your application passed all tests in the {results.scan_type} scan.
            </p>

            <div className="max-w-xs mx-auto">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">
                Categories Tested
              </p>
              <div className="space-y-2">
                {ATTACK_CATEGORIES.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                  >
                    <Check size={14} className="text-[var(--success)]" />
                    {cat}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {results.findings.map((finding, i) => {
              const color = severityColors[finding.severity] || severityColors.Low;
              return (
                <div
                  key={i}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden"
                >
                  {/* Severity color bar */}
                  <div className="flex">
                    <div
                      className="w-1 shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="font-semibold">{finding.title}</h3>
                        <span
                          className="shrink-0 text-[11px] font-bold uppercase px-2 py-0.5 rounded border"
                          style={{
                            backgroundColor: `${color}20`,
                            color: color,
                            borderColor: `${color}30`,
                          }}
                        >
                          {finding.severity}
                        </span>
                      </div>

                      {/* Endpoint */}
                      <p className="font-mono text-[13px] text-[var(--accent)] mb-3">
                        {finding.endpoint}
                      </p>

                      {/* Impact - always visible */}
                      <p className="text-sm text-[var(--text-secondary)] mb-4">
                        {finding.impact}
                      </p>

                      {/* Locked content for free tier */}
                      {!isPaid && (
                        <div className="relative bg-[var(--surface-raised)] rounded-lg p-4 mt-4">
                          {/* Blurred fake content */}
                          <div className="blur-sm select-none pointer-events-none text-sm text-[var(--text-muted)] space-y-2 mb-4">
                            <p>
                              1. Send a POST request to the endpoint with the
                              following payload...
                            </p>
                            <p>
                              2. Observe that the response contains sensitive
                              data from the database...
                            </p>
                            <p>
                              3. The vulnerability can be exploited by
                              injecting...
                            </p>
                          </div>

                          {/* Lock overlay */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface-raised)]/80 backdrop-blur-[2px] rounded-lg">
                            <Lock
                              size={16}
                              className="text-[var(--text-muted)] mb-2"
                            />
                            <p className="text-[13px] text-[var(--text-muted)] mb-3">
                              Reproduction steps, proof-of-concept, and fix
                              guidance
                            </p>
                            <button
                              onClick={() => handleCheckout("unlock")}
                              disabled={checkoutLoading}
                              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] text-sm font-semibold rounded-lg transition-all hover:shadow-[0_0_20px_var(--accent-glow)]"
                            >
                              {checkoutLoading
                                ? "Loading..."
                                : "Unlock full report — $149"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Full content for paid tier */}
                      {isPaid && finding.reproduction_steps && (
                        <div className="mt-4 pt-4 border-t border-[var(--border)]">
                          <h4 className="text-sm font-semibold mb-2">
                            Reproduction Steps
                          </h4>
                          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                            {finding.reproduction_steps}
                          </p>
                        </div>
                      )}

                      {isPaid && finding.poc && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold mb-2">
                            Proof of Concept
                          </h4>
                          <div className="relative">
                            <pre className="bg-black border border-[var(--border)] rounded-lg p-4 text-[13px] font-mono text-[var(--text-secondary)] overflow-x-auto">
                              {finding.poc}
                            </pre>
                            <button
                              onClick={() => copyToClipboard(finding.poc!, i)}
                              className="absolute top-2 right-2 p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded hover:bg-[var(--surface-raised)] transition-colors"
                            >
                              {copiedIndex === i ? (
                                <CheckCheck
                                  size={14}
                                  className="text-[var(--success)]"
                                />
                              ) : (
                                <Copy
                                  size={14}
                                  className="text-[var(--text-muted)]"
                                />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {isPaid && finding.fix_guidance && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold mb-2">
                            Fix Guidance
                          </h4>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {finding.fix_guidance}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Deep Analysis upsell */}
        {(!isPaid || results.paid_tier === "unlock") && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">
              {isPaid ? "Go deeper" : "Want to go deeper?"}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Our Deep Analysis runs for 1-4 hours with 7+ attack categories.
            </p>
            <button
              onClick={() => handleCheckout("deep")}
              disabled={checkoutLoading}
              className="px-6 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] text-sm font-medium rounded-lg transition-all"
            >
              {checkoutLoading ? "Loading..." : "Deep Analysis — $399"}
            </button>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
