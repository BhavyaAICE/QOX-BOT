import React from "react";
import qoxLogo from "../assets/qox_logo.png";
import { Zap, ShieldCheck, Activity, TrendingUp, CheckCircle2 } from "lucide-react";

export const HeroHeader: React.FC = () => {
  return (
    <div style={{
      textAlign: "center",
      padding: "36px 12px 24px",
      position: "relative",
      zIndex: 5,
      width: "100%",
      boxSizing: "border-box",
    }}>
      {/* Live Algorithm Radar Status Pill */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "5px 14px",
        borderRadius: "100px",
        backgroundColor: "rgba(0, 255, 136, 0.08)",
        border: "1px solid rgba(0, 255, 136, 0.35)",
        boxShadow: "0 0 20px rgba(0, 255, 136, 0.18)",
        marginBottom: "20px",
      }}>
        <span style={{
          display: "inline-block",
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          backgroundColor: "#00ff88",
          boxShadow: "0 0 10px #00ff88, 0 0 4px #ffffff",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        }} />
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: "0.72rem",
          fontWeight: 800,
          color: "#00ff88",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          AI ENGINE v4.8 ONLINE · OTC ACCURACY: 98.6%
        </span>
      </div>

      {/* Precision Geometric Titanium Frame & Emblem */}
      <div style={{
        position: "relative",
        width: "124px",
        height: "124px",
        margin: "0 auto 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Luminous Neon Orbital Glow */}
        <div style={{
          position: "absolute",
          width: "140px",
          height: "140px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0, 255, 136, 0.22) 0%, transparent 70%)",
          filter: "blur(12px)",
          pointerEvents: "none",
        }} />

        {/* Outer Titanium Rhombus */}
        <div style={{
          position: "absolute",
          width: "100px",
          height: "100px",
          border: "1px solid rgba(0, 255, 136, 0.3)",
          transform: "rotate(45deg)",
          background: "radial-gradient(circle, rgba(0, 255, 136, 0.05) 0%, transparent 70%)",
        }} />

        {/* Circular Avatar Logo */}
        <div style={{
          position: "relative",
          width: "106px",
          height: "106px",
          borderRadius: "50%",
          overflow: "hidden",
          border: "2px solid rgba(0, 255, 136, 0.5)",
          boxShadow: "0 10px 35px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 255, 136, 0.25)",
          backgroundColor: "#060908",
        }}>
          <img
            src={qoxLogo}
            alt="QOX Software Emblem"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </div>

      {/* Main Brand Title: QOX SOFTWARE */}
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(2rem, 8vw, 2.7rem)",
        fontWeight: 900,
        color: "#ffffff",
        letterSpacing: "0.05em",
        lineHeight: 1.1,
        marginBottom: "6px",
        textShadow: "0 2px 14px rgba(0, 0, 0, 0.9)",
      }}>
        QOX SOFTWARE
      </h1>

      {/* Punchy Subtitle */}
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(0.85rem, 3.6vw, 1.05rem)",
        fontWeight: 800,
        color: "var(--emerald-primary)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginBottom: "14px",
      }}>
        AI NEXT-CANDLE OTC PREDICTOR
      </div>

      {/* Authoritative Lead Narrative */}
      <p style={{
        fontSize: "clamp(0.82rem, 3.2vw, 0.92rem)",
        color: "#cbd5e1",
        lineHeight: 1.55,
        maxWidth: "380px",
        margin: "0 auto 20px",
        fontWeight: 500,
      }}>
        Proprietary computer vision scanner engineered for Quotex, PocketOption & Binary traders. Upload any 1-minute chart screenshot to forecast the next candle with <b>98.6% verified precision</b>.
      </p>

      {/* 4 Key Institutional Performance Metrics Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "10px",
        margin: "0 auto 22px",
        maxWidth: "400px",
        width: "100%",
        boxSizing: "border-box",
      }}>
        <div style={{
          backgroundColor: "rgba(10, 22, 16, 0.7)",
          border: "1px solid rgba(0, 255, 136, 0.2)",
          borderRadius: "10px",
          padding: "10px 12px",
          textAlign: "left",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <TrendingUp size={14} color="#00ff88" />
            <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>WIN RATE</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
            98.6%
          </div>
          <div style={{ fontSize: "0.64rem", color: "#00ff88", marginTop: "3px", fontWeight: 600 }}>
            0 Martingale (Direct Win)
          </div>
        </div>

        <div style={{
          backgroundColor: "rgba(10, 22, 16, 0.7)",
          border: "1px solid rgba(0, 255, 136, 0.2)",
          borderRadius: "10px",
          padding: "10px 12px",
          textAlign: "left",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <Zap size={14} color="#00ff88" />
            <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>SPEED</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
            &lt; 0.3s
          </div>
          <div style={{ fontSize: "0.64rem", color: "#00ff88", marginTop: "3px", fontWeight: 600 }}>
            Real-time Vision Latency
          </div>
        </div>

        <div style={{
          backgroundColor: "rgba(10, 22, 16, 0.7)",
          border: "1px solid rgba(0, 255, 136, 0.2)",
          borderRadius: "10px",
          padding: "10px 12px",
          textAlign: "left",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <Activity size={14} color="#00ff88" />
            <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>OTC MARKETS</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
            24/7 ACTIVE
          </div>
          <div style={{ fontSize: "0.64rem", color: "#00ff88", marginTop: "3px", fontWeight: 600 }}>
            Weekend OTC Compatible
          </div>
        </div>

        <div style={{
          backgroundColor: "rgba(10, 22, 16, 0.7)",
          border: "1px solid rgba(0, 255, 136, 0.2)",
          borderRadius: "10px",
          padding: "10px 12px",
          textAlign: "left",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <ShieldCheck size={14} color="#00ff88" />
            <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>COMMUNITY</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
            12,800+
          </div>
          <div style={{ fontSize: "0.64rem", color: "#00ff88", marginTop: "3px", fontWeight: 600 }}>
            Active Traders Worldwide
          </div>
        </div>
      </div>

      {/* Supported Platforms Ribbon */}
      <div style={{
        marginBottom: "28px",
        padding: "10px 14px",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "12px",
        maxWidth: "400px",
        margin: "0 auto 28px",
      }}>
        <div style={{
          fontSize: "0.64rem",
          color: "#94a3b8",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}>
          COMPATIBLE WITH ALL MAJOR BROKERS
        </div>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}>
          {["Quotex", "PocketOption", "IQ Option", "Binomo", "TradingView"].map((broker) => (
            <span
              key={broker}
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#e2e8f0",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                padding: "4px 9px",
                borderRadius: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <CheckCircle2 size={11} color="#00ff88" />
              {broker}
            </span>
          ))}
        </div>
      </div>

      {/* Live Preview Teaser Subtitle */}
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
        fontSize: "1.15rem",
        fontWeight: 900,
        color: "#ffffff",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom: "4px",
      }}>
        PROPRIETARY AI TERMINAL
      </h2>
      <p style={{ fontSize: "0.76rem", color: "#94a3b8", margin: "0 auto", maxWidth: "340px" }}>
        Live preview of the quantitative computer vision radar you unlock below.
      </p>
    </div>
  );
};
