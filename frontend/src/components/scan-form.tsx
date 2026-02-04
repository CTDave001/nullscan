"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function ScanForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scans/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          target_url: targetUrl,
          consent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to start scan");
      }

      const data = await res.json();
      router.push(`/scan/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="space-y-1.5">
        <Label
          htmlFor="url"
          className="text-[13px] font-medium text-[var(--text-secondary)]"
        >
          Your app URL
        </Label>
        <Input
          id="url"
          type="url"
          placeholder="https://yourapp.com"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          required
          className="h-10 bg-[var(--bg)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]"
        />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="email"
          className="text-[13px] font-medium text-[var(--text-secondary)]"
        >
          Email for results
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-10 bg-[var(--bg)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]"
        />
      </div>

      <div className="flex items-start space-x-2 pt-1">
        <Checkbox
          id="consent"
          checked={consent}
          onCheckedChange={(checked) => setConsent(checked === true)}
          required
          className="border-[var(--border)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)]"
        />
        <Label
          htmlFor="consent"
          className="text-xs text-[var(--text-muted)] leading-relaxed cursor-pointer"
        >
          I confirm I own this application or have explicit written permission
          to perform security testing on it.
        </Label>
      </div>

      {error && (
        <p className="text-sm text-[var(--severity-critical)]">{error}</p>
      )}

      <Button
        type="submit"
        className="w-full h-10 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] font-semibold text-sm transition-all hover:shadow-[0_0_20px_var(--accent-glow)]"
        disabled={loading || !consent}
      >
        {loading ? "Starting scan..." : "Scan your app free"}
      </Button>
    </form>
  );
}
