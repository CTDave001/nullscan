# Nullscan — Full Design Document

## What is Nullscan?

Nullscan is a SaaS that performs automated black-box penetration testing on web applications. A user submits a URL, and AI-powered agents scan it for real vulnerabilities — SQL injection, XSS, SSRF, auth bypass, IDOR, directory traversal, and more. Users watch the scan happen in real-time, then receive a professional pentest report with verified findings, proof-of-concept code, and fix guidance.

The free tier shows finding titles, severity, and affected endpoints. Paid tiers ($149 / $399) unlock reproduction steps, PoC code, and detailed remediation.

---

## Brand Identity

**Name:** nullscan (always lowercase)

**Wordmark:** "null" in cyan (#06b6d4), "scan" in white (#fafafa). Font: Geist Sans, medium weight (500). Letter-spacing: -0.02em (slightly tight).

**Icon:** A minimal null set symbol (a circle with a diagonal stroke through it). Rendered as a clean geometric SVG — 2px stroke, cyan (#06b6d4), no fill. The diagonal line has a subtle gradient fade at the ends, suggesting a scan sweep. Must work clearly at 16px (favicon), 24px (nav), and 48px (hero).

**Tagline:** "Your app. Their perspective."

**Voice:** Technical but not jargon-heavy. Confident, not salesy. Direct. No exclamation marks. No "AI-powered" or "next-gen" or "revolutionary." The product speaks for itself.

---

## Color System

All colors defined as CSS custom properties on `:root`. The app is dark-only — no light mode.

```css
:root {
  /* Backgrounds */
  --bg:              #09090b;   /* Page background — near black */
  --surface:         #18181b;   /* Cards, panels, elevated surfaces */
  --surface-raised:  #1c1c20;   /* Hover states, active selections */

  /* Borders */
  --border:          #27272a;   /* Default border — subtle */
  --border-bright:   #3f3f46;   /* Emphasized borders */

  /* Text */
  --text:            #fafafa;   /* Primary text — near white */
  --text-secondary:  #a1a1aa;   /* Descriptions, secondary info */
  --text-muted:      #71717a;   /* Tertiary text, timestamps */
  --text-dim:        #52525b;   /* Disabled, very low emphasis */

  /* Brand accent — cyan */
  --accent:          #06b6d4;   /* Primary accent — buttons, links, highlights */
  --accent-hover:    #0891b2;   /* Accent hover state */
  --accent-muted:    #0e7490;   /* Accent on dark surfaces */
  --accent-glow:     rgba(6, 182, 212, 0.12);  /* Glow effect behind CTAs */
  --accent-glow-strong: rgba(6, 182, 212, 0.25); /* Stronger glow for emphasis */

  /* Severity colors — universal, do not brand these */
  --severity-critical: #ef4444;  /* Red */
  --severity-high:     #f97316;  /* Orange */
  --severity-medium:   #eab308;  /* Yellow */
  --severity-low:      #3b82f6;  /* Blue */

  /* Status colors */
  --success:         #22c55e;   /* Green — scan complete, agent done */
  --error:           #ef4444;   /* Red — failures */
  --warning:         #eab308;   /* Yellow — rate limits, caution */

  /* Spacing and radius */
  --radius:          0.625rem;  /* 10px — default border radius */
  --radius-sm:       0.375rem;  /* 6px — small elements like badges */
  --radius-lg:       0.75rem;   /* 12px — larger cards */
}
```

---

## Typography

**Font family:** Geist Sans (sans-serif) and Geist Mono (monospace). Loaded from Google Fonts.

**Usage rules:**
- **Geist Sans** — all UI text: headings, body, buttons, labels
- **Geist Mono** — technical content: URLs, endpoints, code blocks, terminal output, timestamps, stat numbers, hashes

**Scale:**
- Hero heading: 3rem (48px), font-weight 700, tracking -0.03em
- Section heading: 1.875rem (30px), font-weight 700, tracking -0.02em
- Card heading: 1.125rem (18px), font-weight 600
- Body: 0.875rem (14px), font-weight 400
- Small/caption: 0.75rem (12px), font-weight 400
- Mono content: 0.8125rem (13px), font-weight 400

---

## Tech Stack

- **Framework:** Next.js (App Router, React Server Components where possible)
- **Styling:** Tailwind CSS 4
- **Components:** shadcn/ui (New York style) with Radix UI primitives
- **Icons:** Lucide React
- **Animations:** CSS transitions + tw-animate-css. No heavy JS animation libraries.
- **State:** React hooks only (useState, useEffect). No Redux/Zustand needed.

---

## Backend API Contract

The frontend communicates with a FastAPI backend. Base URL configured via `NEXT_PUBLIC_API_URL` environment variable (default: `http://localhost:8000`).

### Endpoints

#### `POST /scans/`
Create a new scan.

**Request:**
```json
{
  "email": "user@example.com",
  "target_url": "https://example.com",
  "consent": true
}
```

**Response (201):**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "target_url": "https://example.com",
  "status": "pending",
  "scan_type": "deep",
  "created_at": "2026-02-04T12:00:00"
}
```

**Errors:**
- `400` — consent not given
- `429` — rate limit exceeded (3 free scans/month per email)

After creation, redirect user to `/scan/{id}`.

#### `GET /scans/{scan_id}`
Get scan metadata.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "target_url": "https://example.com",
  "status": "pending" | "running" | "completed" | "failed",
  "scan_type": "quick" | "deep",
  "created_at": "2026-02-04T12:00:00",
  "completed_at": "2026-02-04T12:15:00" | null,
  "paid_tier": null | "unlock" | "deep"
}
```

#### `GET /scans/{scan_id}/progress`
Get live scan progress. Poll every 5 seconds while status is "pending" or "running".

**Response:**
```json
{
  "scan_id": "uuid",
  "status": "running",
  "progress": {
    "agents": 13,
    "active_agents": 4,
    "tools": 98,
    "input_tokens": 1758382,
    "output_tokens": 3456,
    "cost": 0.1471,
    "vulnerabilities_found": 2,
    "findings_so_far": [
      { "title": "Reflected XSS on /search", "severity": "Medium" },
      { "title": "SQL Injection on /api/users", "severity": "High" }
    ],
    "active_agent_list": [
      {
        "label": "SQL Injection Testing",
        "description": "Testing identified endpoints from reconnaissance...",
        "status": "running"
      },
      {
        "label": "Authentication Bypass Testing",
        "description": "Checking for default credentials on auth endpoints...",
        "status": "waiting"
      }
    ],
    "recent_activity": [
      {
        "ts": "2026-02-04T12:05:23",
        "description": "Discovering subdomains and related hosts",
        "status": "running"
      },
      {
        "ts": "2026-02-04T12:06:11",
        "description": "Probing endpoint /api/login for vulnerabilities",
        "status": "running"
      }
    ]
  }
}
```

When `progress` is empty `{}`, the scan hasn't started yet (sandbox initializing).

#### `GET /scans/{scan_id}/results`
Get scan results. Only available when status is "completed".

**Response:**
```json
{
  "scan_id": "uuid",
  "target_url": "https://example.com",
  "risk_level": "High" | "Medium" | "Low" | "Clean",
  "scan_type": "deep",
  "completed_at": "2026-02-04T12:15:00",
  "paid_tier": null | "unlock" | "deep",
  "findings": [
    {
      "title": "SQL Injection in login endpoint",
      "severity": "High",
      "endpoint": "POST /api/auth/login",
      "impact": "Attacker can extract database contents...",
      "reproduction_steps": null,  // null if not paid
      "poc": null,                 // null if not paid
      "fix_guidance": null         // null if not paid
    }
  ]
}
```

Free tier: `title`, `severity`, `endpoint`, `impact` are visible. `reproduction_steps`, `poc`, `fix_guidance` are `null`.
Paid tier: all fields populated.

#### `POST /scans/{scan_id}/checkout?tier=unlock|deep`
Create a Stripe checkout session.

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/..."
}
```

Redirect user to `checkout_url`. On success, Stripe redirects to `/results/{scan_id}/full?success=true`.

#### `GET /health`
Health check. Returns `{"status": "healthy"}`.

---

## Page Architecture

### Routes

| Route | Purpose | Data source |
|-------|---------|-------------|
| `/` | Landing page | Static (optionally fetch scan count from API) |
| `/scan/[id]` | Live scan status | Poll `GET /scans/{id}` + `GET /scans/{id}/progress` every 5s |
| `/results/[id]` | Scan results + paywall | `GET /scans/{id}/results` |
| `/scope` | What we test (legal) | Static |
| `/terms` | Terms of service | Static |
| `/privacy` | Privacy policy | Static |

---

## Shared Components

### Navbar

Appears on every page. Sticky to top.

- **Background:** Transparent when at top of page. On scroll, becomes `var(--bg)` with `backdrop-blur-md` and a 1px bottom border `var(--border)`.
- **Height:** 64px
- **Layout:** Flex, space-between, items-center
- **Left:** Nullscan logo (icon + wordmark). Clicking navigates to `/`.
- **Right:** Two text links: "Pricing" (scrolls to pricing section on landing, or navigates to `/#pricing` from other pages) and "Scope" (navigates to `/scope`). Text color `var(--text-muted)`, hover `var(--text)`. Font size 14px.
- **No hamburger menu on mobile.** Links wrap naturally or hide behind a simple overflow. Keep it minimal.

