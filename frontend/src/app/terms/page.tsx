export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-slate">
          <h2>Authorization</h2>
          <p>
            By using this service, you confirm that you own the application
            being tested or have explicit written permission from the owner to
            perform security testing.
          </p>

          <h2>Liability</h2>
          <p>
            We are not liable for how you use the findings from our scans. You
            are responsible for using this information ethically and legally.
          </p>

          <h2>No Guarantees</h2>
          <p>
            We do not guarantee that our scans will find all vulnerabilities.
            Our service is designed to identify common security issues but
            should not be considered a replacement for comprehensive security
            audits.
          </p>

          <h2>Refund Policy</h2>
          <p>
            No refunds are provided if no vulnerabilities are found. You are
            paying for a security assessment, not for finding bugs.
          </p>

          <h2>Service Refusal</h2>
          <p>We reserve the right to refuse service at our discretion.</p>
        </div>
      </div>
    </main>
  );
}
