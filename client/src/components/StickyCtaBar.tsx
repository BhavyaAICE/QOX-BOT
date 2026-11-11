import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { useTelegram } from "../context/TelegramContext";

interface StickyCtaBarProps {
  onChoosePlan: () => void;
}

export const StickyCtaBar: React.FC<StickyCtaBarProps> = ({ onChoosePlan }) => {
  const { haptic } = useTelegram();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled down 260px
      if (window.scrollY > 260) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "16px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 90,
      width: "calc(100% - 28px)",
      maxWidth: "430px",
      boxSizing: "border-box",
      animation: "fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        backgroundColor: "rgba(8, 18, 13, 0.94)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1.5px solid rgba(0, 255, 136, 0.5)",
        borderRadius: "14px",
        boxShadow: "0 12px 36px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 255, 136, 0.2)",
      }}>
        <div>
          <div style={{
            fontSize: "0.68rem",
            color: "#94a3b8",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}>
            QOX OTC ENGINE v4.8
          </div>
          <div style={{
            fontSize: "0.82rem",
            fontWeight: 900,
            color: "#ffffff",
            fontFamily: "var(--font-display)",
          }}>
            Plans From <span style={{ color: "var(--emerald-primary)" }}>$200 USD</span>
          </div>
        </div>

        <button
          onClick={() => {
            haptic("medium");
            onChoosePlan();
          }}
          className="btn-emerald-solid"
          style={{
            padding: "9px 16px",
            fontSize: "0.80rem",
            letterSpacing: "0.06em",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Sparkles size={13} />
          <span>CHOOSE PLAN</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};

