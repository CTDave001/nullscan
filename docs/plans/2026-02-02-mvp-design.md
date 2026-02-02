# MVP Design: Black-Box Security Testing SaaS

## Overview & Goals

**Product:** SaaS wrapper around Strix for automated black-box external security testing

**Target users:** Early-stage SaaS and AI founders who ship fast without dedicated security teams

**Core value prop:** "See what attackers see — before they do"

**MVP Goal:** Validate that founders will pay for automated external security scans. Get to first paying customers within 2-3 weeks of launch.

**Success metrics:**
- First 10 paid reports sold
- Conversion rate from free scan → paid unlock
- Average scan cost stays under $25 (quick) / $150 (deep)

---

## User Flow

### Inbound flow (user finds you):

1. User lands on homepage
2. Enters URL + email + checks consent box
3. Clicks "Scan my app"
4. Sees confirmation: "Scan started. ~5-15 min. We'll email you."
5. Quick scan runs (background worker)
6. Email sent: "Your scan is ready" + link
7. Results page shows:
   - Risk level (Critical/High/Medium/Low/Clean)
   - Finding titles + severity + affected endpoints
   - Details hidden behind paywall
8. User chooses:
   - Leave (free tier complete)
   - Pay $149 → unlock quick scan details
   - Pay $399 → unlock + deep scan
9. If paid: Stripe checkout → webhook → unlock/trigger deep scan
10. If deep scan: runs 1-4 hours → email when ready
11. Final report delivered (full details, PoCs, fixes, PDF)

### Outbound flow (you find them):

1. You identify target (Product Hunt, Twitter, etc.)
2. Run scan through your own product (same flow)
3. Get results
4. Manually email founder with summary + link to results
5. They click link → same results page → can pay to unlock

### Scan states:

| Status | Meaning |
|--------|---------|
| `pending` | Submitted, waiting for worker |
| `running` | Worker picked it up, Strix executing |
| `completed` | Finished successfully |
| `failed` | Error occurred, user notified |

---

## Pricing & Tiers

### Three tiers:

| Tier | Price | What they get |
|------|-------|---------------|
| **Free** | $0 | Quick scan summary — titles, severity, endpoints (details hidden) |
| **Unlock** | $149 | Full quick scan details + PoCs + fix guidance + PDF |
| **Deep** | $399 | All above + deep scan + executive summary + certificate + one free rescan |

### What's shown vs hidden:

| Element | Free | $149 | $399 |
|---------|------|------|------|
| Finding titles | ✓ | ✓ | ✓ |
| Severity level | ✓ | ✓ | ✓ |
| Affected endpoint | ✓ | ✓ | ✓ |
| One-line impact | ✓ | ✓ | ✓ |
| Reproduction steps | ✗ | ✓ | ✓ |
| Proof-of-concept | ✗ | ✓ | ✓ |
| Fix guidance | ✗ | ✓ | ✓ |
| PDF export | ✗ | ✓ | ✓ |
| OWASP category tags | ✗ | ✓ | ✓ |
| Deep scan findings | ✗ | ✗ | ✓ |
| Executive summary | ✗ | ✗ | ✓ |
| Security certificate | ✗ | ✗ | ✓ |
| One free rescan | ✗ | ✗ | ✓ |

### "Nothing found" scenarios:

- **Quick scan, nothing found:** Show "No obvious issues detected" + upsell deep scan only (skip $149 tier since nothing to unlock)
- **Deep scan, nothing found:** Deliver certificate "Verified Secure by [Product]" — this is the value

### Payment flow:

- Stripe Checkout (hosted page)
- Webhook on payment success → unlock results / trigger deep scan

---

## Technical Architecture

### Stack:

| Layer | Choice |
|-------|--------|
| Backend | Python + FastAPI |
| Frontend | Next.js + Tailwind + shadcn/ui |
| Database | SQLite (MVP) → Postgres later |
| Queue | DB polling (simple worker) |
| Email | Resend |
| Payments | Stripe Checkout |
| Hosting | Railway (backend + worker) + Vercel (frontend) |
| Scanning | Strix (Docker container) |

