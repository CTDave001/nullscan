"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { captureAttribution, initAutocapture, trackPageview } from "@/lib/analytics"

/**
 * Mounts once at the app root: captures first-touch attribution, wires up click
 * autocapture, and records a pageview on every route change. Renders nothing.
 */
export function AnalyticsProvider() {
  const pathname = usePathname()

  useEffect(() => {
    captureAttribution()
    initAutocapture()
  }, [])

  useEffect(() => {
    trackPageview(pathname)
  }, [pathname])

  return null
}
