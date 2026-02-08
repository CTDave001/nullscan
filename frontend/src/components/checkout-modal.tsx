"use client"

import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { X, Lock, Shield, Check, CreditCard, Zap, AlertTriangle } from "lucide-react"

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  scanId: string
  targetUrl: string
  onSuccess: (childScanId?: string) => void
  preselectedTier?: "pro" | "deep"
}

interface TierOption {
  id: "unlock" | "pro" | "deep"
  name: string
  price: number
  description: string
  features: string[]
  highlighted?: boolean
}

const TIERS: TierOption[] = [
  {
    id: "unlock",
    name: "Unlock Report",
    price: 39,
    description: "Full details for this scan",
    features: [
      "Technical analysis",
      "Proof-of-concept code",
      "Fix guidance",
      "PDF export",
    ],
  },
  {
    id: "pro",
    name: "Pro Scan",
    price: 250,
    description: "Unlock + new comprehensive scan",
    features: [
      "Everything in Unlock",
      "300-iteration scan",
      "More attack vectors",
      "Detailed report",
    ],
    highlighted: true,
  },
  {
    id: "deep",
    name: "Deep Analysis",
    price: 899,
    description: "Unlock + thorough security audit",
    features: [
      "Everything in Pro",
      "500-iteration deep scan",
      "Full attack coverage",
      "Executive summary",
    ],
  },
]

function CheckoutForm({
  scanId,
  tier,
  onSuccess,
  onBack,
}: {
  scanId: string
  tier: TierOption
  onSuccess: (childScanId?: string) => void
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [succeeded, setSucceeded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsProcessing(true)
    setError(null)

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/results/${scanId}`,
      },
      redirect: "if_required",
    })

    if (submitError) {
      setError(submitError.message || "Payment failed")
      setIsProcessing(false)
      return
    }

    if (paymentIntent?.status === "succeeded") {
      // Confirm on backend
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/scans/${scanId}/confirm-payment?payment_intent_id=${paymentIntent.id}&tier=${tier.id}`,
          { method: "POST" }
        )
        if (!res.ok) throw new Error("Failed to confirm payment")

        const data = await res.json()
        setSucceeded(true)
        setTimeout(() => onSuccess(data.child_scan_id), 1500)
      } catch (err) {
        setError("Payment succeeded but failed to unlock. Please contact support.")
      }
    }

    setIsProcessing(false)
  }

  if (succeeded) {
    return (
      <div className="text-center py-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "var(--low-glow, rgba(34, 197, 94, 0.2))" }}
        >
          <Check className="w-8 h-8" style={{ color: "var(--low)" }} />
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>
          Payment Successful!
        </h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {tier.id === "pro" || tier.id === "deep"
            ? "Starting your scan..."
            : "Your report is being unlocked..."}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order summary */}
      <div
        className="p-4 rounded-[var(--radius)]"
        style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {tier.name}
          </span>
          <span className="font-mono font-bold" style={{ color: "var(--text)" }}>
            ${tier.price}
          </span>
        </div>
        <p className="text-xs" style={{ color: "var(--text-dim)" }}>
          {tier.description}
        </p>
      </div>

      {/* Payment Element */}
      <div className="stripe-element-container">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
          onLoadError={(error) => {
            console.error("PaymentElement load error:", error)
            setError("Failed to load payment form. Please refresh and try again.")
          }}
        />
      </div>

      {error && (
        <div
          className="p-3 rounded-[var(--radius-sm)] text-sm"
          style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--critical)" }}
        >
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1 py-3 rounded-[var(--radius-sm)] font-mono text-sm uppercase tracking-wider transition-all"
          style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 py-3 rounded-[var(--radius-sm)] font-mono text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          style={{
            backgroundColor: isProcessing ? "var(--text-dim)" : "var(--cyan)",
            color: "var(--void)",
          }}
        >
          {isProcessing ? (
            <>
              <div
                className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: "var(--void)", borderTopColor: "transparent" }}
              />
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Pay ${tier.price}
            </>
          )}
        </button>
      </div>

      <p className="text-center text-xs flex items-center justify-center gap-1" style={{ color: "var(--text-dim)" }}>
        <Shield className="w-3 h-3" />
        Secured by Stripe
      </p>
    </form>
  )
}

