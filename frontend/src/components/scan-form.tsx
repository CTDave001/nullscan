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
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="url">Your app URL</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://yourapp.com"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email for results</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="consent"
          checked={consent}
          onCheckedChange={(checked) => setConsent(checked === true)}
          required
        />
        <Label htmlFor="consent" className="text-sm text-muted-foreground">
          I confirm I own this application or have explicit written permission
          to perform security testing on it.
        </Label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        type="submit"
        className="w-full bg-[#d4a853] hover:bg-[#c9a227] text-[#18181b] font-semibold"
        disabled={loading || !consent}
      >
        {loading ? "Starting scan..." : "Scan your app free"}
      </Button>
    </form>
  );
}
