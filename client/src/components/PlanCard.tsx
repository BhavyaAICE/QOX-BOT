import React from "react";
import { Zap, Sparkles, Crown, Check, ArrowRight } from "lucide-react";
import type { QTXPlan } from "../data/qtxData";
import { getPlanInrAmount } from "../data/qtxData";
import { useTelegram } from "../context/TelegramContext";

interface PlanCardProps {
  plan: QTXPlan;
  onSelectPlan: (plan: QTXPlan) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, onSelectPlan }) => {
  const { haptic } = useTelegram();

  const inrAmount = getPlanInrAmount(plan).toLocaleString();

  // Custom metadata per plan tier
  const isEnlightened = plan.tag === "ENLIGHTENED";
  const isGrandmaster = plan.tag === "GRANDMASTER";

  const getTierBadge = () => {
    if (isEnlightened) return "MOST POPULAR · 78% OF TRADERS CHOOSE THIS";
    if (isGrandmaster) return "PERMANENT LIFETIME ALLOCATION";
    return "TACTICAL 10-DAY STARTER PASS";
  };

  const getDailyRateText = () => {
    if (isEnlightened) return "Only $10 / Day · Best Value (Save $300)";
    if (isGrandmaster) return "One-Time Payment · Zero Monthly Fees Forever";
    return "$20 / Day · Perfect For Testing Signals";
  };

  const renderIcon = () => {
    if (isGrandmaster) return <Crown size={16} color="#fbbf24" />;
    if (isEnlightened) return <Sparkles size={16} color="#00ff88" />;
    return <Zap size={16} color="#00ff88" />;
  };

  return (
    <div
      className={`plan-card ${isEnlightened ? "plan-card-popular" : ""}`}
      style={{
        position: "relative",
        marginTop: isEnlightened ? "30px" : "18px",
        marginBottom: "18px",
        width: "100%",
        boxSizing: "border-box",
        border: isEnlightened
          ? "2px solid #00ff88"
          : isGrandmaster
          ? "1.5px solid rgba(251, 191, 36, 0.45)"
          : "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: isEnlightened
          ? "0 16px 50px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 255, 136, 0.28)"
          : isGrandmaster
          ? "0 16px 45px rgba(0, 0, 0, 0.95), 0 0 25px rgba(251, 191, 36, 0.15)"
          : "0 10px 30px rgba(0, 0, 0, 0.8)",
        borderRadius: "16px",
        overflow: "hidden",
        backgroundColor: isEnlightened
          ? "rgba(10, 24, 17, 0.95)"
          : isGrandmaster
          ? "rgba(16, 18, 12, 0.95)"
          : "rgba(11, 18, 14, 0.92)",
      }}
    >
      {/* Top Banner Tag */}
      <div style={{
        padding: "7px 12px",
        backgroundColor: isEnlightened
          ? "#00ff88"
          : isGrandmaster
          ? "rgba(251, 191, 36, 0.18)"
          : "rgba(255, 255, 255, 0.05)",
        color: isEnlightened ? "#021609" : isGrandmaster ? "#fbbf24" : "#94a3b8",
        fontFamily: "var(--font-display)",
        fontWeight: 900,
        fontSize: "0.68rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: isEnlightened
          ? "none"
          : isGrandmaster
          ? "1px solid rgba(251, 191, 36, 0.3)"
          : "1px solid rgba(255, 255, 255, 0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          {renderIcon()}
          <span>{getTierBadge()}</span>
        </div>
        <span style={{ fontSize: "0.64rem", opacity: 0.85, fontWeight: 700 }}>
          {plan.duration}
        </span>
      </div>

      <div style={{ padding: "18px 16px" }}>
        {/* Tier Name & Subtitle */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "4px" }}>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.25rem",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          }}>
            {plan.tag}
          </h3>
          <span style={{
            fontSize: "0.72rem",
            color: isEnlightened ? "#00ff88" : isGrandmaster ? "#fbbf24" : "#94a3b8",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}>
            {plan.duration} ACCESS
          </span>
        </div>

        {/* Dual Pricing Display: USD & INR */}
        <div style={{
          display: "flex",
          alignItems: "baseline",
          gap: "8px",
          marginBottom: "6px",
          marginTop: "6px",
        }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(2rem, 7vw, 2.4rem)",
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}>
            <span style={{ color: "var(--emerald-primary)", fontSize: "0.75em", marginRight: "2px" }}>$</span>
            {plan.price}
            <span style={{ fontSize: "0.45em", color: "#94a3b8", marginLeft: "4px", fontWeight: 700 }}>USD</span>
          </div>

          <div style={{
            padding: "3px 8px",
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "6px",
            fontSize: "0.82rem",
            fontWeight: 800,
            color: "#00ff88",
            fontFamily: "var(--font-mono)",
          }}>
            ₹{inrAmount} INR
          </div>
        </div>

        {/* Rate breakdown */}
        <div style={{
          fontSize: "0.74rem",
          color: isEnlightened ? "#34d399" : "#94a3b8",
          fontWeight: 600,
          marginBottom: "16px",
        }}>
          {getDailyRateText()}
        </div>

        {/* Divider */}
        <div style={{ height: "1px", backgroundColor: "rgba(255, 255, 255, 0.08)", marginBottom: "14px" }} />

        {/* Features Checklist */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "9px",
          marginBottom: "18px",
        }}>
          {plan.features.map((feature, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.80rem",
                color: "#e2e8f0",
                lineHeight: 1.35,
                fontWeight: 500,
              }}
            >
              <div style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: isEnlightened ? "rgba(0, 255, 136, 0.15)" : "rgba(255, 255, 255, 0.06)",
                border: isEnlightened ? "1px solid #00ff88" : "1px solid rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Check size={10} color={isEnlightened ? "#00ff88" : "#ffffff"} strokeWidth={3} />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button
          className={isEnlightened ? "btn-emerald-solid" : "btn-emerald-outline"}
          onClick={() => {
            haptic("medium");
            onSelectPlan(plan);
          }}
          style={{
            width: "100%",
            padding: "14px 10px",
            fontSize: "0.86rem",
            letterSpacing: "0.08em",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            backgroundColor: isEnlightened
              ? "#00ff88"
              : isGrandmaster
              ? "rgba(251, 191, 36, 0.12)"
              : "rgba(255, 255, 255, 0.04)",
            borderColor: isGrandmaster ? "rgba(251, 191, 36, 0.5)" : undefined,
            color: isEnlightened ? "#021609" : isGrandmaster ? "#fbbf24" : "#ffffff",
          }}
        >
          <span>
            {isEnlightened
              ? "UNLOCK 1-MONTH PRO PASS"
              : isGrandmaster
              ? "ACQUIRE LIFETIME VIP"
              : "GET 10-DAY ACCESS"}
          </span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
