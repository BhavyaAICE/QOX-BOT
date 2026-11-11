import React, { useState } from "react";
import { X, Star, ShieldCheck, Zap, Truck, ShoppingBag, Plus, Minus } from "lucide-react";
import type { Product } from "../types/telegram";
import { useCart } from "../context/CartContext";
import { useTelegram } from "../context/TelegramContext";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { items, addToCart, updateQuantity } = useCart();
  const { haptic } = useTelegram();

  const [selectedVariant, setSelectedVariant] = useState<string>("");

  React.useEffect(() => {
    if (product?.variants?.[0]?.options?.[0]) {
      setSelectedVariant(product.variants[0].options[0]);
    } else {
      setSelectedVariant("");
    }
  }, [product]);

  const cartItem = items.find(
    (item) => item.product.id === product?.id && item.selectedVariant === selectedVariant
  );
  const currentQuantity = cartItem?.quantity || 0;

  if (!product) return null;
  const firstVariantType = product.variants?.[0];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
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
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Handle & Close Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          <div style={{
            width: "36px",
            height: "4px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--border-subtle)",
            margin: "0 auto",
          }} />
          <button
            onClick={() => {
              haptic("light");
              onClose();
            }}
            aria-label="Close details"
            style={{
              position: "absolute",
              right: "16px",
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

        {/* Scrollable Content Body */}
        <div style={{
          overflowY: "auto",
          padding: "16px 20px 90px 20px",
        }}>
          {/* Main Showcase Image */}
          <div style={{
            position: "relative",
            width: "100%",
            height: "240px",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            marginBottom: "16px",
            backgroundColor: "#0d111a",
          }}>
            <img
              src={product.image}
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {product.badge && (
              <span
                className={`badge badge-${product.badge.toLowerCase().replace(" ", "")}`}
                style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                }}
              >
                {product.badge}
              </span>
            )}
          </div>

          {/* Title & Ratings */}
          <div style={{ marginBottom: "12px" }}>
            <h2 style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}>
              {product.name}
            </h2>
            <p style={{
              fontSize: "0.88rem",
              color: "var(--text-secondary)",
              marginBottom: "8px",
            }}>
              {product.subtitle}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#f59e0b",
              }}>
                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                <span>{product.rating}</span>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>•</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                {product.reviewsCount} customer reviews
              </span>
            </div>
          </div>

          {/* Price Showcase Box */}
          <div style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                Price
              </span>
              <span style={{
                fontSize: "1.45rem",
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}>
                ${product.price.toFixed(2)}
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--accent-stars)",
              }}>
                ⭐ {product.starsPrice.toLocaleString()} Stars
              </span>
              <span style={{
                display: "block",
                fontSize: "0.75rem",
                color: "#60a5fa",
                fontWeight: 600,
              }}>
                💎 {product.tonPrice} TON
              </span>
            </div>
          </div>

          {/* Variant Selector */}
          {firstVariantType && (
            <div style={{ marginBottom: "18px" }}>
              <label style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}>
                Select {firstVariantType.type}: <span style={{ color: "var(--text-primary)" }}>{selectedVariant}</span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {firstVariantType.options.map((option) => {
                  const isSelected = selectedVariant === option;
                  return (
                    <button
                      key={option}
                      onClick={() => {
                        haptic("light");
                        setSelectedVariant(option);
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "var(--radius-md)",
                        border: isSelected ? "1.5px solid #3b82f6" : "1px solid var(--border-subtle)",
                        backgroundColor: isSelected ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.04)",
                        color: isSelected ? "#60a5fa" : "var(--text-primary)",
                        fontSize: "0.82rem",
                        fontWeight: isSelected ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom: "18px" }}>
            <h4 style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "6px",
            }}>
              Description
            </h4>
            <p style={{
              fontSize: "0.83rem",
              lineHeight: 1.5,
              color: "var(--text-secondary)",
            }}>
              {product.description}
            </p>
          </div>

          {/* Specs / Features Grid */}
          {product.specs && product.specs.length > 0 && (
            <div style={{ marginBottom: "18px" }}>
              <h4 style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "8px",
              }}>
                Specifications
              </h4>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}>
                {product.specs.map((spec) => (
                  <div
                    key={spec.label}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>
                      {spec.label}
                    </span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guarantee Badges */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "rgba(59, 130, 246, 0.06)",
            border: "1px solid rgba(59, 130, 246, 0.15)",
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Truck size={15} color="#60a5fa" /> Fast Shipping
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <ShieldCheck size={15} color="#34d399" /> Official Guarantee
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Zap size={15} color="#fbbf24" /> Instant Stars Delivery
            </span>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div style={{
          position: "sticky",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "14px 20px",
          backgroundColor: "var(--bg-glass)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          {currentQuantity > 0 ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              gap: "12px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(59, 130, 246, 0.15)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                borderRadius: "var(--radius-md)",
                padding: "8px 12px",
              }}>
                <button
                  onClick={() => updateQuantity(product.id, currentQuantity - 1, selectedVariant)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    display: "flex",
                  }}
                >
                  <Minus size={18} />
                </button>
                <span style={{ fontWeight: 700, minWidth: "24px", textAlign: "center", color: "#60a5fa" }}>
                  {currentQuantity}
                </span>
                <button
                  onClick={() => updateQuantity(product.id, currentQuantity + 1, selectedVariant)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    display: "flex",
                  }}
                >
                  <Plus size={18} />
                </button>
              </div>

              <button
                className="btn-primary"
                onClick={() => {
                  haptic("light");
                  onClose();
                }}
                style={{ flex: 1, padding: "14px" }}
              >
                In Cart • Continue Shopping
              </button>
            </div>
          ) : (
            <button
              className="btn-primary"
              onClick={() => {
                addToCart(product, selectedVariant);
              }}
              style={{ width: "100%", padding: "14px" }}
            >
              <ShoppingBag size={18} />
              Add to Cart • ${product.price.toFixed(2)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