### Nullscan Logo

An SVG component that renders the null set icon + wordmark.

**Props:**
- `size`: "sm" (24px icon, 14px text) | "md" (32px icon, 18px text) | "lg" (48px icon, 24px text)
- `iconOnly`: boolean — render just the icon (for favicon, small spaces)

**Icon spec:** Circle with diagonal stroke. Stroke width 2px at md size (scale proportionally). Color: `var(--accent)`. No fill.

**Wordmark:** "null" in `var(--accent)`, "scan" in `var(--text)`. Geist Sans medium. Sits to the right of the icon with 8px gap.

### Footer

Simple, consistent across all pages.

- **Background:** `var(--bg)` — blends with page
- **Layout:** Centered text, single row of links
- **Links:** "What we test" → `/scope`, "Terms" → `/terms`, "Privacy" → `/privacy`
- **Text color:** `var(--text-muted)`, hover `var(--accent)`
- **Below links:** "(C) 2026 nullscan" in `var(--text-dim)`, font size 12px

---

## Page 1: Landing Page (`/`)

### Section 1: Hero (above the fold)

**Layout:** Two-column split on desktop (60% left / 40% right). Stacks vertically on mobile (text first, form below).

**Left column:**
- Headline: `Your app. Their perspective.`
  - Font: 3rem, weight 700, tracking -0.03em, color `var(--text)`
  - Consider making "Their perspective" in `var(--accent)` for emphasis
