import { ScanForm } from "@/components/scan-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#18181b] text-[#fafafa]">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          See what attackers see
          <br />
          <span className="text-[#d4a853]">before they do</span>
        </h1>
        <p className="text-xl text-[#a1a1aa] mb-8 max-w-2xl mx-auto">
          You ship fast. Argus makes sure you ship safe.
        </p>

        <div className="flex justify-center">
          <ScanForm />
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#27272a] border border-[#d4a853] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#d4a853] font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Submit your URL</h3>
            <p className="text-[#a1a1aa]">
              Enter your app URL and email. We only test public endpoints.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#27272a] border border-[#d4a853] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#d4a853] font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">Argus scans</h3>
            <p className="text-[#a1a1aa]">
              Our AI-powered scanner checks for common vulnerabilities.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#27272a] border border-[#d4a853] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#d4a853] font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Get results</h3>
            <p className="text-[#a1a1aa]">
              Receive a report with findings and fix guidance.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-16 bg-[#27272a] rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-[#18181b] p-6 rounded-lg border border-[#3f3f46]">
            <h3 className="font-semibold text-lg mb-2">Free Scan</h3>
            <p className="text-3xl font-bold mb-4">$0</p>
            <ul className="space-y-2 text-[#a1a1aa] text-sm">
              <li>Quick external scan</li>
              <li>Finding titles and severity</li>
              <li>Affected endpoints</li>
              <li className="text-[#52525b]">Details locked</li>
            </ul>
          </div>
          <div className="bg-[#18181b] p-6 rounded-lg border-2 border-[#d4a853]">
            <h3 className="font-semibold text-lg mb-2 text-[#d4a853]">Unlock Report</h3>
            <p className="text-3xl font-bold mb-4">$149</p>
            <ul className="space-y-2 text-[#a1a1aa] text-sm">
              <li>Everything in Free</li>
              <li>Reproduction steps</li>
              <li>Proof-of-concept code</li>
              <li>Fix guidance</li>
              <li>PDF export</li>
            </ul>
          </div>
          <div className="bg-[#18181b] p-6 rounded-lg border border-[#3f3f46]">
            <h3 className="font-semibold text-lg mb-2">Deep Analysis</h3>
            <p className="text-3xl font-bold mb-4">$399</p>
            <ul className="space-y-2 text-[#a1a1aa] text-sm">
              <li>Everything in Unlock</li>
              <li>1-4 hour deep scan</li>
              <li>Executive summary</li>
              <li>Security certificate</li>
              <li>One free rescan</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-[#a1a1aa] text-sm">
        <div className="space-x-4">
          <a href="/scope" className="hover:text-[#d4a853]">
            What we test
          </a>
          <a href="/terms" className="hover:text-[#d4a853]">
            Terms
          </a>
          <a href="/privacy" className="hover:text-[#d4a853]">
            Privacy
          </a>
        </div>
      </footer>
    </main>
  );
}