export function CheckoutModal({
  isOpen,
  onClose,
  scanId,
  targetUrl,
  onSuccess,
  preselectedTier,
}: CheckoutModalProps) {
  const [selectedTier, setSelectedTier] = useState<TierOption | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTier(null)
      setClientSecret(null)
      setError(null)
    }
  }, [isOpen])

  const handleSelectTier = async (tier: TierOption) => {
    setSelectedTier(tier)
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scans/${scanId}/create-payment-intent?tier=${tier.id}`,
        { method: "POST" }
      )
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error("Payment intent error:", errorData)
        throw new Error(errorData.detail || "Failed to create payment")
      }
      const data = await res.json()
      setClientSecret(data.client_secret)
    } catch (err) {
      console.error("Checkout error:", err)
      setSelectedTier(null)
      setError(err instanceof Error ? err.message : "Failed to initialize payment")
    } finally {
      setLoading(false)
    }
  }

  // Auto-select tier when preselectedTier is provided
  useEffect(() => {
    if (isOpen && preselectedTier && !selectedTier && !clientSecret) {
      const tier = TIERS.find((t) => t.id === preselectedTier)
      if (tier) handleSelectTier(tier)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, preselectedTier])

  const handleBack = () => {
    setSelectedTier(null)
    setClientSecret(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-[var(--radius)] my-auto animate-fade-in-up max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--cyan-glow)", border: "1px solid var(--cyan)" }}
            >
              <CreditCard className="w-4 h-4" style={{ color: "var(--cyan)" }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                {selectedTier ? "Complete Payment" : "Unlock Full Report"}
              </h3>
              <p className="text-xs font-mono truncate max-w-[200px]" style={{ color: "var(--text-muted)" }}>
                {targetUrl}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded transition-colors hover:bg-[var(--bg)]"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedTier ? (
            // Tier selection
            <div className="space-y-3">
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                Choose a plan to unlock technical details, proof-of-concept code, and remediation guidance.
              </p>

              {error && (
                <div
                  className="p-3 rounded-[var(--radius-sm)] text-sm mb-4"
                  style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--critical)" }}
                >
                  {error}
                </div>
              )}

              {TIERS.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => handleSelectTier(tier)}
                  disabled={loading}
                  className="w-full p-4 rounded-[var(--radius)] text-left transition-all hover:border-[var(--cyan)]"
                  style={{
                    backgroundColor: "var(--bg)",
                    border: tier.highlighted
                      ? "1px solid var(--cyan)"
                      : "1px solid var(--border)",
                    boxShadow: tier.highlighted ? "0 0 30px var(--cyan-glow)" : "none",
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-sm font-bold"
                        style={{ color: tier.highlighted ? "var(--cyan)" : "var(--text)" }}
                      >
                        {tier.name}
                      </span>
                      {tier.id === "deep" && (
                        <Zap className="w-3.5 h-3.5" style={{ color: "var(--medium)" }} />
                      )}
                      {tier.highlighted && (
                        <span
                          className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold"
                          style={{ backgroundColor: "var(--cyan)", color: "var(--void)" }}
                        >
                          Best Value
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-lg font-bold" style={{ color: "var(--text)" }}>
                      ${tier.price}
                    </span>
                  </div>
                  <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                    {tier.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tier.features.map((feature) => (
                      <span
                        key={feature}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: "var(--surface)", color: "var(--text-dim)" }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          ) : loading ? (
            // Loading state
            <div className="text-center py-12">
              <div
                className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
                style={{ borderColor: "var(--border)", borderTopColor: "var(--cyan)" }}
              />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Preparing checkout...
              </p>
            </div>
          ) : !stripePromise ? (
            // Stripe not configured
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 mx-auto mb-4" style={{ color: "var(--medium)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Payment system not configured. Please contact support.
              </p>
              <button
                onClick={handleBack}
                className="mt-4 px-4 py-2 rounded-[var(--radius-sm)] font-mono text-sm"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
              >
                Go Back
              </button>
            </div>
          ) : clientSecret ? (
            // Payment form
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#06b6d4",
                    colorBackground: "#18181b",
                    colorText: "#fafafa",
                    colorTextSecondary: "#71717a",
                    colorDanger: "#ef4444",
                    borderRadius: "6px",
                  },
                },
              }}
            >
              <CheckoutForm
                scanId={scanId}
                tier={selectedTier}
                onSuccess={onSuccess}
                onBack={handleBack}
              />
            </Elements>
          ) : null}
        </div>
      </div>
    </div>
  )
}
