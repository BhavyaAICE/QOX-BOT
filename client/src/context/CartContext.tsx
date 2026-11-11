import React, { createContext, useContext, useState, useMemo } from "react";
import type { Product, CartItem, OrderDetails } from "../types/telegram";
import { useTelegram } from "./TelegramContext";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variant?: string) => void;
  removeFromCart: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  finalTotal: number;
  promoCode: string;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  lastOrder: OrderDetails | null;
  setLastOrder: (order: OrderDetails | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState<string>("");
  const [promoDiscountPct, setPromoDiscountPct] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [lastOrder, setLastOrder] = useState<OrderDetails | null>(null);

  const { haptic } = useTelegram();

  const addToCart = (product: Product, variant?: string) => {
    haptic("medium");
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.product.id === product.id && item.selectedVariant === variant
      );

      if (existingIndex > -1) {
        const nextItems = [...prevItems];
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          quantity: nextItems[existingIndex].quantity + 1,
        };
        return nextItems;
      } else {
        return [...prevItems, { product, quantity: 1, selectedVariant: variant }];
      }
    });
  };

  const updateQuantity = (productId: string, quantity: number, variant?: string) => {
    haptic("light");
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.selectedVariant === variant
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: string, variant?: string) => {
    haptic("medium");
    setItems((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.selectedVariant === variant)
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setPromoCode("");
    setPromoDiscountPct(0);
  };

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  const shippingAmount = useMemo(() => {
    if (items.length === 0) return 0;
    // Free shipping on orders over $150
    return subtotal >= 150 ? 0 : 9.99;
  }, [subtotal, items]);

  const discountAmount = useMemo(() => {
    return subtotal * (promoDiscountPct / 100);
  }, [subtotal, promoDiscountPct]);

  const finalTotal = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.max(0, subtotal - discountAmount + shippingAmount);
  }, [items, subtotal, discountAmount, shippingAmount]);

  const applyPromoCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === "TELEGRAM10") {
      setPromoCode("TELEGRAM10");
      setPromoDiscountPct(10);
      haptic("success");
      return { success: true, message: "10% Telegram Community discount applied!" };
    } else if (cleanCode === "STARS20") {
      setPromoCode("STARS20");
      setPromoDiscountPct(20);
      haptic("success");
      return { success: true, message: "20% VIP Stars discount applied!" };
    } else {
      haptic("error");
      return { success: false, message: "Invalid promo code. Try TELEGRAM10 or STARS20" };
    }
  };

  const removePromoCode = () => {
    setPromoCode("");
    setPromoDiscountPct(0);
    haptic("light");
  };

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      subtotal,
      discountAmount,
      shippingAmount,
      finalTotal,
      promoCode,
      applyPromoCode,
      removePromoCode,
      isCartOpen,
      setIsCartOpen,
      isCheckoutOpen,
      setIsCheckoutOpen,
      lastOrder,
      setLastOrder,
    }),
    [
      items,
      totalItems,
      subtotal,
      discountAmount,
      shippingAmount,
      finalTotal,
      promoCode,
      isCartOpen,
      isCheckoutOpen,
      lastOrder,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
