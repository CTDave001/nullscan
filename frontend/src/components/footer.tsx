import Link from "next/link"

export function Footer() {
  return (
    <footer
      className="py-8 2xl:py-10 px-6 2xl:px-12 border-t"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="max-w-6xl 2xl:max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p
          className="font-mono text-[10px] uppercase tracking-wider"
          style={{ color: "var(--text-dim)" }}
        >
          NULLSCAN 2026
        </p>
        <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-wider">
          <Link
            href="/scope"
            className="transition-colors hover:text-[var(--cyan)]"
            style={{ color: "var(--text-muted)" }}
          >
            Scope
          </Link>
          <Link
            href="/terms"
            className="transition-colors hover:text-[var(--cyan)]"
            style={{ color: "var(--text-muted)" }}
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="transition-colors hover:text-[var(--cyan)]"
            style={{ color: "var(--text-muted)" }}
          >
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}
