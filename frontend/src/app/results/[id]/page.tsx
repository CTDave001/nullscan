"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  Critical: "bg-red-500",
  High: "bg-orange-500",
  Medium: "bg-yellow-500",
  Low: "bg-blue-500",
};

const riskColors: Record<string, string> = {
  Critical: "text-red-600 bg-red-50 border-red-200",
  High: "text-orange-600 bg-orange-50 border-orange-200",
  Medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  Low: "text-blue-600 bg-blue-50 border-blue-200",
  Clean: "text-green-600 bg-green-50 border-green-200",
};

export default function ResultsPage() {
  const params = useParams();
  const [results, setResults] = useState<ScanResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Error</h1>
          <p className="text-slate-600">{error}</p>
        </Card>
      </main>
    );
  }

  if (!results) return null;

  const isPaid = results.paid_tier !== null;
  const showUnlockTier = results.findings.length > 0 && !isPaid;
  const showDeepTier = !isPaid || results.paid_tier === "unlock";

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Card className={`p-6 mb-6 border-2 ${riskColors[results.risk_level]}`}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-semibold mb-1">
                Scan complete for{" "}
                <span className="font-mono">{results.target_url}</span>
              </h1>
              <p className="text-slate-600">
                {results.findings.length} issue
                {results.findings.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <Badge
              className={`${severityColors[results.risk_level] || "bg-green-500"} text-white`}
            >
              {results.risk_level}
            </Badge>
          </div>
        </Card>

        {/* Findings */}
        {results.findings.length === 0 ? (
          <Card className="p-6 text-center">
            <h2 className="text-lg font-semibold text-green-600 mb-2">
              No obvious issues detected
            </h2>
            <p className="text-slate-600 mb-4">
              The quick scan didn&apos;t find any obvious vulnerabilities. Want
              to go deeper?
            </p>
          </Card>
        ) : (
          <div className="space-y-4 mb-6">
            {results.findings.map((finding, i) => (
              <Card key={i} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{finding.title}</h3>
                  <Badge
                    className={`${severityColors[finding.severity]} text-white`}
                  >
                    {finding.severity}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  <span className="font-medium">Endpoint:</span>{" "}
                  <code className="bg-slate-100 px-1 rounded">
                    {finding.endpoint}
                  </code>
                </p>
                <p className="text-sm text-slate-600">{finding.impact}</p>

                {isPaid && finding.reproduction_steps && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">
                      Reproduction Steps
                    </h4>
                    <pre className="bg-slate-100 p-2 rounded text-xs overflow-x-auto">
                      {finding.reproduction_steps}
                    </pre>
                  </div>
                )}

                {isPaid && finding.fix_guidance && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2">Fix Guidance</h4>
                    <p className="text-sm text-slate-600">
                      {finding.fix_guidance}
                    </p>
                  </div>
                )}

                {!isPaid && (
                  <div className="mt-4 pt-4 border-t border-dashed">
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                      <span>🔒</span> Reproduction steps, PoC, and fix guidance
                      locked
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* CTAs */}
        {(!isPaid || results.paid_tier === "unlock") && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-center">
              {isPaid ? "Go deeper" : "Unlock full report"}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {showUnlockTier && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Unlock Report</h3>
                  <p className="text-2xl font-bold mb-2">$149</p>
                  <ul className="text-sm text-slate-600 mb-4 space-y-1">
                    <li>Full reproduction steps</li>
                    <li>Proof-of-concept code</li>
                    <li>Fix guidance</li>
                    <li>PDF export</li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handleCheckout("unlock")}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? "Loading..." : "Unlock for $149"}
                  </Button>
                </div>
              )}
              {showDeepTier && (
                <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h3 className="font-semibold mb-2">Deep Analysis</h3>
                  <p className="text-2xl font-bold mb-2">$399</p>
                  <ul className="text-sm text-slate-600 mb-4 space-y-1">
                    <li>Everything in Unlock</li>
                    <li>1-4 hour thorough scan</li>
                    <li>Executive summary</li>
                    <li>Security certificate</li>
                    <li>One free rescan</li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handleCheckout("deep")}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? "Loading..." : "Get deep analysis $399"}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
