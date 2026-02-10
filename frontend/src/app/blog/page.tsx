import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { blogPosts } from "@/lib/blog"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Blog — Security Insights for AI-Built Apps | Nullscan",
  description:
    "Security research, vulnerability analysis, and practical advice for developers building with AI coding tools. Learn how to find and fix security issues in vibe coded apps.",
  alternates: {
    canonical: "https://nullscan.io/blog",
  },
  openGraph: {
    title: "Blog — Security Insights for AI-Built Apps | Nullscan",
    description:
      "Security research and practical advice for developers building with AI coding tools.",
    url: "https://nullscan.io/blog",
    siteName: "Nullscan",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Nullscan",
    description:
      "Security research and practical advice for developers building with AI coding tools.",
    images: ["/og-image.png"],
  },
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://nullscan.io",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Blog",
      item: "https://nullscan.io/blog",
    },
  ],
}

const categoryColors: Record<string, string> = {
  Research: "var(--cyan)",
  Security: "var(--high)",
  Opinion: "var(--medium)",
}

export default function BlogListingPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Navbar />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 lg:pt-36 pb-8">
        <p
          className="font-mono text-xs uppercase tracking-widest mb-4"
          style={{ color: "var(--cyan)" }}
        >
          Blog
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          Security Insights
        </h1>
        <p
          className="text-base max-w-xl"
          style={{ color: "var(--text-secondary)" }}
        >
          Research, analysis, and practical advice on securing web applications
          built with AI coding tools.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="space-y-6">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block p-6 rounded-lg transition-all hover:border-[var(--cyan)]"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${categoryColors[post.category] || "var(--cyan)"}20`,
                    color: categoryColors[post.category] || "var(--cyan)",
                  }}
                >
                  {post.category}
                </span>
                <span
                  className="text-[10px] font-mono uppercase"
                  style={{ color: "var(--text-dim)" }}
                >
                  {new Date(post.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--text-dim)" }}
                >
                  {post.readingTime}
                </span>
              </div>
              <h2 className="text-lg font-semibold mb-2 group-hover:text-[var(--cyan)] transition-colors">
                {post.title}
              </h2>
              <p
                className="text-sm leading-relaxed mb-4"
                style={{ color: "var(--text-muted)" }}
              >
                {post.description}
              </p>
              <span
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-colors group-hover:text-[var(--cyan)]"
                style={{ color: "var(--text-dim)" }}
              >
                Read more
                <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Internal Links */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <a href="/free-website-security-scanner" className="underline" style={{ color: "var(--text-muted)" }}>
            Free Security Scanner
          </a>
          <a href="/vibe-coding-security" className="underline" style={{ color: "var(--text-muted)" }}>
            AI App Security
          </a>
          <a href="/what-we-test" className="underline" style={{ color: "var(--text-muted)" }}>
            What We Test
          </a>
        </div>
      </section>

      <Footer />
    </main>
  )
}
