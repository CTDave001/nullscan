# Nullscan Frontend Rebrand Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebrand the entire frontend from "Argus" to "Nullscan" with a new dark theme, cyan accent color, enhanced UI components, and improved UX across all 6 pages.

**Architecture:** Replace the current amber/gold color scheme with cyan (#06b6d4) accents on a near-black (#09090b) background. Create new shared components (navbar, logo, footer). Enhance the scan status page with a two-panel "war room" layout. Add paywall blur effects to the results page.

**Tech Stack:** Next.js (App Router), Tailwind CSS 4, shadcn/ui components, Lucide React icons, CSS animations (no JS animation libraries).

---

## Task 1: Set Up CSS Variables and Color System

**Files:**
- Modify: `frontend/src/app/globals.css`

**Step 1: Read the existing file**

Read `frontend/src/app/globals.css` to understand current structure.

**Step 2: Replace the CSS variables**

Replace the entire `:root` and `.dark` sections with the new Nullscan color system. The file should look like this:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
}

:root {
  /* Nullscan Dark Theme - Dark Only, No Light Mode */
  --radius: 0.625rem;

  /* Backgrounds */
  --bg: #09090b;
  --surface: #18181b;
  --surface-raised: #1c1c20;

  /* Borders */
  --border: #27272a;
  --border-bright: #3f3f46;

  /* Text */
  --text: #fafafa;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  --text-dim: #52525b;

  /* Brand accent - cyan */
  --accent: #06b6d4;
  --accent-hover: #0891b2;
  --accent-muted: #0e7490;
  --accent-glow: rgba(6, 182, 212, 0.12);
  --accent-glow-strong: rgba(6, 182, 212, 0.25);

  /* Severity colors */
  --severity-critical: #ef4444;
  --severity-high: #f97316;
  --severity-medium: #eab308;
  --severity-low: #3b82f6;

  /* Status colors */
  --success: #22c55e;
  --error: #ef4444;
  --warning: #eab308;

  /* shadcn compatibility mappings */
  --background: #09090b;
  --foreground: #fafafa;
  --card: #18181b;
  --card-foreground: #fafafa;
  --popover: #18181b;
  --popover-foreground: #fafafa;
  --primary: #06b6d4;
  --primary-foreground: #09090b;
  --secondary: #27272a;
  --secondary-foreground: #fafafa;
  --muted: #27272a;
  --muted-foreground: #71717a;
  --destructive: #ef4444;
  --input: #27272a;
  --ring: #06b6d4;
  --chart-1: #06b6d4;
  --chart-2: #22c55e;
  --chart-3: #eab308;
  --chart-4: #f97316;
  --chart-5: #ef4444;
  --sidebar: #18181b;
  --sidebar-foreground: #fafafa;
  --sidebar-primary: #06b6d4;
  --sidebar-primary-foreground: #09090b;
  --sidebar-accent: #27272a;
  --sidebar-accent-foreground: #fafafa;
  --sidebar-border: #27272a;
  --sidebar-ring: #06b6d4;
}

/* Global animations */
@keyframes scan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes blink {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0; }
}

.animate-scan {
  animation: scan 2s ease-in-out infinite;
}

.animate-pulse-slow {
  animation: pulse 2s infinite;
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

.animate-blink {
  animation: blink 1s infinite;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-[var(--bg)] text-[var(--text)];
  }
}
```

**Step 3: Verify the file was saved correctly**

Run: `head -50 frontend/src/app/globals.css`
Expected: File starts with the new Nullscan color variables

**Step 4: Commit**

```bash
git add frontend/src/app/globals.css
git commit -m "feat: add Nullscan dark theme color system

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create Nullscan Logo Component

**Files:**
- Create: `frontend/src/components/nullscan-logo.tsx`

**Step 1: Create the logo component**

Create `frontend/src/components/nullscan-logo.tsx` with this content:

```tsx
interface NullscanLogoProps {
  size?: "sm" | "md" | "lg";
  iconOnly?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 24, text: 14, gap: 6 },
  md: { icon: 32, text: 18, gap: 8 },
  lg: { icon: 48, text: 24, gap: 10 },
};

export function NullscanLogo({
  size = "md",
  iconOnly = false,
  className = "",
}: NullscanLogoProps) {
  const { icon, text, gap } = sizes[size];
  const strokeWidth = size === "sm" ? 1.5 : size === "lg" ? 2.5 : 2;

  return (
    <div className={`flex items-center ${className}`} style={{ gap }}>
      {/* Null set symbol (∅) */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Nullscan logo"
      >
        {/* Circle */}
        <circle
          cx="16"
          cy="16"
          r="11"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Diagonal line with gradient fade */}
        <defs>
          <linearGradient id="diagonalFade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="20%" stopColor="var(--accent)" stopOpacity="1" />
            <stop offset="80%" stopColor="var(--accent)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <line
          x1="8"
          y1="8"
          x2="24"
          y2="24"
          stroke="url(#diagonalFade)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>

      {/* Wordmark */}
      {!iconOnly && (
        <span
          className="font-medium tracking-tight"
          style={{ fontSize: text, letterSpacing: "-0.02em" }}
        >
          <span style={{ color: "var(--accent)" }}>null</span>
          <span style={{ color: "var(--text)" }}>scan</span>
        </span>
      )}
    </div>
  );
}
```