- Subheadline: `Automated penetration testing that shows you what attackers actually find.`
  - Font: 1.125rem, weight 400, color `var(--text-secondary)`
  - Max-width: 480px
- Trust signals (below subheadline, 16px gap):
  - Three inline items separated by a `·` dot
  - "No agents to install" · "No source code needed" · "Results in minutes"
  - Font: 0.8125rem, color `var(--text-muted)`

**Right column:**
- The scan form (see Scan Form component below)
- Wrapped in a card: background `var(--surface)`, border `var(--border)`, border-radius `var(--radius-lg)`
- Card has a very subtle glow effect: `box-shadow: 0 0 80px var(--accent-glow), 0 0 20px var(--accent-glow)`
- The glow should be barely noticeable — it creates an ambient "this is the thing to interact with" feel without being garish

### Section 2: Live Preview

**Purpose:** Show users what the scan experience looks like before they commit. This is the "wow" moment.

**Layout:** Full-width section, centered content, max-width 900px.

**Heading:** `Watch your scan in real-time. No black box.` — font 1.875rem, weight 700, centered, color `var(--text)`.

**The preview:** A CSS-animated mockup of the scan dashboard inside a browser-chrome-styled container:
- **Browser chrome:** A thin bar at top with three dots (red/yellow/green), a fake URL bar showing `nullscan.io/scan/a3f8...`, and a dark background. This frames the mockup as a real product screenshot.
- **Inside the mockup (all CSS-animated, no real data):**
  - A phase progress bar filling left to right (cyan)
  - 2-3 fake agent cards appearing one by one:
    - "Reconnaissance" → appears first, shows "running", then after 3s switches to a checkmark
    - "SQL Injection Testing" → appears second, shows "running" with a fake endpoint cycling
    - "XSS Testing" → appears third
  - A fake activity feed on the right scrolling with entries:
    - "Discovered 4 subdomains"
    - "Found 18 endpoints from sitemap"
    - "Testing POST /api/login for SQLi"
    - "FINDING: Reflected XSS on /search (Medium)" — this one appears in red
  - The whole animation loops every ~15 seconds with a smooth reset

