import React from "react";
import { CreditCard, Send, KeyRound } from "lucide-react";

export const ActivationProtocol: React.FC = () => {
  const steps = [
    {
      num: "01",
      icon: <CreditCard size={18} color="#00ff88" />,
      title: "SELECT PLAN & PAY",
      desc: "Choose 10-Day, 1-Month, or Lifetime. Pay seamlessly via UPI (GPay, PhonePe, Paytm) or Crypto (USDT BEP20/TRC20).",
    },
    {
      num: "02",
      icon: <Send size={18} color="#00ff88" />,
      title: "DISPATCH 1-TAP QUERY",
      desc: "Submit your 12-digit UPI UTR or TxID and tap 'Raise Query to Admin Desk' directly on your checkout confirmation screen.",
    },
    {
      num: "03",
      icon: <KeyRound size={18} color="#00ff88" />,
      title: "RECEIVE TERMINAL & LOGIN",
      desc: "Admin confirms payment on bank statement and delivers your private Terminal link + User ID & Password directly in Telegram.",
    },
  ];

  return (
    <div style={{
      margin: "32px 0 28px",
      width: "100%",
      boxSizing: "border-box",
    }}>
      {/* Section Header */}
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <div style={{
          fontSize: "0.66rem",
          color: "var(--emerald-primary)",
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginBottom: "4px",
        }}>
          OFFICIAL ACTIVATION PROTOCOL
        </div>
        <h3 style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.15rem",
          fontWeight: 900,
          color: "#ffffff",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}>
          HOW YOU RECEIVE YOUR ACCESS
        </h3>
      </div>

      {/* 3 Step Cards */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}>
        {steps.map((s, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              padding: "14px",
              backgroundColor: "rgba(10, 20, 15, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              position: "relative",
            }}
          >
            {/* Step Number + Icon Badge */}
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              backgroundColor: "rgba(0, 255, 136, 0.1)",
              border: "1px solid rgba(0, 255, 136, 0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              {s.icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  fontWeight: 900,
                  color: "#00ff88",
                }}>
                  STEP {s.num}
                </span>
                <div style={{ height: "1px", flex: 1, backgroundColor: "rgba(255, 255, 255, 0.08)" }} />
              </div>
              <h4 style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.86rem",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "0.02em",
                marginBottom: "3px",
              }}>
                {s.title}
              </h4>
              <p style={{
                fontSize: "0.74rem",
                color: "#cbd5e1",
                lineHeight: 1.45,
                margin: 0,
              }}>
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
