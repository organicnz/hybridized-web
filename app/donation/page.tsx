'use client'

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Heart, Coffee, Sparkles, Zap, Music, Headphones, Users, Globe, Shield, CreditCard } from "lucide-react";
import { useState } from "react";

const DONATION_TIERS = [
  {
    amount: 5,
    icon: Coffee,
    title: "Coffee Supporter",
    description: "Buy us a coffee",
    benefits: ["Our eternal gratitude", "Supporter badge"]
  },
  {
    amount: 25,
    icon: Sparkles,
    title: "Music Enthusiast",
    description: "Support our work",
    benefits: ["All previous benefits", "Early access to new hybrids", "Monthly newsletter"],
    popular: true
  },
  {
    amount: 50,
    icon: Headphones,
    title: "Sound Explorer",
    description: "Fuel innovation",
    benefits: ["All previous benefits", "Exclusive content access", "Vote on new features"]
  },
  {
    amount: 100,
    icon: Zap,
    title: "Platinum Patron",
    description: "Become a patron",
    benefits: ["All previous benefits", "Personal thank you", "Name in credits", "Priority support"]
  }
];

export default function DonationPage() {
  const [customAmount, setCustomAmount] = useState("");
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  const handleDonate = (amount: number) => {
    // Placeholder for payment integration
    console.log(`Donating $${amount}`);
    alert(`Thank you for your $${amount} donation! Payment integration coming soon.`);
  };

  const handleCustomDonate = () => {
    const amount = parseFloat(customAmount);
    if (amount && amount > 0) {
      handleDonate(amount);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Heart className="w-20 h-20 text-pink-400 mx-auto mb-6 animate-pulse" />
            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
              Support Hybridized
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              Help us continue creating innovative musical experiences, discovering unique hybrid sounds, 
              and pushing the boundaries of music exploration
            </p>
          </div>

          {/* Impact Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center">
              <Music className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white mb-1">500+</div>
              <div className="text-sm text-white/60">Hybrid Sounds</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center">
              <Users className="w-8 h-8 text-pink-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white mb-1">10K+</div>
              <div className="text-sm text-white/60">Community Members</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center">
              <Globe className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white mb-1">50+</div>
              <div className="text-sm text-white/60">Countries Reached</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center">
              <Headphones className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white mb-1">1M+</div>
              <div className="text-sm text-white/60">Plays</div>
            </div>
          </div>

          {/* Donation Tiers */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Choose Your Support Level</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {DONATION_TIERS.map((tier) => {
                const Icon = tier.icon;
                return (
                  <div
                    key={tier.amount}
                    onClick={() => setSelectedTier(tier.amount)}
                    className={`bg-white/5 backdrop-blur-sm rounded-2xl border p-8 text-center hover:scale-105 transition-all cursor-pointer ${
                      tier.popular
                        ? 'border-pink-400/50 ring-2 ring-pink-400/50 shadow-lg shadow-pink-400/20'
                        : selectedTier === tier.amount
                        ? 'border-purple-400/50 ring-2 ring-purple-400/50'
                        : 'border-white/10'
                    }`}
                  >
                    {tier.popular && (
                      <div className="mb-3 text-xs font-bold text-pink-400 uppercase tracking-wider">
                        Most Popular
                      </div>
                    )}
                    <Icon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">${tier.amount}</h3>
                    <p className="text-lg font-semibold text-white/90 mb-3">{tier.title}</p>
                    <p className="text-sm text-white/60 mb-4">{tier.description}</p>
                    <div className="space-y-2 mb-6">
                      {tier.benefits.map((benefit, idx) => (
                        <div key={idx} className="text-xs text-white/70 flex items-center gap-2">
                          <div className="w-1 h-1 bg-purple-400 rounded-full" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDonate(tier.amount);
                      }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:scale-105 transition-transform shadow-lg"
                    >
                      Select
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 md:p-12 mb-16">
            <h2 className="text-3xl font-bold text-white mb-4 text-center">Custom Amount</h2>
            <p className="text-white/60 text-center mb-8">Choose your own amount to support us</p>
            <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-lg">$</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    step="1"
                    className="w-full pl-8 pr-4 py-4 bg-black/40 border border-white/20 rounded-xl text-white text-lg placeholder:text-white/40 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all"
                  />
                </div>
              </div>
              <button
                onClick={handleCustomDonate}
                disabled={!customAmount || parseFloat(customAmount) <= 0}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Donate Now
              </button>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Why Support Us */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Heart className="w-7 h-7 text-pink-400" />
                Why Support Us?
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Music className="w-3 h-3 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold mb-1">Create More Content</div>
                    <div className="text-white/60 text-sm">Help us discover and create more innovative musical hybrids</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-pink-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold mb-1">New Features</div>
                    <div className="text-white/60 text-sm">Support the development of interactive tools and experiences</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Globe className="w-3 h-3 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold mb-1">Free & Accessible</div>
                    <div className="text-white/60 text-sm">Keep our platform free and accessible to music lovers worldwide</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-3 h-3 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold mb-1">Artist Collaborations</div>
                    <div className="text-white/60 text-sm">Enable us to work with more artists and creators</div>
                  </div>
                </li>
              </ul>
            </div>

            {/* Secure & Transparent */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Shield className="w-7 h-7 text-blue-400" />
                Secure & Transparent
              </h2>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    <h3 className="text-white font-semibold">Secure Payments</h3>
                  </div>
                  <p className="text-white/60 text-sm">
                    All donations are processed through secure payment gateways with industry-standard encryption
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Heart className="w-5 h-5 text-pink-400" />
                    <h3 className="text-white font-semibold">100% Goes to Development</h3>
                  </div>
                  <p className="text-white/60 text-sm">
                    Every dollar supports content creation, platform development, and community growth
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-5 h-5 text-blue-400" />
                    <h3 className="text-white font-semibold">Community Driven</h3>
                  </div>
                  <p className="text-white/60 text-sm">
                    Your support helps us build features requested by our community
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-white/50 text-xs">
                    Hybridized is a passion project dedicated to music exploration and innovation. 
                    Your donations help us continue this mission.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Other Ways to Support */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-400/20 p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Other Ways to Support</h2>
            <p className="text-white/70 mb-6 max-w-2xl mx-auto">
              Can't donate right now? You can still help us grow by sharing Hybridized with your friends, 
              following us on social media, or contributing to our community discussions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-semibold transition-all">
                Share on Social Media
              </button>
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-semibold transition-all">
                Join Our Community
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
