import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Nullscan",
  description:
    "Nullscan privacy policy — what data we collect during security scans, how we use it, how long we retain it, and how we protect your information.",
  alternates: {
    canonical: "https://nullscan.io/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Nullscan",
    description:
      "Nullscan privacy policy — what data we collect during security scans, how we use it, how long we retain it, and how we protect your information.",
    url: "https://nullscan.io/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-[var(--text)]">What we collect</h2>
            <ul className="space-y-2 text-[var(--text-secondary)]">
              <li>Email address (to send results)</li>
              <li>Target URL (to perform the scan)</li>
              <li>Scan results (findings from the security assessment)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-[var(--text)]">What we don&apos;t collect</h2>
            <ul className="space-y-2 text-[var(--text-secondary)]">
              <li>Your users&apos; data</li>
              <li>Passwords or credentials</li>
              <li>Sensitive application data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-[var(--text)]">Data retention</h2>
            <ul className="space-y-2 text-[var(--text-secondary)]">
              <li>Free scan results: 30 days</li>
              <li>Paid scan results: indefinitely</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-[var(--text)]">Data sharing</h2>
            <p className="text-[var(--text-secondary)]">
              We do not sell or share your data with third parties. Scan results
              are only accessible via unique, unguessable links.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
