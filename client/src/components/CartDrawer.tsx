import React, { useState } from "react";
import { X, Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag, Check } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useTelegram } from "../context/TelegramContext";

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    shippingAmount,
    discountAmount,
    finalTotal,
    promoCode,
    applyPromoCode,
    removePromoCode,
  } = useCart();

  const { haptic } = useTelegram();
  const [promoInput, setPromoInput] = useState("");
  const [promoMsg, setPromoMsg] = useState<{ text: string; success: boolean } | null>(null);

  if (!isCartOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput);
    setPromoMsg({ text: res.message, success: res.success });
    if (res.success) setPromoInput("");
  };

  const freeShippingThreshold = 150;
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
      onClick={() => setIsCartOpen(false)}
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
          maxHeight: "90vh",
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShoppingBag size={20} color="#60a5fa" />
            <h2 style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}>
              Your Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)})
            </h2>
          </div>
          <button
            onClick={() => {
              haptic("light");
              setIsCartOpen(false);
            }}
            aria-label="Close cart"
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

        {/* Free Shipping Progress bar */}
        {items.length > 0 && (
          <div style={{
            padding: "10px 20px",
            backgroundColor: "rgba(59, 130, 246, 0.06)",
            borderBottom: "1px solid var(--border-subtle)",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.75rem",
              marginBottom: "6px",
              color: "var(--text-secondary)",
            }}>
              <span>
                {amountToFreeShipping === 0
                  ? "🎉 You have qualified for FREE shipping!"
                  : `Add $${amountToFreeShipping.toFixed(2)} more for FREE shipping`}
              </span>
              <span style={{ fontWeight: 700, color: "#60a5fa" }}>
                {Math.round(freeShippingProgress)}%
              </span>
            </div>
            <div style={{
              width: "100%",
              height: "5px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              overflow: "hidden",
            }}>
              <div style={{
                width: `${freeShippingProgress}%`,
                height: "100%",
                background: "var(--accent-gradient)",
                borderRadius: "var(--radius-full)",
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>
        )}

        {/* Cart Item List */}
        <div style={{
          overflowY: "auto",
          padding: "16px 20px",
          flex: 1,
        }}>
          {items.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "48px 16px",
            }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "var(--radius-full)",
                background: "rgba(255, 255, 255, 0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "var(--text-muted)",
              }}>
                <ShoppingBag size={28} />
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                Your cart is empty
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                Explore our catalog for premium tech & streetwear!
              </p>
              <button
                className="btn-primary"
                onClick={() => setIsCartOpen(false)}
                style={{ padding: "10px 24px", fontSize: "0.88rem" }}
              >
                Browse Drops
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {items.map((item, idx) => (
                <div
                  key={`${item.product.id}-${item.selectedVariant || "def"}-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "var(--radius-sm)",
                      objectFit: "cover",
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {item.product.name}
                    </h4>

                    {item.selectedVariant && (
                      <span style={{
                        display: "inline-block",
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        marginBottom: "4px",
                      }}>
                        Variant: {item.selectedVariant}
                      </span>
                    )}

                    <div style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#60a5fa",
                      fontFamily: "var(--font-heading)",
                    }}>
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "var(--radius-sm)",
                    padding: "4px 8px",
                  }}>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedVariant)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        display: "flex",
                      }}
                    >
                      <Minus size={13} />
                    </button>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, minWidth: "16px", textAlign: "center" }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedVariant)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        display: "flex",
                      }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.product.id, item.selectedVariant)}
                    aria-label="Remove item"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "6px",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {/* Promo Code Input */}
              <div style={{ marginTop: "12px" }}>
                <form
                  onSubmit={handleApplyPromo}
                  style={{ display: "flex", gap: "8px" }}
                >
                  <div style={{
                    flex: 1,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}>
                    <Tag size={15} color="var(--text-muted)" style={{ position: "absolute", left: "12px" }} />
                    <input
                      type="text"
                      placeholder="Promo code (e.g. TELEGRAM10)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 36px",
                        backgroundColor: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-primary)",
                        fontSize: "0.82rem",
                        outline: "none",
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-secondary"
                    style={{ padding: "10px 16px", fontSize: "0.82rem" }}
                  >
                    Apply
                  </button>
                </form>

                {promoMsg && (
                  <div style={{
                    fontSize: "0.75rem",
                    marginTop: "6px",
                    color: promoMsg.success ? "#34d399" : "#f87171",
                  }}>
                    {promoMsg.text}
                  </div>
                )}

                {promoCode && (
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "8px",
                    padding: "4px 10px",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.75rem",
                    color: "#34d399",
                    fontWeight: 600,
                  }}>
                    <Check size={12} />
                    <span>{promoCode} applied</span>
                    <button
                      onClick={removePromoCode}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#34d399",
                        cursor: "pointer",
                        marginLeft: "4px",
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Checkout Summary */}
        {items.length > 0 && (
          <div style={{
            padding: "16px 20px",
            backgroundColor: "var(--bg-glass)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid var(--border-subtle)",
          }}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              marginBottom: "14px",
              fontSize: "0.82rem",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span>Delivery</span>
                <span>{shippingAmount === 0 ? "FREE" : `$${shippingAmount.toFixed(2)}`}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#34d399", fontWeight: 600 }}>
                  <span>Discount ({promoCode})</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "6px",
                borderTop: "1px solid var(--border-subtle)",
                fontSize: "1rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                fontFamily: "var(--font-heading)",
              }}>
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => {
                haptic("medium");
                setIsCartOpen(false);
                setIsCheckoutOpen(true);
              }}
              style={{ width: "100%", padding: "14px" }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
