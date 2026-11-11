"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiServer = createApiServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const licenseStore_1 = require("./services/licenseStore");
const upiOrderStore_1 = require("./services/upiOrderStore");
const userRegistry_1 = require("./services/userRegistry");
const chartAnalyzer_1 = require("./services/chartAnalyzer");
const paymentConfigStore_1 = require("./services/paymentConfigStore");
function createApiServer(handlers) {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({ origin: "*" }));
    app.use(express_1.default.json({ limit: "30mb" }));
    app.use(express_1.default.urlencoded({ limit: "30mb", extended: true }));
    // AI & OCR Chart Analysis Endpoint (Reads pair & timeframe from screenshot)
    app.post("/api/terminal/analyze-chart", async (req, res) => {
        try {
            const { image } = req.body;
            if (!image) {
                return res.status(400).json({ success: false, message: "Image data is required." });
            }
            const signal = await (0, chartAnalyzer_1.analyzeChartImage)(image);
            return res.json({
                success: true,
                signal,
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : "Analysis failed";
            console.error("[API] analyze-chart error:", err);
            return res.status(500).json({ success: false, message: msg });
        }
    });
    // Health check
    app.get("/api/health", (_req, res) => {
        res.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            activeLicenses: licenseStore_1.licenseStore.getAllLicenses().filter((l) => l.status === "ACTIVE").length,
        });
    });
    // Payment Gateways Status (UPI, Binance, Trust Wallet)
    app.get("/api/payment/gateways", (_req, res) => {
        res.json({
            success: true,
            gateways: paymentConfigStore_1.paymentConfigStore.getGateways(),
        });
    });
    // Toggle Payment Gateway (Admin)
    app.post("/api/payment/toggle-gateway", (req, res) => {
        try {
            const { method, enabled } = req.body;
            if (!method || !["upi", "binance", "trust"].includes(method)) {
                return res.status(400).json({ success: false, message: "Invalid payment method. Use 'upi', 'binance', or 'trust'." });
            }
            const result = paymentConfigStore_1.paymentConfigStore.toggle(method, enabled !== undefined ? Boolean(enabled) : undefined);
            return res.json({ success: true, ...result });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : "Toggle failed";
            return res.status(500).json({ success: false, message: msg });
        }
    });
    // Login verification for Web Software (Supports User ID & Password)
    app.post("/api/license/login", (req, res) => {
        try {
            const { userId, password, key, deviceId } = req.body;
            let result;
            if (userId && password) {
                result = licenseStore_1.licenseStore.validateCredentials(userId, password, deviceId);
            }
            else if (key) {
                result = licenseStore_1.licenseStore.validateKey(key, deviceId);
            }
            else if (userId && !password) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter your password.",
                });
            }
            else {
                return res.status(400).json({
                    success: false,
                    message: "Please enter your User ID and Password.",
                });
            }
            if (!result.valid) {
                return res.status(401).json({
                    success: false,
                    status: result.status,
                    message: result.message,
                });
            }
            return res.json({
                success: true,
                status: result.status,
                message: result.message,
                isPermanent: result.isPermanent,
                remainingDays: result.remainingDays,
                remainingHours: result.remainingHours,
                remainingMinutes: result.remainingMinutes,
                license: {
                    id: result.license?.id,
                    userId: result.license?.userId,
                    password: result.license?.password,
                    keyId: result.license?.keyId,
                    planTag: result.license?.planTag,
                    durationDays: result.license?.durationDays,
                    expiresAt: result.license?.expiresAt,
                    username: result.license?.telegramUsername,
                },
            });
        }
        catch (err) {
            console.error("API /login error:", err);
            return res.status(500).json({ success: false, message: "Internal server error." });
        }
    });
    // Heartbeat status check (called periodically by Web Software)
    app.get("/api/license/status", (req, res) => {
        try {
            const userId = req.query.userId || req.query.id || "";
            const password = req.query.password || "";
            const key = req.query.key || "";
            let result;
            if (userId && password) {
                result = licenseStore_1.licenseStore.validateCredentials(userId, password);
            }
            else if (key || userId) {
                result = licenseStore_1.licenseStore.validateKey(key || userId);
            }
            else {
                return res.status(400).json({ success: false, message: "Credentials or Key parameter required." });
            }
            return res.json({
                success: result.valid,
                status: result.status,
                message: result.message,
                remainingDays: result.remainingDays,
                remainingHours: result.remainingHours,
                remainingMinutes: result.remainingMinutes,
                isPermanent: result.isPermanent,
            });
        }
        catch (err) {
            console.error("API /status error:", err);
            return res.status(500).json({ success: false, message: "Internal server error." });
        }
    });
    // Update account password (allows user to set their own custom password)
    app.post("/api/license/update-password", (req, res) => {
        try {
            const { userId, newPassword, oldPassword } = req.body;
            if (!userId || !newPassword) {
                return res.status(400).json({ success: false, message: "User ID and new password are required." });
            }
            const cleanPass = newPassword.toString().trim();
            if (cleanPass.length < 4) {
                return res.status(400).json({ success: false, message: "Password must be at least 4 characters." });
            }
            const account = licenseStore_1.licenseStore.findAccount(userId);
            if (!account) {
                return res.status(404).json({ success: false, message: "Account not found." });
            }
            // If oldPassword is provided, verify it
            if (oldPassword && account.password !== oldPassword.toString().trim()) {
                return res.status(401).json({ success: false, message: "Current password does not match." });
            }
            const ok = licenseStore_1.licenseStore.updatePassword(userId, cleanPass);
            if (!ok) {
                return res.status(500).json({ success: false, message: "Failed to update password." });
            }
            return res.json({
                success: true,
                message: "Password updated successfully.",
                userId: account.userId,
                newPassword: cleanPass,
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : "Internal error";
            return res.status(500).json({ success: false, message: msg });
        }
    });
    // Create account/license directly from verified WebApp payment
    app.post("/api/license/create", (req, res) => {
        try {
            const { telegramId, telegramUsername, planTag, planId, durationDays, priceUsdt, txId, customUserId, customPassword, customKey, } = req.body;
            if (!planTag || durationDays === undefined) {
                return res.status(400).json({ success: false, message: "Missing plan information." });
            }
            const newLicense = licenseStore_1.licenseStore.createLicense({
                telegramId,
                telegramUsername,
                planTag,
                planId,
                durationDays: Number(durationDays),
                priceUsdt: Number(priceUsdt || 0),
                txId,
                customUserId,
                customPassword,
                customKey,
            });
            console.log(`✨ New Account Activated: ${newLicense.userId} (Pass: ${newLicense.password}, Plan: ${newLicense.planTag}) for @${newLicense.telegramUsername}`);
            return res.json({
                success: true,
                license: newLicense,
            });
        }
        catch (err) {
            console.error("API /create error:", err);
            return res.status(500).json({ success: false, message: "Failed to create account." });
        }
    });
    // Unified Payment Submission for ALL Methods (UPI, Binance, Trust Wallet, TRC20)
    app.post("/api/payment/submit", async (req, res) => {
        try {
            const { orderId, telegramId, telegramUsername, planTag, planId, durationDays, priceUsdt, amountInr, amountText, paymentMethod, txRef, utr, customUserId, customPassword, } = req.body;
            const cleanRef = (txRef || utr || "").toString().trim();
            if (!cleanRef || cleanRef.length < 3) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid Transaction Hash (TxID), Pay ID, or UTR number.",
                });
            }
            // If telegramId is missing but username exists, resolve from registry
            let resolvedId = telegramId ? Number(telegramId) : undefined;
            if (!resolvedId && telegramUsername) {
                resolvedId = userRegistry_1.userRegistry.getIdByUsername(telegramUsername);
            }
            if (resolvedId) {
                userRegistry_1.userRegistry.registerUser(resolvedId, telegramUsername);
            }
            const methodUpper = (paymentMethod || "UPI").toUpperCase();
            const prefix = methodUpper.includes("BINANCE") ? "BINANCE" : methodUpper.includes("TRUST") ? "TRUST" : methodUpper.includes("TRC") ? "TRC20" : "UPI";
            const generatedOrderId = orderId || `QOX-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
            const newOrder = upiOrderStore_1.upiOrderStore.createOrder({
                orderId: generatedOrderId,
                telegramId: resolvedId,
                telegramUsername: telegramUsername || "Valued Trader",
                planTag: planTag || "INITIATE",
                planId: planId || "initiate-10d",
                durationDays: durationDays !== undefined ? Number(durationDays) : 10,
                priceUsdt: Number(priceUsdt || 200),
                amountInr: amountInr ? Number(amountInr) : undefined,
                amountText: amountText || (amountInr ? `₹${Number(amountInr).toLocaleString()} INR` : `$${priceUsdt || 200} USD`),
                paymentMethod: methodUpper,
                txRef: cleanRef,
                utr: cleanRef,
                customUserId,
                customPassword,
            });
            console.log(`[PAYMENT] New ${methodUpper} Submission: Order #${newOrder.orderId}, Ref: ${cleanRef}`);
            // Dispatch Telegram alert to Owner
            if (handlers?.onQueryRaised) {
                handlers.onQueryRaised({
                    orderId: newOrder.orderId,
                    planTag: newOrder.planTag,
                    amountText: newOrder.amountText || `$${newOrder.priceUsdt} USD`,
                    paymentMethod: newOrder.paymentMethod || "CRYPTO",
                    txRef: cleanRef,
                    telegramId: resolvedId,
                    telegramUsername: newOrder.telegramUsername,
                }).catch((err) => {
                    console.error("[PAYMENT] Failed to notify owner:", err);
                });
            }
            return res.json({
                success: true,
                orderId: newOrder.orderId,
                status: newOrder.status,
                message: "Payment submitted successfully. Verification in progress.",
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : "Internal error";
            console.error("API /submit error:", err);
            return res.status(500).json({ success: false, message: msg });
        }
    });
    // Submit UPI Payment (alias to unified submit)
    app.post("/api/payment/upi-submit", async (req, res) => {
        try {
            const { orderId, telegramId, telegramUsername, planTag, planId, durationDays, priceUsdt, amountInr, utr, customUserId, customPassword, } = req.body;
            const cleanUtr = utr ? utr.toString().trim() : "";
            if (!cleanUtr || cleanUtr.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid 12-digit UPI Reference (UTR) number.",
                });
            }
            let resolvedId = telegramId ? Number(telegramId) : undefined;
            if (!resolvedId && telegramUsername) {
                resolvedId = userRegistry_1.userRegistry.getIdByUsername(telegramUsername);
            }
            if (resolvedId) {
                userRegistry_1.userRegistry.registerUser(resolvedId, telegramUsername);
            }
            const generatedOrderId = orderId || `QOX-UPI-${Math.floor(100000 + Math.random() * 900000)}`;
            const newOrder = upiOrderStore_1.upiOrderStore.createOrder({
                orderId: generatedOrderId,
                telegramId: resolvedId,
                telegramUsername: telegramUsername || "Valued Trader",
                planTag: planTag || "INITIATE",
                planId: planId || "initiate-10d",
                durationDays: durationDays !== undefined ? Number(durationDays) : 10,
                priceUsdt: Number(priceUsdt || 200),
                amountInr: Number(amountInr || 20000),
                amountText: `₹${Number(amountInr || 20000).toLocaleString()} INR ($${priceUsdt || 200} USD)`,
                paymentMethod: "UPI",
                txRef: cleanUtr,
                utr: cleanUtr,
                customUserId,
                customPassword,
            });
            console.log(`[UPI] New Payment Submitted: Order #${newOrder.orderId}, UTR: ${newOrder.utr}, Amount: ₹${newOrder.amountInr}`);
            // Trigger Telegram notification to Owner & Buyer
            if (handlers?.onQueryRaised) {
                handlers.onQueryRaised({
                    orderId: newOrder.orderId,
                    planTag: newOrder.planTag,
                    amountText: `₹${(newOrder.amountInr || 20000).toLocaleString()} INR ($${newOrder.priceUsdt} USD)`,
                    paymentMethod: "UPI",
                    txRef: cleanUtr,
                    telegramId: resolvedId,
                    telegramUsername: newOrder.telegramUsername,
                }).catch((err) => {
                    console.error("[UPI] Failed to dispatch bot notification:", err);
                });
            }
            return res.json({
                success: true,
                orderId: newOrder.orderId,
                status: newOrder.status,
                message: "UPI payment submitted successfully. Verification in progress.",
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : "Internal error";
            console.error("API /upi-submit error:", err);
            return res.status(500).json({ success: false, message: msg });
        }
    });
    // Check Order Status for ANY payment method (polling for WebApp)
    app.get(["/api/payment/order-status", "/api/payment/upi-status"], (req, res) => {
        try {
            const orderId = req.query.orderId || "";
            if (!orderId) {
                return res.status(400).json({ success: false, message: "orderId is required." });
            }
            const order = upiOrderStore_1.upiOrderStore.getOrder(orderId);
            if (!order) {
                return res.status(404).json({ success: false, message: "Order not found." });
            }
            let license = null;
            if (order.status === "APPROVED" && order.assignedLicenseId) {
                license = licenseStore_1.licenseStore.findAccount(order.assignedLicenseId);
            }
            return res.json({
                success: true,
                orderId: order.orderId,
                status: order.status,
                paymentMethod: order.paymentMethod,
                txRef: order.txRef || order.utr,
                utr: order.utr || order.txRef,
                amountInr: order.amountInr,
                amountText: order.amountText,
                planTag: order.planTag,
                license: license
                    ? {
                        userId: license.userId,
                        password: license.password,
                        planTag: license.planTag,
                        durationDays: license.durationDays,
                        expiresAt: license.expiresAt,
                    }
                    : null,
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : "Internal error";
            return res.status(500).json({ success: false, message: msg });
        }
    });
    // Raise purchase query directly to Bot Admin Desk
    app.post("/api/payment/raise-query", async (req, res) => {
        try {
            const { orderId, planTag, amountText, paymentMethod, txRef, telegramId, telegramUsername, } = req.body;
            let resolvedId = telegramId ? Number(telegramId) : undefined;
            if (!resolvedId && telegramUsername) {
                resolvedId = userRegistry_1.userRegistry.getIdByUsername(telegramUsername);
            }
            if (resolvedId) {
                userRegistry_1.userRegistry.registerUser(resolvedId, telegramUsername);
            }
            // Check if order exists in store, if not create it
            if (orderId && !upiOrderStore_1.upiOrderStore.getOrder(orderId)) {
                upiOrderStore_1.upiOrderStore.createOrder({
                    orderId,
                    telegramId: resolvedId,
                    telegramUsername: telegramUsername || "Valued Trader",
                    planTag: planTag || "INITIATE",
                    planId: (planTag || "initiate").toLowerCase(),
                    durationDays: planTag === "GRANDMASTER" ? -1 : planTag === "ENLIGHTENED" ? 30 : 10,
                    priceUsdt: planTag === "GRANDMASTER" ? 500 : planTag === "ENLIGHTENED" ? 300 : 200,
                    paymentMethod: (paymentMethod || "UPI").toUpperCase(),
                    txRef: txRef || "N/A",
                    amountText: amountText || "$200 USD",
                });
            }
            if (handlers?.onQueryRaised) {
                await handlers.onQueryRaised({
                    orderId,
                    planTag: planTag || "INITIATE",
                    amountText: amountText || "$200 USD",
                    paymentMethod: (paymentMethod || "UPI").toUpperCase(),
                    txRef: txRef || "N/A",
                    telegramId: resolvedId,
                    telegramUsername,
                });
            }
            return res.json({ success: true, message: "Query dispatched to Admin." });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : "Internal error";
            return res.status(500).json({ success: false, message: msg });
        }
    });
    // Production Frontend Serving for Pterodactyl / VPS / Docker
    // Automatically detects and serves Vite compiled build from client/dist
    const candidateDistPaths = [
        path_1.default.resolve(__dirname, "../../client/dist"),
        path_1.default.resolve(__dirname, "../client/dist"),
        path_1.default.resolve(process.cwd(), "client/dist"),
        path_1.default.resolve(process.cwd(), "dist"),
    ];
    const clientDist = candidateDistPaths.find((p) => fs_1.default.existsSync(p));
    if (clientDist) {
        console.log(`[API] Production mode: Serving Mini App frontend from: ${clientDist}`);
        app.use(express_1.default.static(clientDist));
        // Client-side SPA routing fallback (Compatible with Express 4 & 5)
        app.use((req, res, next) => {
            if (req.method !== "GET" || req.path.startsWith("/api")) {
                return next();
            }
            const indexFile = path_1.default.join(clientDist, "index.html");
            if (fs_1.default.existsSync(indexFile)) {
                return res.sendFile(indexFile);
            }
            return next();
        });
    }
    else {
        console.log("[API] Running in API-only / Development mode (client/dist not detected).");
    }
    return app;
}
