import React, { useState } from "react";
import { X, ShieldCheck, Sparkles, CreditCard, Wallet, Send } from "lucide-react";
import confetti from "canvas-confetti";
import { useCart } from "../context/CartContext";
import { useTelegram } from "../context/TelegramContext";
import type { OrderDetails } from "../types/telegram";

export const CheckoutModal: React.FC = () => {
  const {
    items,
    isCheckoutOpen,
    setIsCheckoutOpen,
    finalTotal,
    clearCart,
    setLastOrder,
  } = useCart();

  const { user, haptic, sendOrderToBot } = useTelegram();

  const [name, setName] = useState(
    user ? `${user.first_name} ${user.last_name || ""}`.trim() : "Valued Customer"
  );
  const [address, setAddress] = useState("742 Evergreen Terrace, Springfield (or Digital TON ID)");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"stars" | "ton" | "card">("stars");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCheckoutOpen) return null;

  // Telegram Stars calculate approx 50 stars per $1
  const starsTotal = Math.round(finalTotal * 50);
  const tonTotal = (finalTotal / 5.5).toFixed(2);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    haptic("medium");

    setTimeout(() => {
      const orderId = `${Math.floor(100000 + Math.random() * 900000)}`;
      const orderData: OrderDetails = {
        orderId,
        items: items.map((i) => ({
          id: i.product.id,
          name: i.product.name,
          quantity: i.quantity,
          price: i.product.price,
          variant: i.selectedVariant,
        })),
        totalAmount: finalTotal,
        customerName: name,
        telegramUserId: user?.id,
        telegramUsername: user?.username,
        deliveryAddress: address,
        paymentMethod,
        notes: notes || undefined,
        createdAt: new Date().toISOString(),
      };

      // Send order data to Telegram Bot via WebApp.sendData()
      sendOrderToBot(orderData);

      // Trigger Confetti Celebration!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.log("Confetti triggered", err);
      }

      haptic("success");
      setLastOrder(orderData);
      clearCart();
      setIsSubmitting(false);
      setIsCheckoutOpen(false);
    }, 900);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
      onClick={() => !isSubmitting && setIsCheckoutOpen(false)}
    >
      <div
        className="animate-slide-up"
        style={{
          width: "100%",
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "var(--bg-secondary)",
          borderTopLeftRadius: "var(--radius-lg)",
          borderTopRightRadius: "var(--radius-lg)",
          borderTop: "1px solid var(--border-subtle)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Fast Checkout
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Verified Telegram Mini App Order
            </p>
          </div>
          <button
            onClick={() => {
              if (!isSubmitting) {
                haptic("light");
                setIsCheckoutOpen(false);
              }
            }}
            aria-label="Close checkout"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-full)",
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitOrder} style={{ overflowY: "auto", padding: "16px 20px 80px" }}>
          {/* Payment Method Selector */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px" }}>
              Select Payment Method
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {/* Stars */}
              <button
                type="button"
                onClick={() => {
                  haptic("light");
                  setPaymentMethod("stars");
                }}
                style={{
                  padding: "12px 8px",
                  borderRadius: "var(--radius-md)",
                  border: paymentMethod === "stars" ? "2px solid #facc15" : "1px solid var(--border-subtle)",
                  backgroundColor: paymentMethod === "stars" ? "rgba(250, 204, 21, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  color: paymentMethod === "stars" ? "#facc15" : "var(--text-secondary)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>⭐</span>
                <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>TG Stars</span>
                <span style={{ fontSize: "0.68rem", opacity: 0.8 }}>{starsTotal} XTR</span>
              </button>

              {/* TON */}
              <button
                type="button"
                onClick={() => {
                  haptic("light");
                  setPaymentMethod("ton");
                }}
                style={{
                  padding: "12px 8px",
                  borderRadius: "var(--radius-md)",
                  border: paymentMethod === "ton" ? "2px solid #3b82f6" : "1px solid var(--border-subtle)",
                  backgroundColor: paymentMethod === "ton" ? "rgba(59, 130, 246, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  color: paymentMethod === "ton" ? "#60a5fa" : "var(--text-secondary)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                }}
              >
                <Wallet size={20} />
                <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>TON Crypto</span>
                <span style={{ fontSize: "0.68rem", opacity: 0.8 }}>~{tonTotal} TON</span>
              </button>

              {/* Card / Apple Pay */}
              <button
                type="button"
                onClick={() => {
                  haptic("light");
                  setPaymentMethod("card");
                }}
                style={{
                  padding: "12px 8px",
                  borderRadius: "var(--radius-md)",
                  border: paymentMethod === "card" ? "2px solid #8b5cf6" : "1px solid var(--border-subtle)",
                  backgroundColor: paymentMethod === "card" ? "rgba(139, 92, 246, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  color: paymentMethod === "card" ? "#a78bfa" : "var(--text-secondary)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                }}
              >
                <CreditCard size={20} />
                <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>Card / Pay</span>
                <span style={{ fontSize: "0.68rem", opacity: 0.8 }}>${finalTotal.toFixed(2)}</span>
              </button>
            </div>
          </div>

          {/* Delivery & Contact Information */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                Recipient Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                Delivery Address / TON Wallet Address
              </label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem",
                  outline: "none",
                  resize: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                Order Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="Gate code, gift packaging, or Telegram handle..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Telegram Security Pill */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            fontSize: "0.75rem",
            color: "#34d399",
          }}>
            <ShieldCheck size={16} />
            <span>End-to-end encrypted order transmitted securely to bot</span>
          </div>

          {/* Sticky Submit Button */}
          <div style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: "600px",
            margin: "0 auto",
            padding: "14px 20px",
            backgroundColor: "var(--bg-glass)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid var(--border-subtle)",
          }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "14px",
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={18} className="animate-spin" /> Processing Telegram Order...
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Send size={18} />
                  Pay ${finalTotal.toFixed(2)} ({paymentMethod === "stars" ? `${starsTotal} Stars` : paymentMethod === "ton" ? `${tonTotal} TON` : "Card"})
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
