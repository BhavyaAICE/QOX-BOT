import React from "react";
import { Star, Plus, Minus } from "lucide-react";
import type { Product } from "../types/telegram";
import { useCart } from "../context/CartContext";
import { useTelegram } from "../context/TelegramContext";

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetails }) => {
  const { items, addToCart, updateQuantity } = useCart();
  const { haptic } = useTelegram();

  // Check if item is already in cart
  const cartItem = items.find((item) => item.product.id === product.id);
  const currentQuantity = cartItem?.quantity || 0;

  const getBadgeClass = (badge?: string) => {
    switch (badge) {
      case "Trending":
        return "badge-trending";
      case "Limited":
        return "badge-limited";
      case "Best Seller":
        return "badge-bestseller";
      case "New Drop":
        return "badge-newdrop";
      default:
        return "";
    }
  };

  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        cursor: "pointer",
        position: "relative",
      }}
      onClick={() => onOpenDetails(product)}
    >
      {/* Product Image & Badges */}
      <div style={{ position: "relative", width: "100%", paddingTop: "80%", overflow: "hidden", backgroundColor: "#0f1420" }}>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.4s ease",
          }}
        />

        {/* Gradient Overlay for contrast */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(10, 13, 20, 0.7) 0%, transparent 40%)",
        }} />

        {/* Badge */}
        {product.badge && (
          <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 2 }}>
            <span className={`badge ${getBadgeClass(product.badge)}`}>
              {product.badge}
            </span>
          </div>
        )}

        {/* Rating chip */}
        <div style={{
          position: "absolute",
          bottom: "8px",
          left: "10px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(8px)",
          padding: "3px 7px",
          borderRadius: "var(--radius-full)",
          fontSize: "0.72rem",
          fontWeight: 600,
          color: "#f8fafc",
        }}>
          <Star size={12} fill="#f59e0b" color="#f59e0b" />
          <span>{product.rating}</span>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.68rem" }}>({product.reviewsCount})</span>
        </div>
      </div>

      {/* Card Content */}
      <div style={{
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        justifyContent: "space-between",
      }}>
        <div>
          <h3 style={{
            fontSize: "0.98rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.3,
            marginBottom: "4px",
          }}>
            {product.name}
          </h3>
          <p style={{
            fontSize: "0.78rem",
            color: "var(--text-secondary)",
            lineHeight: 1.35,
            marginBottom: "12px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {product.subtitle}
          </p>
        </div>

        {/* Price & Action Row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "8px",
          borderTop: "1px solid var(--border-subtle)",
        }}>
          {/* Prices */}
          <div>
            <div style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.05rem",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}>
              ${product.price.toFixed(2)}
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--accent-stars)",
            }}>
              <span>⭐</span>
              <span>{product.starsPrice.toLocaleString()} Stars</span>
            </div>
          </div>

          {/* Quick Add or Quantity Stepper */}
          <div onClick={(e) => e.stopPropagation()}>
            {currentQuantity > 0 ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(59, 130, 246, 0.15)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                borderRadius: "var(--radius-full)",
                padding: "3px 6px",
              }}>
                <button
                  onClick={() => updateQuantity(product.id, currentQuantity - 1)}
                  aria-label="Decrease quantity"
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "var(--radius-full)",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Minus size={13} />
                </button>
                <span style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  minWidth: "16px",
                  textAlign: "center",
                  color: "#60a5fa",
                }}>
                  {currentQuantity}
                </span>
                <button
                  onClick={() => updateQuantity(product.id, currentQuantity + 1)}
                  aria-label="Increase quantity"
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "var(--radius-full)",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  haptic("medium");
                  addToCart(product);
                }}
                aria-label={`Add ${product.name} to cart`}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: "var(--accent-gradient)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(59, 130, 246, 0.3)",
                  transition: "transform 0.15s ease",
                }}
              >
                <Plus size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
