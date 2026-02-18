export interface BlogSection {
  heading?: string
  paragraphs: string[]
  list?: string[]
  code?: string
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

const allBlogPosts: BlogPost[] = [
  // ── Bottom of funnel ──────────────────────────────────────────────
  {
    slug: "cost-of-security-breach-startups",
    title: "What a Data Breach Actually Costs a Startup (Real Numbers)",
    description:
      "IBM says the average breach costs $3.3M for companies under 500 employees. Here's the real breakdown — incident response, legal, churn, and the hidden costs that kill startups.",
    date: "2026-06-02",
    readingTime: "6 min read",
    category: "Opinion",
    sections: [
      {
        paragraphs: [
          "Every founder thinks it won't happen to them. The app is too small, there's nothing worth stealing, hackers go after big companies. Then it happens, and the bill is nothing like what they expected.",
          "IBM's 2024 Cost of a Data Breach Report puts the average at $4.88 million globally. For companies under 500 employees, it's $3.31 million. CNBC reports the average for small businesses specifically at around $200,000. But whatever number you pick, it masks what actually happens to a startup after a breach.",
        ],
      },
      {
        heading: "The Immediate Costs",
        paragraphs: [
          "The moment you discover a breach, the clock starts. Your first expense is incident response — figuring out what happened, how bad it is, and how to stop it. If you don't have a security team (most startups don't), you're hiring one at emergency rates. Expect $300-500 per hour for a competent incident response firm, with most engagements running $15,000 to $50,000.",
          "Then there's the downtime. While your team investigates and patches, your product is either offline or running in a compromised state. For a SaaS startup doing $50K in monthly recurring revenue, every day of downtime costs roughly $1,600 in direct lost revenue. But the real cost is the customers who cancel during the outage and don't come back.",
        ],
      },
      {
        heading: "Legal and Compliance",
        paragraphs: [
          "If you handle user data (and you almost certainly do), a breach triggers legal obligations. GDPR requires notification within 72 hours. US state laws vary but most require disclosure. You'll need a lawyer experienced in data breach notification — that's $5,000 to $20,000 minimum.",
          "If you're found to have been negligent — no encryption, no access controls, known vulnerabilities left unpatched — fines follow. GDPR fines can reach 4% of annual revenue. California's CCPA allows statutory damages of $100-750 per consumer per incident. For a startup with 10,000 users, that math gets devastating fast.",
        ],
      },
      {
        heading: "Customer Churn",
        paragraphs: [
          "The Identity Theft Resource Center's 2024 report found that cyberattacks are forcing small businesses to raise prices just to cover recovery costs — which accelerates customer loss further. For a startup still building its reputation, there's no brand loyalty to fall back on.",
          "The often-cited statistic is that 60% of small businesses close within six months of a cyberattack. Even if that number is debated, the directional truth is clear: startups operate on thin margins, and a breach consumes the two things you can't afford to lose — engineering time and customer trust.",
        ],
      },
      {
        heading: "The Hidden Costs Nobody Invoices",
        paragraphs: [
          "The costs that actually kill startups aren't on any invoice. It's the three months your engineering team spends on security remediation instead of building features. It's the Series A that falls through because investors see the breach in due diligence. It's the enterprise contract that requires a SOC 2 report you now can't pass.",
          "The competitive damage is the worst. While you're patching and apologizing, your competitor is shipping the features you had planned. In fast-moving markets, a three-month engineering detour can be fatal.",
        ],
      },
      {
        heading: "The Real Math",
        paragraphs: [
          "A realistic cost range for a startup breach, based on published data from IBM, the Ponemon Institute, and the ITRC:",
        ],
        list: [
          "Incident response and forensics: $15,000-50,000 (IBM, Ponemon)",
          "Legal counsel and breach notifications: $5,000-20,000",
          "Customer credit monitoring (if required): $10-30 per affected user",
          "Regulatory fines: varies wildly — $0 to catastrophic",
          "Product downtime and engineering diversion: 2-5 months of lost velocity",
          "Customer churn and reputational damage: the real killer, hard to quantify",
        ],
      },
      {
        heading: "Prevention Is Orders of Magnitude Cheaper",
        paragraphs: [
          "A security scan takes minutes. Fixing the vulnerabilities it finds takes hours, not months. The asymmetry between prevention and remediation is massive — you're comparing a few hours of proactive work to months of reactive crisis management.",
          "You don't need to become a security expert. You need to check before you ship, the same way you'd test any code before putting it in front of real users.",
        ],
      },
    ],
    cta: "3 minutes to scan. 3 months to recover from a breach. Start free at nullscan.io",
  },
  {
    slug: "how-to-pentest-your-web-app",
    title: "How to Pentest Your Own Web App Without Being a Security Expert",
    description:
      "You don't need to be a hacker to test your app's security. A practical guide to finding real vulnerabilities using free tools and your browser's dev tools.",
    date: "2026-05-19",
    readingTime: "7 min read",
    category: "Security",
    sections: [
      {
        paragraphs: [
          "Penetration testing sounds intimidating. The word itself conjures images of hooded hackers in dark rooms running arcane terminal commands. But the reality is that most web application vulnerabilities are found through systematic checking, not genius-level hacking.",
          "You built the app. You know how it works, what endpoints exist, and what data it handles. That actually puts you in a better position than an outside auditor. Here's how to do a meaningful security check using free tools and your browser.",
        ],
      },
      {
        heading: "The Tools (All Free)",
        paragraphs: [
          "You don't need expensive security software. Here's what you'll use:",
        ],
        list: [
          "Your browser's Developer Tools — already installed, covers 60% of what you need",
          "OWASP ZAP (zaproxy.org) — free, open-source scanner that automates common checks. One-click \"Automated Scan\" mode for beginners",
          "Burp Suite Community Edition (free) — proxy tool for intercepting and replaying requests. More hands-on than ZAP but more flexible",
          "curl or Postman — for manually testing API endpoints outside the browser",
        ],
      },
      {
        heading: "Step 1: Map Your Attack Surface",
        paragraphs: [
          "Before testing anything, list every way someone can interact with your application. Open your browser's dev tools, click through your entire app, and watch the Network tab. Write down every API call, every query parameter, every form submission.",
          "If you want to automate this, OWASP ZAP has a \"Spider\" feature — point it at your URL and it crawls through every page and link it can find, building a site map automatically. This catches endpoints you might forget about.",
        ],
      },
      {
        heading: "Step 2: Check Your Security Headers",
        paragraphs: [
          "Open dev tools, go to the Network tab, click on your main page request, and look at the Response Headers. You're looking for:",
        ],
        list: [
          "Content-Security-Policy — tells the browser what resources are allowed to load",
          "Strict-Transport-Security — forces HTTPS connections",
          "X-Content-Type-Options — prevents MIME type sniffing",
          "X-Frame-Options — prevents clickjacking via iframes",
          "Referrer-Policy — controls what information leaks in the Referer header",
        ],
      },
      {
        heading: "Step 3: Test Authentication",
        paragraphs: [
          "Use curl or Postman to send 50 login requests with wrong passwords in rapid succession. Does the server slow you down, return a 429 status, or lock the account? If it keeps returning 401 at the same speed, you have no brute force protection.",
          "Check how your session tokens work. In dev tools, go to Application > Cookies. Are your session cookies marked httpOnly (good — JavaScript can't steal them) or are tokens in localStorage (any XSS vulnerability can exfiltrate them)? Do they have the Secure flag? A SameSite attribute?",
        ],
      },
      {
        heading: "Step 4: Test Authorization (Where Most Apps Fail)",
        paragraphs: [
          "This is the most important test and the one AI-built apps fail most often. Create two user accounts. Log in as User A, open dev tools, and find an API request that returns User A's data. Copy that request as a curl command (right-click > Copy > Copy as cURL).",
          "Now log in as User B in an incognito window. Get User B's session cookie. Replace the cookie in the curl command you copied and run it. If it still returns User A's data, you have an IDOR vulnerability. Repeat this for every endpoint that serves user-specific data.",
        ],
      },
      {
        heading: "Step 5: Check for Information Disclosure",
        paragraphs: [
          "Try accessing paths that shouldn't be public: /.env, /.git/config, /api/debug, /admin, /graphql (which often has introspection enabled by default). Use curl to check response codes — a 200 on any of these is a problem.",
          "Look at your API responses. Are they returning more data than the frontend displays? A common pattern in AI-built apps: the API returns the full user object (including email, internal IDs, sometimes even hashed passwords) even though the frontend only shows the username. Check the Network tab for every API response.",
        ],
      },
      {
        heading: "Step 6: Run an Automated Scan",
        paragraphs: [
          "Manual testing catches business logic issues that automated tools miss. But automated scanners catch the broad, systematic issues — missing headers, known vulnerability patterns, exposed endpoints — faster and more thoroughly than manual testing ever could.",
          "The best approach is both: run an automated scan to catch everything systematic, then manually test the authorization and business logic that's specific to your application.",
        ],
      },
    ],
    cta: "Skip the setup — scan your app automatically at nullscan.io",
  },

  // ── Mid funnel ────────────────────────────────────────────────────
  {
    slug: "ai-app-builders-security",
    title: "Lovable, Bolt, v0: What Security Research Reveals About AI App Builders",
    description:
      "CVE-2025-48757 exposed 170+ Lovable apps. OX Security found Bolt's scanner misses vulnerabilities entirely. Here's what published research says about AI app builder security.",
    date: "2026-05-05",
    readingTime: "9 min read",
    category: "Research",
    sections: [
      {
        paragraphs: [
          "AI app builders promise to turn ideas into working applications in minutes. Lovable, Bolt, and v0 are three of the most popular platforms. But a growing body of security research — from independent researchers, security companies, and the platforms themselves — is revealing consistent patterns in how these tools handle (or don't handle) security.",
          "This isn't speculation. There are published CVEs, peer-reviewed analyses, and documented incidents. Here's what the research shows.",
        ],
      },
      {
        heading: "Lovable: CVE-2025-48757 and the RLS Problem",
        paragraphs: [
          "In 2025, security researchers from Superblocks discovered that Lovable-generated applications had a systematic row-level security (RLS) misconfiguration in their Supabase databases. The vulnerability, assigned CVE-2025-48757, exposed over 170 companies and their applications.",
          "The issue: Lovable generated functional Supabase integrations but didn't properly configure RLS policies. Unauthenticated attackers could read and write to the databases of affected apps — full access to user data, application state, everything. The vulnerability wasn't in one app; it was in the pattern Lovable used to generate database configurations.",
          "Cybernews reported that Lovable's built-in security scan — the one that runs before publishing — only catches vulnerabilities 66% of the time. That means a third of security issues ship to production even when developers use the platform's own safety checks.",
        ],
      },
      {
        heading: "Bolt: The Scanner That Missed",
        paragraphs: [
          "OX Security published a whitepaper in 2025 testing AI app builders (Lovable, Base44, and Bolt) by generating applications and then running security assessments against them. Their finding on Bolt was stark: Bolt's built-in security scanner failed to identify vulnerabilities that OX's testing found.",
          "This is a critical distinction. It's not just that Bolt generates code with vulnerabilities — all AI builders do. It's that Bolt's own security checks don't catch the issues, giving developers false confidence that their app has been reviewed.",
        ],
      },
      {
        heading: "The Shared Patterns Across All Three",
        paragraphs: [
          "Across the published research, the same categories of vulnerability appear regardless of which platform generated the code:",
        ],
        list: [
          "No security headers — none of the platforms add CSP, HSTS, or X-Frame-Options by default",
          "Missing server-side authorization — APIs return data based on resource ID without checking the requesting user's permissions",
          "Client-side-only validation — form validation exists in the UI but the API accepts anything",
          "No rate limiting — authentication endpoints accept unlimited requests",
          "Over-permissive database access — the pattern behind CVE-2025-48757 isn't unique to Lovable; it's how AI tools approach database configuration generally",
        ],
      },
      {
        heading: "Why Platform Security Scans Aren't Enough",
        paragraphs: [
          "Both Lovable and Bolt offer built-in security checks. The research shows these aren't reliable. Lovable's catches 66% of issues. Bolt's missed vulnerabilities entirely in OX's testing. These scans check for surface-level issues but don't perform the kind of deep testing that catches authorization flaws, business logic issues, or configuration problems.",
          "The platforms are improving — Lovable patched the RLS issue after disclosure, and all three platforms have been updating their security defaults. But the fundamental tension remains: these tools optimize for speed and functionality, not security.",
        ],
      },
      {
        heading: "What This Means If You're Building with These Tools",
        paragraphs: [
          "None of this means you shouldn't use AI app builders. The vulnerabilities they produce are predictable, well-documented, and testable. The research consistently shows the same categories of issues, which means the same scan catches problems across all three platforms.",
          "What the research does mean: don't rely on the platform's built-in security checks. Run an independent scan after building. The vulnerabilities are real, the CVEs are published, and the fixes are straightforward once you know what to look for.",
        ],
      },
    ],
    cta: "Built with Lovable, Bolt, or v0? Scan it free at nullscan.io",
  },
  {
    slug: "nextjs-security-checklist",
    title: "How to Secure Your Next.js App: The Complete Checklist",
    description:
      "A practical security checklist for Next.js apps with copy-paste code. Covers security headers, API routes, middleware auth, environment variables, Server Actions, and deployment.",
    date: "2026-04-21",
    readingTime: "8 min read",
    category: "Security",
    sections: [
      {
        paragraphs: [
          "Next.js is the default framework for most AI coding tools. If you built an app with Cursor, Lovable, v0, or Bolt, there's a good chance it runs on Next.js — and it almost certainly shipped without these security configurations.",
          "This checklist is copy-paste ready. Each section has the code you need and explains why it matters.",
        ],
      },
      {
        heading: "1. Security Headers",
        paragraphs: [
          "Next.js doesn't add security headers by default. Add them in your next.config.ts:",
        ],
        code: `// next.config.ts
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://your-api.com; frame-ancestors 'none'" },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
]

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig`,
      },
      {
        heading: "2. API Route Authentication",
        paragraphs: [
          "Every file in app/api/ is a public endpoint. Anyone can call it with curl. Every route that reads or modifies data must verify the session:",
        ],
        code: `// app/api/user/settings/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Always filter by the authenticated user's ID
  const settings = await db.settings.findUnique({
    where: { userId: session.user.id }
  })

  return Response.json(settings)
}`,
      },
      {
        heading: "3. Middleware for Route Protection",
        paragraphs: [
          "Don't check auth in each page or API route individually. Use middleware to protect entire route groups:",
        ],
        code: `// middleware.ts
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })

  // Protect dashboard and API routes
  if (!token) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/user/:path*', '/api/admin/:path*']
}`,
      },
      {
        heading: "4. Environment Variables",
        paragraphs: [
          "Next.js variables prefixed with NEXT_PUBLIC_ are bundled into client-side JavaScript and visible to anyone who views your page source. Audit your .env files for this:",
        ],
        list: [
          "NEXT_PUBLIC_STRIPE_KEY — this must be the publishable key, never the secret key",
          "Database URLs, JWT secrets, API secret keys — these must NEVER have the NEXT_PUBLIC_ prefix",
          "Ensure .env files are in .gitignore — we've seen production database credentials in public repos",
        ],
      },
      {
        heading: "5. Server Actions",
        paragraphs: [
          "Every Server Action is a public API endpoint. The 'use server' directive doesn't mean it's protected — it means it runs on the server but can be called by anyone. Validate inputs and check auth in every server action:",
        ],
        code: `'use server'

import { getServerSession } from 'next-auth'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100),
  bio: z.string().max(500).optional(),
})

export async function updateProfile(formData: FormData) {
  const session = await getServerSession()
  if (!session?.user?.id) throw new Error('Unauthorized')

  // Validate input — never trust client data
  const parsed = updateProfileSchema.safeParse({
    name: formData.get('name'),
    bio: formData.get('bio'),
  })
  if (!parsed.success) throw new Error('Invalid input')

  await db.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  })
}`,
      },
      {
        heading: "6. Server Components and Data Leaks",
        paragraphs: [
          "Server Components can safely access databases and secrets. But any props you pass to Client Components get serialized and sent to the browser. Don't pass full database records when the client only needs a few fields:",
        ],
        code: `// BAD — sends everything to the client, including internal fields
// <UserCard user={fullUserRecord} />

// GOOD — only send what the client needs
<UserCard user={{ name: user.name, avatar: user.avatarUrl }} />`,
      },
      {
        heading: "7. Deployment",
        paragraphs: [
          "Final checks before shipping:",
        ],
        list: [
          "poweredByHeader: false in next.config.ts (already in the headers config above)",
          "Verify environment variables are scoped correctly in Vercel (production vs. preview vs. development)",
          "Disable source maps in production if not needed: productionBrowserSourceMaps: false",
          "Ensure CORS is configured correctly if you have an API — don't use Access-Control-Allow-Origin: *",
          "Run an automated scan to verify everything is configured correctly",
        ],
      },
    ],
    cta: "Verify your Next.js security setup — free scan at nullscan.io",
  },
  {
    slug: "cursor-ai-security",
    title: "Cursor AI Security: Known Vulnerabilities and What Developers Should Know",
    description:
      "From CVE-2025-54135 to MCP poisoning attacks, Cursor has real security risks. Here's what's been discovered, what's been patched, and what you should configure.",
    date: "2026-04-07",
    readingTime: "8 min read",
    category: "Research",
    sections: [
      {
        paragraphs: [
          "Cursor is the most popular AI coding tool for professional developers. It's fast, context-aware, and produces working code with impressive accuracy. But in 2025, security researchers found several serious vulnerabilities — not just in the code Cursor generates, but in the IDE itself.",
          "Here's what's been discovered, what's been fixed, and what you should configure to use Cursor safely.",
        ],
      },
      {
        heading: "CVE-2025-54135: Remote Code Execution via MCP",
        paragraphs: [
          "The most serious Cursor vulnerability to date was dubbed \"CurXecute\" by Check Point Research. The attack chain: an attacker crafts a malicious Slack message. When Cursor's AI summarizes that message, it rewrites the user's MCP (Model Context Protocol) configuration files and executes arbitrary commands with the developer's full privileges.",
          "This isn't a theoretical attack. Check Point demonstrated the full chain: malicious message to code execution in minutes. The vulnerability exploits Cursor's one-time approval model for MCPs — once you approve an MCP configuration, future modifications to its commands are trusted without additional validation.",
        ],
      },
      {
        heading: "Workspace Trust Is Disabled by Default",
        paragraphs: [
          "Imperva's research revealed that Cursor ships with VS Code's Workspace Trust feature disabled. This means when you open a repository, Cursor will execute pre-defined tasks from the project folder without any warning. A malicious repository can include task definitions that run arbitrary commands the moment you open the project.",
          "This is a deliberate trade-off Cursor made for convenience — workspace trust prompts are annoying and most developers just click \"Trust\" anyway. But it means cloning an untrusted repository in Cursor is genuinely dangerous. The fix is simple: enable Workspace Trust in settings.",
        ],
      },
      {
        heading: "Malicious npm Packages Targeting Cursor Users",
        paragraphs: [
          "SecurityWeek reported three malicious npm packages specifically targeting Cursor users on macOS. The packages posed as developer tools for Cursor and deployed a backdoor that could steal credentials and execute commands.",
          "This isn't a vulnerability in Cursor itself, but it shows that Cursor's popularity has made it a target. Attackers are building social engineering campaigns specifically around the Cursor ecosystem. When you install extensions or packages that claim to enhance Cursor, verify the publisher and check download counts.",
        ],
      },
      {
        heading: "The Code Cursor Generates",
        paragraphs: [
          "Beyond the IDE vulnerabilities, there's a separate question: is the code Cursor generates secure? Cursor's strength — deep project context awareness — actually creates a specific risk pattern. Because it generates complex, working code quickly, developers trust it more and review it less than output from other AI tools.",
          "The patterns seen in Cursor-generated code are consistent with other AI tools but amplified by volume: API routes without authorization checks, verbose error responses that leak internals to production, validation that exists in React components but not in the API handler, and default framework configurations shipped unchanged.",
        ],
      },
      {
        heading: "What to Configure Right Now",
        paragraphs: [
          "If you're using Cursor, these settings changes take two minutes and address the known attack vectors:",
        ],
        list: [
          "Enable Workspace Trust: Settings > search \"trust\" > enable \"Security: Workspace Trust Enabled\". This prevents auto-execution of tasks from untrusted repositories",
          "Disable auto-run for MCP commands: this ensures AI-generated terminal commands require your approval before executing",
          "Audit your MCP configurations: check .cursor/mcp.json for any servers you don't recognize",
          "Don't install unverified Cursor-specific npm packages — verify publisher, check downloads, read the source",
          "Treat Cursor's code output as a first draft that needs security review, not production-ready code",
        ],
      },
      {
        heading: "The Bigger Picture",
        paragraphs: [
          "Cursor is arguably the best AI coding tool available. It's also the most targeted, because its user base is professional developers with access to production systems and source code. The IDE-level vulnerabilities (MCP poisoning, workspace trust) are more concerning than the code generation issues because they can give attackers direct access to your development environment.",
          "Cursor has been responsive to disclosed vulnerabilities and has patched issues after disclosure. But the attack surface of an AI-powered IDE is fundamentally larger than a traditional editor. Keep Cursor updated, configure the security settings above, and scan the code it generates before shipping.",
        ],
      },
    ],
    cta: "Built with Cursor? See what it missed — free scan at nullscan.io",
  },
  {
    slug: "is-vibe-coding-safe",
    title: "Is Vibe Coding Safe? Here's What the Research Actually Shows",
    description:
      "Only 10.5% of AI-generated code is both functional and secure. A Wiz study found 20% of vibe-coded apps have serious vulnerabilities. Here's what the data says.",
    date: "2026-03-24",
    readingTime: "7 min read",
    category: "Opinion",
    sections: [
      {
        paragraphs: [
          "Vibe coding — describing what you want in natural language and letting AI build it — has gone from a novelty to the default way many people build software. But \"does it work?\" and \"is it safe?\" are different questions, and a growing body of research is providing answers.",
          "The short version: most AI-generated code that works is not secure. The gap between functional and safe is massive, and most developers don't know it exists.",
        ],
      },
      {
        heading: "The Numbers: Functional vs. Secure",
        paragraphs: [
          "A 2025 research paper from Cornell (\"Is Vibe Coding Safe?\", published on arxiv) benchmarked AI coding agents on real-world tasks. Their finding: while 61% of solutions generated by SWE-Agent with Claude Sonnet were functionally correct, only 10.5% were both functional and secure. That means roughly 5 out of 6 working AI-generated solutions have at least one security vulnerability.",
          "A separate study by Wiz found that 20% of vibe-coded applications have serious vulnerabilities or configuration errors. And Aikido.dev's analysis concluded that 45% of AI-generated code contains vulnerabilities from the OWASP Top 10.",
          "These aren't scare numbers from anti-AI advocates. These are from researchers and security companies who use AI tools themselves. The data is consistent: AI tools generate functional code reliably but secure code rarely.",
        ],
      },
      {
        heading: "Why Functional Code Isn't Secure Code",
        paragraphs: [
          "When a developer writes code manually, they bring context that AI doesn't have. They know the user settings endpoint needs authorization because they designed the data model. They add rate limiting because they've seen brute force attacks in production. They validate file uploads because they've read about SSRF.",
          "Vibe coding removes that context. You describe the feature, the AI builds it, and the output looks correct because it does what you asked. The security gaps are invisible because they're not about what the code does — they're about what the code doesn't prevent.",
        ],
      },
      {
        heading: "The Monoculture Problem",
        paragraphs: [
          "When one developer writes insecure code, one application is vulnerable. When an AI model generates insecure patterns, every application built with that model shares the same blind spots. AI models are trained on the same data, produce the same patterns, and make the same omissions.",
          "This creates a monoculture of vulnerability. Attackers figure out the pattern once — \"AI-built Next.js apps usually don't have authorization on API routes\" — and apply it across thousands of targets. The scale of AI code generation turns individual vulnerabilities into systemic risks.",
        ],
      },
      {
        heading: "Who's Actually at Risk",
        paragraphs: [
          "The people most at risk aren't experienced developers using AI as a productivity tool. They have the security knowledge to review AI output and catch gaps. The people most at risk are the new wave of builders — designers, product managers, entrepreneurs — who are building real applications with AI tools and don't have the background to evaluate security.",
          "These builders are shipping apps that handle real user data, real payments, and real business logic. They're moving fast because the tools let them. And the research shows that the tools' own security checks (like Lovable's built-in scan) miss a third of vulnerabilities.",
        ],
      },
      {
        heading: "Is It Safe? It Depends on One Thing",
        paragraphs: [
          "Vibe coding is as safe as your verification process. If you build with AI and test what it produces, you catch the 5-out-of-6 solutions that work but aren't secure. If you build with AI and ship without testing, you're relying on the 10.5% chance that the AI happened to generate secure code.",
          "The answer isn't to stop vibe coding. The productivity gains are real and the trend is irreversible. The answer is to add one step to the workflow: scan before you ship. It takes less time to run a security scan than it took to read this article.",
        ],
      },
    ],
    cta: "Find out what your AI tool missed — free scan at nullscan.io",
  },

  // ── Top of funnel ─────────────────────────────────────────────────
  {
    slug: "security-headers-explained",
    title: "Security Headers: The 5-Minute Setup That Blocks Entire Attack Categories",
    description:
      "Security headers are the lowest-effort, highest-impact security fix for any web app. Here's what each header does, why it matters, and the exact code to add them in Next.js and Express.",
    date: "2026-03-10",
    readingTime: "6 min read",
    category: "Security",
    sections: [
      {
        paragraphs: [
          "Security headers are instructions your server sends to the browser telling it how to handle your site's content. They block entire categories of attacks — clickjacking, XSS execution, protocol downgrade, MIME sniffing — with zero changes to your application code.",
          "Most web applications don't have them. Adding them takes five minutes and immediately hardens your app. Here's each header, what it does, and the code to implement them.",
        ],
      },
      {
        heading: "Content-Security-Policy (CSP)",
        paragraphs: [
          "CSP tells the browser exactly which resources are allowed to load — which scripts can execute, where images can come from, where forms can submit data. Without CSP, an XSS vulnerability lets an attacker load any script from any server. With CSP, the browser blocks it because it's not in the allowlist. CSP turns a critical vulnerability into a non-issue.",
          "Start restrictive and loosen as needed:",
        ],
        code: `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://your-api.com; frame-ancestors 'none'`,
      },
      {
        heading: "Strict-Transport-Security (HSTS)",
        paragraphs: [
          "HSTS tells the browser to always use HTTPS, even if someone types http:// or clicks an HTTP link. Without it, the first request might be over HTTP — and that unencrypted request can be intercepted. Set max-age to one year, include subdomains, and add the preload directive so even the very first visit uses HTTPS:",
        ],
        code: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`,
      },
      {
        heading: "X-Content-Type-Options",
        paragraphs: [
          "One value, no configuration: nosniff. Prevents browsers from guessing MIME types. Without it, a browser might interpret a text file as JavaScript and execute it. There's no reason not to set it:",
        ],
        code: `X-Content-Type-Options: nosniff`,
      },
      {
        heading: "X-Frame-Options",
        paragraphs: [
          "Controls whether your site can be embedded in an iframe. Clickjacking attacks work by embedding your site in an invisible iframe and tricking users into clicking on it while they think they're interacting with something else. Set DENY if your site should never be framed:",
        ],
        code: `X-Frame-Options: DENY`,
      },
      {
        heading: "Referrer-Policy",
        paragraphs: [
          "When a user clicks a link on your site, the browser sends a Referer header to the destination with the URL they came from. This can leak sensitive information — URL parameters, internal page paths, user-specific URLs. This setting sends only your domain to external sites but full URLs for same-origin requests:",
        ],
        code: `Referrer-Policy: strict-origin-when-cross-origin`,
      },
      {
        heading: "Permissions-Policy",
        paragraphs: [
          "Disable browser features your site doesn't use — camera, microphone, geolocation, payment. This prevents any malicious script from accessing these features even if it executes on your page:",
        ],
        code: `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`,
      },
      {
        heading: "Implementation: Next.js",
        paragraphs: [
          "If you're on Next.js (the most common framework for AI-built apps), add all headers in next.config.ts:",
        ],
        code: `// next.config.ts
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; frame-ancestors 'none'" },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      ],
    }]
  },
}
export default nextConfig`,
      },
      {
        heading: "Implementation: Express",
        paragraphs: [
          "For Express apps, the helmet middleware sets sensible defaults for all of these in one line:",
        ],
        code: `npm install helmet

// In your Express app:
import helmet from 'helmet'
app.use(helmet())`,
      },
      {
        heading: "Verify Your Headers",
        paragraphs: [
          "After adding headers, check that they're actually being sent. Open dev tools > Network tab > click your main page request > check Response Headers. Or run an automated scan that checks headers as part of a comprehensive security assessment.",
        ],
      },
    ],
    cta: "Check your headers in 30 seconds — free scan at nullscan.io",
  },
  {
    slug: "owasp-top-10-ai-generated-code",
    title: "The OWASP Top 10 in AI-Generated Code: Where Vibe Coding Goes Wrong",
    description:
      "How each OWASP Top 10 vulnerability specifically shows up in code generated by AI tools like Cursor, Lovable, and Bolt — with real patterns and fixes.",
    date: "2026-02-24",
    readingTime: "7 min read",
    category: "Security",
    sections: [
      {
        paragraphs: [
          "The OWASP Top 10 is the definitive list of web application security risks. Every security audit and penetration test references it. But the standard explanations assume code written by humans. AI-generated code has its own patterns — it produces certain OWASP vulnerabilities far more often than others, and in predictable ways.",
          "Here's how each OWASP item specifically manifests in AI-generated code, with the patterns to look for and the fixes that work.",
        ],
      },
      {
        heading: "1. Broken Access Control — The #1 AI Code Vulnerability",
        paragraphs: [
          "This is the OWASP item AI tools fail at most. AI generates API endpoints that fetch data by ID correctly but don't verify the requesting user has permission to access that ID. The route works, the data returns, but any authenticated user can access any other user's data by changing the ID in the URL.",
          "The AI pattern: you ask for \"a settings page.\" The AI builds GET /api/users/[id]/settings that fetches by ID. It doesn't add the check that the session user IS that ID. The fix: always filter by the authenticated user's ID, not a URL parameter.",
        ],
        code: `// AI generates this (vulnerable):
const settings = await db.settings.findUnique({ where: { userId: params.id } })

// What it should generate:
const session = await getServerSession()
const settings = await db.settings.findUnique({ where: { userId: session.user.id } })`,
      },
      {
        heading: "2. Cryptographic Failures",
        paragraphs: [
          "AI tools rarely make classic cryptography mistakes (they won't hash passwords with MD5). But they make a subtler error: storing sensitive data in the wrong place. Environment variables with the NEXT_PUBLIC_ prefix get bundled into client-side JavaScript. AI tools sometimes put API keys or configuration secrets there because that's the simplest way to make the code work.",
          "The fix: any secret, key, or connection string must be a server-side-only environment variable without the NEXT_PUBLIC_ prefix.",
        ],
      },
      {
        heading: "3. Injection",
        paragraphs: [
          "Modern AI tools usually generate ORM-based queries (Prisma, Drizzle), which handle SQL parameterization automatically. The risk appears when AI uses raw SQL for complex queries the ORM doesn't support easily, or when building search functionality with dynamic filters.",
          "Watch for: any Prisma $queryRaw, Drizzle sql``, or Mongoose $where that includes user input. Also watch for dangerouslySetInnerHTML in React — AI tools reach for this when asked to render formatted text or markdown content.",
        ],
      },
      {
        heading: "4. Insecure Design",
        paragraphs: [
          "AI tools build what you ask for, not the security constraints around it. A password reset flow will work (send email, click link, set new password) but the reset token might never expire and could be reusable. A file upload will accept and store files but won't validate file types server-side.",
          "This is the hardest OWASP category to test for automatically. You need to think about abuse cases: what if someone requests 1,000 password resets? What if they upload a 10GB file? What if they submit the same form 10,000 times? AI doesn't ask these questions.",
        ],
      },
      {
        heading: "5. Security Misconfiguration",
        paragraphs: [
          "AI tools generate application code but rarely modify framework-level configuration. This means apps ship with CORS set to allow all origins, debug/verbose error messages enabled, GraphQL introspection accessible in production, and no security headers. The AI wrote your features within the framework's defaults, and those defaults are optimized for development, not security.",
        ],
      },
      {
        heading: "6. Vulnerable Components",
        paragraphs: [
          "AI tools install packages to solve problems but don't evaluate those packages for security. They might install an abandoned package with known CVEs because it was popular in training data. Run npm audit after any AI-generated project setup and address critical findings before deploying.",
        ],
      },
      {
        heading: "7. Authentication Failures",
        paragraphs: [
          "AI generates working auth flows (login, register, password reset) without the security hardening: no rate limiting on login endpoints, session tokens in localStorage instead of httpOnly cookies, no account lockout after failed attempts, missing CSRF protection. The auth works for normal usage but collapses under any adversarial testing.",
        ],
      },
      {
        heading: "8-10: Integrity, Logging, SSRF",
        paragraphs: [
          "Software integrity failures: AI-generated CI/CD configurations and build scripts are usually insecure by default. Logging: AI almost never adds security event logging — failed logins, access denials, and input validation failures go unrecorded. SSRF: any AI-generated feature that accepts a URL (link preview, image import, webhook) fetches it without validating that it points to a public resource.",
        ],
      },
      {
        heading: "The Pattern",
        paragraphs: [
          "Items 1, 5, and 7 (Broken Access Control, Security Misconfiguration, Authentication Failures) account for the vast majority of vulnerabilities in AI-generated code. They're also the most testable — an automated scanner catches all three categories in minutes. You don't need to memorize the OWASP Top 10; you need to scan for it.",
        ],
      },
    ],
    cta: "See how your AI-generated code scores against the OWASP Top 10 — free scan at nullscan.io",
  },

  // ── Existing posts ────────────────────────────────────────────────
  {
    slug: "we-scanned-10-ai-built-apps",
    title: "We Scanned 10 AI-Built Apps — Here's What We Found",
    description:
      "We pentested 10 web apps built with AI coding tools. Every single one had at least one vulnerability. Here are the most common issues.",
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

// Only show posts whose publish date has passed
export const blogPosts: BlogPost[] = allBlogPosts.filter(
  (post) => new Date(post.date) <= new Date()
)

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug)
}

export function getAllSlugs(): string[] {
  return blogPosts.map((post) => post.slug)
}
