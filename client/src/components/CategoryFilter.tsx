import React from "react";
import { Sparkles, Cpu, Shirt, Layers, Watch } from "lucide-react";
import { useTelegram } from "../context/TelegramContext";

interface CategoryFilterProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CATEGORIES = [
  { id: "all", label: "All Items", icon: Sparkles },
  { id: "tech", label: "Tech & Audio", icon: Cpu },
  { id: "streetwear", label: "Streetwear", icon: Shirt },
  { id: "digital", label: "Web3 Digital", icon: Layers },
  { id: "accessories", label: "Accessories", icon: Watch },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeCategory,
  onSelectCategory,
}) => {
  const { haptic } = useTelegram();

  return (
    <div style={{
      display: "flex",
      gap: "8px",
      overflowX: "auto",
      padding: "12px 16px",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
    }}>
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => {
              haptic("light");
              onSelectCategory(cat.id);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "var(--radius-full)",
              border: isActive ? "1px solid rgba(59, 130, 246, 0.5)" : "1px solid var(--border-subtle)",
              background: isActive ? "var(--accent-gradient)" : "rgba(255, 255, 255, 0.04)",
              color: isActive ? "#ffffff" : "var(--text-secondary)",
              fontSize: "0.85rem",
              fontFamily: "var(--font-heading)",
              fontWeight: isActive ? 600 : 500,
              whiteSpace: "nowrap",
              cursor: "pointer",
              boxShadow: isActive ? "0 2px 10px rgba(59, 130, 246, 0.3)" : "none",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: isActive ? "scale(1.02)" : "scale(1)",
            }}
          >
            <Icon size={14} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