### Backend components:

```
/api
  POST /scans          → Submit new scan
  GET  /scans/:id      → Get scan status/results
  POST /webhooks/stripe → Handle payment

/worker
  Poll DB for pending scans
  Invoke Strix via CLI
  Parse results, store in DB
  Send completion email
```

### Database schema:

```sql
scans:
  id              TEXT PRIMARY KEY
  email           TEXT NOT NULL
  target_url      TEXT NOT NULL
  status          TEXT DEFAULT 'pending'  -- pending/running/completed/failed
  scan_type       TEXT DEFAULT 'quick'    -- quick/deep
  results_json    TEXT
  created_at      TIMESTAMP
  completed_at    TIMESTAMP
  paid_tier       TEXT                    -- null/unlock/deep
  stripe_payment_id TEXT

rate_limits:
  email           TEXT PRIMARY KEY
  scan_count      INTEGER DEFAULT 0
  month           TEXT                    -- YYYY-MM format
```

### Strix invocation:

```bash
# Quick scan
STRIX_LLM="openai/gpt-4o-mini" strix -n \
  --target https://example.com \
  --scan-mode quick \
  --timeout 1200

# Deep scan
STRIX_LLM="anthropic/claude-sonnet-4-5" strix -n \
  --target https://example.com \
  --scan-mode deep \
  --timeout 14400
```

### Scan modes (from Strix docs):

| Mode | Duration | Use case |
|------|----------|----------|
| `quick` | ~5-15 minutes | Free tier, fast checks |
| `standard` | 30 min - 1 hour | (Not used in MVP) |
| `deep` | 1-4 hours | Paid tier, thorough testing |

### Cost controls:

- Quick scan: 20 min timeout, GPT-4o-mini
- Deep scan: 4 hour timeout, Claude Sonnet 4.5
- Target cost: ~$20-25 for quick, ~$50-150 for deep

---

## Pages & UI Structure

### Pages to build:

| Page | Purpose |
|------|---------|
| `/` | Landing page — hero, form, how it works, pricing, FAQ |
| `/scan/[id]` | Scan status — shows progress while running |
| `/results/[id]` | Results page — findings + paywall + checkout buttons |
| `/results/[id]/full` | Full report — unlocked after payment |
| `/checkout/success` | Post-payment confirmation |
| `/scope` | What we test / don't test |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |

### Landing page sections:

1. **Hero** — Headline + subhead + scan form (URL + email + consent checkbox)
2. **How it works** — 3 steps: Submit → Scan → Results
3. **What we check** — Vulnerability categories (auth, APIs, injection, etc.)
4. **Pricing** — Three tier cards
5. **FAQ** — Common questions
6. **Footer** — Links to scope, terms, privacy

### Landing page copy:

- **Headline:** "See what attackers see — before they do"
- **Subhead:** "Automated external security scan for your app. Results in minutes, not weeks."
- **CTA:** "Scan your app free"

### Results page layout:

```
┌─────────────────────────────────────────┐
│ Scan complete for: example.com          │
│ Risk level: [HIGH]                      │
├─────────────────────────────────────────┤
│ Finding 1: Unauthenticated API endpoint │
│ Severity: Critical | Endpoint: /api/... │
│ Impact: Could expose user data          │
│ [Details locked 🔒]                     │
├─────────────────────────────────────────┤
│ Finding 2: ...                          │
├─────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────┐       │
│ │ Unlock $149 │  │ Deep $399   │       │
│ └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────┘
```

### Email templates:

1. **Scan started** — "We're scanning [url]. You'll hear from us in ~5-15 min."
2. **Scan complete** — "Results ready for [url]. [X] issues found. View results: [link]"
3. **Scan failed** — "Something went wrong. Try again: [link]"
4. **Payment received** — "Thanks! Your full report: [link]"
5. **Deep scan started** — "Deep analysis started. Usually takes 1-4 hours."
6. **Deep scan complete** — "Your deep analysis is ready: [link]"

