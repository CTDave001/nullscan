# Nullscan SEO Reference

Reference document for AI agents and developers working on SEO for nullscan.io.

## Current SEO Setup

### Pages and Target Keywords

| Page | URL | Primary Keywords | Status |
|------|-----|-----------------|--------|
| Landing | `/` | nullscan, automated pentesting, security scanner | Live |
| Free Scanner | `/free-website-security-scanner` | free website vulnerability scanner, free security scan, scan website for vulnerabilities, online security checker | Live |
| Vibe Coding Security | `/vibe-coding-security` | vibe coding security, AI app security, lovable security, bolt security, cursor security, AI generated code vulnerabilities | Live |
| What We Test | `/what-we-test` | OWASP top 10 scanner, SQL injection scanner, XSS scanner, penetration testing tool, automated pentesting | Live |
| Scope | `/scope` | (internal/trust page) | Live |
| Terms | `/terms` | (legal) | Live |
| Privacy | `/privacy` | (legal) | Live |

### Infrastructure

| Feature | Implementation | Location |
|---------|---------------|----------|
| Sitemap | Auto-generated via Next.js `sitemap.ts` | `/sitemap.xml` |
| Robots.txt | Auto-generated via Next.js `robots.ts` | `/robots.txt` |
| LLMs.txt | Static file for AI crawler discoverability | `/llms.txt` |
| OG Image | Static PNG 1200x630 | `/og-image.png` |
| Favicon | SVG | `/favicon.svg` |

### Per-Page SEO Checklist

Every new page MUST have:

- [ ] `export const metadata: Metadata` with unique `title` and `description`
- [ ] `alternates.canonical` pointing to the full canonical URL
- [ ] `openGraph` with title, description, url, siteName, images, type
- [ ] `twitter` with card type `summary_large_image`, title, description, images
- [ ] JSON-LD structured data (at minimum FAQPage if page has FAQs)
- [ ] Single `<h1>` tag — one per page, contains primary keyword
- [ ] Heading hierarchy: h1 > h2 > h3, no skipping levels
- [ ] Internal links to other SEO pages (cross-linking section at bottom)
- [ ] CTA linking to the terminal/scanner
- [ ] Added to `sitemap.ts` with appropriate priority and changeFrequency

### Structured Data (JSON-LD)

**Sitewide (layout.tsx):**
- `Organization` — name, url, logo, description
- `WebSite` — name, url, description, SearchAction

**Per-page schemas used:**
- `FAQPage` — on any page with an FAQ section. Each Q&A must match the visible FAQ content exactly.
- `WebApplication` — on the free scanner page (product schema with pricing)
- `Article` — on the vibe coding security page (informational content)

**When to use which:**
- Product/tool pages → `WebApplication` + `FAQPage`
- Educational/blog content → `Article` + `FAQPage`
- Comparison pages → `Article` + `FAQPage`
- Landing pages → `WebSite` (already sitewide) + page-specific as needed

### Metadata Patterns

**Title format:** `Primary Keyword | Secondary Context — Nullscan`
- Keep under 60 characters
- Put the most important keyword first
- Brand name at the end

**Description format:**
- Keep between 150-160 characters
- Include primary keyword naturally
- Include a call to action ("Free scan", "No signup")
- Make it compelling to click

**Examples:**
```
Title: "Free Website Security Scanner | Nullscan — AI-Powered Vulnerability Testing"
Desc: "Scan your website for vulnerabilities for free. Nullscan uses AI agents to run real penetration tests — SQL injection, XSS, auth bypass, and more. No signup."
```

### URL Structure

- Use lowercase, hyphenated slugs: `/free-website-security-scanner`
- Keep URLs descriptive and keyword-rich
- No trailing slashes
- No query parameters for content pages
- Dynamic pages (`/scan/[id]`, `/results/[id]`) are blocked from crawlers via robots.txt

### Internal Linking Strategy

Every SEO page should link to:
1. At least 2 other SEO pages (cross-links section at page bottom)
2. The main landing page / terminal CTA
3. The `/scope` page where relevant (builds trust)

The landing page should link to all SEO pages from relevant sections.

### Content Guidelines

**Heading usage:**
- H1: One per page, contains primary keyword. Example: "Free Website Security Scanner"
- H2: Section headings, contain secondary keywords. Example: "What the Scanner Tests For"
- H3: Subsection headings. Example: "SQL Injection"

**Keyword density:**
- Primary keyword: 3-5 times per page naturally
- Secondary keywords: 1-3 times each
- Never stuff keywords — if it reads awkwardly, rewrite it

**Content length:**
- SEO pages: 1000-2000 words of visible content
- FAQ sections: 5-7 questions minimum, answers 2-4 sentences each
- Keep paragraphs short (2-3 sentences max)

**Images:**
- Always include `alt` text with keyword when relevant
- Use descriptive filenames: `security-scan-results.png` not `img1.png`
- Optimize file size (WebP preferred, PNG acceptable)

### FAQ Best Practices

- FAQ content in JSON-LD MUST exactly match visible FAQ content on the page
- Use `<details>` / `<summary>` for collapsible FAQ (already implemented)
- Questions should match how people actually search: "Is the security scan really free?" not "Pricing information"
- Answers should be comprehensive but concise (2-4 sentences)
- FAQs are a strong source of featured snippets — write answers that directly answer the question in the first sentence

### robots.txt Rules

```
Allow: / (all public pages)
Disallow: /scan/ (private user scan sessions)
Disallow: /results/ (private user results)
Sitemap: https://nullscan.io/sitemap.xml
```

### LLMs.txt

Located at `/llms.txt`. This is a plain-text file that describes the product for AI crawlers (ChatGPT, Perplexity, Claude, etc.). Update this when:
- New features are added
- Pricing changes
- New pages are created
- Product description changes

### Performance (SEO-Relevant)

- Next.js handles code splitting, static generation, and asset optimization automatically
- Vercel/Railway provides Gzip/Brotli compression and CDN caching
- SEO pages are statically generated at build time (no server-side rendering delay)
- Core Web Vitals: monitor with Google PageSpeed Insights after deploy
- Keep client-side JavaScript minimal on SEO pages — use server components where possible

### Monitoring and Verification

After deploying new SEO pages:

1. **Google Search Console** — submit sitemap, request indexing for new pages
2. **OG Preview** — test with https://opengraph.xyz or Facebook Sharing Debugger
3. **Structured Data** — validate with https://search.google.com/test/rich-results
4. **PageSpeed** — test with https://pagespeed.web.dev
5. **Mobile** — verify responsive layout on phone-width viewport

### Future SEO Opportunities

Potential pages to build when the time is right:

| Keyword Target | Suggested URL | Priority |
|---------------|---------------|----------|
| "SOC 2 security testing" | `/soc2-security-scan` | High |
| "how to pentest a web app" | `/how-to-pentest-web-app` | Medium |
| "website security checklist" | `/security-checklist` | Medium |
| "[competitor] alternative" | `/alternative-to-[name]` | Medium |
| "security for startups" | `/startup-security` | Medium |
| "AI code security risks" | `/ai-code-security-risks` | Low |
| "automated vs manual pentesting" | `/automated-vs-manual-pentesting` | Low |

### Conventions for This Codebase

- SEO pages live in `frontend/src/app/[slug]/page.tsx`
- Pages are server components (no `"use client"` at top) to support metadata exports
- Client components (TerminalInput, Navbar, etc.) are imported as child components
- All pages use the shared Navbar and Footer components
- Styling uses CSS variables from `globals.css` via inline styles and Tailwind
- The `TerminalInput` component is the primary CTA — include it on every SEO page
