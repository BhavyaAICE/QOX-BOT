import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  Sparkles,
  Crown,
  Wallet,
  ArrowRight,
  Copy,
  Check,
  CheckCircle2,
  Shield,
  Loader2,
  ShieldCheck,
  QrCode as QrIcon,
  ExternalLink,
  AlertCircle,
  Terminal,
  MessageSquare,
  Send,
} from "lucide-react";
import QRCode from "qrcode";
import confetti from "canvas-confetti";
import type { QTXPlan } from "../data/qtxData";
import { PAYMENT_CONFIG, getPlanInrAmount } from "../data/qtxData";
import { useTelegram } from "../context/TelegramContext";
import { sounds } from "../utils/soundEffects";
import type { VerificationResult } from "../utils/bscVerify";
import binanceQrImg from "../assets/binance_bep20_qr.jpg";
import trustQrImg from "../assets/trust_wallet_qr.jpg";
import binanceQrSquareImg from "../assets/binance_qr_square.jpg";
import trustQrSquareImg from "../assets/trust_qr_square.jpg";

interface GatewayStatus {
  key: "upi" | "binance" | "trust";
  name: string;
  badge: string;
  enabled: boolean;
  disabledReason: string;
}

type GatewaysMap = Record<"upi" | "binance" | "trust", GatewayStatus>;

const DEFAULT_GATEWAYS: GatewaysMap = {
  upi: {
    key: "upi",
    name: "PAY WITH UPI / QR",
    badge: "INR",
    enabled: true,
    disabledReason: "UPI / QR payment gateway is temporarily disabled by admin for routine banking maintenance. Please use Binance Pay or Trust Wallet, or contact admin support.",
  },
  binance: {
    key: "binance",
    name: "PAY WITH BINANCE",
    badge: "USDT",
    enabled: true,
    disabledReason: "Binance Pay gateway is temporarily disabled by admin for system maintenance. Please use UPI / QR or Trust Wallet, or contact admin desk.",
  },
  trust: {
    key: "trust",
    name: "PAY WITH TRUST WALLET",
    badge: "USDT",
    enabled: true,
    disabledReason: "Trust Wallet gateway is temporarily disabled by admin for node maintenance. Please use UPI / QR or Binance Pay, or contact admin desk.",
  },
};

interface QTXCheckoutModalProps {
  plan: QTXPlan | null;
  onClose: () => void;
  onLaunchTerminal?: (userId?: string, password?: string) => void;
}

// Generate random QOX User ID and Password
function generateCredentials(): { userId: string; password: string } {
  const userId = `QOX-${Math.floor(10000 + Math.random() * 90000)}`;
  const password = `${Math.floor(100000 + Math.random() * 900000)}`;
  return { userId, password };
}

type ModalStep = "plan_details" | "choose_method" | "pay_and_verify" | "verifying" | "complete" | "upi_pending";
type PaymentMethodType = "binance" | "trust" | "trc20" | "upi";

