"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

interface Scan {
  id: string;
  status: string;
  target_url: string;
  created_at: string;
}

export default function ScanStatusPage() {
  const params = useParams();
  const router = useRouter();
  const [scan, setScan] = useState<Scan | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/scans/${params.id}`
        );
        if (!res.ok) throw new Error("Scan not found");
        const data = await res.json();
        setScan(data);

        if (data.status === "completed") {
          router.push(`/results/${params.id}`);
        } else if (data.status === "failed") {
          setError("Scan failed. Please try again.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    };

    fetchScan();
    const interval = setInterval(fetchScan, 5000);
    return () => clearInterval(interval);
  }, [params.id, router]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Error</h1>
          <p className="text-slate-600">{error}</p>
          <a href="/" className="text-blue-600 hover:underline mt-4 block">
            Try again
          </a>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-md">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Scanning your app</h1>
        {scan && (
          <p className="text-slate-600 mb-4">
            Target: <span className="font-mono text-sm">{scan.target_url}</span>
          </p>
        )}
        <p className="text-slate-500 text-sm">
          This usually takes 5-15 minutes. We&apos;ll email you when it&apos;s
          ready.
        </p>
        <p className="text-slate-400 text-xs mt-4">
          You can close this page. We&apos;ll send results to your email.
        </p>
      </Card>
    </main>
  );
}
