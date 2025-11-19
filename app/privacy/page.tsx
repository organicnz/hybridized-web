import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Privacy Policy
          </h1>

          <div className="space-y-6 text-white/90">
            <section>
              <h2 className="text-2xl font-semibold text-purple-300 mb-3">
                Information We Collect
              </h2>
              <p className="leading-relaxed">
                When you create an account on Hybridized, we collect your email
                address, name, and profile information. We use this information
                to provide you with access to our music discovery platform and
                personalize your experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">
                How We Use Your Information
              </h2>
              <p className="leading-relaxed mb-3">
                Your information is used to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and maintain your account</li>
                <li>Enable access to hybrid sounds and interactive features</li>
                <li>Communicate important updates about the platform</li>
                <li>Improve our services and user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">
                Data Security
              </h2>
              <p className="leading-relaxed">
                We use Supabase for authentication and data storage, which
                provides enterprise-grade security. Your password is encrypted,
                and we never store it in plain text. All data transmission is
                encrypted using SSL/TLS.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">
                Third-Party Services
              </h2>
              <p className="leading-relaxed">
                We use Supabase for backend services and Vercel for hosting.
                These services may collect anonymous usage data to improve their
                platforms. We do not share your personal information with third
                parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">
                Your Rights
              </h2>
              <p className="leading-relaxed mb-3">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Update or correct your information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">
                Cookies
              </h2>
              <p className="leading-relaxed">
                We use essential cookies to maintain your session and
                authentication state. These are necessary for the platform to
                function properly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">
                Contact Us
              </h2>
              <p className="leading-relaxed">
                If you have questions about this privacy policy or your data,
                please{" "}
                <Link
                  href="/contact"
                  className="text-green-400 hover:text-green-300 underline"
                >
                  contact us
                </Link>
                .
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-white/10 text-sm text-white/50">
              Last updated: November 18, 2025
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
