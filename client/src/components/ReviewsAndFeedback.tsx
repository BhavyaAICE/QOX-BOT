import React, { useState } from "react";
import { CheckCircle2, Star, Send, MessageCircle, ShieldCheck, TrendingUp, Sparkles, MessageSquarePlus, ChevronDown } from "lucide-react";
import { QTX_REVIEWS } from "../data/qtxData";
import { useTelegram } from "../context/TelegramContext";
import { AnimatedReveal } from "./AnimatedReveal";

const FAQ_ITEMS = [
  {
    q: "How do I receive my login credentials after payment?",
    a: "After completing your UPI or Crypto payment on checkout, tap 'Raise Query to Admin Desk'. The Bot Owner verifies incoming credits directly on bank statements and delivers your private Software Terminal link, User ID, and Password straight to your Telegram chat (usually within 5–15 minutes).",
  },
  {
    q: "Which brokers and charts are supported?",
    a: "QOX Software's computer vision model supports Quotex, PocketOption, IQ Option, Binomo, OlympTrade, and TradingView. Simply upload any 1-minute candlestick chart screenshot to get instant call/put forecasts.",
  },
  {
    q: "Does QOX Software work on mobile phones (Android & iOS)?",
    a: "Yes. The Software Terminal runs natively inside the Telegram Mini App on Android and iPhone, as well as on any desktop web browser (Chrome, Safari, Edge on Windows and Mac).",
  },
  {
    q: "Can I trade on weekends and OTC market sessions?",
    a: "Absolutely. The QOX OTC momentum engine v4.8 is specifically trained on OTC broker algorithms that run 24/7, including Saturday and Sunday OTC sessions.",
  },
  {
    q: "Is Martingale (MTG) required with QOX signals?",
    a: "No. All QOX signals are calibrated strictly for Direct Wins (0 MTG). Our volatility and order block filters ensure you trade high-probability candle setups only.",
  },
];

