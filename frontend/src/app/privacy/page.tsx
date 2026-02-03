export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-slate">
          <h2>What we collect</h2>
          <ul>
            <li>Email address (to send results)</li>
            <li>Target URL (to perform the scan)</li>
            <li>Scan results (findings from the security assessment)</li>
          </ul>

          <h2>What we don&apos;t collect</h2>
          <ul>
            <li>Your users&apos; data</li>
            <li>Passwords or credentials</li>
            <li>Sensitive application data</li>
          </ul>

          <h2>Data retention</h2>
          <ul>
            <li>Free scan results: 30 days</li>
            <li>Paid scan results: indefinitely</li>
          </ul>

          <h2>Data sharing</h2>
          <p>
            We do not sell or share your data with third parties. Scan results
            are only accessible via unique, unguessable links.
          </p>
        </div>
      </div>
    </main>
  );
}
