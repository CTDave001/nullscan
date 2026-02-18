import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TerminalInput } from "@/components/terminal-input"
import { blogPosts, getPostBySlug, getAllSlugs } from "@/lib/blog"
import { ArrowLeft, ArrowRight } from "lucide-react"

export const revalidate = 86400

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title: `${post.title} | Nullscan Blog`,
    description: post.description,
    alternates: {
      canonical: `https://nullscan.io/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://nullscan.io/blog/${post.slug}`,
      siteName: "Nullscan",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
      type: "article",
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: ["/og-image.png"],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const currentIndex = blogPosts.findIndex((p) => p.slug === slug)
  const prevPost = currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null
  const nextPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null

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
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://nullscan.io/blog/${post.slug}`,
      },
    ],
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: "Nullscan",
      url: "https://nullscan.io",
    },
    publisher: {
      "@type": "Organization",
      name: "Nullscan",
      url: "https://nullscan.io",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://nullscan.io/blog/${post.slug}`,
    },
  }

  const categoryColors: Record<string, string> = {
    Research: "var(--cyan)",
    Security: "var(--high)",
    Opinion: "var(--medium)",
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <Navbar />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 lg:pt-36 pb-16">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-xs font-mono" style={{ color: "var(--text-dim)" }}>
            <li>
              <Link href="/" className="hover:text-[var(--cyan)] transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/blog" className="hover:text-[var(--cyan)] transition-colors">
                Blog
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li style={{ color: "var(--text-muted)" }}>{post.title}</li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
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
                month: "long",
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-4">
            {post.title}
          </h1>
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {post.description}
          </p>
        </header>

        {/* Content */}
        <div className="space-y-8">
          {post.sections.map((section, i) => (
            <section key={i}>
              {section.heading && (
                <h2 className="text-xl font-bold mb-4">{section.heading}</h2>
              )}
              {section.paragraphs.map((paragraph, j) => (
                <p
                  key={j}
                  className="text-sm sm:text-base leading-relaxed mb-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="space-y-2 mb-4 ml-4">
                  {section.list.map((item, k) => (
                    <li
                      key={k}
                      className="text-sm leading-relaxed flex items-start gap-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--cyan)" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {section.code && (
                <pre
                  className="rounded-lg p-4 mb-4 overflow-x-auto text-xs sm:text-sm leading-relaxed font-mono"
                  style={{
                    backgroundColor: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <code>{section.code}</code>
                </pre>
              )}
            </section>
          ))}
        </div>

        {/* CTA */}
        {post.cta && (
          <div
            className="mt-12 p-6 rounded-lg text-center"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--cyan)",
              boxShadow: "0 0 40px var(--cyan-glow)",
            }}
          >
            <p className="font-semibold mb-4">{post.cta}</p>
            <div className="max-w-2xl mx-auto">
              <TerminalInput />
            </div>
          </div>
        )}

        {/* Post Navigation */}
        <nav aria-label="Blog post navigation" className="mt-12 pt-8 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-stretch gap-4">
            {prevPost ? (
              <Link
                href={`/blog/${prevPost.slug}`}
                className="flex-1 p-4 rounded-lg transition-all hover:border-[var(--cyan)] group"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <span className="flex items-center gap-1 text-[10px] font-mono uppercase mb-2" style={{ color: "var(--text-dim)" }}>
                  <ArrowLeft className="w-3 h-3" />
                  Previous
                </span>
                <span className="text-sm font-semibold group-hover:text-[var(--cyan)] transition-colors">
                  {prevPost.title}
                </span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {nextPost ? (
              <Link
                href={`/blog/${nextPost.slug}`}
                className="flex-1 p-4 rounded-lg transition-all hover:border-[var(--cyan)] text-right group"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <span className="flex items-center justify-end gap-1 text-[10px] font-mono uppercase mb-2" style={{ color: "var(--text-dim)" }}>
                  Next
                  <ArrowRight className="w-3 h-3" />
                </span>
                <span className="text-sm font-semibold group-hover:text-[var(--cyan)] transition-colors">
                  {nextPost.title}
                </span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </nav>
      </article>

      <Footer />
    </main>
  )
}
