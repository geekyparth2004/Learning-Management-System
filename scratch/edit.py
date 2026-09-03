import re

with open('components/landing/HeroLanding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    'import React, { useState, useEffect, useRef } from "react";\nimport Link from "next/link";',
    'import React, { useState, useEffect, useRef } from "react";\nimport Link from "next/link";\nimport Script from "next/script";\nimport { useSession } from "next-auth/react";\nimport RegisterModal from "./RegisterModal";'
)

# 2. PricingSection props
content = content.replace(
    'function PricingSection() {',
    'function PricingSection({ onGetStarted }: { onGetStarted: () => void }) {'
)

# 3. PricingSection button
content = content.replace(
    '<Link\n              href="/register"\n              className="group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 via-orange-500 to-red-600 px-8 py-4 text-base font-bold text-white shadow-[0_0_40px_rgba(255,49,49,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(255,49,49,0.5)] w-full"\n            >\n              <Zap className="h-5 w-5" />\n              Get Started Now\n              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />\n              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">\n                <div className="relative h-full w-10 bg-white/20" />\n              </div>\n            </Link>',
    '<button\n              onClick={onGetStarted}\n              className="group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 via-orange-500 to-red-600 px-8 py-4 text-base font-bold text-white shadow-[0_0_40px_rgba(255,49,49,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(255,49,49,0.5)] w-full"\n            >\n              <Zap className="h-5 w-5" />\n              Get Started Now\n              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />\n              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">\n                <div className="relative h-full w-10 bg-white/20" />\n              </div>\n            </button>'
)

# 4. CTASection props
content = content.replace(
    'function CTASection() {',
    'function CTASection({ onGetStarted }: { onGetStarted: () => void }) {'
)

# 5. CTASection button
content = content.replace(
    '<Link\n            href="/register"\n            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-8 py-4 text-base font-bold text-gray-950 shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all hover:scale-[1.05] hover:shadow-[0_0_50px_rgba(255,255,255,0.25)]"\n          >\n            Get Started — ₹3,999/yr\n            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />\n            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">\n              <div className="relative h-full w-10 bg-gradient-to-r from-transparent via-orange-300/30 to-transparent" />\n            </div>\n          </Link>',
    '<button\n            onClick={onGetStarted}\n            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-8 py-4 text-base font-bold text-gray-950 shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all hover:scale-[1.05] hover:shadow-[0_0_50px_rgba(255,255,255,0.25)]"\n          >\n            Get Started — ₹3,999/yr\n            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />\n            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">\n              <div className="relative h-full w-10 bg-gradient-to-r from-transparent via-orange-300/30 to-transparent" />\n            </div>\n          </button>'
)

# 6. HeroLanding main setup
new_hero_setup = '''export default function HeroLanding() {
  const { data: session, status } = useSession();
  const [showRegister, setShowRegister] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      if (!res.ok) {
        setIsProcessing(false);
        return;
      }

      const data = await res.json();
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "KodeCraft",
        description: "KodeCraft Pro — 1 Year Access",
        order_id: data.order_id,
        handler: async function (response: any) {
          setIsProcessing(true);
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (verifyRes.ok) {
              window.location.href = "/";
            } else {
              setIsProcessing(false);
            }
          } catch (err) {
            setIsProcessing(false);
          }
        },
        theme: { color: "#ef4444" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", () => setIsProcessing(false));
      rzp.open();
    } catch (err) {
      setIsProcessing(false);
    }
  };

  const handleGetStarted = () => {
    if (status === "loading") return;
    if (session) {
      handleCheckout();
    } else {
      setShowRegister(true);
    }
  };
'''

content = content.replace(
    '''export default function HeroLanding() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });''',
    new_hero_setup
)

# 7. Add tags to render
content = content.replace(
    '<div className="relative flex min-h-screen flex-col overflow-hidden bg-[#050508] font-sans selection:bg-red-500/30">\n      <CursorGlow />',
    '<div className="relative flex min-h-screen flex-col overflow-hidden bg-[#050508] font-sans selection:bg-red-500/30">\n      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />\n      <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} onSuccess={() => {\n        setShowRegister(false);\n        handleCheckout();\n      }} />\n      <CursorGlow />'
)

# Pass props
content = content.replace(
    '<PricingSection />',
    '<PricingSection onGetStarted={handleGetStarted} />'
)
content = content.replace(
    '<CTASection />',
    '<CTASection onGetStarted={handleGetStarted} />'
)

# 8. Update Nav link
content = content.replace(
    '<Link\n            href="/register"\n            className="hidden sm:inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_25px_rgba(255,49,49,0.35)] transition-all hover:scale-105 hover:shadow-[0_0_35px_rgba(255,49,49,0.5)]"\n          >\n            Get Started\n            <ArrowRight className="h-4 w-4" />\n          </Link>',
    '<button\n            onClick={handleGetStarted}\n            className="hidden sm:inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_25px_rgba(255,49,49,0.35)] transition-all hover:scale-105 hover:shadow-[0_0_35px_rgba(255,49,49,0.5)]"\n          >\n            Get Started\n            <ArrowRight className="h-4 w-4" />\n          </button>'
)

# 9. Update Hero link
content = content.replace(
    '<Link\n              href="/register"\n              className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-red-600 px-9 py-4 text-base font-bold text-white shadow-[0_0_40px_rgba(255,49,49,0.35)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(255,49,49,0.5)]"\n            >\n              <Zap className="h-5 w-5" />\n              Start Learning Now\n              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">\n                <div className="relative h-full w-10 bg-white/20" />\n              </div>\n            </Link>',
    '<button\n              onClick={handleGetStarted}\n              className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-red-600 px-9 py-4 text-base font-bold text-white shadow-[0_0_40px_rgba(255,49,49,0.35)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(255,49,49,0.5)]"\n            >\n              <Zap className="h-5 w-5" />\n              Start Learning Now\n              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">\n                <div className="relative h-full w-10 bg-white/20" />\n              </div>\n            </button>'
)

with open('components/landing/HeroLanding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Python replacement completed.")