**Step 2: Verify the component was created**

Run: `cat frontend/src/components/nullscan-logo.tsx | head -20`
Expected: File exists with the NullscanLogo component

**Step 3: Commit**

```bash
git add frontend/src/components/nullscan-logo.tsx
git commit -m "feat: add Nullscan logo component with null set symbol

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create Shared Navbar Component

**Files:**
- Create: `frontend/src/components/navbar.tsx`

**Step 1: Create the navbar component**

Create `frontend/src/components/navbar.tsx` with this content:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NullscanLogo } from "./nullscan-logo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-6 transition-all duration-200 ${
        scrolled
          ? "bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--border)]"
          : "bg-transparent"
      }`}
    >
      <Link href="/" className="flex items-center">
        <NullscanLogo size="sm" />
      </Link>

      <div className="flex items-center gap-6">
        <Link
          href="/#pricing"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          Pricing
        </Link>
        <Link
          href="/scope"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          Scope
        </Link>
      </div>
    </nav>
  );
}
```

**Step 2: Verify the component was created**

Run: `cat frontend/src/components/navbar.tsx | head -20`
Expected: File exists with the Navbar component

**Step 3: Commit**

```bash
git add frontend/src/components/navbar.tsx
git commit -m "feat: add shared navbar component with scroll effect

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create Shared Footer Component

**Files:**
- Create: `frontend/src/components/footer.tsx`

**Step 1: Create the footer component**

Create `frontend/src/components/footer.tsx` with this content:

```tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-8 text-center">
      <div className="flex items-center justify-center gap-4 text-sm text-[var(--text-muted)] mb-4">
        <Link href="/scope" className="hover:text-[var(--accent)] transition-colors">
          What we test
        </Link>
        <span className="text-[var(--text-dim)]">·</span>
        <Link href="/terms" className="hover:text-[var(--accent)] transition-colors">
          Terms
        </Link>
        <span className="text-[var(--text-dim)]">·</span>
        <Link href="/privacy" className="hover:text-[var(--accent)] transition-colors">
          Privacy
        </Link>
      </div>
      <p className="text-xs text-[var(--text-dim)]">© 2026 nullscan</p>
    </footer>
  );
}
```

**Step 2: Verify the component was created**

Run: `cat frontend/src/components/footer.tsx`
Expected: File exists with the Footer component

**Step 3: Commit**

```bash
git add frontend/src/components/footer.tsx
git commit -m "feat: add shared footer component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Update Layout with Metadata and Favicon

**Files:**
- Modify: `frontend/src/app/layout.tsx`
- Create: `frontend/public/favicon.svg`

**Step 1: Read the existing layout**

Read `frontend/src/app/layout.tsx` to understand current structure.

**Step 2: Update the layout**

Replace the entire content of `frontend/src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nullscan - Automated Penetration Testing",
  description:
    "Automated black-box penetration testing for web applications. Find real vulnerabilities with AI-powered security scanning.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--bg)] text-[var(--text)]`}
      >
        {children}
      </body>
    </html>
  );
}
```

**Step 3: Create the favicon SVG**

Create `frontend/public/favicon.svg` with this content:

```svg
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="11" stroke="#06b6d4" stroke-width="2" fill="none"/>
  <line x1="8" y1="8" x2="24" y2="24" stroke="#06b6d4" stroke-width="2" stroke-linecap="round"/>
</svg>
```

**Step 4: Verify both files**

Run: `cat frontend/src/app/layout.tsx && cat frontend/public/favicon.svg`
Expected: Layout has updated metadata, favicon SVG exists

**Step 5: Commit**

```bash
git add frontend/src/app/layout.tsx frontend/public/favicon.svg
git commit -m "feat: update layout metadata and add Nullscan favicon

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Update Scan Form Component with Cyan Theme

**Files:**
- Modify: `frontend/src/components/scan-form.tsx`

**Step 1: Read the existing file**

Read `frontend/src/components/scan-form.tsx` to understand current structure.