**Below the mockup:** A small caption: `Real scan in progress on a test application` — font 0.75rem, color `var(--text-dim)`, centered. This adds authenticity.

### Section 3: How It Works

**Layout:** Three-column grid on desktop, stacks on mobile. Max-width 800px, centered.

**Heading:** `How it works` — font 1.875rem, weight 700, centered.

**Three steps, each a card with:**
- Step number in a circle: 40px, border 2px `var(--accent)`, background `var(--surface)`, number in `var(--accent)`, font-weight 700
- Title: font 1rem, weight 600, color `var(--text)`
- Description: font 0.875rem, color `var(--text-secondary)`

**Content:**
1. **Enter your URL** — "Paste your app's URL and your email. We only test publicly accessible endpoints — no credentials needed."
2. **AI agents attack** — "Specialized agents probe for SQL injection, XSS, SSRF, authentication bypass, IDOR, and more. Watch them work in real-time."
3. **Get a real report** — "Verified findings only. Every vulnerability includes proof-of-concept code and specific fix guidance. No false positives."

### Section 4: Pricing (`#pricing`)

**Layout:** Three-column grid, max-width 1000px, centered. Each card is equal height.

**Heading:** `Pricing` — font 1.875rem, weight 700, centered.

**Cards:**

**Card 1: Free Scan**
- Background: `var(--surface)`
- Border: 1px `var(--border)`
- Title: "Free Scan" — font 1.125rem, weight 600
- Price: "$0" — font 2rem, weight 700
- Feature list (font 0.875rem, color `var(--text-secondary)`):
  - Quick external scan
  - Finding titles and severity
  - Affected endpoints
  - Impact description
  - ~~Reproduction steps~~ (strikethrough, color `var(--text-dim)`)
  - ~~Proof-of-concept code~~ (strikethrough)
  - ~~Fix guidance~~ (strikethrough)

**Card 2: Unlock Report (highlighted)**
- Background: `var(--surface)`
- Border: 2px `var(--accent)`
- Subtle glow: `box-shadow: 0 0 40px var(--accent-glow)`
- A small "Most popular" badge at top-right: background `var(--accent)`, text `var(--bg)`, font 0.6875rem, weight 600, padding 2px 8px, border-radius `var(--radius-sm)`
- Title: "Unlock Report" — font 1.125rem, weight 600, color `var(--accent)`
- Price: "$149" — font 2rem, weight 700
- Feature list:
  - Everything in Free
  - Full reproduction steps
  - Proof-of-concept code
  - Fix guidance per finding
  - PDF export

**Card 3: Deep Analysis**
- Background: `var(--surface)`
- Border: 1px `var(--border)`
- Title: "Deep Analysis" — font 1.125rem, weight 600
- Price: "$399" — font 2rem, weight 700
- Feature list:
  - Everything in Unlock
  - 1-4 hour thorough deep scan
  - 7+ vulnerability categories
  - Executive summary
  - Security certificate
  - One free rescan

### Section 5: Footer

As described in Shared Components above.

---

## Page 2: Scan Status (`/scan/[id]`)

### Data Flow

1. On mount, fetch `GET /scans/{id}` to get scan metadata (target_url, status, created_at)
2. Start polling `GET /scans/{id}/progress` every 5 seconds
3. When `status` becomes `"completed"`, stop polling, show completion state, then redirect to `/results/{id}` after 3 seconds
4. When `status` becomes `"failed"`, show error state with retry link

### Layout

**Top:** Navbar (shared)

**Scanning animation bar:** A 2px tall bar at the very top of the page (below navbar). A gradient segment (`transparent → var(--accent) → transparent`) animates left to right continuously. Indicates the scan is alive.

**Header row:**
- Left: Pulsing cyan dot (8px, `var(--accent)`, CSS pulse animation) + "Penetration test active" (font 1.125rem, weight 600) + target URL below in mono (font 0.875rem, color `var(--text-muted)`)
- Right: Elapsed timer. Large mono digits (font 1.5rem, color `var(--text-secondary)`, tabular-nums). Format: `MM:SS`. Calculated from `created_at` timestamp, ticks every second. Label below: "elapsed" (font 0.75rem, color `var(--text-dim)`)

