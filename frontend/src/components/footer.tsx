import Link from "next/link"

export function Footer() {
  return (
    <footer
      className="py-8 2xl:py-10 px-4 sm:px-6 2xl:px-12 border-t"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="max-w-6xl 2xl:max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p
          className="font-mono text-[10px] uppercase tracking-wider"
          style={{ color: "var(--text-dim)" }}
        >
          NULLSCAN 2026
        </p>
        <nav aria-label="Footer navigation" className="flex items-center gap-4 sm:gap-6 font-mono text-[10px] uppercase tracking-wider">
          <Link
            href="/blog"
            className="py-2 transition-colors hover:text-[var(--cyan)]"
            style={{ color: "var(--text-muted)" }}
          >
            Blog
          </Link>
          <Link
            href="/free-website-security-scanner"
            className="py-2 transition-colors hover:text-[var(--cyan)]"
            style={{ color: "var(--text-muted)" }}
          >
            Free Scanner
          </Link>
          <Link
            href="/what-we-test"
            className="py-2 transition-colors hover:text-[var(--cyan)]"
            style={{ color: "var(--text-muted)" }}
          >
            What We Test
          </Link>
          <Link
            href="/scope"
            className="py-2 transition-colors hover:text-[var(--cyan)]"
            style={{ color: "var(--text-muted)" }}
          >
            Scope
          </Link>
          <Link
            href="/terms"
            className="py-2 transition-colors hover:text-[var(--cyan)]"
            style={{ color: "var(--text-muted)" }}
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="py-2 transition-colors hover:text-[var(--cyan)]"
            style={{ color: "var(--text-muted)" }}
          >
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  )
}