**Step 2: Update the scan form**

Replace the entire content of `frontend/src/components/scan-form.tsx` with:

```tsx
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
```

**Step 3: Verify the file was updated**

Run: `grep "accent" frontend/src/components/scan-form.tsx | head -5`
Expected: Shows references to --accent CSS variable

**Step 4: Commit**

```bash
git add frontend/src/components/scan-form.tsx
git commit -m "feat: update scan form with cyan theme styling

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Rewrite Landing Page

**Files:**
- Modify: `frontend/src/app/page.tsx`

**Step 1: Read the existing file**

Read `frontend/src/app/page.tsx` to understand current structure.

**Step 2: Replace the landing page**

Replace the entire content of `frontend/src/app/page.tsx` with:

```tsx
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
```

**Step 3: Verify the file was updated**

Run: `grep "nullscan\|accent" frontend/src/app/page.tsx | head -5`
Expected: Shows references to Nullscan components and accent color

**Step 4: Commit**

```bash
git add frontend/src/app/page.tsx
git commit -m "feat: rewrite landing page with Nullscan branding

- Split hero layout with form on right
- Cyan accent color scheme
- Updated pricing cards
- Added navbar and footer components

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Redesign Scan Status Page

**Files:**
- Modify: `frontend/src/app/scan/[id]/page.tsx`

**Step 1: Read the existing file**

Read `frontend/src/app/scan/[id]/page.tsx` to understand current structure.

**Step 2: Replace the scan status page**

Replace the entire content of `frontend/src/app/scan/[id]/page.tsx` with:

```tsx
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
```

**Step 3: Verify the file was updated**

Run: `grep "War Room\|accent\|Nullscan" frontend/src/app/scan/[id]/page.tsx | head -5`
Expected: Shows references to new styling

**Step 4: Commit**

```bash
git add "frontend/src/app/scan/[id]/page.tsx"
git commit -m "feat: redesign scan status page with war room layout

- Two-panel layout: agents left, activity right
- Cyan accent color scheme
- Enhanced agent cards with status indicators
- Terminal-style activity feed

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Rewrite Results Page with Dark Theme and Paywall

**Files:**
- Modify: `frontend/src/app/results/[id]/page.tsx`

**Step 1: Read the existing file**

Read `frontend/src/app/results/[id]/page.tsx` to understand current structure.

**Step 2: Replace the results page**

Replace the entire content of `frontend/src/app/results/[id]/page.tsx` with:

```tsx
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
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface-raised)]/80 rounded-lg">
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
```

**Step 3: Verify the file was updated**

Run: `grep "Lock\|paywall\|blur" frontend/src/app/results/[id]/page.tsx | head -5`
Expected: Shows references to Lock component and blur styling

**Step 4: Commit**

```bash
git add "frontend/src/app/results/[id]/page.tsx"
git commit -m "feat: rewrite results page with dark theme and paywall

- Dark theme with severity color bars
- Frosted blur paywall effect for locked content
- Inline unlock CTAs per finding
- Copy button for PoC code
- Zero findings state with category checklist

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Update Legal Pages with Dark Theme

**Files:**
- Modify: `frontend/src/app/scope/page.tsx`
- Modify: `frontend/src/app/terms/page.tsx`
- Modify: `frontend/src/app/privacy/page.tsx`

**Step 1: Read the existing scope page**

Read `frontend/src/app/scope/page.tsx` to understand current structure.

**Step 2: Update scope page**

Replace the entire content of `frontend/src/app/scope/page.tsx` with:

```tsx
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function ScopePage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-8">What We Test</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[var(--success)]">
            What we DO
          </h2>
          <ul className="space-y-2 text-[var(--text-secondary)]">
            <li>Scan publicly accessible URLs and endpoints</li>
            <li>
              Test for common vulnerabilities (authentication, injection, SSRF,
              etc.)
            </li>
            <li>Attempt proof-of-concept validation (non-destructive)</li>
            <li>Provide fix guidance for issues found</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[var(--severity-critical)]">
            What we DON&apos;T do
          </h2>
          <ul className="space-y-2 text-[var(--text-secondary)]">
            <li>Access anything behind authentication</li>
            <li>Perform denial-of-service attacks</li>
            <li>Brute force credentials</li>
            <li>Exfiltrate or store your application&apos;s data</li>
            <li>Social engineering</li>
            <li>Test infrastructure (servers, DNS, etc.)</li>
          </ul>
        </section>

        <p className="text-[var(--text-muted)] text-sm">
          Our scans are non-destructive and designed to identify vulnerabilities
          without causing harm to your application or its users.
        </p>
      </div>

      <Footer />
    </main>
  );
}
```