export const ReviewsAndFeedback: React.FC = () => {
  const { haptic, tg, sendOrderToBot } = useTelegram();

  // Feedback State
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const handleOpenContact = () => {
    haptic("light");
    if (tg?.openTelegramLink) {
      tg.openTelegramLink("https://t.me/qoxking");
    } else {
      window.open("https://t.me/qoxking", "_blank");
    }
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    haptic("success");
    setSubmitted(true);

    sendOrderToBot({
      type: "customer_feedback",
      rating,
      comment: feedbackText,
      timestamp: new Date().toISOString(),
    });

    setTimeout(() => {
      setFeedbackText("");
      setSubmitted(false);
    }, 3500);
  };

  // Duplicate reviews array to create an infinite seamless vertical scrolling loop
  const tickerReviews = [...QTX_REVIEWS, ...QTX_REVIEWS];

  return (
    <div style={{ position: "relative", zIndex: 5, paddingBottom: "36px", width: "100%", boxSizing: "border-box" }}>
      {/* Centered CONTACT US Button */}
      <AnimatedReveal delay={50}>
        <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 28px" }}>
          <button
            onClick={handleOpenContact}
            style={{
              padding: "13px 32px",
              fontSize: "0.86rem",
              letterSpacing: "0.1em",
              minWidth: "220px",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.2) 100%)",
              border: "1.5px solid rgba(0, 255, 136, 0.5)",
              borderRadius: "100px",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              boxShadow: "0 8px 25px rgba(0, 255, 136, 0.2), inset 0 0 15px rgba(0, 255, 136, 0.1)",
              transition: "all 0.2s ease",
            }}
          >
            <MessageCircle size={16} color="#00ff88" style={{ marginRight: "8px" }} />
            <span>CONTACT US (@qoxking)</span>
          </button>
        </div>
      </AnimatedReveal>

      {/* USER REVIEWS Section Header: ◆ USER REVIEWS ◆ in Solid White */}
      <AnimatedReveal delay={100}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "10px",
        }}>
          <span style={{ color: "var(--emerald-primary)", fontSize: "0.8rem", opacity: 0.85 }}>◆</span>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(0.95rem, 4vw, 1.1rem)",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}>
            USER REVIEWS
          </h3>
          <span style={{ color: "var(--emerald-primary)", fontSize: "0.8rem", opacity: 0.85 }}>◆</span>
        </div>

        {/* Live Trader Rating Summary Strip */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          boxSizing: "border-box",
          margin: "0 auto 14px",
          padding: "7px 12px",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "100px",
          backdropFilter: "blur(10px)",
          fontSize: "0.72rem",
          color: "#94a3b8",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "var(--emerald-primary)",
            }} />
            <span style={{ fontWeight: 700, color: "#ffffff" }}>
              4.98
            </span>
            <div style={{ display: "flex", gap: "1.5px" }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={10} fill="#fbbf24" color="#fbbf24" />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#cbd5e1" }}>
            <ShieldCheck size={12} color="var(--emerald-primary)" />
            <span>1,280+ Verified Members</span>
          </div>
        </div>
      </AnimatedReveal>

      {/* Exact Reviews Outer Frame Box with Infinite Auto-Scrolling Marquee */}
      <AnimatedReveal delay={150}>
        <div className="reviews-outer-frame">
          <div className="reviews-ticker-wrapper">
            <div className="reviews-ticker-track">
              {tickerReviews.map((rev, index) => {
                const initial = rev.name.charAt(0);
                return (
                  <div key={`${rev.id}-${index}`} className="review-card">
                    {/* Header: User Avatar + Name + Checkmark + Time (Left), 5 Gold Stars (Right) */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      marginBottom: "10px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0, flex: 1 }}>
                        {/* Monogram Avatar Badge */}
                        <div style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "50%",
                          background: "#0c1511",
                          border: "1px solid rgba(255, 255, 255, 0.14)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          fontFamily: "var(--font-display)",
                          fontWeight: 800,
                          fontSize: "0.86rem",
                          flexShrink: 0,
                        }}>
                          {initial}
                        </div>

                        <div style={{ minWidth: 0, overflow: "hidden" }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexWrap: "wrap",
                            lineHeight: 1.2,
                          }}>
                            <span style={{
                              fontFamily: "var(--font-display)",
                              fontWeight: 800,
                              fontSize: "0.86rem",
                              color: "#ffffff",
                              letterSpacing: "0.02em",
                              whiteSpace: "nowrap",
                            }}>
                              {rev.name}
                            </span>
                            {/* Verified Pill matching Image 5 */}
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              padding: "1px 6px",
                              borderRadius: "100px",
                              backgroundColor: "rgba(16, 185, 129, 0.08)",
                              border: "1px solid rgba(16, 185, 129, 0.4)",
                              color: "var(--emerald-primary)",
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              lineHeight: 1.3,
                            }}>
                              <CheckCircle2 size={10} style={{ flexShrink: 0 }} />
                              VERIFIED
                            </span>
                          </div>

                          <div style={{
                            fontSize: "0.68rem",
                            color: "#64748b",
                            marginTop: "3px",
                            fontFamily: "var(--font-mono)",
                          }}>
                            {rev.timeAgo}
                          </div>
                        </div>
                      </div>

                      {/* 5 Radiant Gold Stars + 5.0 Pill (Matching Image 5) */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 7px",
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        border: "1px solid rgba(251, 191, 36, 0.2)",
                        borderRadius: "6px",
                        flexShrink: 0,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1.5px" }}>
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} size={11} fill="#fbbf24" color="#fbbf24" />
                          ))}
                        </div>
                        <span style={{
                          color: "#fbbf24",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 800,
                          fontSize: "0.72rem",
                          marginLeft: "2px",
                        }}>
                          5.0
                        </span>
                      </div>
                    </div>

                    {/* Review Body Text enclosed in quotes */}
                    <p style={{
                      fontSize: "0.84rem",
                      lineHeight: 1.48,
                      color: "#cbd5e1",
                      fontWeight: 400,
                      margin: "0 0 10px 0",
                      fontFamily: "var(--font-body)",
                      wordBreak: "break-word",
                    }}>
                      "{rev.text.replace(/^["'\s]+|["'\s]+$/g, "")}"
                    </p>

                    {/* Bottom Metadata Badges */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      paddingTop: "8px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                      fontSize: "0.7rem",
                    }}>
                      <span style={{
                        color: "#94a3b8",
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.68rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        <Sparkles size={11} color="var(--emerald-primary)" style={{ flexShrink: 0, opacity: 0.8 }} />
                        {rev.tier}
                      </span>

                      <span style={{
                        backgroundColor: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        color: "#e2e8f0",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.68rem",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}>
                        <TrendingUp size={11} color="var(--emerald-primary)" style={{ flexShrink: 0 }} />
                        {rev.badge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AnimatedReveal>

      {/* FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <AnimatedReveal delay={80}>
        <div style={{ margin: "32px 0 28px" }}>
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div style={{
              fontSize: "0.66rem",
              color: "var(--emerald-primary)",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}>
              CLEAR ANSWERS
            </div>
            <h3 style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>
              FREQUENTLY ASKED QUESTIONS
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {FAQ_ITEMS.map((item, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "rgba(10, 20, 15, 0.75)",
                    border: isExpanded ? "1px solid rgba(0, 255, 136, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      haptic("light");
                      setExpandedFaq(isExpanded ? null : idx);
                    }}
                    style={{
                      width: "100%",
                      padding: "13px 14px",
                      background: "none",
                      border: "none",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "0.84rem",
                      fontWeight: 800,
                      color: isExpanded ? "#00ff88" : "#ffffff",
                      lineHeight: 1.35,
                    }}>
                      {item.q}
                    </span>
                    <ChevronDown
                      size={16}
                      color={isExpanded ? "#00ff88" : "#94a3b8"}
                      style={{
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.25s ease",
                        flexShrink: 0,
                      }}
                    />
                  </button>

                  {isExpanded && (
                    <div style={{
                      padding: "0 14px 14px",
                      fontSize: "0.78rem",
                      color: "#cbd5e1",
                      lineHeight: 1.5,
                      borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                      paddingTop: "10px",
                    }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </AnimatedReveal>

      {/* SEND YOUR FEEDBACK Section */}
      <AnimatedReveal delay={100}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "14px",
        }}>
          <MessageSquarePlus size={16} color="var(--emerald-primary)" />
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(0.92rem, 3.8vw, 1.05rem)",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}>
            SEND YOUR FEEDBACK
          </h3>
        </div>

        {/* Feedback Form Card */}
        <div style={{
          backgroundColor: "#0d1512",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          padding: "20px 16px",
          boxShadow: "0 10px 32px rgba(0, 0, 0, 0.7)",
          width: "100%",
          boxSizing: "border-box",
        }}>
          {submitted ? (
            <div style={{
              textAlign: "center",
              padding: "20px 10px",
              color: "var(--emerald-primary)",
            }}>
              <CheckCircle2 size={38} color="var(--emerald-primary)" style={{ margin: "0 auto 10px" }} />
              <h4 style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.05rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                marginBottom: "4px",
                color: "#ffffff",
              }}>
                FEEDBACK RECEIVED!
              </h4>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                Thank you for contributing to the QOX Software community.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendFeedback}>
              {/* Interactive Rating Stars */}
              <div style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "16px",
              }}>
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <button
                    type="button"
                    key={starValue}
                    onClick={() => {
                      haptic("light");
                      setRating(starValue);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    <Star
                      size={26}
                      fill={starValue <= rating ? "#fbbf24" : "none"}
                      color={starValue <= rating ? "#fbbf24" : "rgba(251, 191, 36, 0.25)"}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div style={{ marginBottom: "16px" }}>
                <textarea
                  required
                  rows={3}
                  placeholder="Write your feedback here..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "0.86rem",
                    outline: "none",
                    resize: "none",
                    fontFamily: "inherit",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--emerald-primary)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                  }}
                />
              </div>

              {/* SEND FEEDBACK Button */}
              <button
                type="submit"
                className="btn-emerald-outline"
                style={{
                  width: "100%",
                  padding: "12px",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <Send size={15} />
                <span>SEND FEEDBACK</span>
              </button>
            </form>
          )}
        </div>
      </AnimatedReveal>
    </div>
  );
};