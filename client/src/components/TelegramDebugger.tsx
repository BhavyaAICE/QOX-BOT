import React, { useState } from "react";
import { Smartphone, ChevronDown, ChevronUp } from "lucide-react";
import { useTelegram } from "../context/TelegramContext";

export const TelegramDebugger: React.FC = () => {
  const { isTelegram, user } = useTelegram();
  const [isExpanded, setIsExpanded] = useState(false);

  // If already running directly inside native Telegram WebApp, don't show the dev banner
  if (isTelegram) return null;

  return (
    <div style={{
      backgroundColor: "rgba(59, 130, 246, 0.12)",
      borderBottom: "1px solid rgba(59, 130, 246, 0.25)",
      fontSize: "0.78rem",
      color: "var(--text-secondary)",
    }}>
      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Smartphone size={15} color="#60a5fa" />
          <span>
            <b>Browser Preview:</b> Mocking Telegram User <code>@{user?.username}</code>
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: "transparent",
            border: "none",
            color: "#60a5fa",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {isExpanded ? "Hide Guide" : "Test in Telegram"}
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {isExpanded && (
        <div style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "10px 16px 14px",
          borderTop: "1px dashed rgba(59, 130, 246, 0.2)",
          color: "var(--text-secondary)",
          lineHeight: 1.5,
        }}>
          <p style={{ marginBottom: "6px", color: "var(--text-primary)", fontWeight: 600 }}>
            🚀 How to test this inside your real Telegram app:
          </p>
          <ol style={{ paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <li>
              Expose port 5173 to HTTPS using <code>npx localtunnel --port 5173</code> or <code>ngrok http 5173</code>.
            </li>
            <li>
              Open <b>@BotFather</b> in Telegram and create a bot with <code>/newbot</code>.
            </li>
            <li>
              Create a Mini App via <code>/newapp</code> in @BotFather and paste your HTTPS tunnel URL.
            </li>
            <li>
              Add the bot token to <code>bot/.env</code> and run <code>npm run dev:bot</code> to receive order receipts!
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};
