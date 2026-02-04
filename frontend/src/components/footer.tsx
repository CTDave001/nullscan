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