**Phase indicators:**
Six phases displayed as a horizontal progress bar:
1. "Initializing sandbox"
2. "Reconnaissance & mapping"
3. "Probing endpoints"
4. "Testing attack vectors"
5. "Analyzing responses"
6. "Compiling report"

Each phase is a flex segment with a 4px tall bar on top and label below. Active phase: bar is `var(--accent)`, label is `var(--accent)`. Completed phases: bar is `var(--accent)` (solid). Future phases: bar is `var(--border)`, label is `var(--text-dim)`.

Phase is determined by `input_tokens` from progress:
- 0 → Phase 0 (Initializing)
- \>0 → Phase 1 (Recon)
- \>50,000 → Phase 2 (Probing)
- \>200,000 → Phase 3 (Testing)
- \>500,000 → Phase 4 (Analyzing)
- \>900,000 → Phase 5 (Reporting)

**Stats row:**
Four cards in a grid (4 columns desktop, 2x2 mobile). Each card: background `var(--surface)`, border `var(--border)`, padding 16px, border-radius `var(--radius-lg)`.

| Card | Label | Value format |
|------|-------|-------------|
| Active Agents | "Active Agents" | `{active_agents}` / `{agents}` (the slash and total in `var(--text-dim)`) |
| Tools Used | "Tools Used" | Number, formatted with K/M suffix when >= 1000 |
| Tokens | "Tokens" | Number, formatted with K/M suffix |
| Findings | "Findings" | Number, color `var(--severity-critical)` if > 0 |

**Formatting rule for large numbers:**
- < 1,000 → raw number
- 1,000 – 999,999 → `{n/1000}K` (e.g., "847K")
- >= 1,000,000 → `{n/1000000}M` with 1 decimal (e.g., "1.2M")

**War Room — two-panel activity section:**

This is the centerpiece of the scan experience. Two panels side by side on desktop (stack on mobile).

**Left panel (60%): Live Agent Cards**

Container: background `var(--surface)`, border `var(--border)`, border-radius `var(--radius-lg)`, padding 16px. Heading: "Active Agents" (font 0.75rem, weight 600, uppercase, letter-spacing 0.05em, color `var(--text-muted)`).

Each active agent (status "running" or "waiting") gets a card:
- Background: `var(--bg)` (darker than container)
- Border-left: 3px solid — `var(--accent)` if running, `var(--border)` if waiting
- Padding: 12px
- Border-radius: `var(--radius)`
- **Agent name:** font 0.875rem, weight 500, color `var(--text)`
- **Status pill:** right-aligned, font 0.6875rem. Running: green dot + "running" in `var(--success)`. Waiting: gray dot + "waiting" in `var(--text-dim)`.
- **Description line:** font 0.8125rem, color `var(--text-secondary)`. The agent's task description, truncated to 120 chars.

When an agent completes, its card shrinks to a single-line summary with a checkmark: `checkmark SQL Injection Testing — complete` in `var(--text-dim)`, then fades out after 5 seconds.

Max 5 agent cards visible at once. If more, show count: "+3 more agents running".

**Right panel (40%): Event Timeline**

Container: background `#000000` (pure black — terminal feel), border `var(--border)`, border-radius `var(--radius-lg)`, padding 16px, max-height 400px, overflow-y auto (auto-scrolls to bottom).

Heading: "Live Activity" (font 0.75rem, weight 600, uppercase, letter-spacing 0.05em, color `var(--text-muted)`).

Each event is a row:
- Timestamp: mono font, 0.75rem, color `var(--accent)` (cyan timestamps give the terminal life)
- Description: 0.75rem

**Event styling by type:**
- Discovery events (subdomains found, endpoints found): color `var(--text-secondary)`
- Agent events (spawned, finished): color `var(--text-muted)`
- Testing events (probing endpoint X): color `var(--text-secondary)`
- Finding events (vulnerability discovered): color `var(--severity-critical)` or appropriate severity color, bold weight
- Error/block events: color `var(--text-dim)`

At the bottom: a blinking cursor (`_`) in `var(--accent)` with 50% opacity, CSS blink animation. Indicates the feed is live.

Show last 30 events. New events fade in from bottom.

**Vulnerability discoveries (if any):**

When `findings_so_far` has items, show them between the stats row and the war room in a dedicated section:

