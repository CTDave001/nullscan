"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Check, AlertCircle } from "lucide-react";

interface Scan {
  id: string;
  status: string;
  target_url: string;
  created_at: string;
}

interface Finding {
  title: string;
  severity: string;
}

interface ActiveAgent {
  label: string;
  description: string;
  status: string;
}

interface ActivityEntry {
  ts: string;
  description: string;
  status: string;
}

interface Progress {
  agents?: number;
  active_agents?: number;
  tools?: number;
  input_tokens?: number;
  output_tokens?: number;
  cost?: number;
  vulnerabilities_found?: number;
  findings_so_far?: Finding[];
  active_agent_list?: ActiveAgent[];
  recent_activity?: ActivityEntry[];
}

const PHASES = [
  "Initializing sandbox",
  "Reconnaissance & mapping",
  "Probing endpoints",
  "Testing attack vectors",
  "Analyzing responses",
  "Compiling report",
];

export default function ScanStatusPage() {
  const params = useParams();
  const router = useRouter();
  const [scan, setScan] = useState<Scan | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const activityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scan?.created_at) return;
    const raw = scan.created_at.endsWith("Z")
      ? scan.created_at
      : scan.created_at + "Z";
    const createdAt = new Date(raw).getTime();
    const update = () =>
      setElapsed(Math.floor((Date.now() - createdAt) / 1000));
    update();
    const tick = setInterval(update, 1000);
    return () => clearInterval(tick);
  }, [scan?.created_at]);

  useEffect(() => {
    if (activityRef.current) {
      activityRef.current.scrollTop = activityRef.current.scrollHeight;
    }
  }, [progress.recent_activity]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [scanRes, progressRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/scans/${params.id}`),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/scans/${params.id}/progress`
          ),
        ]);

        if (!scanRes.ok) throw new Error("Scan not found");
        const scanData = await scanRes.json();
        setScan(scanData);

        if (progressRes.ok) {
          const progressData = await progressRes.json();
          if (
            progressData.progress &&
            Object.keys(progressData.progress).length > 0
          ) {
            setProgress(progressData.progress);
          }
        }

        if (scanData.status === "completed") {
          setTimeout(() => router.push(`/results/${params.id}`), 2000);
        } else if (scanData.status === "failed") {
          setError("Scan failed. Please try again.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [params.id, router]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const formatBigNumber = (n: number) => {
    if (n >= 1_000_000) {
      return { value: (n / 1_000_000).toFixed(1), suffix: "M" };
    }
    if (n >= 1_000) {
      return { value: (n / 1_000).toFixed(0), suffix: "K" };
    }
    return { value: String(n), suffix: "" };
  };

  const severityColor = (s: string) => {
    switch (s.toLowerCase()) {
      case "critical":
        return "bg-[var(--severity-critical)]/20 text-[var(--severity-critical)] border-[var(--severity-critical)]/30";
      case "high":
        return "bg-[var(--severity-high)]/20 text-[var(--severity-high)] border-[var(--severity-high)]/30";
      case "medium":
        return "bg-[var(--severity-medium)]/20 text-[var(--severity-medium)] border-[var(--severity-medium)]/30";
      default:
        return "bg-[var(--severity-low)]/20 text-[var(--severity-low)] border-[var(--severity-low)]/30";
    }
  };

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--bg)]">
        <Navbar />
        <div className="pt-24 flex items-center justify-center p-4">
          <div className="max-w-md w-full border border-[var(--severity-critical)]/30 bg-[var(--surface)] rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--severity-critical)]/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-[var(--severity-critical)]" size={24} />
            </div>
            <h1 className="text-lg font-semibold text-[var(--text)] mb-2">
              Scan Failed
            </h1>
            <p className="text-[var(--text-muted)] text-sm mb-6">{error}</p>
            <a
              href="/"
              className="inline-block px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] text-sm font-medium rounded-lg transition-colors"
            >
              Start New Scan
            </a>
          </div>
        </div>
      </main>
    );
  }

  const hasProgress = progress.agents !== undefined;
  const vulnCount = progress.vulnerabilities_found ?? 0;
  const inputTokens = progress.input_tokens ?? 0;
  const activeAgents = progress.active_agent_list ?? [];
  const recentActivity = progress.recent_activity ?? [];
  const isComplete = scan?.status === "completed";

  const phase =
    inputTokens >= 900000
      ? 5
      : inputTokens >= 500000
        ? 4
        : inputTokens >= 200000
          ? 3
          : inputTokens >= 50000
            ? 2
            : inputTokens > 0
              ? 1
              : 0;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      {/* Scanning animation bar */}
      {!isComplete && (
        <div className="fixed top-16 left-0 right-0 h-0.5 bg-[var(--surface)] overflow-hidden z-40">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent animate-scan" />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  isComplete
                    ? "bg-[var(--success)]"
                    : "bg-[var(--accent)] animate-pulse-slow"
                }`}
              />
              <h1 className="text-lg font-semibold">
                {isComplete
                  ? "Penetration test complete"
                  : "Penetration test active"}
              </h1>
            </div>
            {scan && (
              <p className="text-[var(--text-muted)] font-mono text-sm ml-5">
                {scan.target_url}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono text-[var(--text-secondary)] tabular-nums">
              {formatTime(elapsed)}
            </p>
            <p className="text-xs text-[var(--text-dim)]">elapsed</p>
          </div>
        </div>

        {/* Phase indicators */}
        <div className="flex gap-1 mb-8">
          {PHASES.map((label, i) => (
            <div key={i} className="flex-1">
              <div
                className={`h-1 rounded-full mb-2 transition-all duration-700 ${
                  i <= phase ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                }`}
              />
              <p
                className={`text-[11px] transition-colors duration-500 ${
                  i === phase
                    ? "text-[var(--accent)]"
                    : i < phase
                      ? "text-[var(--text-muted)]"
                      : "text-[var(--text-dim)]"
                }`}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Stats row */}
        {hasProgress && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">
                Active Agents
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {progress.active_agents ?? 0}
                <span className="text-sm text-[var(--text-dim)] font-normal ml-1">
                  / {progress.agents ?? 0}
                </span>
              </p>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">
                Tools Used
              </p>
              <p className="text-2xl font-bold tabular-nums font-mono">
                {formatBigNumber(progress.tools ?? 0).value}
                <span className="text-sm text-[var(--text-muted)] font-normal">
                  {formatBigNumber(progress.tools ?? 0).suffix}
                </span>
              </p>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">Tokens</p>
              <p className="text-2xl font-bold tabular-nums font-mono">
                {formatBigNumber(inputTokens).value}
                <span className="text-sm text-[var(--text-muted)] font-normal">
                  {formatBigNumber(inputTokens).suffix}
                </span>
              </p>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">Findings</p>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  vulnCount > 0 ? "text-[var(--severity-critical)]" : ""
                }`}
              >
                {vulnCount}
              </p>
            </div>
          </div>
        )}

        {/* Vulnerability discoveries */}
        {progress.findings_so_far && progress.findings_so_far.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Discovered Vulnerabilities
            </h2>
            <div className="space-y-2">
              {progress.findings_so_far.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 animate-fadeIn"
                >
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${severityColor(
                      f.severity
                    )}`}
                  >
                    {f.severity}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {f.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* War Room - Two panel layout */}
        <div className="grid lg:grid-cols-5 gap-4 mb-6">
          {/* Left panel: Active agents */}
          <div className="lg:col-span-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Active Agents
            </h2>
            {activeAgents.length > 0 ? (
              <div className="space-y-2">
                {activeAgents.slice(0, 5).map((agent, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 bg-[var(--bg)] rounded-lg px-4 py-3 border-l-[3px] ${
                      agent.status === "running"
                        ? "border-l-[var(--accent)]"
                        : "border-l-[var(--border)]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-[var(--text)]">
                          {agent.label}
                        </p>
                        <span
                          className={`flex items-center gap-1.5 text-[11px] ${
                            agent.status === "running"
                              ? "text-[var(--success)]"
                              : "text-[var(--text-dim)]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              agent.status === "running"
                                ? "bg-[var(--success)] animate-pulse"
                                : "bg-[var(--text-dim)]"
                            }`}
                          />
                          {agent.status}
                        </span>
                      </div>
                      {agent.description && (
                        <p className="text-[13px] text-[var(--text-muted)] line-clamp-2">
                          {agent.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {activeAgents.length > 5 && (
                  <p className="text-xs text-[var(--text-dim)] text-center py-2">
                    +{activeAgents.length - 5} more agents running
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-dim)] py-4 text-center">
                {hasProgress
                  ? "Waiting for agents to spawn..."
                  : "Initializing sandbox..."}
              </p>
            )}
          </div>

          {/* Right panel: Event timeline */}
          <div className="lg:col-span-2 bg-black border border-[var(--border)] rounded-xl p-4">
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Live Activity
            </h2>
            <div
              ref={activityRef}
              className="h-64 overflow-y-auto space-y-1.5 font-mono text-xs"
            >
              <div className="flex items-start gap-2">
                <span className="text-[var(--text-dim)] shrink-0">--:--</span>
                <span className="text-[var(--text-muted)]">
                  Nullscan engine initialized. Target: {scan?.target_url ?? "..."}
                </span>
              </div>

              {!hasProgress && (
                <div className="flex items-start gap-2">
                  <span className="text-[var(--text-dim)] shrink-0">--:--</span>
                  <span className="text-[var(--accent)]/70 animate-pulse">
                    Setting up sandbox and deploying agents...
                  </span>
                </div>
              )}

              {hasProgress && recentActivity.length === 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-[var(--text-dim)] shrink-0">--:--</span>
                  <span className="text-[var(--accent)]/70 animate-pulse">
                    Agents deployed. Starting reconnaissance...
                  </span>
                </div>
              )}

              {recentActivity.map((entry, i) => {
                const time = entry.ts
                  ? new Date(entry.ts).toLocaleTimeString("en-US", {
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--";
                const isFinding =
                  entry.description.includes("VULN") ||
                  entry.description.toLowerCase().includes("vulnerabilit");
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2 animate-fadeIn"
                  >
                    <span className="text-[var(--accent)] shrink-0 tabular-nums">
                      {time}
                    </span>
                    <span
                      className={
                        isFinding
                          ? "text-[var(--severity-critical)] font-semibold"
                          : entry.status === "running"
                            ? "text-[var(--text-secondary)]"
                            : "text-[var(--text-muted)]"
                      }
                    >
                      {entry.description}
                    </span>
                  </div>
                );
              })}

              {hasProgress && !isComplete && (
                <div className="flex items-start gap-2">
                  <span className="text-[var(--text-dim)] shrink-0">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  </span>
                  <span className="text-[var(--accent)]/40 animate-blink">
                    _
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Completion message */}
        {isComplete && (
          <div className="bg-[var(--surface)] border border-[var(--success)]/30 rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
              <Check className="text-[var(--success)]" size={16} />
            </div>
            <div>
              <p className="font-medium">Scan complete</p>
              <p className="text-sm text-[var(--text-muted)]">
                Redirecting to results...
              </p>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p className="text-[var(--text-dim)] text-xs text-center">
          This scan runs in our cloud. Close this tab anytime — we&apos;ll email
          your report.
        </p>
      </div>
    </main>
  );
}
