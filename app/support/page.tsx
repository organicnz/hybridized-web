import Link from "next/link";
import { Mail, MessageCircle, Book, ArrowLeft } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <div className="container mx-auto px-4 py-16">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Support
          </h1>

          <p className="text-gray-300 text-lg mb-12">
            Need help? We're here for you. Choose the best way to get support.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Link
              href="/contact"
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 hover:bg-white/20 transition-all hover:scale-105"
            >
              <Mail className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Contact Us
              </h3>
              <p className="text-gray-300">
                Send us a message and we'll get back to you soon.
              </p>
            </Link>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
              <MessageCircle className="w-12 h-12 text-pink-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Community
              </h3>
              <p className="text-gray-300">
                Join our community for discussions and tips.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
              <Book className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Documentation
              </h3>
              <p className="text-gray-300">Browse our guides and tutorials.</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-2">
                  How do I explore hybrid sounds?
                </h3>
                <p className="text-gray-300">
                  Navigate to the home page to browse our collection of unique
                  musical hybrids. Each entry includes a formula and embedded
                  content.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-2">
                  Do I need an account?
                </h3>
                <p className="text-gray-300">
                  You can browse hybrids without an account, but creating one
                  unlocks additional features and personalization.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-2">
                  How can I support the platform?
                </h3>
                <p className="text-gray-300">
                  Visit our{" "}
                  <Link
                    href="/donation"
                    className="text-pink-400 hover:text-pink-300 underline"
                  >
                    donation page
                  </Link>{" "}
                  to learn about supporting Hybridized.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