Heading: "Discovered Vulnerabilities" (same style as other section headings).

Each finding: a card with severity badge (colored pill) on left, title text on right. Animate in with a subtle slide-up + fade.

**Completion state:**

When scan completes:
1. The scanning animation bar stops
2. The pulsing dot turns green (solid, no pulse)
3. Header text changes to "Penetration test complete"
4. A brief message appears: "Redirecting to results..." — then redirect to `/results/{id}` after 3 seconds

**Error state:**

When scan fails:
- Dark card centered on page
- Red icon (circle with !)
- "Scan Failed" heading
- Error message
- "Start New Scan" button linking to `/`

**Bottom note:**
`This scan runs in our cloud. Close this tab anytime — we'll email your report.`
Font 0.75rem, color `var(--text-dim)`, centered, padding-bottom 32px.

---

## Page 3: Results (`/results/[id]`)

### Data Flow

1. Fetch `GET /scans/{id}/results` on mount
2. If scan not completed, show loading or redirect to scan status page
3. Display results with paywall based on `paid_tier`

### Layout

Entire page: dark background `var(--bg)`.

**Header section:**
- Navbar (shared)
- Below navbar: a full-width banner with padding 32px
  - Left: Nullscan logo (small) + "Scan Report" label
  - Center: Target URL in mono font (font 1.125rem, weight 500)
  - Right: Overall risk level badge — large pill with severity color background, white text, font 0.875rem weight 700, uppercase

**Stats strip:**
Horizontal row of stats below the header. Background `var(--surface)`, border-y `var(--border)`, padding 16px 0.

Stats displayed inline with `·` separator, centered:
- `{agents} agents deployed`
- `{tools} security tests run`
- `{duration} scan duration`
- `{categories} attack categories`

All in mono font, 0.8125rem, color `var(--text-muted)`. Numbers in `var(--text)`.

These stats come from `progress_json` — the API should include them in the results response (or the frontend can fetch progress separately for completed scans).

**Findings section:**

If findings exist:

Each finding is a card:
- Background: `var(--surface)`
- Border: 1px `var(--border)`
- Border-radius: `var(--radius-lg)`
- **Left edge:** 4px wide strip in the finding's severity color (red/orange/yellow/blue). Runs the full height of the card.
- **Content padding:** 20px

**Card content (always visible — free tier):**
- **Title:** font 1rem, weight 600, color `var(--text)`
- **Endpoint:** mono font, 0.8125rem, color `var(--accent)`. Display as: `POST /api/auth/login` or just the path.
- **Impact:** font 0.875rem, color `var(--text-secondary)`. 2-3 sentences explaining the risk.
- **Severity badge:** positioned top-right of the card. Small pill: background `severity-color/20`, text `severity-color`, border 1px `severity-color/30`, font 0.6875rem, weight 700, uppercase.

**Card content (locked — free tier):**

Below the impact text, a visually distinct locked section:
- Background: `var(--surface-raised)` with a CSS `backdrop-filter: blur(4px)` effect on the text content (or just use a translucent overlay)
- The text inside is intentionally blurred/unreadable — this creates the feeling that the content EXISTS, the user just can't see it yet
- Over the blur: a lock icon (Lucide `Lock`, 16px) + text: "Reproduction steps, proof-of-concept, and fix guidance" in `var(--text-muted)`, font 0.8125rem
- Below: an inline button — background `var(--accent)`, text `var(--bg)`, font 0.8125rem, weight 600, padding 8px 16px, border-radius `var(--radius)`. Text: "Unlock full report — $149". Hover: `var(--accent-hover)`.
- The button should have a subtle glow: `box-shadow: 0 0 20px var(--accent-glow)`

The blur effect is key to conversion — it should look like there are 4-6 lines of real technical text behind the blur, not just an empty placeholder.

**Card content (unlocked — paid tier):**

When paid, the blur section is replaced with actual content:
- **Technical Analysis** heading (font 0.875rem, weight 600) + body text
- **Proof of Concept** heading + code block:
  - Background: `#000000`
  - Border: 1px `var(--border)`
  - Border-radius: `var(--radius)`
  - Mono font, 0.8125rem
  - A "Copy" button in the top-right corner of the code block (ghost button, small)
  - Syntax highlighting if feasible, otherwise just white mono text
- **Fix Guidance** heading + body text with specific remediation steps