---

## Legal & Consent

### Consent checkbox (required on form):

> "I confirm I own this application or have explicit written permission to perform security testing on it."

### Scope statement page (`/scope`):

**What we DO:**
- Scan publicly accessible URLs and endpoints
- Test for common vulnerabilities (auth, injection, SSRF, etc.)
- Attempt proof-of-concept validation (non-destructive)
- Provide fix guidance for issues found

**What we DON'T:**
- Access anything behind authentication
- Perform denial-of-service attacks
- Brute force credentials
- Exfiltrate or store your application's data
- Social engineering
- Test infrastructure (servers, DNS, etc.)

### Terms of Service (key points):

- You must have permission to test the target
- We're not liable for how you use findings
- No guarantee we find all vulnerabilities
- No refunds if no vulnerabilities found (you paid for assessment)
- We may refuse service at our discretion

### Privacy policy (key points):

- We collect: email, target URL, scan results
- We don't collect: your users' data, passwords, sensitive app data
- Results stored: 30 days (free) / indefinitely (paid)
- We don't sell data

---

## Defaults & Edge Cases

### Rate limiting:
- 3 free scans per email per month
- Counter stored in DB, resets monthly

### Scan failures:
- Auto-retry once
- If still fails → email user "scan failed, try again" with retry link
- Paid scans that fail → automatic Stripe refund

### Result expiry:
- Free scan results: 30 days
- Paid results: forever

### Timeout enforcement:
- Quick scan: 20 min hard cap
- Deep scan: 4 hour hard cap
- Kill Strix process if exceeded, return partial results if any

---

## What's OUT of MVP

| Feature | Why it's out |
|---------|--------------|
| User accounts / login | Email + unique links are enough |
| Dashboard / scan history | One scan, one result |
| Team features | Solo users only |
| CI/CD integration | Post-MVP |
| Gray-box / white-box testing | Black-box only, no credentials |
| API access | Manual only |
| Custom scan instructions | Fixed behavior |
| Multiple targets per scan | One URL per scan |
| Scheduled / recurring scans | Manual only |
| Webhooks / integrations | No Slack, Jira, etc. |
| Standard scan mode | Just quick + deep |
| Rescan (except $399 tier) | Pay again or upgrade |
| Mobile app | Web only |

---

## Post-MVP Roadmap

### Phase 2 (after MVP validated):

| Feature | Value |
|---------|-------|
| User accounts + scan history | Retention, returning users |
| Subscriptions (monthly plans) | Recurring revenue |
| One-click rescan | Convenience |
| Gray-box testing | Deeper scans, higher price point |
| Standard scan mode tier | Middle option |

### Phase 3 (growth):

| Feature | Value |
|---------|-------|
| CI/CD integration (GitHub Action) | Stickiness, workflow integration |
| API access | Power users, automation |
| Team features | Bigger customers |
| Slack/Jira integrations | Enterprise appeal |

### Phase 4 (scale):

| Feature | Value |
|---------|-------|
| White-box testing (repo scans) | Full platform |
| Compliance reports (SOC 2) | High-ticket sales |
| White-label / agency mode | New market |
| Custom scan rules | Enterprise |

---

## Timeline

**Target: ~2 weeks to MVP**

Week 1:
- Backend: FastAPI setup, DB schema, scan submission, worker skeleton
- Frontend: Landing page, scan form, confirmation page
- Strix integration: Basic invocation working

Week 2:
- Results page with paywall
- Stripe integration
- Email notifications
- Polish and deploy
- First outreach

---

## Summary

**What you're building:** A SaaS that lets founders scan their apps for security issues. Powered by Strix. Black-box only. Two-phase: free quick scan → paid deep analysis.

**Stack:** FastAPI + Next.js + Tailwind/shadcn + SQLite + Resend + Stripe + Railway/Vercel

**Pricing:** Free (teaser) → $149 (unlock) → $399 (deep + certificate)

**Success:** First 10 paid reports, validate conversion rate, keep costs manageable
