"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnerId = getOwnerId;
exports.getAllOwnerIds = getAllOwnerIds;
exports.setOwnerId = setOwnerId;
exports.getOwnerUsername = getOwnerUsername;
exports.setOwnerUsername = setOwnerUsername;
const grammy_1 = require("grammy");
const dotenv = __importStar(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const api_1 = require("./api");
const licenseStore_1 = require("./services/licenseStore");
const upiOrderStore_1 = require("./services/upiOrderStore");
const userRegistry_1 = require("./services/userRegistry");
const ownerStore_1 = require("./services/ownerStore");
const paymentConfigStore_1 = require("./services/paymentConfigStore");
// Search candidate .env paths for Pterodactyl / Docker / Local VPS environments
const candidateEnvFiles = [
    path_1.default.resolve(process.cwd(), ".env"),
    path_1.default.resolve(__dirname, "../../.env"),
    path_1.default.resolve(__dirname, "../.env"),
    path_1.default.resolve(__dirname, "../../bot/.env"),
];
for (const envPath of candidateEnvFiles) {
    if (fs_1.default.existsSync(envPath)) {
        dotenv.config({ path: envPath });
    }
}
dotenv.config();
const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL || "https://tree-chorus-incentive-massachusetts.trycloudflare.com";
const apiPort = process.env.PORT
    ? parseInt(process.env.PORT)
    : process.env.SERVER_PORT
        ? parseInt(process.env.SERVER_PORT)
        : 5001;
// Path to persistent bot configuration
const CONFIG_FILE = path_1.default.resolve(__dirname, "../../data/config.json");
function getOwnerId() {
    const ids = ownerStore_1.ownerStore.getAllOwnerIds();
    return ids[0] || (process.env.OWNER_TELEGRAM_ID ? process.env.OWNER_TELEGRAM_ID.trim() : "");
}
function getAllOwnerIds() {
    return ownerStore_1.ownerStore.getAllOwnerIds();
}
function setOwnerId(id) {
    process.env.OWNER_TELEGRAM_ID = id.trim();
}
function getOwnerUsername() {
    const users = ownerStore_1.ownerStore.getAllOwnerUsernames();
    return users[0] || (process.env.OWNER_USERNAME || "Bhavya49").replace(/^@/, "").trim().toLowerCase();
}
function setOwnerUsername(username) {
    process.env.OWNER_USERNAME = username.replace(/^@/, "").trim();
}
function isOwner(userId, username) {
    return ownerStore_1.ownerStore.isOwner(userId, username);
}
// Function to notify ALL Owners upon events
async function notifyAllOwners(message, keyboard) {
    const ownerIds = ownerStore_1.ownerStore.getAllOwnerIds();
    console.log(`[NOTIFY_OWNERS] Sending alert to ${ownerIds.length} owner(s):`, ownerIds);
    for (const ownerId of ownerIds) {
        if (!ownerId)
            continue;
        try {
            await bot.api.sendMessage(ownerId, message, {
                parse_mode: "HTML",
                ...(keyboard ? { reply_markup: keyboard } : {}),
            });
        }
        catch (err) {
            console.warn(`[NOTIFY] Could not message owner ${ownerId}:`, err);
        }
    }
}
if (!token || token === "your_telegram_bot_token_here") {
    console.warn("[WARNING] BOT_TOKEN is missing or not configured in bot/.env!");
}
const bot = new grammy_1.Bot(token || "dummy_token_for_typing");
// Function to notify Owner & Buyer upon UPI Submission
async function notifyUpiSubmission(order) {
    const ownerKeyboard = new grammy_1.InlineKeyboard()
        .text("✅ Approve & Issue Login", `approve_upi:${order.orderId}`)
        .text("❌ Reject", `reject_upi:${order.orderId}`);
    const durText = order.durationDays === -1 ? "Permanent Lifetime" : `${order.durationDays} Days`;
    const inrDisplay = (order.amountInr ?? (order.planTag === "INITIATE" ? 20000 : order.priceUsdt * 90)).toLocaleString();
    const ownerMsg = `<b>🔔 NEW UPI PAYMENT SUBMITTED</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>Order ID:</b> <code>#${order.orderId}</code>\n` +
        `<b>Plan:</b> <b>${order.planTag}</b> (${durText})\n` +
        `<b>Amount:</b> <b>₹${inrDisplay} INR</b> ($${order.priceUsdt} USDT)\n` +
        `<b>12-Digit UTR:</b> <code>${order.utr}</code>\n` +
        `<b>Trader:</b> @${order.telegramUsername || "Anonymous"} (ID: <code>${order.telegramId || "N/A"}</code>)\n` +
        `<b>Time:</b> ${new Date(order.submittedAt).toLocaleTimeString()}\n\n` +
        `<i>Please verify the incoming bank credit of ₹${inrDisplay} with UTR <code>${order.utr}</code> on your bank/UPI app, then tap below:</i>`;
    // Dispatch to all 3 bot owners
    await notifyAllOwners(ownerMsg, ownerKeyboard);
    // Notify Buyer with explicit notice that verification might take time
    if (order.telegramId) {
        const durText = order.durationDays === -1 ? "Permanent" : `${order.durationDays} Days`;
        const buyerKeyboard = new grammy_1.InlineKeyboard()
            .url("💬 Message Admin (@varshithofficial)", "https://t.me/varshithofficial");
        const buyerMsg = `<b>QOX SOFTWARE • UPI PAYMENT SUBMITTED</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `<b>Order ID:</b> <code>#${order.orderId}</code>\n` +
            `<b>Plan:</b> <b>${order.planTag}</b> (${durText})\n` +
            `<b>Amount:</b> ₹${inrDisplay} INR ($${order.priceUsdt} USD)\n` +
            `<b>Submitted UTR:</b> <code>${order.utr}</code>\n\n` +
            `⏳ <b>ACTION REQUIRED FOR LOGIN APPROVAL:</b>\n` +
            `Please message our approval admin directly on Telegram:\n` +
            `👉 <b>Admin:</b> @varshithofficial\n\n` +
            `<i>Send your Order ID <code>#${order.orderId}</code> or payment receipt screenshot to @varshithofficial to confirm your funds and receive your User ID & Password.</i>`;
        try {
            await bot.api.sendMessage(order.telegramId, buyerMsg, {
                parse_mode: "HTML",
                reply_markup: buyerKeyboard,
            });
        }
        catch (err) {
            console.error("[UPI] Failed to message buyer:", err);
        }
    }
}
// Function to notify Owner & Buyer when a Trader raises an activation query
async function notifyQueryRaised(query) {
    const ownerKeyboard = new grammy_1.InlineKeyboard()
        .text("✅ Confirm & Issue Login", `approve_query:${query.orderId}`)
        .text("❌ Reject", `reject_query:${query.orderId}`);
    const ownerMsg = `<b>🔔 NEW PURCHASE QUERY RAISED BY TRADER</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>Order ID:</b> <code>#${query.orderId}</code>\n` +
        `<b>Plan:</b> <b>${query.planTag}</b>\n` +
        `<b>Amount:</b> <b>${query.amountText}</b>\n` +
        `<b>Method:</b> ${query.paymentMethod}\n` +
        `<b>Reference (UTR/Tx):</b> <code>${query.txRef}</code>\n` +
        `<b>Trader:</b> @${query.telegramUsername || "Anonymous"} (ID: <code>${query.telegramId || "N/A"}</code>)\n` +
        `<b>Time:</b> ${new Date().toLocaleTimeString()}\n\n` +
        `<i>Trader has raised this activation query after purchasing. Please confirm the credit on your bank statement/wallet and tap below:</i>`;
    // Dispatch to all 3 bot owners
    await notifyAllOwners(ownerMsg, ownerKeyboard);
    // Also confirm receipt to Buyer
    if (query.telegramId) {
        const buyerKeyboard = new grammy_1.InlineKeyboard()
            .url("💬 Message Admin (@varshithofficial)", "https://t.me/varshithofficial");
        const buyerMsg = `<b>QOX SOFTWARE • ACTIVATION QUERY RECEIVED</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `<b>Order ID:</b> <code>#${query.orderId}</code>\n` +
            `<b>Plan:</b> <b>${query.planTag}</b>\n` +
            `<b>Reference:</b> <code>${query.txRef}</code>\n\n` +
            `Your query has been dispatched directly to the Administrator desk.\n\n` +
            `👉 <b>Contact Approval Admin:</b> @varshithofficial\n` +
            `<i>Please DM @varshithofficial with your Order ID or payment receipt to get your User ID & Password approved.</i>`;
        try {
            await bot.api.sendMessage(query.telegramId, buyerMsg, {
                parse_mode: "HTML",
                reply_markup: buyerKeyboard,
            });
        }
        catch (err) {
            console.error("[QUERY] Failed to message buyer:", err);
        }
    }
}
// Launch HTTP API Server (Serves license validation & UPI submission to Web Software)
const apiApp = (0, api_1.createApiServer)({
    onUpiSubmitted: notifyUpiSubmission,
    onQueryRaised: notifyQueryRaised,
});
apiApp.listen(apiPort, "0.0.0.0", () => {
    console.log(`[API] QOX Software Server & License API running on 0.0.0.0:${apiPort}`);
});
// Middleware: Auto-refresh chat menu button to active Cloudflare URL + audit log & registry
bot.use(async (ctx, next) => {
    if (ctx.from) {
        userRegistry_1.userRegistry.registerUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
        console.log(`[MSG] From @${ctx.from.username || "user"} (ID: ${ctx.from.id}) - Text: "${ctx.message?.text || ""}"`);
    }
    if (ctx.chat?.id) {
        try {
            await ctx.api.setChatMenuButton({
                chat_id: ctx.chat.id,
                menu_button: {
                    type: "web_app",
                    text: "Launch Software",
                    web_app: { url: webAppUrl },
                },
            });
        }
        catch { }
    }
    await next();
});
// Helper: Format duration display without emojis
function formatDuration(license) {
    if (license.durationDays === -1 || !license.expiresAt) {
        return "Permanent (Lifetime)";
    }
    const diffMs = new Date(license.expiresAt).getTime() - Date.now();
    if (diffMs <= 0)
        return "Expired";
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h left (${license.durationDays}d Plan)`;
}
// ==========================================
// USER COMMANDS (No emojis - Pure clean typography)
// ==========================================
// Command: /start
bot.command("start", async (ctx) => {
    const user = ctx.from;
    const firstName = user?.first_name || "Trader";
    const userId = user?.id;
    const isUserOwner = isOwner(userId, ctx.from?.username);
    const activeLicense = licenseStore_1.licenseStore.getAllLicenses().find((l) => l.telegramId === userId && l.status === "ACTIVE");
    const storeAppUrl = webAppUrl;
    const terminalAppUrl = `${webAppUrl}?app=terminal`;
    const keyboard = new grammy_1.InlineKeyboard()
        .webApp("🛒 Purchase License / Access", storeAppUrl);
    // Strictly gate the Software Terminal link: only show if user is owner or approved subscriber
    if (isUserOwner || activeLicense) {
        keyboard.row().webApp("⚡ Launch Software Terminal", terminalAppUrl);
    }
    keyboard.row().url("Open Store in Browser", storeAppUrl);
    let statusInfo = "";
    if (activeLicense) {
        statusInfo = `\n<b>YOUR ACCOUNT STATUS:</b> <code>ACTIVE (${activeLicense.planTag})</code>\n` +
            `User ID: <code>${activeLicense.userId}</code> | Type /myaccount for full details.\n`;
    }
    else if (!isUserOwner) {
        statusInfo = `\n🔒 <i>Note: The Software Terminal is a private application. Access links and login credentials are provided exclusively by the Bot Owner upon payment confirmation.</i>\n`;
    }
    await ctx.reply(`<b>QOX SOFTWARE</b>\n` +
        `Welcome, ${firstName}.\n\n` +
        `<i>Quantitative Algorithmic Signals and Precision Market Analysis.</i>\n` +
        statusInfo + `\n` +
        `<b>AVAILABLE ACCESS PLANS:</b>\n` +
        `• <b>INITIATE</b> — 10 Days ($200 USD / ₹20,000 INR)\n` +
        `• <b>ENLIGHTENED</b> — 1 Month ($300 USD / ₹27,000 INR) [MOST COVETED]\n` +
        `• <b>GRANDMASTER</b> — Lifetime Permanent ($500 USD / ₹45,000 INR)\n\n` +
        `<b>HOW LOGIN ACTIVATION WORKS:</b>\n` +
        `1. Tap <b>Purchase License</b> to choose your plan and complete payment.\n` +
        `2. Contact Admin <b>@varshithofficial</b> with your Order ID or transfer proof.\n` +
        `3. Admin confirms payment on bank statement and issues your official <b>User ID & Password</b>.\n` +
        `4. Unlock your private <b>Software Terminal Link</b> immediately!\n\n` +
        `<i>Need help? Type /contact or message @varshithofficial</i>`, {
        parse_mode: "HTML",
        reply_markup: keyboard,
    });
});
// Command: /terminal (Gated link to dedicated Software Terminal App)
bot.command("terminal", async (ctx) => {
    const userId = ctx.from?.id;
    const isUserOwner = isOwner(userId, ctx.from?.username);
    const activeLicense = licenseStore_1.licenseStore.getAllLicenses().find((l) => l.telegramId === userId && l.status === "ACTIVE");
    if (!isUserOwner && !activeLicense) {
        await ctx.reply(`<b>🔒 ACCESS RESTRICTED</b>\n\n` +
            `The QOX Software Terminal link is private and shared exclusively by the Bot Owner upon payment verification.\n\n` +
            `To acquire access, tap below to view plans and complete payment:`, {
            parse_mode: "HTML",
            reply_markup: new grammy_1.InlineKeyboard().webApp("🛒 Purchase Access Plan", webAppUrl),
        });
        return;
    }
    const terminalAppUrl = `${webAppUrl}?app=terminal`;
    const keyboard = new grammy_1.InlineKeyboard()
        .webApp("⚡ Launch Software Terminal", terminalAppUrl)
        .row()
        .url("Open in Web Browser", terminalAppUrl);
    await ctx.reply(`<b>QOX SOFTWARE TERMINAL (AUTHORIZED ACCESS)</b>\n\n` +
        `Dedicated AI Candlestick Chart Scanner & Precision Predictor.\n` +
        `Tap below to open your terminal and log in:`, {
        parse_mode: "HTML",
        reply_markup: keyboard,
    });
});
// Command: /plans
bot.command(["plans", "shop", "buy"], async (ctx) => {
    const storeAppUrl = webAppUrl;
    const keyboard = new grammy_1.InlineKeyboard().webApp("🛒 Open QOX Plans", storeAppUrl);
    await ctx.reply("Select an option to review access plans & purchase:", {
        reply_markup: keyboard,
    });
});
// Command: /contact
bot.command("contact", async (ctx) => {
    const keyboard = new grammy_1.InlineKeyboard().url("💬 Message Admin (@varshithofficial)", "https://t.me/varshithofficial");
    await ctx.reply("<b>QOX OFFICIAL SUPPORT & VERIFICATION DESK</b>\n\n" +
        "For software activation, payment approvals, or login assistance:\n" +
        "• <b>Approval Admin:</b> @varshithofficial\n" +
        "• Tap the button below to message our admin directly on Telegram\n" +
        "• Type /myaccount to retrieve your issued credentials", { parse_mode: "HTML", reply_markup: keyboard });
});
// Command: /myaccount (also aliases: /mykey, /credentials, /login, /account)
bot.command(["myaccount", "mykey", "credentials", "login", "account"], async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId)
        return;
    const all = licenseStore_1.licenseStore.getAllLicenses();
    const userLicenses = all.filter((l) => l.telegramId === userId);
    if (userLicenses.length === 0) {
        await ctx.reply("<b>No Active Accounts Found</b>\n\n" +
            "You do not have an active QOX Software account on this Telegram profile.\n\n" +
            "<b>How to get your User ID & Password:</b>\n" +
            "1. Open the app and choose an Access Plan (10 Days, 1 Month, or Lifetime).\n" +
            "2. Complete payment verification.\n" +
            "3. Your unique User ID & Password will be generated immediately and sent to you here.", {
            parse_mode: "HTML",
            reply_markup: new grammy_1.InlineKeyboard().webApp("Get QOX Account", webAppUrl),
        });
        return;
    }
    let text = `<b>YOUR QOX ACCOUNT CREDENTIALS:</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const lic of userLicenses) {
        text += `<b>USER ID:</b>  <code>${lic.userId}</code>\n`;
        text += `<b>PASSWORD:</b> <code>${lic.password}</code>\n`;
        text += `Plan: ${lic.planTag}\n`;
        text += `Time Remaining: ${formatDuration(lic)}\n`;
        text += `Status: ${lic.status}\n\n`;
    }
    text += `<i>Tap any User ID or Password above to copy it with one tap.</i>\n\n`;
    text += `💡 <b>Want to customize your password?</b>\nType: <code>/setpassword &lt;new_password&gt;</code>`;
    const terminalAppUrl = `${webAppUrl}?app=terminal`;
    const keyboard = new grammy_1.InlineKeyboard()
        .webApp("Launch Software Terminal", terminalAppUrl)
        .row()
        .url("Open in Web Browser", terminalAppUrl);
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: keyboard });
});
// Command: /setpassword or /changepassword
bot.command(["setpassword", "changepassword"], async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId)
        return;
    const rawArgs = ctx.message?.text?.split(" ").slice(1).join(" ").trim();
    if (!rawArgs) {
        await ctx.reply("<b>Usage:</b> <code>/setpassword &lt;your_new_password&gt;</code>\n\n" +
            "Example: <code>/setpassword Trader9920</code>\n" +
            "<i>Must be at least 4 characters long.</i>", { parse_mode: "HTML" });
        return;
    }
    if (rawArgs.length < 4) {
        await ctx.reply("<b>Error:</b> Password must be at least 4 characters long.", { parse_mode: "HTML" });
        return;
    }
    const all = licenseStore_1.licenseStore.getAllLicenses();
    const userAccount = all.find((l) => l.telegramId === userId);
    if (!userAccount) {
        await ctx.reply("<b>No Account Found:</b> You do not have an active QOX account registered to this Telegram profile.", { parse_mode: "HTML" });
        return;
    }
    const ok = licenseStore_1.licenseStore.updatePassword(userAccount.userId, rawArgs);
    if (ok) {
        await ctx.reply(`<b>PASSWORD UPDATED!</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `<b>USER ID:</b>  <code>${userAccount.userId}</code>\n` +
            `<b>NEW PASSWORD:</b> <code>${rawArgs}</code>\n\n` +
            `<i>You can now log into the Software Terminal using your new password.</i>`, {
            parse_mode: "HTML",
            reply_markup: new grammy_1.InlineKeyboard().webApp("Launch Terminal", `${webAppUrl}?app=terminal`),
        });
    }
    else {
        await ctx.reply("Failed to update password. Please try again.", { parse_mode: "HTML" });
    }
});
// Command: /id
bot.command("id", async (ctx) => {
    console.log(`[ID] User @${ctx.from?.username} requested their Telegram ID: ${ctx.from?.id}`);
    await ctx.reply(`<b>Your Telegram User ID:</b> <code>${ctx.from?.id}</code>\n` +
        `Username: @${ctx.from?.username || "none"}`, { parse_mode: "HTML" });
});
// ==========================================
// OWNER ADMIN COMMANDS (/admin, /keys, /upi)
// ==========================================
bot.command(["admin", "keys"], async (ctx) => {
    const userId = ctx.from?.id;
    const username = ctx.from?.username;
    if (!isOwner(userId, username)) {
        await ctx.reply("<b>Access Denied:</b> This command is restricted to verified bot owners.", {
            parse_mode: "HTML",
        });
        return;
    }
    const all = licenseStore_1.licenseStore.getAllLicenses();
    const active = all.filter((l) => l.status === "ACTIVE");
    const expired = all.filter((l) => l.status === "EXPIRED");
    const terminated = all.filter((l) => l.status === "TERMINATED");
    const pendingUpi = upiOrderStore_1.upiOrderStore.getPendingOrders();
    const totalUsdt = all.reduce((sum, l) => sum + (l.priceUsdt || 0), 0);
    const text = `<b>QOX SOFTWARE — OWNER CONTROL PANEL</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `<b>OPERATIONAL STATISTICS:</b>\n` +
        `• Pending UPI Verifications: <code>${pendingUpi.length}</code>\n` +
        `• Active Accounts: <code>${active.length}</code>\n` +
        `• Expired Accounts: <code>${expired.length}</code>\n` +
        `• Terminated Accounts: <code>${terminated.length}</code>\n` +
        `• Total Registered Traders: <code>${all.length}</code>\n` +
        `• Total Verified Revenue: <code>$${totalUsdt.toLocaleString()} USDT</code>\n\n` +
        `Select an option below to manage gateways, owners, or trader accounts:`;
    const keyboard = new grammy_1.InlineKeyboard()
        .text(`Pending UPI Orders (${pendingUpi.length})`, "admin_pending_upi")
        .row()
        .text("View Active Accounts & Terminate", "admin_list_keys:0")
        .row()
        .text("Issue New Account (ID & Password)", "admin_issue_key")
        .row()
        .text("🔗 Share Private Terminal Link", "admin_share_terminal")
        .row()
        .text("⚙️ Payment Gateways", "admin_payment_methods")
        .text("Refresh Stats", "admin_refresh");
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: keyboard });
});
// Command: /payments or /gateway (Toggle payment options ON/OFF)
bot.command(["payments", "gateway", "gateways"], async (ctx) => {
    const userId = ctx.from?.id;
    const username = ctx.from?.username;
    if (!isOwner(userId, username)) {
        await ctx.reply("<b>Access Denied:</b> Restricted to verified bot owners.", { parse_mode: "HTML" });
        return;
    }
    await sendPaymentGatewaysMenu(ctx);
});
// Command: /shareterminal or /sendlink (Owner Only)
bot.command(["shareterminal", "sendlink"], async (ctx) => {
    const userId = ctx.from?.id;
    const username = ctx.from?.username;
    if (!isOwner(userId, username)) {
        await ctx.reply("<b>Access Denied:</b> This command is restricted to the verified bot owner.", { parse_mode: "HTML" });
        return;
    }
    const rawArgs = ctx.message?.text?.split(" ").slice(1).join(" ").trim();
    const terminalAppUrl = `${webAppUrl}?app=terminal`;
    if (rawArgs) {
        const userRec = userRegistry_1.userRegistry.getUser(rawArgs);
        const targetId = userRec ? userRec.id : (!isNaN(parseInt(rawArgs, 10)) ? parseInt(rawArgs, 10) : undefined);
        const targetDisplay = userRec?.username ? `@${userRec.username}` : `ID: ${targetId}`;
        if (targetId) {
            try {
                const msg = `<b>🎉 QOX SOFTWARE TERMINAL • OFFICIAL ACCESS ISSUED</b>\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `The Bot Owner has authorized your access to the dedicated QOX AI Software Terminal.\n\n` +
                    `<b>Private Terminal Link:</b>\n` +
                    `🔗 <code>${terminalAppUrl}</code>\n\n` +
                    `<b>How to Start:</b>\n` +
                    `1. Tap the button below to launch your terminal.\n` +
                    `2. Log in with your issued User ID and Password.\n` +
                    `3. Upload candlestick chart screenshots and receive live AI signals!\n\n` +
                    `<i>Tip: Type /myaccount anytime to view your login details.</i>`;
                await bot.api.sendMessage(targetId, msg, {
                    parse_mode: "HTML",
                    reply_markup: new grammy_1.InlineKeyboard()
                        .webApp("⚡ Launch Software Terminal", terminalAppUrl)
                        .row()
                        .url("Open in Web Browser", terminalAppUrl),
                });
                await ctx.reply(`<b>Success:</b> Terminal link dispatched directly to ${targetDisplay} (<code>${targetId}</code>)`, {
                    parse_mode: "HTML",
                });
                return;
            }
            catch (err) {
                await ctx.reply(`<b>Could not send to ${targetDisplay}:</b> Ensure the trader has started this bot first.`, {
                    parse_mode: "HTML",
                });
                return;
            }
        }
        else {
            await ctx.reply(`<b>User Not Found:</b> Could not resolve <code>${rawArgs}</code>. Please ask the trader to type /start in the bot first so their Telegram ID is registered.`, {
                parse_mode: "HTML",
            });
            return;
        }
    }
    const shareText = `<b>🔗 PRIVATE SOFTWARE TERMINAL LINK (OWNER DESK)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>Terminal URL:</b>\n` +
        `<code>${terminalAppUrl}</code>\n\n` +
        `<b>Trader Access Template (Copy & Send):</b>\n` +
        `<blockquote>` +
        `<b>QOX SOFTWARE TERMINAL ACCESS</b>\n` +
        `Here is your private link to the AI Scanner:\n` +
        `${terminalAppUrl}\n\n` +
        `Use your assigned User ID & Password to log in.` +
        `</blockquote>\n\n` +
        `<i>To dispatch directly to a user:</i>\n` +
        `<code>/shareterminal @username</code> or <code>/shareterminal &lt;numeric_id&gt;</code>`;
    await ctx.reply(shareText, {
        parse_mode: "HTML",
        reply_markup: new grammy_1.InlineKeyboard()
            .webApp("⚡ Test Open Terminal", terminalAppUrl)
            .row()
            .text("Back to Admin Overview", "admin_refresh"),
    });
});
bot.command(["upi", "pendingupi"], async (ctx) => {
    const userId = ctx.from?.id;
    if (!isOwner(userId)) {
        await ctx.reply("<b>Access Denied:</b> Owner only command.", { parse_mode: "HTML" });
        return;
    }
    const pending = upiOrderStore_1.upiOrderStore.getPendingOrders();
    if (pending.length === 0) {
        await ctx.reply("<b>No Pending UPI Orders</b>\n\nAll submitted payments have been verified.", {
            parse_mode: "HTML",
        });
        return;
    }
    const keyboard = new grammy_1.InlineKeyboard();
    pending.slice(0, 5).forEach((order) => {
        const amtStr = order.amountInr ? `₹${order.amountInr.toLocaleString()}` : `$${order.priceUsdt}`;
        keyboard
            .text(`✅ #${order.orderId} (${amtStr})`, `approve_upi:${order.orderId}`)
            .text(`❌`, `reject_upi:${order.orderId}`)
            .row();
    });
    keyboard.text("Back to Admin Overview", "admin_refresh");
    await ctx.reply(`<b>PENDING UPI ORDERS (${pending.length})</b>\n━━━━━━━━━━━━━━━━━━━━━\nSelect an order to approve or reject:`, {
        parse_mode: "HTML",
        reply_markup: keyboard,
    });
});
// ==========================================
// INLINE BUTTON CALLBACK HANDLERS
// ==========================================
bot.callbackQuery(/^admin_list_keys:(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!isOwner(userId)) {
        await ctx.answerCallbackQuery({ text: "Access Denied", show_alert: true });
        return;
    }
    const page = parseInt(ctx.match[1]) || 0;
    const pageSize = 5;
    const allActive = licenseStore_1.licenseStore.getAllLicenses().filter((l) => l.status === "ACTIVE");
    if (allActive.length === 0) {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(`<b>ACTIVE ACCOUNTS (0)</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n<i>No active trader accounts currently in system.</i>`, {
            parse_mode: "HTML",
            reply_markup: new grammy_1.InlineKeyboard().text("Back to Admin", "admin_refresh"),
        });
        return;
    }
    const totalPages = Math.ceil(allActive.length / pageSize);
    const startIdx = page * pageSize;
    const currentBatch = allActive.slice(startIdx, startIdx + pageSize);
    let text = `<b>ACTIVE TRADER ACCOUNTS (Page ${page + 1}/${totalPages})</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    const keyboard = new grammy_1.InlineKeyboard();
    currentBatch.forEach((lic, idx) => {
        const itemNum = startIdx + idx + 1;
        text += `<b>${itemNum}. @${lic.telegramUsername || "Anonymous"}</b>\n`;
        text += `<b>User ID:</b> <code>${lic.userId}</code>\n`;
        text += `<b>Password:</b> <code>${lic.password}</code>\n`;
        text += `Plan: <b>${lic.planTag}</b> | Time: ${formatDuration(lic)}\n\n`;
        keyboard.text(`[Terminate #${itemNum} (${lic.userId})]`, `terminate_key:${lic.userId}`).row();
    });
    const navRow = [];
    if (page > 0) {
        navRow.push({ text: "< Previous", callback_data: `admin_list_keys:${page - 1}` });
    }
    if (page < totalPages - 1) {
        navRow.push({ text: "Next >", callback_data: `admin_list_keys:${page + 1}` });
    }
    if (navRow.length > 0) {
        keyboard.row(...navRow.map((b) => grammy_1.InlineKeyboard.text(b.text, b.callback_data)));
    }
    keyboard.row().text("Back to Admin Overview", "admin_refresh");
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: keyboard });
});
// Terminate account action
bot.callbackQuery(/^terminate_key:(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!isOwner(userId)) {
        await ctx.answerCallbackQuery({ text: "Access Denied", show_alert: true });
        return;
    }
    const targetId = ctx.match[1];
    const success = licenseStore_1.licenseStore.terminateKey(targetId, "Terminated by Bot Owner via Telegram");
    if (success) {
        await ctx.answerCallbackQuery({
            text: `Account ${targetId} TERMINATED! User session has been locked.`,
            show_alert: true,
        });
        const allActive = licenseStore_1.licenseStore.getAllLicenses().filter((l) => l.status === "ACTIVE");
        await ctx.editMessageText(`<b>ACCOUNT TERMINATED SUCCESSFULLY</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `User ID: <code>${targetId}</code> has been revoked.\n` +
            `The trader's active software session has been terminated.\n\n` +
            `Remaining Active Accounts: <b>${allActive.length}</b>`, {
            parse_mode: "HTML",
            reply_markup: new grammy_1.InlineKeyboard()
                .text("View Remaining Active Accounts", "admin_list_keys:0")
                .row()
                .text("Back to Admin", "admin_refresh"),
        });
    }
    else {
        await ctx.answerCallbackQuery({ text: "Failed to terminate account or account not found.", show_alert: true });
    }
});
// Refresh / Back to Admin
bot.callbackQuery("admin_refresh", async (ctx) => {
    const userId = ctx.from?.id;
    if (!isOwner(userId)) {
        await ctx.answerCallbackQuery({ text: "Access Denied" });
        return;
    }
    const all = licenseStore_1.licenseStore.getAllLicenses();
    const active = all.filter((l) => l.status === "ACTIVE");
    const expired = all.filter((l) => l.status === "EXPIRED");
    const terminated = all.filter((l) => l.status === "TERMINATED");
    const pendingUpi = upiOrderStore_1.upiOrderStore.getPendingOrders();
    const totalUsdt = all.reduce((sum, l) => sum + (l.priceUsdt || 0), 0);
    const text = `<b>QOX SOFTWARE — OWNER CONTROL PANEL</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `<b>OPERATIONAL STATISTICS:</b>\n` +
        `• Pending UPI Verifications: <code>${pendingUpi.length}</code>\n` +
        `• Active Accounts: <code>${active.length}</code>\n` +
        `• Expired Accounts: <code>${expired.length}</code>\n` +
        `• Terminated Accounts: <code>${terminated.length}</code>\n` +
        `• Total Registered Traders: <code>${all.length}</code>\n` +
        `• Total Verified Revenue: <code>$${totalUsdt.toLocaleString()} USDT</code>\n\n` +
        `Select an option below to review pending UPI payments or manage trader accounts:`;
    const keyboard = new grammy_1.InlineKeyboard()
        .text(`Pending UPI Orders (${pendingUpi.length})`, "admin_pending_upi")
        .row()
        .text("View Active Accounts & Terminate", "admin_list_keys:0")
        .row()
        .text("Issue New Account (ID & Password)", "admin_issue_key")
        .row()
        .text("🔗 Share Private Terminal Link", "admin_share_terminal")
        .row()
        .text("⚙️ Payment Gateways", "admin_payment_methods")
        .text("Refresh Stats", "admin_refresh");
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: keyboard });
});
// Helper: Render Payment Gateways Menu
async function sendPaymentGatewaysMenu(ctx, edit = false) {
    const gws = paymentConfigStore_1.paymentConfigStore.getGateways();
    const text = `<b>⚙️ PAYMENT GATEWAYS CONTROL PANEL</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Temporarily enable or disable payment methods in the mini-app with 1 tap.\n\n` +
        `<b>CURRENT GATEWAY STATUS:</b>\n` +
        `• <b>UPI / QR (INR):</b> ${gws.upi.enabled ? "🟢 <b>ACTIVE</b>" : "🔴 <b>TEMPORARILY DISABLED</b>"}\n` +
        `• <b>Binance Pay (USDT):</b> ${gws.binance.enabled ? "🟢 <b>ACTIVE</b>" : "🔴 <b>TEMPORARILY DISABLED</b>"}\n` +
        `• <b>Trust Wallet (Crypto):</b> ${gws.trust.enabled ? "🟢 <b>ACTIVE</b>" : "🔴 <b>TEMPORARILY DISABLED</b>"}\n\n` +
        `<i>When a payment method is disabled, if a user attempts to select it in the app, an instant popup alert informs them that it is temporarily disabled.</i>\n\n` +
        `Tap below to toggle gateway availability:`;
    const keyboard = new grammy_1.InlineKeyboard()
        .text(`${gws.upi.enabled ? "🟢 UPI: ACTIVE" : "🔴 UPI: DISABLED"} (Tap to toggle)`, "toggle_gw_upi")
        .row()
        .text(`${gws.binance.enabled ? "🟢 Binance: ACTIVE" : "🔴 Binance: DISABLED"} (Tap to toggle)`, "toggle_gw_binance")
        .row()
        .text(`${gws.trust.enabled ? "🟢 Trust Wallet: ACTIVE" : "🔴 Trust: DISABLED"} (Tap to toggle)`, "toggle_gw_trust")
        .row()
        .text("« Back to Admin Overview", "admin_refresh");
    if (edit && ctx.callbackQuery) {
        try {
            await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: keyboard });
        }
        catch {
            await ctx.reply(text, { parse_mode: "HTML", reply_markup: keyboard });
        }
    }
    else {
        await ctx.reply(text, { parse_mode: "HTML", reply_markup: keyboard });
    }
}
// Callback: Manage Payment Gateways Menu
bot.callbackQuery("admin_payment_methods", async (ctx) => {
    const userId = ctx.from?.id;
    const username = ctx.from?.username;
    if (!isOwner(userId, username)) {
        await ctx.answerCallbackQuery({ text: "Access Denied: Owner only", show_alert: true });
        return;
    }
    await ctx.answerCallbackQuery();
    await sendPaymentGatewaysMenu(ctx, true);
});
// Callback: Toggle specific gateway
bot.callbackQuery(/^toggle_gw_(upi|binance|trust)$/, async (ctx) => {
    const userId = ctx.from?.id;
    const username = ctx.from?.username;
    if (!isOwner(userId, username)) {
        await ctx.answerCallbackQuery({ text: "Access Denied: Owner only", show_alert: true });
        return;
    }
    const method = ctx.match[1];
    const result = paymentConfigStore_1.paymentConfigStore.toggle(method);
    await ctx.answerCallbackQuery({
        text: `${result.config[method].name} is now ${result.enabled ? "🟢 ACTIVE" : "🔴 TEMPORARILY DISABLED"}!`,
        show_alert: true,
    });
    await sendPaymentGatewaysMenu(ctx, true);
});
// Callback: Share Terminal Link from Admin Panel
bot.callbackQuery("admin_share_terminal", async (ctx) => {
    const userId = ctx.from?.id;
    if (!isOwner(userId)) {
        await ctx.answerCallbackQuery({ text: "Access Denied" });
        return;
    }
    await ctx.answerCallbackQuery();
    const terminalAppUrl = `${webAppUrl}?app=terminal`;
    const shareText = `<b>🔗 PRIVATE SOFTWARE TERMINAL LINK</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>Official Terminal URL:</b>\n` +
        `<code>${terminalAppUrl}</code>\n\n` +
        `<b>Trader Access Template (Copy & Send):</b>\n` +
        `<blockquote>` +
        `<b>QOX SOFTWARE TERMINAL ACCESS</b>\n` +
        `Here is your private link to the AI Scanner:\n` +
        `${terminalAppUrl}\n\n` +
        `Use your assigned User ID & Password to log in.` +
        `</blockquote>\n\n` +
        `<i>To dispatch directly to a user:</i>\n` +
        `<code>/shareterminal @username</code> or <code>/shareterminal &lt;numeric_id&gt;</code>`;
    await ctx.editMessageText(shareText, {
        parse_mode: "HTML",
        reply_markup: new grammy_1.InlineKeyboard()
            .webApp("⚡ Test Open Terminal", terminalAppUrl)
            .row()
            .text("Back to Admin Overview", "admin_refresh"),
    });
});
// View Pending UPI orders callback
bot.callbackQuery("admin_pending_upi", async (ctx) => {
    const userId = ctx.from?.id;
    if (!isOwner(userId)) {
        await ctx.answerCallbackQuery({ text: "Access Denied" });
        return;
    }
    const pending = upiOrderStore_1.upiOrderStore.getPendingOrders();
    if (pending.length === 0) {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(`<b>PENDING UPI VERIFICATIONS (0)</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n<i>No pending UPI payments awaiting review.</i>`, {
            parse_mode: "HTML",
            reply_markup: new grammy_1.InlineKeyboard().text("Back to Admin Overview", "admin_refresh"),
        });
        return;
    }
    let text = `<b>PENDING UPI VERIFICATIONS (${pending.length})</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    const keyboard = new grammy_1.InlineKeyboard();
    pending.slice(0, 5).forEach((o, idx) => {
        text += `<b>${idx + 1}. Order #${o.orderId}</b>\n`;
        text += `• Trader: @${o.telegramUsername || "Anonymous"} (ID: <code>${o.telegramId || "N/A"}</code>)\n`;
        text += `• Plan: ${o.planTag} • Amount: <b>${o.amountText || (o.amountInr ? `₹${o.amountInr.toLocaleString()} INR` : `$${o.priceUsdt} USD`)}</b>\n`;
        text += `• 12-Digit UTR: <code>${o.utr}</code>\n`;
        text += `• Submitted: ${new Date(o.submittedAt).toLocaleTimeString()}\n\n`;
        keyboard
            .text(`✅ Approve #${o.orderId}`, `approve_upi:${o.orderId}`)
            .text(`❌ Reject`, `reject_upi:${o.orderId}`)
            .row();
    });
    text += `<i>Tap ✅ to approve & issue credentials immediately, or ❌ to reject:</i>`;
    keyboard.text("Back to Admin Overview", "admin_refresh");
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: keyboard });
});
// Approve UPI Order Callback
bot.callbackQuery(/^approve_upi:(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!isOwner(userId)) {
        await ctx.answerCallbackQuery({ text: "Access Denied: Owner only", show_alert: true });
        return;
    }
    const orderId = ctx.match[1];
    const order = upiOrderStore_1.upiOrderStore.getOrder(orderId);
    if (!order) {
        await ctx.answerCallbackQuery({ text: "Order not found.", show_alert: true });
        return;
    }
    if (order.status === "APPROVED") {
        await ctx.answerCallbackQuery({ text: "Order already approved!", show_alert: true });
        return;
    }
    if (order.status === "REJECTED") {
        await ctx.answerCallbackQuery({ text: "Order was already rejected.", show_alert: true });
        return;
    }
    // Issue License
    const newLic = licenseStore_1.licenseStore.createLicense({
        telegramId: order.telegramId,
        telegramUsername: order.telegramUsername || "UpiBuyer",
        planTag: order.planTag,
        planId: order.planId,
        durationDays: order.durationDays,
        priceUsdt: order.priceUsdt,
        txId: `UPI-${order.utr}`,
        customUserId: order.customUserId,
        customPassword: order.customPassword,
    });
    upiOrderStore_1.upiOrderStore.approveOrder(order.orderId, newLic.userId);
    await ctx.answerCallbackQuery({ text: `Approved! User ID: ${newLic.userId}`, show_alert: true });
    await ctx.editMessageText(`<b>✅ UPI ORDER #${order.orderId} APPROVED</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>Trader:</b> @${order.telegramUsername || "Anonymous"} (ID: <code>${order.telegramId || "N/A"}</code>)\n` +
        `<b>Plan:</b> ${order.planTag} (${order.durationDays === -1 ? "Permanent" : `${order.durationDays} Days`})\n` +
        `<b>Amount:</b> ${order.amountText || (order.amountInr ? `₹${order.amountInr.toLocaleString()} INR` : `$${order.priceUsdt} USD`)} (Ref/UTR: <code>${order.utr || order.txRef}</code>)\n\n` +
        `<b>ISSUED CREDENTIALS:</b>\n` +
        `<b>USER ID:</b>  <code>${newLic.userId}</code>\n` +
        `<b>PASSWORD:</b> <code>${newLic.password}</code>\n` +
        `<b>Status:</b> <code>ACTIVATED & DELIVERED</code>`, {
        parse_mode: "HTML",
        reply_markup: new grammy_1.InlineKeyboard()
            .text("Review More UPI Orders", "admin_pending_upi")
            .row()
            .text("Back to Admin Overview", "admin_refresh"),
    });
    // Send credentials to Buyer
    if (order.telegramId) {
        const buyerCredentialsMsg = `<b>🎉 QOX SOFTWARE • PAYMENT APPROVED & ACTIVATED!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Activation ID: <code>#${order.orderId}</code>\n` +
            `Plan: <b>${newLic.planTag}</b>\n` +
            `Duration: ${formatDuration(newLic)}\n` +
            `Status: <code>ACTIVE & VERIFIED</code>\n\n` +
            `<b>YOUR OFFICIAL LOGIN CREDENTIALS:</b>\n` +
            `<b>USER ID:</b>  <code>${newLic.userId}</code>\n` +
            `<b>PASSWORD:</b> <code>${newLic.password}</code>\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `<b>How to Access QOX Software:</b>\n` +
            `1. Tap "Launch Software Terminal" below.\n` +
            `2. Log in using your User ID and Password above.\n` +
            `3. Access the AI Chart Scanner & Next Candle Predictor.\n\n` +
            `<i>Tip: Retrieve your login details anytime by typing /myaccount</i>`;
        const terminalAppUrl = `${webAppUrl}?app=terminal`;
        const launchKeyboard = new grammy_1.InlineKeyboard()
            .webApp("⚡ Launch Software Terminal", terminalAppUrl)
            .row()
            .url("Open in Web Browser", terminalAppUrl);
        try {
            await bot.api.sendMessage(order.telegramId, buyerCredentialsMsg, {
                parse_mode: "HTML",
                reply_markup: launchKeyboard,
            });
        }
        catch (err) {
            console.error("[UPI] Failed to send credentials to buyer:", err);
        }
    }
});
// Approve Query Callback (Handles both UPI and direct purchase queries)
bot.callbackQuery(/^approve_query:(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!isOwner(userId)) {
        await ctx.answerCallbackQuery({ text: "Access Denied: Owner only", show_alert: true });
        return;
    }
    const orderId = ctx.match[1];
    const order = upiOrderStore_1.upiOrderStore.getOrder(orderId);
    let newLic;
    let buyerId;
    if (order) {
        if (order.status === "APPROVED") {
            await ctx.answerCallbackQuery({ text: "Already approved!", show_alert: true });
            return;
        }
        let resolvedBuyerId = order.telegramId;
        if (!resolvedBuyerId && order.telegramUsername) {
            const regUser = userRegistry_1.userRegistry.getUser(order.telegramUsername);
            if (regUser)
                resolvedBuyerId = regUser.id;
        }
        newLic = licenseStore_1.licenseStore.createLicense({
            telegramId: resolvedBuyerId,
            telegramUsername: order.telegramUsername || "Trader",
            planTag: order.planTag,
            planId: order.planId,
            durationDays: order.durationDays,
            priceUsdt: order.priceUsdt,
            txId: `QUERY-${order.txRef || order.utr || order.orderId}`,
            customUserId: order.customUserId,
            customPassword: order.customPassword,
        });
        upiOrderStore_1.upiOrderStore.approveOrder(order.orderId, newLic.userId);
        buyerId = resolvedBuyerId;
    }
    else {
        // Generate standard 30-day or lifetime account
        newLic = licenseStore_1.licenseStore.createLicense({
            telegramUsername: "VerifiedTrader",
            planTag: "ENLIGHTENED",
            planId: "enlightened",
            durationDays: 30,
            priceUsdt: 300,
            txId: `QUERY-${orderId}`,
        });
    }
    await ctx.answerCallbackQuery({ text: `Approved! User ID: ${newLic.userId}`, show_alert: true });
    await ctx.editMessageText(`<b>✅ ACTIVATION QUERY #${orderId} CONFIRMED</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>ISSUED CREDENTIALS:</b>\n` +
        `<b>USER ID:</b>  <code>${newLic.userId}</code>\n` +
        `<b>PASSWORD:</b> <code>${newLic.password}</code>\n` +
        `<b>Plan:</b> ${newLic.planTag} (${formatDuration(newLic)})\n` +
        `<b>Status:</b> <code>DELIVERED TO TRADER</code>`, {
        parse_mode: "HTML",
        reply_markup: new grammy_1.InlineKeyboard().text("Back to Admin Overview", "admin_refresh"),
    });
    // Send credentials to Buyer
    if (buyerId) {
        const terminalAppUrl = `${webAppUrl}?app=terminal`;
        const buyerCredentialsMsg = `<b>🎉 QOX SOFTWARE • PAYMENT CONFIRMED BY ADMIN!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Order: <code>#${orderId}</code>\n` +
            `Plan: <b>${newLic.planTag}</b>\n` +
            `Duration: ${formatDuration(newLic)}\n` +
            `Status: <code>ACTIVE & VERIFIED</code>\n\n` +
            `<b>YOUR OFFICIAL LOGIN CREDENTIALS:</b>\n` +
            `<b>USER ID:</b>  <code>${newLic.userId}</code>\n` +
            `<b>PASSWORD:</b> <code>${newLic.password}</code>\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `<b>How to Start Trading:</b>\n` +
            `1. Tap "Launch Software Terminal" below.\n` +
            `2. Log in using your User ID and Password.\n` +
            `3. Upload your chart screenshot and receive AI signals!\n\n` +
            `<i>Tip: Retrieve your login details anytime by typing /myaccount</i>`;
        const launchKeyboard = new grammy_1.InlineKeyboard()
            .webApp("⚡ Launch Software Terminal", terminalAppUrl)
            .row()
            .url("Open in Web Browser", terminalAppUrl);
        try {
            await bot.api.sendMessage(buyerId, buyerCredentialsMsg, {
                parse_mode: "HTML",
                reply_markup: launchKeyboard,
            });
        }
        catch (err) {
            console.error("[QUERY] Failed to dispatch login credentials to buyer:", err);
        }
    }
});
// Reject Query Callback
bot.callbackQuery(/^reject_query:(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!isOwner(userId)) {
        await ctx.answerCallbackQuery({ text: "Access Denied: Owner only", show_alert: true });
        return;
    }
    const orderId = ctx.match[1];
    const order = upiOrderStore_1.upiOrderStore.getOrder(orderId);
    if (order) {
        upiOrderStore_1.upiOrderStore.rejectOrder(order.orderId);
        if (order.telegramId) {
            try {
                await bot.api.sendMessage(order.telegramId, `<b>QOX SOFTWARE • PAYMENT QUERY STATUS</b>\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `Order ID: <code>#${order.orderId}</code>\n\n` +
                    `The administrator was unable to confirm the incoming credit on our bank statement.\n` +
                    `Please re-check your transfer reference/UTR or message admin support.`, { parse_mode: "HTML" });
            }
            catch { }
        }
    }
    await ctx.answerCallbackQuery({ text: `Query #${orderId} Rejected`, show_alert: true });
    await ctx.editMessageText(`<b>❌ QUERY #${orderId} MARKED UNVERIFIED</b>`, {
        parse_mode: "HTML",
        reply_markup: new grammy_1.InlineKeyboard().text("Back to Admin Overview", "admin_refresh"),
    });
});
// Reject UPI Order Callback
bot.callbackQuery(/^reject_upi:(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!isOwner(userId)) {
        await ctx.answerCallbackQuery({ text: "Access Denied: Owner only", show_alert: true });
        return;
    }
    const orderId = ctx.match[1];
    const order = upiOrderStore_1.upiOrderStore.getOrder(orderId);
    if (!order) {
        await ctx.answerCallbackQuery({ text: "Order not found.", show_alert: true });
        return;
    }
    upiOrderStore_1.upiOrderStore.rejectOrder(order.orderId);
    await ctx.answerCallbackQuery({ text: `Order #${order.orderId} Rejected`, show_alert: true });
    await ctx.editMessageText(`<b>❌ UPI ORDER #${order.orderId} REJECTED</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Trader: @${order.telegramUsername || "Anonymous"} (ID: <code>${order.telegramId || "N/A"}</code>)\n` +
        `Amount: ${order.amountText || (order.amountInr ? `₹${order.amountInr.toLocaleString()} INR` : `$${order.priceUsdt} USD`)} (Ref/UTR: <code>${order.utr || order.txRef}</code>)\n` +
        `Status: <code>REJECTED / UNVERIFIED</code>`, {
        parse_mode: "HTML",
        reply_markup: new grammy_1.InlineKeyboard()
            .text("Review More UPI Orders", "admin_pending_upi")
            .row()
            .text("Back to Admin Overview", "admin_refresh"),
    });
    if (order.telegramId) {
        try {
            await bot.api.sendMessage(order.telegramId, `<b>QOX SOFTWARE • PAYMENT VERIFICATION FAILED</b>\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `Order ID: <code>#${order.orderId}</code>\n` +
                `Submitted UTR: <code>${order.utr}</code>\n\n` +
                `We were unable to confirm the incoming credit on our bank statement for this UTR.\n` +
                `If this was an error or you already transferred the funds, please contact official support or re-submit with your correct 12-digit UTR.`, { parse_mode: "HTML" });
        }
        catch (err) {
            console.error("[UPI] Failed to notify buyer of rejection:", err);
        }
    }
});
// Issue custom account directly
bot.callbackQuery("admin_issue_key", async (ctx) => {
    const userId = ctx.from?.id;
    if (!isOwner(userId)) {
        await ctx.answerCallbackQuery({ text: "Access Denied" });
        return;
    }
    const keyboard = new grammy_1.InlineKeyboard()
        .text("10 Days Account ($200)", "issue_plan:INITIATE:10:200")
        .row()
        .text("1 Month Account ($300)", "issue_plan:ENLIGHTENED:30:300")
        .row()
        .text("Permanent Account ($500)", "issue_plan:GRANDMASTER:-1:500")
        .row()
        .text("Cancel", "admin_refresh");
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(`<b>GENERATE NEW TRADER ACCOUNT</b>\n━━━━━━━━━━━━━━━━━━━━━\n\nChoose the plan duration to generate a fresh User ID & Password:`, { parse_mode: "HTML", reply_markup: keyboard });
});
bot.callbackQuery(/^issue_plan:([^:]+):(-?\d+):(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!isOwner(userId)) {
        await ctx.answerCallbackQuery({ text: "Access Denied" });
        return;
    }
    const planTag = ctx.match[1];
    const durationDays = parseInt(ctx.match[2]);
    const priceUsdt = parseInt(ctx.match[3]);
    const newLic = licenseStore_1.licenseStore.createLicense({
        telegramId: userId,
        telegramUsername: ctx.from?.username || "OwnerGenerated",
        planTag,
        planId: planTag.toLowerCase(),
        durationDays,
        priceUsdt,
    });
    const durationStr = durationDays === -1 ? "Permanent" : `${durationDays} Days`;
    await ctx.answerCallbackQuery({ text: "Account generated successfully!", show_alert: true });
    await ctx.editMessageText(`<b>NEW TRADER ACCOUNT GENERATED</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `<b>USER ID:</b>  <code>${newLic.userId}</code>\n` +
        `<b>PASSWORD:</b> <code>${newLic.password}</code>\n\n` +
        `Plan: ${newLic.planTag} (${durationStr})\n` +
        `Expires: ${newLic.expiresAt ? new Date(newLic.expiresAt).toLocaleDateString() : "Never (Permanent)"}\n` +
        `Status: ACTIVE\n\n` +
        `Provide these credentials to the trader to log into QOX Software.`, {
        parse_mode: "HTML",
        reply_markup: new grammy_1.InlineKeyboard()
            .text("View Active Accounts", "admin_list_keys:0")
            .row()
            .text("Back to Admin", "admin_refresh"),
    });
});
// ==========================================
// HANDLE WEBAPP DATA (Payment Verified)
// ==========================================
bot.on("message:web_app_data", async (ctx) => {
    try {
        const rawData = ctx.message.web_app_data.data;
        const data = JSON.parse(rawData);
        if (data.type === "customer_feedback") {
            await ctx.reply(`<b>Feedback Received</b>\n\n` +
                `Rating: ${data.rating || 5} / 5\n` +
                `Comment: <i>"${data.comment}"</i>\n\n` +
                `Thank you for contributing to the QOX Software community.`, { parse_mode: "HTML" });
            return;
        }
        if (data.type === "upi_payment_submission") {
            const orderId = data.orderId || `QOX-UPI-${Math.floor(100000 + Math.random() * 900000)}`;
            const durationDays = data.planTag === "INITIATE"
                ? 10
                : data.planTag === "ENLIGHTENED"
                    ? 30
                    : data.planTag === "GRANDMASTER"
                        ? -1
                        : 10;
            let order = upiOrderStore_1.upiOrderStore.getOrder(orderId);
            if (!order) {
                order = upiOrderStore_1.upiOrderStore.createOrder({
                    orderId,
                    telegramId: ctx.from?.id,
                    telegramUsername: ctx.from?.username || ctx.from?.first_name || "Valued Trader",
                    planTag: data.planTag || "INITIATE",
                    planId: (data.planTag || "initiate").toLowerCase(),
                    durationDays,
                    priceUsdt: data.price || 200,
                    amountInr: data.amountInr || (data.planTag === "INITIATE" ? 20000 : (data.price || 200) * 90),
                    utr: data.utr,
                    customUserId: data.userId,
                    customPassword: data.password,
                });
            }
            const durText = data.duration || (order.planTag === "INITIATE" ? "10 DAYS" : order.planTag === "ENLIGHTENED" ? "1 MONTH" : "LIFETIME");
            const inrStr = (order.amountInr ?? (order.planTag === "INITIATE" ? 20000 : order.priceUsdt * 90)).toLocaleString();
            await ctx.reply(`<b>QOX SOFTWARE • UPI PAYMENT SUBMITTED</b>\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `<b>Order ID:</b> <code>#${order.orderId}</code>\n` +
                `<b>Plan:</b> <b>${order.planTag}</b> (${durText})\n` +
                `<b>Amount:</b> ₹${inrStr} INR ($${order.priceUsdt} USD)\n` +
                `<b>Submitted UTR:</b> <code>${order.utr}</code>\n\n` +
                `⏳ <b>VERIFICATION IN PROGRESS:</b>\n` +
                `<i>Please note that verification might take time (typically 5 to 15 minutes) as our compliance desk manually confirms the bank statement credit.</i>\n\n` +
                `Once approved, your official <b>User ID & Password</b> will be sent right here in this chat immediately.`, { parse_mode: "HTML" });
            // Notify ALL 3 Owners
            const ownerKeyboard = new grammy_1.InlineKeyboard()
                .text("✅ Approve & Issue Login", `approve_upi:${order.orderId}`)
                .text("❌ Reject", `reject_upi:${order.orderId}`);
            const ownerAlertText = `<b>🔔 NEW UPI PAYMENT SUBMITTED</b>\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `<b>Order ID:</b> <code>#${order.orderId}</code>\n` +
                `<b>Plan:</b> <b>${order.planTag}</b>\n` +
                `<b>Amount:</b> <b>₹${inrStr} INR</b> ($${order.priceUsdt} USDT)\n` +
                `<b>12-Digit UTR:</b> <code>${order.utr}</code>\n` +
                `<b>Trader:</b> @${order.telegramUsername} (ID: <code>${ctx.from?.id}</code>)\n\n` +
                `<i>Check your bank statement for ₹${inrStr} credit with UTR <code>${order.utr}</code>, then tap below:</i>`;
            await notifyAllOwners(ownerAlertText, ownerKeyboard);
            return;
        }
        const durationDays = data.planTag === "INITIATE"
            ? 10
            : data.planTag === "ENLIGHTENED"
                ? 30
                : data.planTag === "GRANDMASTER"
                    ? -1
                    : 10;
        const savedLicense = licenseStore_1.licenseStore.createLicense({
            telegramId: ctx.from?.id,
            telegramUsername: ctx.from?.username || ctx.from?.first_name || "Valued Trader",
            planTag: data.planTag || "INITIATE",
            planId: (data.planTag || "initiate").toLowerCase(),
            durationDays,
            priceUsdt: data.price || 200,
            txId: data.txId,
            customUserId: data.userId,
            customPassword: data.password,
            customKey: data.licenseKey,
        });
        const orderId = data.orderId || `QOX-${Math.floor(100000 + Math.random() * 900000)}`;
        const txIdDisplay = data.txId ? `\nTransaction ID (TxID):\n<code>${data.txId}</code>` : "";
        const expiryDisplay = savedLicense.expiresAt
            ? new Date(savedLicense.expiresAt).toUTCString()
            : "Lifetime Permanent Access";
        const receiptMessage = `<b>QOX SOFTWARE • PAYMENT VERIFIED & ACTIVATED</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Activation ID: <code>#${orderId}</code>\n` +
            `Trader: @${savedLicense.telegramUsername}\n` +
            `Plan: ${savedLicense.planTag} (${data.duration || "10 DAYS"})\n` +
            `Amount Paid: $${data.price || 200} USDT\n` +
            `Payment Method: ${data.paymentMethod || "Trust Wallet / Binance"}` +
            `${txIdDisplay}\n` +
            `Expiration: ${expiryDisplay}\n` +
            `Status: <code>ACTIVE & VERIFIED</code>\n\n` +
            `<b>YOUR OFFICIAL LOGIN CREDENTIALS:</b>\n` +
            `<b>USER ID:</b>  <code>${savedLicense.userId}</code>\n` +
            `<b>PASSWORD:</b> <code>${savedLicense.password}</code>\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `<b>How to Access QOX Software:</b>\n` +
            `1. Tap "Launch Software Terminal" below.\n` +
            `2. Your User ID & Password will auto-fill (or enter them manually).\n` +
            `3. Unlock the AI Chart Scanner & Next Candle Predictor.\n\n` +
            `<i>Tip: Retrieve your login details anytime by typing /myaccount</i>`;
        const launchKeyboard = new grammy_1.InlineKeyboard()
            .webApp("Launch Software Terminal", `${webAppUrl}?app=terminal`)
            .row()
            .url("Open in Desktop Browser", `${webAppUrl}?app=terminal`);
        await ctx.reply(receiptMessage, { parse_mode: "HTML", reply_markup: launchKeyboard });
        // Notify ALL 3 Owners
        await notifyAllOwners(`<b>🎉 NEW SUBSCRIPTION SALE</b>\n\n` +
            `Trader: @${savedLicense.telegramUsername} (ID: <code>${ctx.from?.id}</code>)\n` +
            `Plan: ${savedLicense.planTag} (${data.duration || "10 DAYS"})\n` +
            `Paid: $${data.price} USDT\n` +
            `User ID: <code>${savedLicense.userId}</code>\n` +
            `Password: <code>${savedLicense.password}</code>\n` +
            `Duration: ${formatDuration(savedLicense)}\n\n` +
            `Use /admin to manage this account.`);
    }
    catch (error) {
        console.error("Failed to process WebApp data:", error);
        await ctx.reply("Activation Request Received. Our team is verifying your QOX Software license.", { parse_mode: "HTML" });
    }
});
// Launch bot with error catching
if (token && token !== "your_telegram_bot_token_here") {
    bot.catch((err) => {
        console.error("Bot encountered an error:", err);
    });
    bot.start({
        onStart: async (botInfo) => {
            console.log(`[BOT] @${botInfo.username} is running`);
            console.log(`[URL] Active WebApp URL: ${webAppUrl}`);
            console.log(`[OWNER] Verified Owner ID: ${getOwnerId() || "Not configured"}`);
            try {
                await bot.api.setChatMenuButton({
                    menu_button: {
                        type: "web_app",
                        text: "Launch Software",
                        web_app: { url: webAppUrl },
                    },
                });
                console.log("[MENU] Global Menu Button successfully configured");
            }
            catch (err) {
                console.error("Failed to set default menu button:", err);
            }
        },
    });
}
else {
    console.log("[INFO] Bot runner paused. Please configure BOT_TOKEN in bot/.env.");
}
