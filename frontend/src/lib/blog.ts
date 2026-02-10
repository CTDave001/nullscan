export interface BlogSection {
  heading?: string
  paragraphs: string[]
  list?: string[]
}

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  readingTime: string
  category: string
  sections: BlogSection[]
  cta?: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: "we-scanned-10-ai-built-apps",
    title: "We Scanned 10 AI-Built Apps — Here's What We Found",
    description:
      "We ran automated penetration tests against 10 web apps built with AI coding tools. Every single one had at least one vulnerability. Here are the most common issues.",
    date: "2026-02-10",
    readingTime: "5 min read",
    category: "Research",
    sections: [
      {
        paragraphs: [
          "AI coding tools have made it easier than ever to build and ship web applications. Tools like Cursor, Lovable, Bolt, and v0 can take a rough idea and turn it into a working app in hours. But there's a question nobody seems to be asking: are these apps secure?",
          "We decided to find out. We ran Nullscan against 10 web applications built entirely or primarily with AI coding tools. The results were concerning.",
        ],
      },
      {
        heading: "The Setup",
        paragraphs: [
          "We selected 10 publicly available web applications that were explicitly described by their creators as \"vibe coded\" or \"built with AI.\" These were real products — SaaS tools, marketplaces, dashboards, and internal tools — built with a range of AI coding assistants.",
          "Each app was scanned using Nullscan's free tier, which runs 50 iterations of AI-powered penetration testing. We tested for SQL injection, XSS, authentication bypass, SSRF, IDOR, path traversal, rate limiting, and security header configuration.",
        ],
      },
      {
        heading: "The Results",
        paragraphs: [
          "Every single app had at least one vulnerability. Most had several. Here's the breakdown of what we found across all 10 applications:",
        ],
        list: [
          "8 out of 10 had missing or misconfigured security headers (no CSP, no HSTS, missing X-Frame-Options)",
          "7 out of 10 had no rate limiting on authentication endpoints",
          "6 out of 10 had at least one input validation issue (potential injection vectors)",
          "4 out of 10 had endpoints that should have required authentication but didn't",
          "3 out of 10 had potential IDOR vulnerabilities where user resources could be accessed by manipulating IDs",
          "2 out of 10 had SSRF-like behavior where the server could be tricked into making internal requests",
        ],
      },
      {
        heading: "Missing Security Headers Was Universal",
        paragraphs: [
          "The most common issue by far was missing security headers. This isn't surprising — AI coding tools focus on making features work, and security headers are a defensive measure that doesn't affect functionality. Your app works perfectly fine without them, but it's vulnerable to clickjacking, MIME sniffing attacks, and protocol downgrades.",
          "Most of the apps we tested had no Content-Security-Policy header at all. This means any XSS vulnerability becomes significantly more dangerous because there's no browser-level protection limiting what malicious scripts can do.",
        ],
      },
      {
        heading: "No Rate Limiting Is a Ticking Time Bomb",
        paragraphs: [
          "Seven of the ten apps had no rate limiting on their login or password reset endpoints. This means an attacker could attempt thousands of password combinations per minute without being blocked.",
          "Rate limiting is one of those things that's easy to forget because it doesn't affect normal usage. Your app works fine when one person logs in. It becomes a problem when someone writes a script that tries 10,000 passwords in an hour.",
        ],
      },
      {
        heading: "Authentication Gaps",
        paragraphs: [
          "Four apps had API endpoints that returned data without verifying the user was authenticated. In most cases, these were admin or settings endpoints that the AI had generated but hadn't properly protected. The routes existed, the functionality worked, but anyone who knew the URL could access them.",
          "This is a pattern we see often with AI-generated code. The AI builds the feature and the route, but doesn't always think about who should be allowed to access it.",
        ],
      },
      {
        heading: "Why This Happens",
        paragraphs: [
          "AI coding tools are optimized for one thing: making your feature work. When you ask an AI to build a login system, it builds a login system. It probably doesn't add rate limiting, brute force protection, or account lockout because you didn't ask for those things.",
          "Security isn't a feature — it's a property of how features are built. And that distinction is something AI tools don't naturally handle well.",
          "This doesn't mean you shouldn't use AI tools. They're incredibly productive. But it does mean you should test the security of what they produce, the same way you'd test any code before shipping it to real users.",
        ],
      },
      {
        heading: "What You Should Do",
        paragraphs: [
          "If you've built an app with AI tools and shipped it without a security review, you should scan it. Not because your app is definitely vulnerable, but because the odds are high that it has at least one issue worth fixing.",
          "Nullscan offers a free scan that checks for all the issues described in this article. It takes a few minutes and doesn't require any setup — just paste your URL.",
        ],
      },
    ],
    cta: "Scan your app for free at nullscan.io",
  },
  {
    slug: "common-vulnerabilities-vibe-coded-apps",
    title: "The Most Common Vulnerabilities in Vibe Coded Apps",
    description:
      "A breakdown of the security issues that show up most often in apps built with AI coding tools — and why AI keeps making the same mistakes.",
    date: "2026-02-08",
    readingTime: "6 min read",
    category: "Security",
    sections: [
      {
        paragraphs: [
          "\"Vibe coding\" has become the shorthand for building applications with AI assistance — describing what you want in natural language and letting tools like Cursor, Lovable, Bolt, or v0 generate the code. It's fast, it's accessible, and it's producing a wave of new applications from people who couldn't build them before.",
          "But it's also producing a wave of security vulnerabilities. Not because the tools are bad, but because security requires a mindset that AI coding assistants don't have.",
        ],
      },
      {
        heading: "SQL Injection: Still the Classic",
        paragraphs: [
          "SQL injection has been on the OWASP Top 10 for over two decades, and AI-generated code still produces it. The issue typically shows up when AI writes database queries using string concatenation instead of parameterized queries.",
          "Modern ORMs like Prisma, SQLAlchemy, and Drizzle generally protect against this, but AI tools sometimes bypass the ORM for complex queries or use raw SQL when the ORM doesn't support what's needed. Those raw queries are often vulnerable.",
          "The fix is straightforward — always use parameterized queries or your ORM's query builder. But the point is that AI doesn't always default to the safe approach.",
        ],
      },
      {
        heading: "Cross-Site Scripting (XSS)",
        paragraphs: [
          "XSS vulnerabilities appear when user input is rendered in the browser without proper sanitization. Modern frameworks like React and Next.js provide built-in XSS protection through JSX escaping, but there are common ways AI-generated code bypasses these protections.",
          "The most frequent pattern: using dangerouslySetInnerHTML (React) or v-html (Vue) to render user-generated content. AI tools reach for these when asked to display formatted text, markdown content, or HTML from an API. Each usage is a potential XSS vector if the content isn't sanitized server-side.",
        ],
      },
      {
        heading: "Broken Authentication",
        paragraphs: [
          "AI tools can set up authentication flows quickly — login pages, JWT tokens, session management. What they often miss is the security around those flows:",
        ],
        list: [
          "No rate limiting on login attempts, allowing brute force attacks",
          "Password reset tokens that don't expire or can be reused",
          "Session tokens stored in localStorage instead of httpOnly cookies",
          "Missing CSRF protection on state-changing requests",
          "JWT tokens with overly long expiration times",
          "No account lockout after repeated failed attempts",
        ],
      },
      {
        heading: "Insecure Direct Object References (IDOR)",
        paragraphs: [
          "IDOR is one of the most common vulnerabilities in AI-built apps because it requires understanding authorization context that AI often doesn't have.",
          "Here's the typical pattern: AI generates a REST API with endpoints like /api/users/123/settings. It correctly fetches and returns the data for user 123. But it doesn't check whether the currently authenticated user IS user 123. Any logged-in user can access any other user's settings by changing the ID.",
          "This happens because AI implements the happy path — getting the right data for the right ID — without implementing the security check of verifying the requester has permission to access that data.",
        ],
      },
      {
        heading: "Missing Security Headers",
        paragraphs: [
          "This is the single most common issue we see. AI-generated applications almost never include security headers because headers don't affect functionality. Your app works identically with or without them.",
          "But security headers are your browser-level defense layer. Content-Security-Policy prevents XSS from executing. HSTS forces HTTPS connections. X-Frame-Options prevents clickjacking. Without them, every other vulnerability becomes easier to exploit.",
        ],
      },
      {
        heading: "Server-Side Request Forgery (SSRF)",
        paragraphs: [
          "SSRF shows up in AI-built apps that accept URLs as input — for features like link previews, image imports, webhook configurations, or PDF generation. AI implements the feature (fetch this URL and return the content) without implementing the protection (validate that the URL points to a public resource, not an internal service).",
          "In cloud environments, SSRF can be particularly dangerous because it can be used to access cloud metadata endpoints that contain credentials and configuration data.",
        ],
      },
      {
        heading: "The Pattern",
        paragraphs: [
          "Every vulnerability on this list follows the same pattern: AI builds the feature correctly but doesn't build the security around it. It implements what you asked for without considering what an attacker might ask for.",
          "This isn't a limitation that will be fixed soon. Security requires adversarial thinking — imagining how someone would misuse a feature — and that's fundamentally different from the generative approach AI tools take.",
          "The solution isn't to stop using AI tools. It's to test what they produce. Automated security scanning catches the vast majority of these issues in minutes.",
        ],
      },
    ],
    cta: "Check your app for these vulnerabilities — free scan at nullscan.io",
  },
  {
    slug: "why-ai-coding-tools-ignore-security",
    title: "Why AI Coding Tools Don't Care About Security",
    description:
      "AI coding assistants optimize for working features, not secure features. Here's why that's a problem and what to do about it.",
    date: "2026-02-06",
    readingTime: "4 min read",
    category: "Opinion",
    sections: [
      {
        paragraphs: [
          "If you've used an AI coding tool to build an application, you've probably been impressed by how fast it works. Describe what you want, and in minutes you have a working feature. But there's something these tools consistently get wrong, and it's not a bug — it's a fundamental limitation of how they work.",
          "AI coding tools don't care about security. Not because their creators forgot to include it, but because the way these tools are designed makes security an afterthought by default.",
        ],
      },
      {
        heading: "The Optimization Problem",
        paragraphs: [
          "AI coding assistants are trained to generate code that works. Their success metric is: does this code do what the user asked for? If you ask for a login form, you get a login form that logs people in. If you ask for an API endpoint, you get an endpoint that returns data.",
          "Security is a different kind of requirement. It's not about what the code does — it's about what the code doesn't allow. A secure login form doesn't just log people in. It also prevents brute force attacks, uses secure session management, implements CSRF protection, and rate limits requests. None of those things are necessary for the login form to \"work.\"",
          "When an AI tool generates code, it optimizes for the positive case (this feature works) and rarely considers the negative case (this feature can't be abused). That gap is where vulnerabilities live.",
        ],
      },
      {
        heading: "You Don't Ask for Security",
        paragraphs: [
          "Part of the problem is how we interact with AI tools. Nobody types \"build me a login form with brute force protection, account lockout after 5 failed attempts, rate limiting at 10 requests per minute per IP, httpOnly secure session cookies, CSRF tokens on the form, and input sanitization on all fields.\"",
          "People type \"build me a login form.\" And the AI delivers exactly what was asked for — a login form. The security requirements are implicit knowledge that experienced developers carry in their heads. AI tools don't have that implicit knowledge unless you explicitly provide it.",
        ],
      },
      {
        heading: "Context Window vs. Codebase Knowledge",
        paragraphs: [
          "Human developers who care about security think about the entire application when they write a feature. They know that the user settings endpoint needs authorization because they built the auth system last week. They know the file upload feature needs validation because they've seen SSRF attacks before.",
          "AI tools work within a context window. They see the current file, maybe a few related files, and the conversation history. They don't have a holistic understanding of your application's security posture. Each feature is generated somewhat in isolation, which means security checks that should be consistent across the entire application are often inconsistent or missing.",
        ],
      },
      {
        heading: "The Speed Trap",
        paragraphs: [
          "The speed of AI coding tools creates its own security problem. When you can go from idea to deployed app in a day, the pressure to ship overwhelms any instinct to pause and review. Traditional development timelines had natural checkpoints — code reviews, QA cycles, staging environments — where security issues could be caught.",
          "Vibe coding compresses that timeline to near zero. You build it, it works, you ship it. The gap between \"it works\" and \"it's secure\" never gets addressed because there's no point in the process where someone stops to check.",
        ],
      },
      {
        heading: "This Won't Fix Itself",
        paragraphs: [
          "AI tools will get better at security over time, but the fundamental tension won't go away. These tools are designed to build what you ask for as quickly as possible. Security requires slowing down and thinking about what could go wrong. Those are opposing forces.",
          "The practical solution is to accept AI tools for what they're good at — fast feature development — and add a security check to your workflow. The same way you'd test any code before shipping it, test the security of AI-generated code before putting it in front of real users.",
          "An automated security scan takes minutes and catches the most common issues. It's not a replacement for a full security audit, but it's the minimum responsible step before shipping an app that handles real user data.",
        ],
      },
    ],
    cta: "Scan your AI-built app for free at nullscan.io",
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug)
}

export function getAllSlugs(): string[] {
  return blogPosts.map((post) => post.slug)
}