export const QTXCheckoutModal: React.FC<QTXCheckoutModalProps> = ({
  plan,
  onClose,
  onLaunchTerminal,
}) => {
  const { tg, user, haptic, sendOrderToBot } = useTelegram();

  // Multi-step modal state
  const [step, setStep] = useState<ModalStep>("plan_details");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>("upi");
  const [gateways, setGateways] = useState<GatewaysMap>(DEFAULT_GATEWAYS);
  const [disabledMethodPopup, setDisabledMethodPopup] = useState<{
    open: boolean;
    title: string;
    methodName: string;
    message: string;
  } | null>(null);
  const [txId, setTxId] = useState("");
  const [utr, setUtr] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmittingUpi, setIsSubmittingUpi] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [orderId, setOrderId] = useState("");
  const [accountUserId, setAccountUserId] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [isCustomizingPassword, setIsCustomizingPassword] = useState(false);
  const [customPasswordInput, setCustomPasswordInput] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordUpdateMessage, setPasswordUpdateMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [verificationDetails, setVerificationDetails] = useState<VerificationResult | null>(null);
  const [queryDispatched, setQueryDispatched] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [showFullQrCard, setShowFullQrCard] = useState(false);

  // Fetch gateway enable/disable status from backend
  useEffect(() => {
    fetch("/api/payment/gateways")
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.gateways) {
          setGateways(data.gateways);
        }
      })
      .catch((err) => console.warn("Could not fetch payment gateways:", err));
  }, []);

  // Reset step whenever a new plan is opened
  useEffect(() => {
    if (plan) {
      setStep("plan_details");
      setTxId("");
      setUtr("");
      setErrorMessage("");
      setCopied(false);
      setCopiedUpi(false);
      setVerificationDetails(null);
      setDisabledMethodPopup(null);
      setShowFullQrCard(false);
    }
  }, [plan]);

  const currentAddress =
    selectedMethod === "trust" || selectedMethod === "trc20"
      ? PAYMENT_CONFIG.usdtTrc20Address
      : PAYMENT_CONFIG.usdtBep20Address;

  const inrAmount = plan ? getPlanInrAmount(plan) : 0;
  const upiQrString = `upi://pay?pa=${encodeURIComponent(PAYMENT_CONFIG.upiId)}&pn=${encodeURIComponent(PAYMENT_CONFIG.upiName)}&am=${inrAmount}&cu=INR&tn=${encodeURIComponent(`QOX_${plan?.tag || "ACCESS"}`)}`;

  const currentPayload = selectedMethod === "upi" ? upiQrString : currentAddress;

  // Generate QR Code dynamically with High Error Correction ('H') to ensure scanability with center logo
  useEffect(() => {
    if (!plan) return;

    QRCode.toDataURL(currentPayload, {
      margin: 1,
      width: 280,
      errorCorrectionLevel: "H",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [plan, currentPayload]);

  // Polling for UPI order approval
  useEffect(() => {
    if (step !== "upi_pending" || !orderId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/upi-status?orderId=${encodeURIComponent(orderId)}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.success && data.status === "APPROVED" && data.license) {
          clearInterval(interval);
          setAccountUserId(data.license.userId);
          setAccountPassword(data.license.password);
          localStorage.setItem("qox_user_id", data.license.userId);
          localStorage.setItem("qox_password", data.license.password);
          localStorage.setItem("qox_license_key", data.license.userId);
          localStorage.setItem("varshit_license_key", data.license.userId);

          try {
            confetti({
              particleCount: 130,
              spread: 80,
              origin: { y: 0.6 },
              colors: ["#10b981", "#059669", "#34d399", "#ffffff"],
            });
          } catch {}

          sounds.playSuccess();
          haptic("success");
          setStep("complete");
        } else if (data.success && data.status === "REJECTED") {
          clearInterval(interval);
          setErrorMessage("Your UPI transaction could not be verified by compliance.");
        }
      } catch (err) {
        console.error("UPI polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, orderId, haptic]);

  if (!plan) return null;

  const handleCopyAddress = () => {
    haptic("light");
    sounds.playClick();
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyUserId = () => {
    haptic("light");
    sounds.playClick();
    navigator.clipboard.writeText(accountUserId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleCopyPassword = () => {
    haptic("light");
    sounds.playClick();
    navigator.clipboard.writeText(accountPassword);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2500);
  };

  const handleCopyUpiId = () => {
    haptic("light");
    sounds.playClick();
    navigator.clipboard.writeText(PAYMENT_CONFIG.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleRaiseQueryToAdmin = async () => {
    haptic("medium");
    sounds.playClick();
    setQueryDispatched(true);
    try {
      const calculatedAmountText =
        selectedMethod === "upi"
          ? `₹${getPlanInrAmount(plan).toLocaleString()} INR ($${plan.price} USD)`
          : `$${plan.price} USD`;

      await fetch("/api/payment/raise-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          planTag: plan.tag,
          amountText: calculatedAmountText,
          paymentMethod: selectedMethod.toUpperCase(),
          txRef: utr || txId,
          telegramId: user?.id,
          telegramUsername: user?.username || user?.first_name || "Valued Trader",
        }),
      });
      sounds.playSuccess();
      haptic("success");
    } catch (err) {
      console.warn("Failed to dispatch query via API:", err);
    }
  };

  const handleOpenAdminChat = () => {
    haptic("light");
    sounds.playClick();
    const link = "https://t.me/qoxking";
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(link);
    } else {
      window.open(link, "_blank");
    }
  };

  const handleCopyQueryText = () => {
    haptic("light");
    sounds.playClick();
    const calculatedAmountText =
      selectedMethod === "upi"
        ? `₹${getPlanInrAmount(plan).toLocaleString()} INR ($${plan.price} USD)`
        : `$${plan.price} USD`;
    const text =
      `QOX PAYMENT VERIFICATION QUERY:\n` +
      `Order ID: #${orderId}\n` +
      `Plan: ${plan.tag} (${plan.duration})\n` +
      `Amount: ${calculatedAmountText}\n` +
      `Method: ${selectedMethod.toUpperCase()}\n` +
      `Reference / UTR / TxID: ${utr || txId}\n` +
      `Trader: @${user?.username || "Trader"}\n` +
      `Official Admin: @qoxking\n` +
      `Request: I have completed the payment. Please verify my credit and approve my QOX Software Terminal User ID & Password.`;
    navigator.clipboard.writeText(text);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2500);
  };

  const handleSubmitUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utr.trim().replace(/\s+/g, "");

    if (!cleanUtr || cleanUtr.length < 6) {
      setErrorMessage("Please enter a valid 12-digit UPI Reference (UTR) number.");
      haptic("error");
      return;
    }

    setErrorMessage("");
    setIsSubmittingUpi(true);
    haptic("medium");

    const generatedOrderId = `QOX-UPI-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(generatedOrderId);

    const calculatedInr = getPlanInrAmount(plan);
    const durationDays = plan.tag === "INITIATE" ? 10 : plan.tag === "ENLIGHTENED" ? 30 : -1;

    try {
      // 1. Submit to Backend API
      await fetch("/api/payment/upi-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: generatedOrderId,
          telegramId: user?.id,
          telegramUsername: user?.username || user?.first_name || "Valued Trader",
          planTag: plan.tag,
          planId: plan.id,
          durationDays,
          priceUsdt: plan.price,
          amountInr: calculatedInr,
          utr: cleanUtr,
        }),
      });

      // 2. Also send Telegram WebApp event
      sendOrderToBot({
        type: "upi_payment_submission",
        orderId: generatedOrderId,
        telegramId: user?.id,
        telegramUser: user?.username || user?.first_name || "Valued Trader",
        planTag: plan.tag,
        duration: plan.duration,
        price: plan.price,
        amountInr: calculatedInr,
        utr: cleanUtr,
        timestamp: new Date().toISOString(),
      });

      sounds.playSuccess();
      haptic("success");
      setStep("upi_pending");
    } catch (err) {
      console.error("UPI submission error:", err);
      setStep("upi_pending");
    } finally {
      setIsSubmittingUpi(false);
    }
  };

  const handleSaveCustomPassword = async () => {
    const cleanNewPass = customPasswordInput.trim();
    if (!cleanNewPass || cleanNewPass.length < 4) {
      setPasswordUpdateMessage("Password must be at least 4 characters long.");
      haptic("error");
      return;
    }

    setIsSavingPassword(true);
    setPasswordUpdateMessage("");
    haptic("medium");

    try {
      const res = await fetch("/api/license/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: accountUserId,
          newPassword: cleanNewPass,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAccountPassword(cleanNewPass);
        localStorage.setItem("qox_password", cleanNewPass);
        setPasswordUpdateMessage("Password updated successfully!");
        sounds.playSuccess();
        haptic("success");
        setTimeout(() => setIsCustomizingPassword(false), 2000);
      } else {
        throw new Error(data.message || "Failed to update password");
      }
    } catch {
      // Local fallback
      setAccountPassword(cleanNewPass);
      localStorage.setItem("qox_password", cleanNewPass);
      setPasswordUpdateMessage("Password saved!");
      sounds.playSuccess();
      haptic("success");
      setTimeout(() => setIsCustomizingPassword(false), 2000);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTx = txId.trim();

    if (!cleanTx || cleanTx.length < 6) {
      setErrorMessage("Please enter a valid Transaction Hash / TxID or Reference ID.");
      haptic("error");
      return;
    }

    setErrorMessage("");
    setIsSubmittingUpi(true);
    haptic("medium");

    const methodLabel =
      selectedMethod === "binance"
        ? "BINANCE PAY"
        : selectedMethod === "trust"
        ? "TRUST WALLET"
        : selectedMethod === "trc20"
        ? "USDT TRC-20"
        : "CRYPTO";

    const prefix =
      selectedMethod === "binance"
        ? "BINANCE"
        : selectedMethod === "trust"
        ? "TRUST"
        : selectedMethod === "trc20"
        ? "TRC20"
        : "CRYPTO";

    const generatedOrderId = `QOX-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    const creds = generateCredentials();

    setOrderId(generatedOrderId);
    setAccountUserId(creds.userId);
    setAccountPassword(creds.password);

    const durationDays = plan.tag === "INITIATE" ? 10 : plan.tag === "ENLIGHTENED" ? 30 : -1;

    try {
      // 1. Submit to Unified Payment API (Triggers Owner Alert with [Confirm & Issue Login])
      await fetch("/api/payment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: generatedOrderId,
          telegramId: user?.id,
          telegramUsername: user?.username || user?.first_name || "Valued Trader",
          planTag: plan.tag,
          planId: plan.id,
          durationDays,
          priceUsdt: plan.price,
          amountText: `$${plan.price} USD`,
          paymentMethod: methodLabel,
          txRef: cleanTx,
          customUserId: creds.userId,
          customPassword: creds.password,
        }),
      });

      // 2. Also send Telegram WebApp event
      sendOrderToBot({
        type: "crypto_payment_submission",
        orderId: generatedOrderId,
        telegramId: user?.id,
        telegramUser: user?.username || user?.first_name || "Valued Trader",
        planTag: plan.tag,
        duration: plan.duration,
        price: plan.price,
        paymentMethod: methodLabel,
        txRef: cleanTx,
        timestamp: new Date().toISOString(),
      });

      sounds.playSuccess();
      haptic("success");
      setStep("upi_pending");
    } catch (err) {
      console.error("Submit error:", err);
      // Still proceed to pending approval screen
      setStep("upi_pending");
    } finally {
      setIsSubmittingUpi(false);
    }
  };

  const renderPlanIcon = () => {
    switch (plan.tag) {
      case "INITIATE":
        return <Zap size={24} color="var(--emerald-primary)" fill="var(--emerald-primary)" />;
      case "ENLIGHTENED":
        return <Sparkles size={24} color="var(--emerald-primary)" />;
      case "GRANDMASTER":
        return <Crown size={24} color="var(--emerald-primary)" />;
      default:
        return <Zap size={24} color="var(--emerald-primary)" />;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(0, 0, 0, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 12px",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
      onClick={() => step !== "verifying" && onClose()}
    >
      <div
        className="animate-slide-up"
        style={{
          width: "100%",
          maxWidth: "420px",
          maxHeight: "calc(100dvh - 32px)",
          backgroundColor: "#070e0b",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderTop: "1.5px solid rgba(16, 185, 129, 0.5)",
          borderRadius: "18px",
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 0, 0, 0.8)",
          position: "relative",
          padding: "24px 18px 20px",
          boxSizing: "border-box",
          margin: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button X at Top Right */}
        {step !== "verifying" && (
          <button
            onClick={() => {
              sounds.playClick();
              haptic("light");
              onClose();
            }}
            style={{
              position: "absolute",
              top: "14px",
              right: "14px",
              background: "rgba(0, 0, 0, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              cursor: "pointer",
              padding: 0,
              zIndex: 30,
              backdropFilter: "blur(6px)",
            }}
          >
            <X size={18} />
          </button>
        )}

        {/* STEP 1: PLAN DETAILS (MATCHING IMAGE 1 IN LUXURY EMERALD THEME) */}
        {step === "plan_details" && (
          <div>
            {/* Top Icon Pill */}
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              {renderPlanIcon()}
            </div>

            {/* Duration */}
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "#ffffff",
              textAlign: "center",
              letterSpacing: "0.04em",
              marginBottom: "4px",
              textTransform: "uppercase",
            }}>
              {plan.duration}
            </h2>

            {/* Price */}
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "2.4rem",
              fontWeight: 800,
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1,
              marginBottom: "22px",
              letterSpacing: "-0.03em",
            }}>
              <span style={{ color: "var(--emerald-primary)", marginRight: "2px" }}>$</span>
              {plan.price}
            </div>

            {/* Checklist */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "26px",
              padding: "0 6px",
            }}>
              {plan.features.map((feature, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "0.86rem",
                    color: "#cbd5e1",
                    fontWeight: 500,
                  }}
                >
                  <div style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ color: "var(--emerald-primary)", fontSize: "0.75rem", fontWeight: 900, lineHeight: 1 }}>✓</span>
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* SELECT PLAN Button */}
            <button
              onClick={() => {
                sounds.playClick();
                haptic("light");
                setStep("choose_method");
              }}
              className="btn-emerald-solid"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "0.92rem",
                letterSpacing: "0.1em",
              }}
            >
              SELECT PLAN
            </button>
          </div>
        )}

        {/* STEP 2: CHOOSE PAYMENT METHOD (MATCHING IMAGE 2 IN LUXURY EMERALD THEME) */}
        {step === "choose_method" && (
          <div>
            {/* Top Wallet Icon */}
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}>
              <Wallet size={24} color="var(--emerald-primary)" />
            </div>

            {/* Header */}
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "#ffffff",
              textAlign: "center",
              letterSpacing: "0.06em",
              marginBottom: "4px",
              textTransform: "uppercase",
            }}>
              CHOOSE PAYMENT METHOD
            </h2>

            {/* Subtitle */}
            <p style={{
              fontSize: "0.85rem",
              color: "#94a3b8",
              textAlign: "center",
              marginBottom: "22px",
            }}>
              {plan.duration} • <b style={{ color: "#ffffff" }}>${plan.price} USDT</b>
            </p>

            {/* Options List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
              {/* Option: PAY WITH UPI / QR (INR) */}
              {(() => {
                const upiEnabled = gateways.upi?.enabled ?? true;
                return (
                  <button
                    onClick={() => {
                      if (!upiEnabled) {
                        sounds.playClick();
                        haptic("error");
                        setDisabledMethodPopup({
                          open: true,
                          title: "Payment Option Temporarily Disabled",
                          methodName: "PAY WITH UPI / QR (INR)",
                          message: gateways.upi?.disabledReason || "UPI / QR payment gateway is temporarily disabled by admin for routine banking maintenance. Please use Binance Pay or Trust Wallet, or contact admin support.",
                        });
                        if (tg?.showAlert) {
                          tg.showAlert(`⚠️ PAY WITH UPI / QR is temporarily disabled by admin.\n\n${gateways.upi?.disabledReason || "Please choose another payment method."}`);
                        }
                        return;
                      }
                      sounds.playClick();
                      haptic("light");
                      setSelectedMethod("upi");
                      setStep("pay_and_verify");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 18px",
                      backgroundColor: upiEnabled ? "#0d1712" : "#130f0f",
                      border: upiEnabled ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(239, 68, 68, 0.3)",
                      borderTop: upiEnabled ? "1.5px solid var(--emerald-primary)" : "1.5px solid #ef4444",
                      borderRadius: "12px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                      opacity: upiEnabled ? 1 : 0.85,
                    }}
                  >
                    <div>
                      <div style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        color: "#ffffff",
                        letterSpacing: "0.04em",
                        marginBottom: "3px",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}>
                        <span>PAY WITH UPI / QR</span>
                        <span style={{
                          fontSize: "0.62rem",
                          color: "#000000",
                          backgroundColor: "var(--emerald-primary)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontWeight: 800,
                        }}>
                          INR
                        </span>
                        {!upiEnabled && (
                          <span style={{
                            fontSize: "0.58rem",
                            color: "#fca5a5",
                            backgroundColor: "rgba(239, 68, 68, 0.2)",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: 800,
                            letterSpacing: "0.03em",
                          }}>
                            ⚠️ TEMPORARILY DISABLED
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: "0.76rem",
                        color: upiEnabled ? "var(--emerald-primary)" : "#f87171",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}>
                        <span style={{ color: "#ffffff", fontWeight: 700 }}>
                          ₹{getPlanInrAmount(plan).toLocaleString()} INR
                        </span>
                        <span style={{ color: "#64748b" }}>/</span>
                        <span style={{ color: "var(--emerald-primary)", fontWeight: 700 }}>
                          ${plan.price} USD
                        </span>
                        <span style={{ color: "#94a3b8" }}>• GPay, PhonePe, Paytm</span>
                      </div>
                    </div>
                    <ArrowRight size={18} color={upiEnabled ? "var(--emerald-primary)" : "#ef4444"} />
                  </button>
                );
              })()}

              {/* Option 1: PAY WITH BINANCE */}
              {(() => {
                const binanceEnabled = gateways.binance?.enabled ?? true;
                return (
                  <button
                    onClick={() => {
                      if (!binanceEnabled) {
                        sounds.playClick();
                        haptic("error");
                        setDisabledMethodPopup({
                          open: true,
                          title: "Payment Option Temporarily Disabled",
                          methodName: "PAY WITH BINANCE",
                          message: gateways.binance?.disabledReason || "Binance Pay gateway is temporarily disabled by admin for system maintenance. Please use UPI / QR or Trust Wallet, or contact admin desk.",
                        });
                        if (tg?.showAlert) {
                          tg.showAlert(`⚠️ PAY WITH BINANCE is temporarily disabled by admin.\n\n${gateways.binance?.disabledReason || "Please choose another payment method."}`);
                        }
                        return;
                      }
                      sounds.playClick();
                      haptic("light");
                      setSelectedMethod("binance");
                      setStep("pay_and_verify");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 18px",
                      backgroundColor: binanceEnabled ? "#0d1712" : "#130f0f",
                      border: binanceEnabled ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(239, 68, 68, 0.3)",
                      borderTop: binanceEnabled ? "1px solid rgba(16, 185, 129, 0.3)" : "1.5px solid #ef4444",
                      borderRadius: "12px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                      opacity: binanceEnabled ? 1 : 0.85,
                    }}
                  >
                    <div>
                      <div style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        color: "#ffffff",
                        letterSpacing: "0.04em",
                        marginBottom: "3px",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}>
                        <span>PAY WITH BINANCE</span>
                        {!binanceEnabled && (
                          <span style={{
                            fontSize: "0.58rem",
                            color: "#fca5a5",
                            backgroundColor: "rgba(239, 68, 68, 0.2)",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: 800,
                            letterSpacing: "0.03em",
                          }}>
                            ⚠️ TEMPORARILY DISABLED
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.76rem", color: binanceEnabled ? "var(--emerald-primary)" : "#f87171", fontWeight: 500 }}>
                        USDT • BEP20 (BSC) • Auto On-Chain Verify
                      </div>
                    </div>
                    <ArrowRight size={18} color={binanceEnabled ? "var(--emerald-primary)" : "#ef4444"} />
                  </button>
                );
              })()}

              {/* Option 2: PAY WITH TRUST WALLET */}
              {(() => {
                const trustEnabled = gateways.trust?.enabled ?? true;
                return (
                  <button
                    onClick={() => {
                      if (!trustEnabled) {
                        sounds.playClick();
                        haptic("error");
                        setDisabledMethodPopup({
                          open: true,
                          title: "Payment Option Temporarily Disabled",
                          methodName: "PAY WITH TRUST WALLET",
                          message: gateways.trust?.disabledReason || "Trust Wallet gateway is temporarily disabled by admin for node maintenance. Please use UPI / QR or Binance Pay, or contact admin desk.",
                        });
                        if (tg?.showAlert) {
                          tg.showAlert(`⚠️ PAY WITH TRUST WALLET is temporarily disabled by admin.\n\n${gateways.trust?.disabledReason || "Please choose another payment method."}`);
                        }
                        return;
                      }
                      sounds.playClick();
                      haptic("light");
                      setSelectedMethod("trust");
                      setStep("pay_and_verify");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 18px",
                      backgroundColor: trustEnabled ? "#0d1712" : "#130f0f",
                      border: trustEnabled ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(239, 68, 68, 0.3)",
                      borderTop: trustEnabled ? "1px solid rgba(16, 185, 129, 0.3)" : "1.5px solid #ef4444",
                      borderRadius: "12px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                      opacity: trustEnabled ? 1 : 0.85,
                    }}
                  >
                    <div>
                      <div style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        color: "#ffffff",
                        letterSpacing: "0.04em",
                        marginBottom: "3px",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}>
                        <span>PAY WITH TRUST WALLET</span>
                        {!trustEnabled && (
                          <span style={{
                            fontSize: "0.58rem",
                            color: "#fca5a5",
                            backgroundColor: "rgba(239, 68, 68, 0.2)",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: 800,
                            letterSpacing: "0.03em",
                          }}>
                            ⚠️ TEMPORARILY DISABLED
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.76rem", color: trustEnabled ? "var(--emerald-primary)" : "#f87171", fontWeight: 500 }}>
                        USDT • TRC20 (Tron) • Auto On-Chain Verify
                      </div>
                    </div>
                    <ArrowRight size={18} color={trustEnabled ? "var(--emerald-primary)" : "#ef4444"} />
                  </button>
                );
              })()}
            </div>

            {/* Back Button */}
            <button
              onClick={() => {
                sounds.playClick();
                haptic("light");
                setStep("plan_details");
              }}
              className="btn-emerald-outline"
              style={{ width: "100%", padding: "12px" }}
            >
              BACK
            </button>
          </div>
        )}

        {/* STEP 3: PAYMENT & VERIFICATION SCREEN */}
        {step === "pay_and_verify" && (
          <div>
            {selectedMethod === "upi" ? (
              /* UPI PAYMENT INTERFACE */
              <div>
                <h2 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  color: "#ffffff",
                  textAlign: "center",
                  letterSpacing: "0.06em",
                  marginBottom: "3px",
                  textTransform: "uppercase",
                }}>
                  PAY WITH UPI / QR
                </h2>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginBottom: "14px",
                  flexWrap: "wrap",
                }}>
                  <span style={{ fontSize: "0.84rem", color: "#94a3b8", fontWeight: 600 }}>
                    {plan.duration}
                  </span>
                  <span style={{ color: "#475569" }}>•</span>
                  <span style={{
                    fontSize: "0.98rem",
                    fontWeight: 800,
                    color: "#ffffff",
                    fontFamily: "var(--font-mono)",
                  }}>
                    ₹{getPlanInrAmount(plan).toLocaleString()} INR
                  </span>
                  <span style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--emerald-primary)",
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    fontFamily: "var(--font-mono)",
                  }}>
                    ${plan.price} USD
                  </span>
                </div>

                {/* Dynamic UPI QR Code */}
                <div style={{
                  position: "relative",
                  width: "170px",
                  height: "170px",
                  margin: "0 auto 10px",
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  padding: "8px",
                  boxSizing: "border-box",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="UPI Payment QR Code"
                      style={{ width: "100%", height: "100%", display: "block" }}
                    />
                  ) : (
                    <div style={{ color: "#000", display: "flex", alignItems: "center", gap: "6px" }}>
                      <QrIcon size={24} /> Generating QR...
                    </div>
                  )}

                  {/* Centered Watermark Shield / Icon */}
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "30px",
                    height: "30px",
                    borderRadius: "7px",
                    backgroundColor: "#ffffff",
                    border: "2px solid #000000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                  }}>
                    <Shield size={18} color="#000000" fill="#000000" />
                  </div>
                </div>

                <p style={{
                  fontSize: "0.76rem",
                  color: "#94a3b8",
                  textAlign: "center",
                  marginBottom: "10px",
                }}>
                  Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI App
                </p>

                {/* Payment Mode Badge */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  marginBottom: "12px",
                }}>
                  <span style={{
                    fontSize: "0.68rem",
                    color: "var(--emerald-primary)",
                    backgroundColor: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    padding: "2px 10px",
                    borderRadius: "100px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                  }}>
                    ACCEPTED: GPAY • PHONEPE • PAYTM • ALL UPI APPS
                  </span>
                </div>

                {/* Dual Currency Transfer Amount Box */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  backgroundColor: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "8px",
                  marginBottom: "12px",
                }}>
                  <div>
                    <div style={{
                      fontSize: "0.62rem",
                      color: "#94a3b8",
                      letterSpacing: "0.08em",
                      marginBottom: "2px",
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}>
                      Amount to Transfer (INR & Dollar)
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "8px",
                    }}>
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "1.08rem",
                        fontWeight: 900,
                        color: "#ffffff",
                      }}>
                        ₹{getPlanInrAmount(plan).toLocaleString()} INR
                      </span>
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.85rem",
                        fontWeight: 800,
                        color: "var(--emerald-primary)",
                      }}>
                        (${plan.price} USD)
                      </span>
                    </div>
                  </div>

                  <div style={{
                    fontSize: "0.66rem",
                    color: "#94a3b8",
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    lineHeight: 1.3,
                  }}>
                    <span style={{ color: "#cbd5e1" }}>Rate: $1 = ₹{Math.round(getPlanInrAmount(plan) / plan.price)}</span>
                  </div>
                </div>

                {/* Official UPI ID with 1-Click Copy */}
                <div
                  onClick={handleCopyUpiId}
                  title="Click to copy official UPI ID"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    backgroundColor: "rgba(0, 0, 0, 0.65)",
                    border: copiedUpi ? "1px solid var(--emerald-primary)" : "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ minWidth: 0, overflow: "hidden" }}>
                    <div style={{
                      fontSize: "0.62rem",
                      color: "#94a3b8",
                      letterSpacing: "0.08em",
                      marginBottom: "2px",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}>
                      Official Store UPI ID
                    </div>
                    <div style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.82rem",
                      color: "#ffffff",
                      fontWeight: 700,
                      letterSpacing: "0.02em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {PAYMENT_CONFIG.upiId}
                    </div>
                  </div>

                  <div
                    style={{
                      color: copiedUpi ? "var(--emerald-primary)" : "#34d399",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.72rem",
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      marginLeft: "10px",
                      flexShrink: 0,
                      padding: "4px 8px",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      borderRadius: "6px",
                    }}
                  >
                    {copiedUpi ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedUpi ? "COPIED" : "COPY"}</span>
                  </div>
                </div>

                {/* Prominent Verification Notice as Requested */}
                <div style={{
                  padding: "11px 13px",
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: "8px",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  textAlign: "left",
                }}>
                  <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div style={{ fontSize: "0.73rem", color: "#fef3c7", lineHeight: 1.45 }}>
                    <strong style={{ color: "#fbbf24", display: "block", marginBottom: "3px" }}>
                      Notice: Verification Might Take Time (5–15 Minutes)
                    </strong>
                    After transferring ₹{getPlanInrAmount(plan).toLocaleString()} INR (${plan.price} USD) from your UPI app, submit your 12-digit UPI Reference (UTR) number below. Verification might take time as our compliance desk manually confirms incoming credits on our bank statement before issuing your login.
                  </div>
                </div>

                {/* Form for UTR Submission */}
                <form onSubmit={handleSubmitUpi}>
                  <div style={{ marginBottom: "14px", textAlign: "left" }}>
                    <label style={{
                      display: "block",
                      fontFamily: "var(--font-display)",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#cbd5e1",
                      letterSpacing: "0.06em",
                      marginBottom: "5px",
                      textTransform: "uppercase",
                    }}>
                      ENTER 12-DIGIT UPI REFERENCE (UTR) NUMBER
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 431289567123"
                      value={utr}
                      onChange={(e) => {
                        setUtr(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        border: errorMessage ? "1px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.14)",
                        borderRadius: "6px",
                        color: "#ffffff",
                        fontSize: "0.86rem",
                        outline: "none",
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.05em",
                      }}
                    />
                    {errorMessage && (
                      <div style={{
                        color: "#f87171",
                        fontSize: "0.72rem",
                        marginTop: "5px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "4px",
                        lineHeight: 1.3,
                      }}>
                        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "1px" }} />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingUpi}
                    className="btn-emerald-solid"
                    style={{
                      width: "100%",
                      padding: "13px",
                      fontSize: "0.88rem",
                      letterSpacing: "0.1em",
                      marginBottom: "10px",
                      opacity: isSubmittingUpi ? 0.7 : 1,
                    }}
                  >
                    {isSubmittingUpi ? "SUBMITTING FOR VERIFICATION..." : "SUBMIT UTR FOR VERIFICATION"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      haptic("light");
                      setStep("choose_method");
                    }}
                    className="btn-emerald-outline"
                    style={{ width: "100%", padding: "11px", fontSize: "0.82rem" }}
                  >
                    BACK
                  </button>
                </form>
              </div>
            ) : (
              /* CRYPTO (BINANCE / TRUST WALLET) INTERFACE */
              <div>
                <h2 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  color: "#ffffff",
                  textAlign: "center",
                  letterSpacing: "0.06em",
                  marginBottom: "3px",
                  textTransform: "uppercase",
                }}>
                  {selectedMethod === "binance" ? "BINANCE PAY (BEP-20)" : "TRUST WALLET (TRC-20)"}
                </h2>

                <p style={{
                  fontSize: "0.84rem",
                  color: "#94a3b8",
                  textAlign: "center",
                  marginBottom: "14px",
                }}>
                  {plan.duration} • <b style={{ color: "#ffffff" }}>${plan.price} USDT ({selectedMethod === "trust" ? "TRC-20" : "BEP-20"})</b>
                </p>

                {/* AUTHENTIC OFFICIAL QR CODE CARD */}
                <div
                  onClick={() => {
                    sounds.playClick();
                    haptic("light");
                    setShowFullQrCard(true);
                  }}
                  title="Click to view full official SafePal slip"
                  style={{
                    position: "relative",
                    width: "184px",
                    height: "184px",
                    margin: "0 auto 8px",
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    padding: "8px",
                    boxSizing: "border-box",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8), 0 0 25px rgba(16, 185, 129, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={selectedMethod === "trust" ? trustQrSquareImg : binanceQrSquareImg}
                    alt={selectedMethod === "trust" ? "Trust Wallet TRX TRC20 QR Code" : "Binance BEP20 QR Code"}
                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", borderRadius: "8px" }}
                  />
                </div>

                {/* View Full Card Button */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      haptic("light");
                      setShowFullQrCard(true);
                    }}
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.14)",
                      color: "#94a3b8",
                      fontSize: "0.72rem",
                      padding: "3px 12px",
                      borderRadius: "100px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    🔍 Tap QR to enlarge official slip
                  </button>
                </div>

                <p style={{
                  fontSize: "0.76rem",
                  color: "#94a3b8",
                  textAlign: "center",
                  marginBottom: "10px",
                }}>
                  {selectedMethod === "trust"
                    ? "Take a screenshot and scan with Trust Wallet, SafePal, or TronLink"
                    : "Take a screenshot and scan with Binance, SafePal, or Trust Wallet"}
                </p>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  marginBottom: "10px",
                }}>
                  <span style={{
                    fontSize: "0.7rem",
                    color: "var(--emerald-primary)",
                    backgroundColor: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    padding: "3px 12px",
                    borderRadius: "100px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}>
                    {selectedMethod === "trust" ? "NETWORK: TRON (TRC20 / TRX)" : "NETWORK: BNB SMART CHAIN (BEP20)"}
                  </span>
                </div>

                <div
                  onClick={handleCopyAddress}
                  title="Click to copy full deposit address"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    backgroundColor: "rgba(0, 0, 0, 0.65)",
                    border: copied ? "1px solid var(--emerald-primary)" : "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "8px",
                    marginBottom: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ minWidth: 0, overflow: "hidden" }}>
                    <div style={{
                      fontSize: "0.62rem",
                      color: "#94a3b8",
                      letterSpacing: "0.08em",
                      marginBottom: "2px",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}>
                      {selectedMethod === "trust"
                        ? "Official Tron Deposit Address (USDT TRC-20)"
                        : "Official BNB Chain Deposit Address (USDT BEP-20)"}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.74rem",
                      color: "#ffffff",
                      letterSpacing: "0.02em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {currentAddress}
                    </div>
                  </div>

                  <div
                    style={{
                      color: copied ? "var(--emerald-primary)" : "#34d399",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.72rem",
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      marginLeft: "10px",
                      flexShrink: 0,
                      padding: "4px 8px",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      borderRadius: "6px",
                    }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copied ? "COPIED" : "COPY"}</span>
                  </div>
                </div>

                <form onSubmit={handleVerifyPayment}>
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{
                      display: "block",
                      fontFamily: "var(--font-display)",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#cbd5e1",
                      letterSpacing: "0.06em",
                      marginBottom: "5px",
                      textTransform: "uppercase",
                    }}>
                      PASTE YOUR TRANSACTION ID (TXID)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Long press to paste TxID here..."
                      value={txId}
                      onChange={(e) => {
                        setTxId(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        border: errorMessage ? "1px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.14)",
                        borderRadius: "6px",
                        color: "#ffffff",
                        fontSize: "0.82rem",
                        outline: "none",
                        fontFamily: "var(--font-mono)",
                      }}
                    />
                    {errorMessage && (
                      <div style={{
                        color: "#f87171",
                        fontSize: "0.72rem",
                        marginTop: "5px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "4px",
                        lineHeight: 1.3,
                      }}>
                        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "1px" }} />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-emerald-solid"
                    style={{
                      width: "100%",
                      padding: "13px",
                      fontSize: "0.88rem",
                      letterSpacing: "0.1em",
                      marginBottom: "10px",
                    }}
                  >
                    VERIFY PAYMENT
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      haptic("light");
                      setStep("choose_method");
                    }}
                    className="btn-emerald-outline"
                    style={{
                      width: "100%",
                      padding: "11px",
                      fontSize: "0.82rem",
                    }}
                  >
                    BACK
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* STEP: UPI PENDING VERIFICATION & ADMIN QUERY FLOW */}
        {step === "upi_pending" && (
          <div style={{ padding: "14px 8px", textAlign: "center" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              border: "2px solid #00ff88",
              background: "radial-gradient(circle, rgba(0, 255, 136, 0.18) 0%, transparent 70%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: "0 0 25px rgba(0, 255, 136, 0.3)",
            }}>
              <MessageSquare size={32} color="#00ff88" />
            </div>

            <h3 style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              fontWeight: 900,
              color: "#ffffff",
              marginBottom: "6px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>
              PAYMENT SUBMITTED · ACTION REQUIRED
            </h3>

            <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0 auto 12px", maxWidth: "340px", lineHeight: 1.45 }}>
              Please message Admin <b style={{ color: "#00ff88" }}>@qoxking</b> directly on Telegram with your Order ID to get your Software Terminal User ID & Password approved.
            </p>

            {/* Official Admin Contact Card */}
            <div style={{
              padding: "11px 14px",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: "1.5px solid rgba(16, 185, 129, 0.4)",
              borderRadius: "10px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              textAlign: "left",
            }}>
              <div>
                <div style={{ fontSize: "0.64rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                  Official Approval Admin
                </div>
                <div style={{ fontSize: "0.95rem", color: "#ffffff", fontWeight: 900, fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                  @qoxking
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenAdminChat}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "7px 14px",
                  backgroundColor: "var(--emerald-primary)",
                  color: "#000000",
                  borderRadius: "6px",
                  fontSize: "0.76rem",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Send size={13} />
                <span>DM ADMIN</span>
              </button>
            </div>

            {/* Verification Time Note */}
            <div style={{
              padding: "11px 13px",
              backgroundColor: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "10px",
              marginBottom: "14px",
              textAlign: "left",
            }}>
              <div style={{
                fontSize: "0.74rem",
                color: "#fbbf24",
                fontWeight: 800,
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <AlertCircle size={14} color="#fbbf24" />
                <span>Verification Time: 5–15 Minutes</span>
              </div>
              <p style={{ fontSize: "0.70rem", color: "#cbd5e1", margin: 0, lineHeight: 1.45 }}>
                Admin verifies incoming credits directly on bank statements before generating login credentials. Once approved, your User ID & Password will be sent to your Telegram chat.
              </p>
            </div>

            {/* Order Summary Box */}
            <div style={{
              padding: "12px 14px",
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.09)",
              borderRadius: "10px",
              textAlign: "left",
              marginBottom: "16px",
              fontSize: "0.74rem",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Order ID:</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "#ffffff", fontWeight: 700 }}>#{orderId}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Plan:</span>
                <span style={{ color: "#ffffff", fontWeight: 700 }}>{plan.tag} ({plan.duration})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Method:</span>
                <span style={{ color: "#ffffff", fontWeight: 700 }}>
                  {selectedMethod === "upi"
                    ? "UPI (GPay / PhonePe / Paytm)"
                    : selectedMethod === "binance"
                    ? "BINANCE PAY (USDT)"
                    : selectedMethod === "trust"
                    ? "TRUST WALLET (USDT)"
                    : "USDT TRC-20"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Amount:</span>
                <span style={{ color: "#ffffff", fontWeight: 700 }}>
                  {selectedMethod === "upi" ? (
                    <>
                      ₹{getPlanInrAmount(plan).toLocaleString()} INR
                      <span style={{ color: "var(--emerald-primary)", marginLeft: "6px" }}>(${plan.price} USD)</span>
                    </>
                  ) : (
                    <span style={{ color: "var(--emerald-primary)" }}>${plan.price} USD</span>
                  )}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>{selectedMethod === "upi" ? "Submitted UTR:" : "Submitted TxID / Ref:"}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--emerald-primary)", fontWeight: 700 }}>{utr || txId}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Status:</span>
                <span style={{ color: "#f59e0b", fontWeight: 800 }}>PENDING ADMIN APPROVAL</span>
              </div>
            </div>

            {/* Actions Stack */}
            <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginBottom: "16px" }}>
              {/* Primary: Contact Admin */}
              <button
                type="button"
                onClick={handleOpenAdminChat}
                className="btn-emerald-solid"
                style={{
                  width: "100%",
                  padding: "13px",
                  fontSize: "0.85rem",
                  letterSpacing: "0.06em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Send size={15} />
                <span>MESSAGE ADMIN (@qoxking)</span>
              </button>

              {/* Secondary: 1-Tap Raise Query */}
              <button
                type="button"
                onClick={handleRaiseQueryToAdmin}
                disabled={queryDispatched}
                className="btn-emerald-outline"
                style={{
                  width: "100%",
                  padding: "11px",
                  fontSize: "0.80rem",
                  borderColor: queryDispatched ? "var(--emerald-primary)" : "rgba(0, 255, 136, 0.4)",
                  backgroundColor: queryDispatched ? "rgba(0, 255, 136, 0.12)" : "transparent",
                  color: queryDispatched ? "#00ff88" : "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                }}
              >
                <Zap size={14} color={queryDispatched ? "#00ff88" : "var(--emerald-primary)"} />
                <span>{queryDispatched ? "QUERY SENT TO ADMIN DESK" : "RAISE QUERY TO ADMIN DESK (1-TAP)"}</span>
              </button>

              {/* Tertiary: Copy Query Text */}
              <button
                type="button"
                onClick={handleCopyQueryText}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "0.76rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: copiedQuery ? "#00ff88" : "#94a3b8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontWeight: 600,
                }}
              >
                {copiedQuery ? <Check size={13} color="#00ff88" /> : <Copy size={13} />}
                <span>{copiedQuery ? "QUERY DETAILS COPIED TO CLIPBOARD" : "COPY QUERY DETAILS FOR TELEGRAM"}</span>
              </button>
            </div>

            {/* Private Terminal Access Guarantee */}
            <div style={{
              padding: "11px 13px",
              backgroundColor: "rgba(0, 255, 136, 0.04)",
              border: "1px solid rgba(0, 255, 136, 0.2)",
              borderRadius: "8px",
              marginBottom: "14px",
              textAlign: "left",
            }}>
              <div style={{
                fontSize: "0.72rem",
                color: "#00ff88",
                fontWeight: 800,
                marginBottom: "3px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}>
                <ShieldCheck size={13} />
                <span>PRIVATE SOFTWARE TERMINAL ACCESS</span>
              </div>
              <p style={{ fontSize: "0.69rem", color: "#94a3b8", margin: 0, lineHeight: 1.45 }}>
                The Software Terminal link is private. Once the Bot Owner confirms your payment, your dedicated Terminal link and Login ID & Password will be sent directly to your Telegram chat.
              </p>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                haptic("light");
                onClose();
              }}
              className="btn-emerald-outline"
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "0.80rem",
                opacity: 0.8,
              }}
            >
              CLOSE WINDOW
            </button>
          </div>
        )}

        {/* STEP 4: VERIFYING STATE (AUTOMATED BLOCKCHAIN QUERY) */}
        {step === "verifying" && (
          <div style={{ padding: "36px 16px", textAlign: "center" }}>
            <Loader2
              size={48}
              color="var(--emerald-primary)"
              style={{
                margin: "0 auto 18px",
                animation: "spin 1s linear infinite",
              }}
            />
            <h3 style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "0.04em",
              marginBottom: "8px",
              textTransform: "uppercase",
            }}>
              VERIFYING TRANSACTION ON-CHAIN...
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Connecting to Binance Smart Chain node to verify transaction receipt and confirm transfer to store wallet.
            </p>
          </div>
        )}

        {/* STEP 5: ORDER VERIFIED & LICENSE COMPLETE */}
        {step === "complete" && (
          <div style={{ padding: "16px 10px", textAlign: "center" }}>
            {/* Success Check Circle */}
            <div style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              border: "2px solid var(--emerald-primary)",
              background: "radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, transparent 70%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 0 25px rgba(16, 185, 129, 0.35)",
            }}>
              <CheckCircle2 size={38} color="var(--emerald-primary)" />
            </div>

            <h3 style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              fontWeight: 900,
              color: "#ffffff",
              marginBottom: "6px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>
              PAYMENT VERIFIED!
            </h3>

            <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "16px" }}>
              Activation ID: <b style={{ color: "#ffffff", fontFamily: "var(--font-mono)" }}>#{orderId}</b>
            </p>

            {/* Credentials Card (User ID & Password) */}
            <div style={{
              padding: "16px 14px",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              borderRadius: "12px",
              textAlign: "left",
              marginBottom: "18px",
            }}>
              <div style={{
                fontSize: "0.68rem",
                color: "var(--emerald-primary)",
                fontWeight: 800,
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}>
                <ShieldCheck size={14} />
                <span>YOUR OFFICIAL QOX LOGIN CREDENTIALS</span>
              </div>

              {/* USER ID Row */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "8px",
                marginBottom: "8px",
              }}>
                <div>
                  <div style={{ fontSize: "0.62rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                    USER ID
                  </div>
                  <div style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "1.05rem",
                    fontWeight: 900,
                    color: "#ffffff",
                    letterSpacing: "0.04em",
                  }}>
                    {accountUserId}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyUserId}
                  style={{
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "6px",
                    color: copiedId ? "var(--emerald-primary)" : "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "5px 10px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                  }}
                >
                  {copiedId ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedId ? "COPIED" : "COPY"}</span>
                </button>
              </div>

              {/* PASSWORD Row */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "8px",
                marginBottom: "10px",
              }}>
                <div>
                  <div style={{ fontSize: "0.62rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                    PASSWORD
                  </div>
                  <div style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "1.05rem",
                    fontWeight: 900,
                    color: "var(--emerald-primary)",
                    letterSpacing: "0.08em",
                  }}>
                    {accountPassword}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPassword}
                  style={{
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "6px",
                    color: copiedPass ? "var(--emerald-primary)" : "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "5px 10px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                  }}
                >
                  {copiedPass ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedPass ? "COPIED" : "COPY"}</span>
                </button>
              </div>

              {/* Option to Set Custom Password */}
              <div style={{ marginBottom: "12px" }}>
                {!isCustomizingPassword ? (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsCustomizingPassword(true);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--emerald-primary)",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "2px 0",
                    }}
                  >
                    <span>Want to choose your own password?</span>
                    <span style={{ textDecoration: "underline" }}>Set Custom Password</span>
                  </button>
                ) : (
                  <div style={{
                    padding: "10px",
                    backgroundColor: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.28)",
                    borderRadius: "8px",
                  }}>
                    <div style={{ fontSize: "0.68rem", color: "#cbd5e1", fontWeight: 700, marginBottom: "6px" }}>
                      Create Your Custom Password (min 4 characters):
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input
                        type="text"
                        value={customPasswordInput}
                        onChange={(e) => setCustomPasswordInput(e.target.value)}
                        placeholder="e.g. MyTrader99"
                        style={{
                          flex: 1,
                          padding: "6px 8px",
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "6px",
                          color: "#ffffff",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveCustomPassword}
                        disabled={isSavingPassword || !customPasswordInput.trim()}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "var(--emerald-primary)",
                          color: "#000000",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isSavingPassword ? "SAVING..." : "SAVE"}
                      </button>
                    </div>
                    {passwordUpdateMessage && (
                      <div style={{ fontSize: "0.66rem", color: "#34d399", marginTop: "5px", fontWeight: 700 }}>
                        {passwordUpdateMessage}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {verificationDetails?.blockNumber && (
                <div style={{
                  fontSize: "0.68rem",
                  color: "#94a3b8",
                  fontFamily: "var(--font-mono)",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}>
                  <span>BSC Block: #{verificationDetails.blockNumber}</span>
                  <a
                    href={`https://bscscan.com/tx/${verificationDetails.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--emerald-primary)", display: "flex", alignItems: "center" }}
                  >
                    <ExternalLink size={10} style={{ marginLeft: "2px" }} />
                  </a>
                </div>
              )}

              <div style={{ fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.4 }}>
                Dispatched to your Telegram chat. Type <b style={{ color: "var(--emerald-primary)" }}>/myaccount</b> anytime to retrieve.
              </div>
            </div>

            {/* 1-Click Launch Terminal Button */}
            {onLaunchTerminal && (
              <button
                onClick={() => {
                  sounds.playClick();
                  haptic("medium");
                  onLaunchTerminal(accountUserId, accountPassword);
                }}
                className="btn-emerald-solid"
                style={{
                  width: "100%",
                  padding: "13px",
                  fontSize: "0.88rem",
                  letterSpacing: "0.08em",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Terminal size={14} />
                <span>LAUNCH SOFTWARE TERMINAL</span>
              </button>
            )}

            <button
              onClick={() => {
                sounds.playClick();
                haptic("light");
                onClose();
              }}
              className="btn-emerald-outline"
              style={{
                width: "100%",
                padding: "11px",
                fontSize: "0.82rem",
              }}
            >
              RETURN TO MAIN STORE
            </button>
          </div>
        )}
      </div>

      {/* POPUP: TEMPORARILY DISABLED PAYMENT METHOD ALERT */}
      {disabledMethodPopup?.open && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.88)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          zIndex: 999999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          animation: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <div style={{
            width: "100%",
            maxWidth: "380px",
            backgroundColor: "#0d1712",
            border: "1.5px solid rgba(245, 158, 11, 0.5)",
            borderRadius: "18px",
            padding: "24px 20px 20px",
            textAlign: "center",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(245, 158, 11, 0.2)",
            position: "relative",
          }}>
            {/* Warning Shield Icon */}
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              border: "1.5px solid rgba(245, 158, 11, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 0 24px rgba(245, 158, 11, 0.3)",
            }}>
              <AlertCircle size={32} color="#fbbf24" />
            </div>

            {/* Title */}
            <h3 style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.08rem",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.04em",
              marginBottom: "6px",
              textTransform: "uppercase",
            }}>
              Payment Option Unavailable
            </h3>

            {/* Gateway Tag */}
            <div style={{
              display: "inline-block",
              fontSize: "0.72rem",
              fontWeight: 800,
              color: "#fbbf24",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              padding: "3px 10px",
              borderRadius: "6px",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              marginBottom: "14px",
              fontFamily: "var(--font-mono)",
            }}>
              {disabledMethodPopup.methodName}
            </div>

            {/* Reason Message Box */}
            <div style={{
              fontSize: "0.80rem",
              color: "#cbd5e1",
              lineHeight: 1.5,
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "20px",
              textAlign: "left",
            }}>
              {disabledMethodPopup.message}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  haptic("light");
                  setDisabledMethodPopup(null);
                }}
                className="btn-emerald-solid"
                style={{ width: "100%", padding: "12px" }}
              >
                CHOOSE ANOTHER PAYMENT METHOD
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  haptic("light");
                  setDisabledMethodPopup(null);
                  handleOpenAdminChat();
                }}
                className="btn-emerald-outline"
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "0.80rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Send size={13} />
                <span>CONTACT ADMIN DESK (@qoxking)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: ENLARGED OFFICIAL SAFEPAL DEPOSIT SLIP */}
      {showFullQrCard && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.92)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            animation: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onClick={() => setShowFullQrCard(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "340px",
              backgroundColor: "#0d1712",
              border: "1.5px solid rgba(16, 185, 129, 0.4)",
              borderRadius: "18px",
              padding: "18px 16px 16px",
              textAlign: "center",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(16, 185, 129, 0.2)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                sounds.playClick();
                setShowFullQrCard(false);
              }}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>

            <h3 style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.95rem",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "0.04em",
              marginBottom: "12px",
              textTransform: "uppercase",
            }}>
              {selectedMethod === "trust" ? "TRX (TRON) OFFICIAL QR SLIP" : "BNB (BEP20) OFFICIAL QR SLIP"}
            </h3>

            {/* Official SafePal Card Image */}
            <div style={{
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              marginBottom: "14px",
              backgroundColor: "#ffffff",
            }}>
              <img
                src={selectedMethod === "trust" ? trustQrImg : binanceQrImg}
                alt="Official Deposit Slip"
                style={{ width: "100%", display: "block", maxHeight: "60vh", objectFit: "contain" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="btn-emerald-solid"
                style={{ width: "100%", padding: "11px", fontSize: "0.82rem" }}
              >
                {copied ? "COPIED TO CLIPBOARD" : "COPY DEPOSIT ADDRESS"}
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setShowFullQrCard(false);
                }}
                className="btn-emerald-outline"
                style={{ width: "100%", padding: "9px", fontSize: "0.78rem" }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
