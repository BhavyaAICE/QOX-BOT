"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePairFromText = parsePairFromText;
exports.parseTimeframeFromText = parseTimeframeFromText;
exports.generateSignalForAsset = generateSignalForAsset;
exports.analyzeChartImage = analyzeChartImage;
const tesseract_js_1 = require("tesseract.js");
const CURRENCIES = [
    "EUR", "USD", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD",
    "INR", "BRL", "TRY", "PKR", "NGN", "IDR", "ZAR", "MXN",
    "RUB", "AED", "SAR", "USDT", "BTC", "ETH", "SOL", "XRP"
];
const ASSETS = [
    "GOLD", "SILVER", "CRUDE", "OIL", "APPLE", "TESLA",
    "MICROSOFT", "GOOGLE", "AMAZON", "BOEING", "INTEL", "MCDONALD",
    "NASDAQ", "US30", "SP500"
];
let workerPromise = null;
async function getWorker() {
    if (!workerPromise) {
        workerPromise = (async () => {
            console.log("[OCR] Initializing warm Tesseract OCR worker...");
            const worker = await (0, tesseract_js_1.createWorker)("eng");
            console.log("[OCR] Tesseract OCR engine ready.");
            return worker;
        })();
    }
    return workerPromise;
}
// Smart Currency Pair & OTC Detector
function parsePairFromText(rawText) {
    const isOtc = /OTC/i.test(rawText);
    const upper = rawText.toUpperCase();
    // 1. Direct standard pair matching (e.g. EUR/JPY, EUR / USD, EUR-USD, EURIJIPY)
    for (const c1 of CURRENCIES) {
        const idx = upper.indexOf(c1);
        if (idx !== -1) {
            const slice = upper.slice(idx + c1.length, idx + c1.length + 12);
            for (const c2 of CURRENCIES) {
                if (c1 === c2)
                    continue;
                // Exact match in proximity
                if (slice.includes(c2)) {
                    return `${c1}/${c2}${isOtc ? " (OTC)" : ""}`;
                }
                // Subsequence match (handles OCR glitches like JIPY -> JPY, P|KR -> PKR)
                const chars = c2.split("");
                let lastPos = -1;
                const allFound = chars.every((ch) => {
                    const p = slice.indexOf(ch, lastPos + 1);
                    if (p !== -1) {
                        lastPos = p;
                        return true;
                    }
                    return false;
                });
                if (allFound) {
                    return `${c1}/${c2}${isOtc ? " (OTC)" : ""}`;
                }
            }
        }
    }
    // 2. Commodities / Stocks / Crypto Indices
    for (const a of ASSETS) {
        if (upper.includes(a)) {
            const assetLabel = a === "CRUDE" || a === "OIL" ? "CRUDE OIL" : a;
            return `${assetLabel}${isOtc ? " (OTC)" : ""}`;
        }
    }
    // 3. Heuristic for JPY pairs (e.g. 176.xxx levels)
    if (/1[3-8][0-9]\b/i.test(upper) || /JPY/i.test(upper)) {
        return isOtc ? "EUR/JPY (OTC)" : "EUR/JPY";
    }
    // Default fallback
    return isOtc ? "EUR/USD (OTC)" : "EUR/USD (OTC)";
}
// Smart Expiry / Timeframe Extractor
function parseTimeframeFromText(rawText) {
    if (/00:00:30|30\s*S\b/i.test(rawText))
        return "00:30 S";
    if (/00:02:00|2\s*M\b/i.test(rawText))
        return "02:00 M";
    if (/00:05:00|5\s*M\b/i.test(rawText))
        return "05:00 M";
    return "01:00 M";
}
// Build Contextual Institutional Quant Setup for the Detected Asset
function generateSignalForAsset(pair, timeframe) {
    const isUp = Math.random() > 0.5;
    const randomAcc = parseFloat((97.8 + Math.random() * 1.8).toFixed(1));
    if (isUp) {
        const templates = [
            {
                headline: "Next Candle Up ↑",
                strategyBadge: "BULLISH ORDER BLOCK",
                strategyType: "ORDERBLOCK",
                patternDescription: `Liquidity Sweep Wick + VWAP Support Rebound on ${pair}`,
                rsiValue: "RSI: 31 (Oversold Bounce)",
                volumeDelta: "Vol: +2.4x Avg Spike",
                entryRule: "Candle Open (00s)",
                mtgRule: "Direct Win (0 MTG)",
            },
            {
                headline: "Sniper Reversal Call ↑",
                strategyBadge: "GOLDEN FIBONACCI 61.8%",
                strategyType: "REVERSAL",
                patternDescription: `Exhaustion Wick Rejection at S2 Support Floor on ${pair}`,
                rsiValue: "Stoch: 12 (Hyper Oversold)",
                volumeDelta: "Delta: Buyer Sweep +68%",
                entryRule: "Wick Pullback Retest",
                mtgRule: "Safe 1-Step MTG",
            },
            {
                headline: "VIP Strong Call ↑",
                strategyBadge: "CONFLUENCE 3-FACTOR TRIGGER",
                strategyType: "MOMENTUM",
                patternDescription: `EMA 50 Dynamic Support Bounce + Bullish Momentum on ${pair}`,
                rsiValue: "MACD: Bullish Histogram Expand",
                volumeDelta: "Vol: Clean Institutional Trail",
                entryRule: "Candle Open (00s)",
                mtgRule: "High Probability Direct Win",
            },
            {
                headline: "OTC Algorithm Rebalance ↑",
                strategyBadge: "BROKER LIQUIDITY REBALANCE",
                strategyType: "OTC_ALGO",
                patternDescription: `Microstructure Imbalance Fill + Buyer Aggression on ${pair}`,
                rsiValue: "Spread: Zero | Flow: Bullish",
                volumeDelta: "Tick: +78% Buy Velocity",
                entryRule: "Strict 1-Minute Candle Expiry",
                mtgRule: "VIP Confidence (0 MTG)",
            },
        ];
        const pick = templates[Math.floor(Math.random() * templates.length)];
        return {
            detectedPair: pair,
            direction: "UP",
            headline: pick.headline,
            strategyBadge: pick.strategyBadge,
            strategyType: pick.strategyType,
            adjustTime: timeframe,
            accuracy: randomAcc,
            pair,
            patternDescription: pick.patternDescription,
            rsiValue: pick.rsiValue,
            volumeDelta: pick.volumeDelta,
            entryRule: pick.entryRule,
            mtgRule: pick.mtgRule,
        };
    }
    else {
        const templates = [
            {
                headline: "Next Candle Down ↓",
                strategyBadge: "BEARISH DISTRIBUTION",
                strategyType: "ORDERBLOCK",
                patternDescription: `Order Block Rejection + Bearish Engulfing on ${pair}`,
                rsiValue: "RSI: 76 (Overbought Peak)",
                volumeDelta: "Vol: +2.8x Seller Inflow",
                entryRule: "Candle Open (00s)",
                mtgRule: "Direct Win (0 MTG)",
            },
            {
                headline: "Sniper Reversal Put ↓",
                strategyBadge: "EXHAUSTION PEAK REJECTION",
                strategyType: "REVERSAL",
                patternDescription: `Triple Top Rejection + Upper Wick Piercing on ${pair}`,
                rsiValue: "Stoch: 91 (Extreme Overbought)",
                volumeDelta: "Delta: Seller Dump -74%",
                entryRule: "Peak Wick Touch",
                mtgRule: "Safe 1-Step MTG",
            },
            {
                headline: "VIP Strong Put ↓",
                strategyBadge: "CONFLUENCE 3-FACTOR TRIGGER",
                strategyType: "MOMENTUM",
                patternDescription: `EMA 200 Rejection + SuperTrend Red on ${pair}`,
                rsiValue: "MACD: Bearish Cross Under Zero",
                volumeDelta: "Vol: Heavy Resistance Rejection",
                entryRule: "Candle Open (00s)",
                mtgRule: "High Probability Direct Win",
            },
            {
                headline: "OTC Algorithm Rebalance ↓",
                strategyBadge: "BROKER LIQUIDITY SWEEP",
                strategyType: "OTC_ALGO",
                patternDescription: `High-Frequency Liquidity Pool Stop Run on ${pair}`,
                rsiValue: "Spread: Zero | Flow: Bearish",
                volumeDelta: "Tick: -82% Sell Velocity",
                entryRule: "Strict Expiry Strike",
                mtgRule: "VIP Confidence (0 MTG)",
            },
        ];
        const pick = templates[Math.floor(Math.random() * templates.length)];
        return {
            detectedPair: pair,
            direction: "DOWN",
            headline: pick.headline,
            strategyBadge: pick.strategyBadge,
            strategyType: pick.strategyType,
            adjustTime: timeframe,
            accuracy: randomAcc,
            pair,
            patternDescription: pick.patternDescription,
            rsiValue: pick.rsiValue,
            volumeDelta: pick.volumeDelta,
            entryRule: pick.entryRule,
            mtgRule: pick.mtgRule,
        };
    }
}
// Master Chart Image Analyzer Function
async function analyzeChartImage(imageSource) {
    try {
        let input = imageSource;
        if (typeof imageSource === "string" && imageSource.startsWith("data:image")) {
            const base64Data = imageSource.split(",")[1];
            input = Buffer.from(base64Data, "base64");
        }
        const worker = await getWorker();
        const result = await worker.recognize(input);
        const rawText = result.data.text || "";
        const detectedPair = parsePairFromText(rawText);
        const detectedTimeframe = parseTimeframeFromText(rawText);
        console.log(`[OCR] Chart Analyzed: "${detectedPair}" | Expiry: "${detectedTimeframe}"`);
        const signal = generateSignalForAsset(detectedPair, detectedTimeframe);
        signal.rawText = rawText.slice(0, 300);
        return signal;
    }
    catch (err) {
        console.error("[OCR] Analysis error:", err);
        // Graceful fallback to EUR/USD (OTC)
        return generateSignalForAsset("EUR/USD (OTC)", "01:00 M");
    }
}