**Step 3: Read and update terms page**

Read `frontend/src/app/terms/page.tsx`, then replace with dark theme version. Apply the same pattern:
- Add `<Navbar />` at top
- Change background to `bg-[var(--bg)]`
- Change text colors to use CSS variables
- Add `<Footer />` at bottom

**Step 4: Read and update privacy page**

Read `frontend/src/app/privacy/page.tsx`, then replace with dark theme version using the same pattern.

**Step 5: Verify all three files**

Run: `grep "bg-\[var(--bg)\]" frontend/src/app/scope/page.tsx frontend/src/app/terms/page.tsx frontend/src/app/privacy/page.tsx`
Expected: All three files have dark background

**Step 6: Commit**

```bash
git add frontend/src/app/scope/page.tsx frontend/src/app/terms/page.tsx frontend/src/app/privacy/page.tsx
git commit -m "feat: update legal pages with dark theme

- Scope, Terms, Privacy pages now use dark theme
- Added navbar and footer to all pages
- Consistent styling with rest of app

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Update Backend API Title and Email Sender

**Files:**
- Modify: `backend/app/main.py`
- Modify: `backend/app/email_service.py` (if exists)

**Step 1: Read backend main.py**

Read `backend/app/main.py` to find the FastAPI title.

**Step 2: Update the API title**

Find and replace `"Argus API"` (or similar) with `"Nullscan API"`.

**Step 3: Check for email service**

Read `backend/app/email_service.py` if it exists, and replace any "Argus" references with "Nullscan".

**Step 4: Commit**

```bash
git add backend/app/main.py backend/app/email_service.py
git commit -m "chore: rename Argus to Nullscan in backend

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Rename Strix Skills File

**Files:**
- Rename: `backend/venv/Lib/site-packages/strix/skills/argus_rules.md` → `nullscan_rules.md`
- Modify: `backend/app/strix_runner.py`

**Step 1: Rename the skills file**

```bash
mv backend/venv/Lib/site-packages/strix/skills/argus_rules.md backend/venv/Lib/site-packages/strix/skills/nullscan_rules.md
```

**Step 2: Update strix_runner.py**

Read `backend/app/strix_runner.py` and replace `skills=["argus_rules"]` with `skills=["nullscan_rules"]`.

**Step 3: Update content of nullscan_rules.md**

Read the file and replace any remaining "Argus" references with "Nullscan".

**Step 4: Commit**

```bash
git add backend/app/strix_runner.py
git commit -m "chore: rename argus_rules skill to nullscan_rules

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Final Verification

**Files:**
- All modified files

**Step 1: Search for remaining Argus references**

```bash
grep -ri "argus" frontend/src/ backend/app/ --include="*.tsx" --include="*.ts" --include="*.py" --include="*.css"
```

Expected: No results (all Argus references removed)

**Step 2: Search for remaining amber/gold colors**

```bash
grep -ri "#d4a853\|amber" frontend/src/ --include="*.tsx" --include="*.ts" --include="*.css"
```

Expected: No results (all amber references replaced with cyan)

**Step 3: Start the development server**

```bash
cd frontend && npm run dev
```

**Step 4: Visual verification checklist**

Open browser and verify:
- [ ] Landing page loads with cyan accent, split hero layout
- [ ] Navbar shows nullscan logo, sticky on scroll
- [ ] Pricing cards have cyan highlight on middle tier
- [ ] Scan form submits and redirects to scan page
- [ ] Scan status page shows cyan theme, two-panel war room
- [ ] Phase indicators use cyan color
- [ ] Results page has dark theme with severity color bars
- [ ] Paywall blur effect works on free tier findings
- [ ] Legal pages (scope, terms, privacy) have dark theme

**Step 5: Create final commit with all changes**

```bash
git add -A
git status
```

If there are any uncommitted changes, commit them:

```bash
git commit -m "chore: final cleanup for Nullscan rebrand

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

This plan covers the complete rebrand from Argus to Nullscan:

1. **CSS Variables** — New color system with cyan accent
2. **Logo Component** — Null set symbol (∅) + wordmark
3. **Navbar** — Shared sticky nav with scroll effect
4. **Footer** — Shared footer with links
5. **Layout** — Updated metadata and favicon
6. **Scan Form** — Cyan theme styling
7. **Landing Page** — Split hero, updated pricing
8. **Scan Status** — Two-panel war room layout
9. **Results Page** — Dark theme with paywall blur
10. **Legal Pages** — Dark theme consistency
11. **Backend** — API title rename
12. **Strix Skills** — File rename
13. **Verification** — Final checks

Each task is self-contained with exact file paths, complete code, and verification steps.
