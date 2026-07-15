// First-party analytics: funnel tracking + traffic-source attribution.
//
// Sends events to our own backend (POST /events) rather than relying solely on Google
// Analytics — a security/dev audience blocks GA heavily, so first-party is the source of
// truth. GA events are still fired (best-effort) for whoever isn't blocking it.

const API = process.env.NEXT_PUBLIC_API_URL

export interface Attribution {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  referrer?: string
  landing_page?: string
}

function randomId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

/** Stable per-visitor id, persisted across the session. */
export function getSessionId(): string {
  if (typeof window === "undefined") return ""
  let id = localStorage.getItem("ns_sid")
  if (!id) {
    id = randomId()
    localStorage.setItem("ns_sid", id)
  }
  return id
}

/**
 * Capture first-touch attribution once and reuse it for the whole visitor lifetime.
 * Call this early (e.g. on landing-page mount) so the source is recorded before the
 * user navigates and loses the UTM params / referrer.
 */
export function captureAttribution(): Attribution {
  if (typeof window === "undefined") return {}

  const existing = localStorage.getItem("ns_attr")
  if (existing) {
    try {
      return JSON.parse(existing) as Attribution
    } catch {
      /* fall through and re-capture */
    }
  }

  const params = new URLSearchParams(window.location.search)
  const attr: Attribution = {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
    referrer: document.referrer || undefined,
    landing_page: window.location.pathname + window.location.search,
  }
  localStorage.setItem("ns_attr", JSON.stringify(attr))
  return attr
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {}
  const stored = localStorage.getItem("ns_attr")
  if (stored) {
    try {
      return JSON.parse(stored) as Attribution
    } catch {
      /* ignore */
    }
  }
  return captureAttribution()
}

/** Fire a funnel event to our backend (robust) and Google Analytics (best-effort). */
export function track(
  name: string,
  props?: Record<string, unknown>,
  scanId?: string,
): void {
  if (typeof window === "undefined") return

  // Google Analytics (blocked for many; best-effort only).
  try {
    ;(window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.(
      "event",
      name,
      props ?? {},
    )
  } catch {
    /* ignore */
  }

  if (!API) return
  const attr = getAttribution()
  try {
    const body = JSON.stringify({
      session_id: getSessionId(),
      name,
      scan_id: scanId,
      props,
      path: window.location.pathname,
      referrer: attr.referrer,
      utm_source: attr.utm_source,
      utm_medium: attr.utm_medium,
      utm_campaign: attr.utm_campaign,
    })
    // keepalive lets the request survive a navigation (e.g. tracking a click that
    // routes away). Failures are swallowed — analytics must never break the app.
    void fetch(`${API}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* ignore */
  }
}

// ── Autocapture ───────────────────────────────────────────────────────────────
// Records every meaningful click/interaction automatically, so we don't have to
// hand-instrument each element. NEVER captures input *values* — only element metadata.

const INTERACTIVE_SELECTOR =
  "a, button, [role=button], [role=link], input[type=submit], input[type=button], [data-track]"

function describeElement(el: Element): Record<string, unknown> {
  const tag = el.tagName.toLowerCase()
  const props: Record<string, unknown> = { tag }

  const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80)
  if (text) props.text = text

  const id = (el as HTMLElement).id
  if (id) props.id = id

  const trackId = el.getAttribute("data-track")
  if (trackId) props.track_id = trackId

  const aria = el.getAttribute("aria-label")
  if (aria) props.aria = aria.slice(0, 80)

  if (tag === "a") {
    const href = (el as HTMLAnchorElement).getAttribute("href")
    if (href) props.href = href.slice(0, 200)
  }

  // Form controls: metadata only — deliberately no value, to avoid capturing PII.
  if (tag === "input" || tag === "textarea" || tag === "select") {
    const input = el as HTMLInputElement
    if (input.name) props.name = input.name
    if (input.type) props.input_type = input.type
  }

  return props
}

let autocaptureInited = false

/** Attach a global click listener that logs every interactive click. Idempotent. */
export function initAutocapture(): void {
  if (typeof window === "undefined" || autocaptureInited) return
  autocaptureInited = true

  document.addEventListener(
    "click",
    (e) => {
      try {
        const target = e.target as Element | null
        if (!target || typeof target.closest !== "function") return
        const el = target.closest(INTERACTIVE_SELECTOR)
        if (!el) return
        const name = el.getAttribute("data-track") || "click"
        track(name, describeElement(el))
      } catch {
        /* analytics must never break interaction */
      }
    },
    { capture: true },
  )
}

/** Record a pageview (call on route change). */
export function trackPageview(path?: string): void {
  track("pageview", {
    path: path ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
  })
}
