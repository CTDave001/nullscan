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
