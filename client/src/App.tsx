import React, { useState, useEffect } from "react";
import { TelegramProvider } from "./context/TelegramContext";
import { QTX_PLANS, type QTXPlan } from "./data/qtxData";
import { BuyerToast } from "./components/BuyerToast";
import { HeroHeader } from "./components/HeroHeader";
import { TerminalLivePreview } from "./components/TerminalLivePreview";
import { PlanCard } from "./components/PlanCard";
import { ActivationProtocol } from "./components/ActivationProtocol";
import { ReviewsAndFeedback } from "./components/ReviewsAndFeedback";
import { StickyCtaBar } from "./components/StickyCtaBar";
import { QTXCheckoutModal } from "./components/QTXCheckoutModal";
import { SoftwareTerminal } from "./components/SoftwareTerminal";
import { AnimatedReveal } from "./components/AnimatedReveal";

const isTerminalRoute = () => {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("app") === "terminal" ||
    params.get("mode") === "terminal" ||
    window.location.pathname.startsWith("/terminal")
  );
};

const QTXAppContent: React.FC = () => {
  // Direct app mode: Main Purchase App vs Dedicated Terminal App
  const isTerminalApp = isTerminalRoute();
  const [selectedPlan, setSelectedPlan] = useState<QTXPlan | null>(null);
  const [terminalUserId, setTerminalUserId] = useState<string>("");
  const [terminalPassword, setTerminalPassword] = useState<string>("");

  useEffect(() => {
    const savedId = localStorage.getItem("qox_user_id") || localStorage.getItem("qox_license_key") || localStorage.getItem("varshit_license_key");
    const savedPass = localStorage.getItem("qox_password");
    if (savedId) {
      setTerminalUserId(savedId);
      if (savedPass) setTerminalPassword(savedPass);
    }
  }, []);

  const handleScrollToPlans = () => {
    const el = document.getElementById("plans-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      setSelectedPlan(QTX_PLANS.find((p) => p.tag === "ENLIGHTENED") || QTX_PLANS[1]);
    }
  };

  // ========================================================
  // DEDICATED APP 2: QOX SOFTWARE TERMINAL (STANDALONE APP)
  // ========================================================
  if (isTerminalApp) {
    return (
      <SoftwareTerminal
        initialUserId={terminalUserId}
        initialPassword={terminalPassword}
        onExit={() => {
          window.location.href = "/";
        }}
        onBuyPlan={() => {
          window.location.href = "/";
        }}
      />
    );
  }

  // ========================================================
  // DEDICATED APP 1: QOX MAIN PURCHASE APP (STANDALONE STORE)
  // ========================================================
  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#050a07",
      color: "#ffffff",
      position: "relative",
      overflowX: "hidden",
    }}>
      {/* Permanent Fixed Live Buyer Capsule (Always fixed at top across scroll) */}
      <BuyerToast />

      {/* Main Container */}
      <div style={{
        maxWidth: "460px",
        margin: "0 auto",
        padding: "0 12px",
        position: "relative",
        zIndex: 2,
        width: "100%",
        boxSizing: "border-box",
      }}>
        {/* Top Space for Buyer Capsule */}
        <div style={{ height: "46px" }} />

        {/* Hero Section: Live Radar + QOX Emblem + Stats + Brokers */}
        <AnimatedReveal initialAnimate delay={100}>
          <HeroHeader />
        </AnimatedReveal>

        {/* Live Interactive Terminal Preview: "What You Are Unlocking" */}
        <AnimatedReveal initialAnimate delay={200}>
          <TerminalLivePreview />
        </AnimatedReveal>

        {/* Section Divider & Headline for Plans */}
        <AnimatedReveal delay={220}>
          <div style={{ textAlign: "center", margin: "24px 0 16px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              maxWidth: "260px",
              margin: "0 auto 8px",
            }}>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(0, 255, 136, 0.4))" }} />
              <span style={{ color: "#00ff88", fontSize: "0.85rem", lineHeight: 1 }}>✦</span>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(0, 255, 136, 0.4))" }} />
            </div>

            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}>
              CHOOSE YOUR ACCESS PLAN
            </h2>
            <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0 auto", maxWidth: "340px" }}>
              Instant license activation via UPI or USDT with manual bank statement confirmation.
            </p>
          </div>
        </AnimatedReveal>

        {/* The 3 Pricing Plans - Staggered slide in */}
        <div id="plans-section" style={{ position: "relative", zIndex: 5 }}>
          {QTX_PLANS.map((plan, index) => (
            <AnimatedReveal
              key={plan.id}
              initialAnimate={index < 2}
              delay={index === 0 ? 250 : index === 1 ? 400 : 150}
            >
              <PlanCard
                plan={plan}
                onSelectPlan={(p) => setSelectedPlan(p)}
              />
            </AnimatedReveal>
          ))}
        </div>

        {/* Official 3-Step Activation Protocol */}
        <AnimatedReveal delay={80}>
          <ActivationProtocol />
        </AnimatedReveal>

        {/* Contact Us + User Reviews + FAQ Accordion + Send Feedback Form */}
        <ReviewsAndFeedback />
      </div>

      {/* Sticky Bottom Floating Bar for Fast Conversion */}
      <StickyCtaBar onChoosePlan={handleScrollToPlans} />

      {/* Luxury Checkout Modal */}
      <QTXCheckoutModal
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <TelegramProvider>
      <QTXAppContent />
    </TelegramProvider>
  );
}