**Zero findings state:**

If `findings` is empty:
- A centered card:
  - Green checkmark icon (large, 48px)
  - Heading: "No vulnerabilities detected" — font 1.25rem, weight 600, color `var(--success)`
  - Subtext: "Your application passed all tests in the quick scan." — font 0.875rem, color `var(--text-secondary)`
  - Below: a grid showing what WAS tested, as a checklist:
    - SQL Injection — checkmark (green)
    - Cross-Site Scripting — checkmark
    - Authentication Bypass — checkmark
    - IDOR / Access Control — checkmark
    - SSRF — checkmark
    - Directory Traversal — checkmark
    - Security Headers — checkmark
  - Each item: font 0.875rem, color `var(--text-secondary)`, with a green checkmark icon
  - Below the checklist: "Want to go deeper?" CTA card for deep analysis upsell

**Upsell section (bottom of page, for both free and paid=unlock users):**

Only show if user hasn't purchased the highest tier.

Card: background `var(--surface)`, border `var(--border)`, padding 32px, centered.

For free users with findings:
- Already handled inline per-finding (the "Unlock full report" buttons)
- Bottom CTA section shows the Deep Analysis upgrade

For paid=unlock users:
- "Go deeper" heading
- Deep Analysis card with feature list and $399 button

For free users with no findings:
- "Want to go deeper?" heading
- Deep Analysis card emphasizing the expanded scope

---

## Page 4: Scope (`/scope`)

Dark theme version of current page.

- Background: `var(--bg)`
- Max-width: 640px, centered, padding-y 64px
- Navbar at top, footer at bottom
- Heading: "What We Test" — font 1.875rem, weight 700, color `var(--text)`
- "What we DO" heading: color `var(--success)`, font 1.25rem, weight 600
  - List items: color `var(--text-secondary)`, font 0.875rem
- "What we DON'T do" heading: color `var(--severity-critical)`, font 1.25rem, weight 600
  - List items: color `var(--text-secondary)`, font 0.875rem
- Bottom note: color `var(--text-muted)`, font 0.8125rem

---

## Page 5: Terms (`/terms`)

Dark theme version of current page.

- Background: `var(--bg)`
- Max-width: 640px, centered, padding-y 64px
- Navbar at top, footer at bottom
- Heading: "Terms of Service" — font 1.875rem, weight 700, color `var(--text)`
- Section headings (Authorization, Liability, etc.): font 1.25rem, weight 600, color `var(--text)`
- Body text: color `var(--text-secondary)`, font 0.875rem
- Keep all existing content, just restyle

---

## Page 6: Privacy (`/privacy`)

Dark theme version of current page.

- Background: `var(--bg)`
- Max-width: 640px, centered, padding-y 64px
- Navbar at top, footer at bottom
- Heading: "Privacy Policy" — font 1.875rem, weight 700, color `var(--text)`
- Section headings: font 1.25rem, weight 600, color `var(--text)`
- Body/list text: color `var(--text-secondary)`, font 0.875rem
- Keep all existing content, just restyle

---

## Component: Scan Form

Used on the landing page hero.

**Fields:**
1. **URL input** — Label: "Your app URL". Type: url. Placeholder: "https://yourapp.com". Required.
2. **Email input** — Label: "Email for results". Type: email. Placeholder: "you@example.com". Required.
3. **Consent checkbox** — Label: "I confirm I own this application or have explicit written permission to perform security testing on it." Required.

**Submit button:**
- Background: `var(--accent)`
- Text: `var(--bg)` (dark text on cyan button)
- Font: 0.875rem, weight 600
- Text: "Scan your app free"
- Loading state: "Starting scan..." with a subtle spinner
- Disabled when: loading OR consent unchecked
- Full width within the form
- Hover: `var(--accent-hover)`
- Subtle glow on hover: `box-shadow: 0 0 20px var(--accent-glow)`

**Input styling:**
- Background: `var(--bg)` (darker than the card it sits in)
- Border: 1px `var(--border)`
- Border-radius: `var(--radius)`
- Text: `var(--text)`
- Placeholder: `var(--text-dim)`
- Focus: border-color `var(--accent)`, outline: 2px `var(--accent-glow)`
- Height: 40px
- Padding: 0 12px

**Label styling:**
- Font: 0.8125rem, weight 500, color `var(--text-secondary)`
- Margin-bottom: 6px

