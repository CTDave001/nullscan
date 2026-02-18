import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Terms of Service | Nullscan",
  description:
    "Terms of service for Nullscan. Authorization requirements, liability, and usage policies for our security scanning service.",
  alternates: {
    canonical: "https://nullscan.io/terms",
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-[var(--text)]">Authorization</h2>
            <p className="text-[var(--text-secondary)]">
              By using this service, you confirm that you own the application
              being tested or have explicit written permission from the owner to
              perform security testing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-[var(--text)]">Liability</h2>
            <p className="text-[var(--text-secondary)]">
              We are not liable for how you use the findings from our scans. You
              are responsible for using this information ethically and legally.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-[var(--text)]">No Guarantees</h2>
            <p className="text-[var(--text-secondary)]">
              We do not guarantee that our scans will find all vulnerabilities.
              Our service is designed to identify common security issues but
              should not be considered a replacement for comprehensive security
              audits.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-[var(--text)]">Refund Policy</h2>
            <p className="text-[var(--text-secondary)]">
              No refunds are provided if no vulnerabilities are found. You are
              paying for a security assessment, not for finding bugs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-[var(--text)]">Service Refusal</h2>
            <p className="text-[var(--text-secondary)]">We reserve the right to refuse service at our discretion.</p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
