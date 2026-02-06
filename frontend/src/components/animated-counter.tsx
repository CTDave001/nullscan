"use client"

import { useEffect, useRef, useState } from "react"

interface AnimatedCounterProps {
  end: number
  label: string
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
}

export function AnimatedCounter({
  end,
  label,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 2000,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            animateCount()
          }
        })
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnimated])

  const animateCount = () => {
    const startTime = performance.now()
    const startValue = 0

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function - ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (end - startValue) * easeOut

      setCount(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }

  const formatNumber = (num: number) => {
    if (decimals > 0) {
      return num.toFixed(decimals)
    }
    return Math.floor(num).toLocaleString()
  }

  return (
    <div ref={ref} className="text-center">
      <p
        className="text-2xl sm:text-3xl 2xl:text-4xl font-mono font-bold mb-1"
        style={{ color: "var(--cyan)" }}
      >
        {prefix}
        {formatNumber(count)}
        {suffix}
      </p>
      <p
        className="font-mono text-[10px] 2xl:text-xs uppercase tracking-wider"
        style={{ color: "var(--text-dim)" }}
      >
        {label}
      </p>
    </div>
  )
}
