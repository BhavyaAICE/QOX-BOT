import React from "react";
import { Cpu, Lock } from "lucide-react";

export const TerminalLivePreview: React.FC = () => {

  return (
    <div style={{
      marginBottom: "28px",
      width: "100%",
      boxSizing: "border-box",
    }}>
      {/* Container Frame with Neon Border Glow */}
      <div style={{
        backgroundColor: "rgba(7, 14, 10, 0.95)",
        border: "1.5px solid rgba(0, 255, 136, 0.35)",
        borderRadius: "16px",
        padding: "16px 14px",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 255, 136, 0.12)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Top Header Bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "12px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          marginBottom: "12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              backgroundColor: "rgba(0, 255, 136, 0.12)",
              border: "1px solid rgba(0, 255, 136, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Cpu size={15} color="#00ff88" />
            </div>
            <div>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.78rem",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "0.04em",
              }}>
                QOX SOFTWARE TERMINAL
              </div>
              <div style={{ fontSize: "0.64rem", color: "#00ff88", fontWeight: 700 }}>
                ● LIVE OTC RADAR ACTIVE
              </div>
            </div>
          </div>

          <div style={{
            padding: "4px 9px",
            borderRadius: "6px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            fontSize: "0.68rem",
            color: "#94a3b8",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
          }}>
            EUR/USD OTC · 1M
          </div>
        </div>

        {/* Live Candlestick Visualizer with Laser Scan Line */}
        <div style={{
          height: "120px",
          backgroundColor: "#030705",
          borderRadius: "10px",
          border: "1px solid rgba(0, 255, 136, 0.2)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "12px",
        }}>
          {/* Subtle Grid Lines */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(rgba(0, 255, 136, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 136, 0.05) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }} />

          {/* Sweeping Laser Beam */}
          <div style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "30%",
            background: "linear-gradient(90deg, transparent 0%, rgba(0, 255, 136, 0.18) 50%, transparent 100%)",
            animation: "laserSweep 3.5s ease-in-out infinite",
          }} />

          {/* Simulated Candlesticks */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            zIndex: 2,
            padding: "0 14px",
          }}>
            {/* Candle 1 (Red) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "1px", height: "10px", backgroundColor: "#ef4444" }} />
              <div style={{ width: "10px", height: "32px", backgroundColor: "#ef4444", borderRadius: "1px" }} />
              <div style={{ width: "1px", height: "14px", backgroundColor: "#ef4444" }} />
            </div>
            {/* Candle 2 (Red) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "1px", height: "8px", backgroundColor: "#ef4444" }} />
              <div style={{ width: "10px", height: "24px", backgroundColor: "#ef4444", borderRadius: "1px" }} />
              <div style={{ width: "1px", height: "8px", backgroundColor: "#ef4444" }} />
            </div>
            {/* Candle 3 (Doji/Pinbar Green) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "1px", height: "6px", backgroundColor: "#00ff88" }} />
              <div style={{ width: "10px", height: "12px", backgroundColor: "#00ff88", borderRadius: "1px" }} />
              <div style={{ width: "1px", height: "22px", backgroundColor: "#00ff88" }} />
            </div>
            {/* Candle 4 (Green Reversal) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "1px", height: "10px", backgroundColor: "#00ff88" }} />
              <div style={{ width: "10px", height: "36px", backgroundColor: "#00ff88", borderRadius: "1px" }} />
              <div style={{ width: "1px", height: "8px", backgroundColor: "#00ff88" }} />
            </div>
            {/* Candle 5 (Strong Green) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "1px", height: "6px", backgroundColor: "#00ff88" }} />
              <div style={{ width: "10px", height: "46px", backgroundColor: "#00ff88", borderRadius: "1px" }} />
              <div style={{ width: "1px", height: "6px", backgroundColor: "#00ff88" }} />
            </div>
            {/* Target Candle (Prediction Glowing) */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              border: "1px dashed #00ff88",
              padding: "2px 4px",
              borderRadius: "4px",
              backgroundColor: "rgba(0, 255, 136, 0.12)",
              boxShadow: "0 0 16px rgba(0, 255, 136, 0.4)",
            }}>
              <div style={{ width: "1px", height: "12px", backgroundColor: "#00ff88" }} />
              <div style={{ width: "12px", height: "54px", backgroundColor: "#00ff88", borderRadius: "2px" }} />
              <div style={{ width: "1px", height: "8px", backgroundColor: "#00ff88" }} />
            </div>
          </div>

          {/* AI Scan Reticle Overlay Tag */}
          <div style={{
            position: "absolute",
            bottom: "8px",
            right: "10px",
            fontSize: "0.62rem",
            color: "#00ff88",
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.06em",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            padding: "2px 8px",
            borderRadius: "4px",
            border: "1px solid rgba(0, 255, 136, 0.3)",
          }}>
            AI CONFIDENCE: 98.6%
          </div>
        </div>

        {/* Live Forecast Signal Output Box */}
        <div style={{
          backgroundColor: "rgba(0, 255, 136, 0.08)",
          border: "1px solid rgba(0, 255, 136, 0.4)",
          borderRadius: "10px",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}>
          <div>
            <div style={{ fontSize: "0.64rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
              FORECASTED 1-MINUTE DIRECTION
            </div>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
              fontWeight: 900,
              color: "#00ff88",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "2px",
            }}>
              <span>NEXT CANDLE: CALL ↑ (UP)</span>
            </div>
            <div style={{ fontSize: "0.66rem", color: "#cbd5e1", marginTop: "3px" }}>
              Order Block Rebound · Direct 0 MTG Win
            </div>
          </div>

          <div style={{
            textAlign: "right",
          }}>
            <div style={{
              fontSize: "0.62rem",
              color: "#94a3b8",
              fontWeight: 700,
            }}>
              SIGNAL STATUS
            </div>
            <div style={{
              fontSize: "0.76rem",
              color: "#ffffff",
              fontWeight: 900,
              backgroundColor: "rgba(0, 255, 136, 0.25)",
              border: "1px solid #00ff88",
              padding: "4px 8px",
              borderRadius: "6px",
              marginTop: "3px",
              display: "inline-block",
            }}>
              CONFIRMED
            </div>
          </div>
        </div>

        {/* Software Lock Banner */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          padding: "8px 10px",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          border: "1px dashed rgba(255, 255, 255, 0.15)",
          borderRadius: "8px",
          fontSize: "0.70rem",
          color: "#94a3b8",
        }}>
          <Lock size={12} color="#00ff88" />
          <span>You unlock this dedicated scanning terminal immediately upon plan purchase below.</span>
        </div>
      </div>
    </div>
  );
};
