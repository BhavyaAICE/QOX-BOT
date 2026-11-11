import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { TelegramUser, TelegramWebApp } from "../types/telegram";
import { sounds } from "../utils/soundEffects";

interface TelegramContextType {
  tg: TelegramWebApp | null;
  user: TelegramUser | null;
  isTelegram: boolean;
  colorScheme: "light" | "dark";
  haptic: (type?: "light" | "medium" | "heavy" | "success" | "warning" | "error") => void;
  sendOrderToBot: (orderData: unknown) => boolean;
  closeApp: () => void;
  toggleThemeForDev: () => void;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

// Mock user for local browser preview / debugging
const MOCK_USER: TelegramUser = {
  id: 7770001,
  first_name: "Alex",
  last_name: "Vance",
  username: "alex_telegram",
  is_premium: true,
  photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
};

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isTelegram, setIsTelegram] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;

    if (webApp) {
      setTg(webApp);
      setIsTelegram(true);
      try {
        webApp.ready();
        webApp.expand();
      } catch (err) {
        console.warn("Telegram WebApp expand error:", err);
      }

      // Detect user from Telegram if available
      if (webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
        setUser(webApp.initDataUnsafe.user);
      } else {
        setUser(MOCK_USER);
      }

      // Detect initial theme
      setColorScheme(webApp.colorScheme || "dark");

      // Apply Telegram theme variables to document root
      if (webApp.themeParams) {
        applyTelegramTheme(webApp.themeParams);
      }

      // Listen to theme change
      const handleThemeChange = () => {
        setColorScheme(webApp.colorScheme || "dark");
        if (webApp.themeParams) {
          applyTelegramTheme(webApp.themeParams);
        }
      };

      webApp.onEvent("themeChanged", handleThemeChange);
      return () => {
        webApp.offEvent("themeChanged", handleThemeChange);
      };
    } else {
      // Running standalone in regular browser (dev preview mode)
      setIsTelegram(false);
      setUser(MOCK_USER);
      setColorScheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Global sound effect on any interactive element click
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      sounds.unlock();
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.closest("button") ||
          target.closest("a") ||
          target.closest(".plan-card") ||
          target.closest("input") ||
          target.closest("textarea"))
      ) {
        sounds.playClick();
      }
    };

    window.addEventListener("click", handleGlobalClick, { capture: true });
    return () => {
      window.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, []);

  const applyTelegramTheme = (params: Record<string, string | undefined>) => {
    const root = document.documentElement;
    if (params.bg_color) root.style.setProperty("--tg-bg", params.bg_color);
    if (params.text_color) root.style.setProperty("--tg-text", params.text_color);
    if (params.hint_color) root.style.setProperty("--tg-hint", params.hint_color);
    if (params.link_color) root.style.setProperty("--tg-link", params.link_color);
    if (params.button_color) root.style.setProperty("--tg-button", params.button_color);
    if (params.button_text_color) root.style.setProperty("--tg-button-text", params.button_text_color);
    if (params.secondary_bg_color) root.style.setProperty("--tg-secondary-bg", params.secondary_bg_color);
  };

  const haptic = (type: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "light") => {
    if (type === "success") {
      sounds.playSuccess();
    } else {
      sounds.playClick();
    }

    if (tg?.HapticFeedback) {
      if (type === "success" || type === "warning" || type === "error") {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    } else if (navigator.vibrate) {
      // Browser fallback vibration
      navigator.vibrate(type === "heavy" ? 40 : 20);
    }
  };

  const sendOrderToBot = (orderData: unknown): boolean => {
    if (tg && isTelegram) {
      try {
        tg.sendData(JSON.stringify(orderData));
        return true;
      } catch (err) {
        console.error("Failed to sendData via Telegram WebApp:", err);
        return false;
      }
    } else {
      console.log("Mock Mode: Order sent to bot:", orderData);
      return true;
    }
  };

  const closeApp = () => {
    if (tg && isTelegram) {
      tg.close();
    } else {
      console.log("Mock Mode: closeApp() triggered");
    }
  };

  const toggleThemeForDev = () => {
    setColorScheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  const value = useMemo(
    () => ({
      tg,
      user,
      isTelegram,
      colorScheme,
      haptic,
      sendOrderToBot,
      closeApp,
      toggleThemeForDev,
    }),
    [tg, user, isTelegram, colorScheme]
  );

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
};

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error("useTelegram must be used within a TelegramProvider");
  }
  return context;
};