**Error message:**
- Font: 0.8125rem, color `var(--severity-critical)`
- Appears below the form on submit failure

**On successful submit:** Navigate to `/scan/{id}` where `id` comes from the API response.

---

## Animations and Interactions

### Global
- All transitions: `transition: all 150ms ease` unless specified otherwise
- No janky hover states — every interactive element should have a smooth transition
- Prefer CSS animations over JS. Use `@keyframes` for complex animations.

### Scanning bar (scan status page)
```css
@keyframes scan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
```
A gradient bar (`transparent → var(--accent) → transparent`) that slides across a 2px track. Duration: 2s, ease-in-out, infinite.

### Pulse dot (scan status page)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```
Applied to the status indicator dot. Duration: 2s, infinite.

### Fade in (new elements)
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
```
Applied to new activity feed entries, new agent cards, new finding cards. Duration: 300ms, ease-out.

### Blink cursor (activity feed)
```css
@keyframes blink {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0; }
}
```
Applied to the `_` cursor at the bottom of the activity feed. Duration: 1s, infinite.

### Scroll-triggered navbar
On scroll past 20px, navbar transitions from transparent to `var(--bg)` background with `backdrop-filter: blur(12px)`. Use a scroll event listener with requestAnimationFrame or IntersectionObserver.

### Scan preview loop (landing page)
The entire scan preview animation runs on a ~15 second loop:
- 0-2s: Phase bar fills to 33%
- 1-4s: First agent card ("Reconnaissance") fades in, shows "running"
- 3-5s: Activity feed entries start scrolling in
- 4-6s: Recon agent completes (checkmark), second agent ("SQL Injection Testing") fades in
- 6-9s: More activity entries, third agent ("XSS Testing") fades in
- 10-12s: A red finding entry appears in the feed
- 12-14s: Phase bar fills to 66%
- 14-15s: Brief pause, then smooth reset to beginning

Use CSS `@keyframes` with delays, or a single timeline animation. No JavaScript intervals.

---

## Responsive Design

### Breakpoints (Tailwind defaults)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px

### Mobile adaptations
- **Hero:** Stacks vertically — headline + copy above, form card below
- **Stats row:** 2x2 grid instead of 4 columns
- **War room panels:** Stack vertically — agent cards above, event timeline below
- **Pricing cards:** Stack vertically
- **Results finding cards:** Full width, same layout (already single-column)
- **Scan preview:** Reduce width, keep animation but maybe hide the right panel (activity feed) on mobile to simplify

### Minimum supported width: 360px (standard mobile)

---

## Favicon

The null set icon (same as the logo icon) rendered as a 32x32 favicon. Cyan stroke on transparent background, with a subtle dark circle behind for visibility on light browser chrome.

Generate as both `.ico` and `.svg` formats. Place `.svg` in `/public/favicon.svg` and reference in layout.tsx metadata.

---

## Environment Variables (Frontend)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

This is the only env var the frontend needs. All other config is server-side (backend).

---

## File Structure

```
frontend/
  src/
    app/
      globals.css           # CSS variables, base styles
      layout.tsx            # Root layout: metadata, fonts, body
      page.tsx              # Landing page
      scan/
        [id]/
          page.tsx          # Scan status page
      results/
        [id]/
          page.tsx          # Results page
      scope/
        page.tsx            # What We Test
      terms/
        page.tsx            # Terms of Service
      privacy/
        page.tsx            # Privacy Policy
    components/
      navbar.tsx            # Shared sticky navbar
      nullscan-logo.tsx     # Logo SVG component (icon + wordmark)
      scan-form.tsx         # URL/email/consent form
      scan-preview.tsx      # CSS-animated scan dashboard mockup
      agent-card.tsx        # Live agent status card (scan page)
      event-timeline.tsx    # Typed event feed (scan page)
      ui/
        button.tsx          # shadcn/ui button
        card.tsx            # shadcn/ui card
        input.tsx           # shadcn/ui input
        label.tsx           # shadcn/ui label
        badge.tsx           # shadcn/ui badge
        checkbox.tsx        # shadcn/ui checkbox
    lib/
      utils.ts              # cn() utility, formatBigNumber(), etc.
  public/
    favicon.svg             # Null set icon
    favicon.ico             # Null set icon (legacy format)
```
