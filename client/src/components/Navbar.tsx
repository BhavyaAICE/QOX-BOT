import React from "react";
import { ShoppingBag, Sparkles, Moon, Sun } from "lucide-react";
import { useTelegram } from "../context/TelegramContext";
import { useCart } from "../context/CartContext";

interface NavbarProps {
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { user, isTelegram, colorScheme, toggleThemeForDev } = useTelegram();
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 40,
      width: "100%",
      backgroundColor: "var(--bg-glass)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      borderBottom: "1px solid var(--border-subtle)",
      padding: "12px 16px",
    }}>
      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(59, 130, 246, 0.4)",
          }}>
            <Sparkles size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: "1.15rem",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}>
              AURA
              <span style={{
                fontSize: "0.65rem",
                padding: "2px 6px",
                borderRadius: "var(--radius-full)",
                background: "rgba(59, 130, 246, 0.15)",
                color: "#60a5fa",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                fontWeight: 700,
              }}>
                STORE
              </span>
            </div>
            <div style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "-2px",
            }}>
              {user ? `Hi, ${user.first_name}` : "Telegram Mini App"}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Dev theme toggle when running in desktop preview */}
          {!isTelegram && (
            <button
              onClick={toggleThemeForDev}
              title="Toggle Dark/Light Mode"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-full)",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {colorScheme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            aria-label="Shopping Cart"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "42px",
              height: "42px",
              borderRadius: "var(--radius-md)",
              background: totalItems > 0 ? "var(--accent-gradient)" : "rgba(255, 255, 255, 0.06)",
              color: totalItems > 0 ? "#ffffff" : "var(--text-primary)",
              border: totalItems > 0 ? "none" : "1px solid var(--border-subtle)",
              cursor: "pointer",
              boxShadow: totalItems > 0 ? "0 0 15px rgba(59, 130, 246, 0.35)" : "none",
              transition: "transform 0.15s ease",
            }}
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                minWidth: "18px",
                height: "18px",
                padding: "0 4px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                fontSize: "0.7rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--bg-primary)",
              }}>
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
