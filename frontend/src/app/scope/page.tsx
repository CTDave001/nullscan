export default function ScopePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">What We Test</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-green-600">
            What we DO
          </h2>
          <ul className="space-y-2 text-slate-600">
            <li>Scan publicly accessible URLs and endpoints</li>
            <li>
              Test for common vulnerabilities (authentication, injection, SSRF,
              etc.)
            </li>
            <li>Attempt proof-of-concept validation (non-destructive)</li>
            <li>Provide fix guidance for issues found</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-red-600">
            What we DON&apos;T do
          </h2>
          <ul className="space-y-2 text-slate-600">
            <li>Access anything behind authentication</li>
            <li>Perform denial-of-service attacks</li>
            <li>Brute force credentials</li>
            <li>Exfiltrate or store your application&apos;s data</li>
            <li>Social engineering</li>
            <li>Test infrastructure (servers, DNS, etc.)</li>
          </ul>
        </section>

        <p className="text-slate-500 text-sm">
          Our scans are non-destructive and designed to identify vulnerabilities
          without causing harm to your application or its users.
        </p>
      </div>
    </main>
  );
}
