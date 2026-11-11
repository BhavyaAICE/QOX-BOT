import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { LIVE_BUYERS } from "../data/qtxData";
import { sounds } from "../utils/soundEffects";

// Fisher-Yates Shuffle with guarantee that the first item doesn't repeat the previous last item
function shuffleNames(names: string[], excludeFirst?: string): string[] {
  const shuffled = [...names];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  if (excludeFirst && shuffled[0] === excludeFirst && shuffled.length > 1) {
    const swapIdx = Math.floor(1 + Math.random() * (shuffled.length - 1));
    [shuffled[0], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[0]];
  }
  return shuffled;
}

export const BuyerToast: React.FC = () => {
  const queueRef = useRef<string[]>([]);
  const lastServedRef = useRef<string>("");

  const getNextBuyer = (): string => {
    if (queueRef.current.length === 0) {
      queueRef.current = shuffleNames(LIVE_BUYERS, lastServedRef.current);
    }
    const next = queueRef.current.shift() || LIVE_BUYERS[0];
    lastServedRef.current = next;
    return next;
  };

  const [currentBuyer, setCurrentBuyer] = useState<string>(() => {
    const first = LIVE_BUYERS[Math.floor(Math.random() * LIVE_BUYERS.length)];
    lastServedRef.current = first;
    return first;
  });

  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Relaxed rotation every 7.5 seconds with soft chime
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentBuyer(getNextBuyer());
        setIsFading(false);
        sounds.playPurchaseNotification();
      }, 300);
    }, 7500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: "12px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99,
        pointerEvents: "none",
        width: "max-content",
        maxWidth: "calc(100vw - 32px)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(16, 24, 20, 0.92)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "8px",
          padding: "6px 18px",
          textAlign: "center",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.85)",
          opacity: isFading ? 0.2 : 1,
          transform: isFading ? "scale(0.97)" : "scale(1)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
        }}
      >
        {/* Top line: Cart icon + BUYER NAME + Verified badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          color: "#ffffff",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "0.82rem",
          letterSpacing: "0.02em",
          lineHeight: 1.2,
        }}>
          <span style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "var(--emerald-primary)",
            boxShadow: "0 0 8px var(--emerald-primary)",
          }} />
          <span>{currentBuyer}</span>
          <CheckCircle2 size={13} color="var(--emerald-primary)" />
        </div>

        {/* Bottom line: Verified subscription notice */}
        <div style={{
          fontSize: "0.68rem",
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          color: "var(--emerald-primary)",
          letterSpacing: "0.06em",
          marginTop: "2px",
          lineHeight: 1.2,
        }}>
          JUST ACTIVATED QOX SOFTWARE LICENSE
        </div>
      </div>
    </div>
  );
};
