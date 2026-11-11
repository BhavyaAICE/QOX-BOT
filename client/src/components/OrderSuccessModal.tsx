import React from "react";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useTelegram } from "../context/TelegramContext";

export const OrderSuccessModal: React.FC = () => {
  const { lastOrder, setLastOrder } = useCart();
  const { closeApp, isTelegram, haptic } = useTelegram();

  if (!lastOrder) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-subtle)",
          padding: "24px 20px",
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Animated Success Badge */}
        <div style={{
          width: "72px",
          height: "72px",
          borderRadius: "var(--radius-full)",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)",
          border: "2px solid #10b981",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
          boxShadow: "0 0 30px rgba(16, 185, 129, 0.4)",
        }}>
          <CheckCircle2 size={38} color="#10b981" />
        </div>

        <h2 style={{
          fontSize: "1.35rem",
          fontWeight: 800,
          color: "var(--text-primary)",
          marginBottom: "4px",
        }}>
          Payment Successful!
        </h2>
        <p style={{
          fontSize: "0.82rem",
          color: "var(--text-secondary)",
          marginBottom: "18px",
        }}>
          Order <b>#{lastOrder.orderId}</b> has been received and sent to your Telegram bot.
        </p>

        {/* Receipt Box */}
        <div style={{
          padding: "14px 16px",
          borderRadius: "var(--radius-md)",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          border: "1px solid var(--border-subtle)",
          textAlign: "left",
          marginBottom: "20px",
          fontSize: "0.8rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--text-muted)" }}>Payment Method:</span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)", textTransform: "uppercase" }}>
              {lastOrder.paymentMethod === "stars" ? "⭐ Telegram Stars" : lastOrder.paymentMethod === "ton" ? "💎 TON Crypto" : "💳 Card"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--text-muted)" }}>Total Paid:</span>
            <span style={{ fontWeight: 700, color: "#60a5fa", fontSize: "0.95rem" }}>
              ${lastOrder.totalAmount.toFixed(2)}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--text-muted)" }}>Recipient:</span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              {lastOrder.customerName}
            </span>
          </div>

          <div style={{
            paddingTop: "8px",
            borderTop: "1px solid var(--border-subtle)",
            color: "var(--text-muted)",
            fontSize: "0.75rem",
          }}>
            📍 Delivered to: {lastOrder.deliveryAddress}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {isTelegram ? (
            <button
              className="btn-primary"
              onClick={() => {
                haptic("light");
                closeApp();
              }}
              style={{ width: "100%", padding: "12px" }}
            >
              <MessageSquare size={17} />
              Return to Telegram Chat
            </button>
          ) : (
            <div style={{
              fontSize: "0.75rem",
              color: "#34d399",
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(16, 185, 129, 0.1)",
              marginBottom: "4px",
            }}>
              ✨ Simulated Telegram receipt sent to chat!
            </div>
          )}

          <button
            className="btn-secondary"
            onClick={() => {
              haptic("light");
              setLastOrder(null);
            }}
            style={{ width: "100%", padding: "12px" }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};
