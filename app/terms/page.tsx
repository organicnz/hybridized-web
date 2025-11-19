export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-lg p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Terms of Service
          </h1>

          <div className="space-y-6 text-white/70">
            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">
                1. Acceptance of Terms
              </h2>
              <p className="leading-relaxed">
                By accessing and using Hybridized, you accept and agree to be
                bound by the terms and provision of this agreement. If you do
                not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">
                2. Use License
              </h2>
              <p className="leading-relaxed mb-3">
                Permission is granted to temporarily access the materials on
                Hybridized for personal, non-commercial use only. This is the
                grant of a license, not a transfer of title, and under this
                license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to decompile or reverse engineer any software</li>
                <li>Remove any copyright or proprietary notations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">
                3. User Accounts
              </h2>
              <p className="leading-relaxed">
                When you create an account with us, you must provide accurate
                and complete information. You are responsible for safeguarding
                your account and for all activities that occur under your
                account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">
                4. Content
              </h2>
              <p className="leading-relaxed">
                Our service allows you to discover and explore hybrid music
                content. We do not claim ownership of any content you access
                through our platform. All music and media content remains the
                property of their respective owners.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">
                5. Privacy
              </h2>
              <p className="leading-relaxed">
                Your use of Hybridized is also governed by our Privacy Policy.
                Please review our Privacy Policy to understand our practices
                regarding the collection and use of your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">
                6. Limitations
              </h2>
              <p className="leading-relaxed">
                Hybridized shall not be held liable for any damages arising out
                of the use or inability to use the materials on our platform,
                even if we have been notified of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">
                7. Modifications
              </h2>
              <p className="leading-relaxed">
                We may revise these terms of service at any time without notice.
                By using this platform, you agree to be bound by the current
                version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">
                8. Contact
              </h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms of Service, please
                contact us through our contact page.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-white/10 text-sm text-white/50">
              <p>Last updated: November 18, 2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
