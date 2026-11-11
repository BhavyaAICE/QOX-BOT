"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.licenseStore = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const DATA_DIR = path_1.default.resolve(__dirname, "../../data");
const DATA_FILE = path_1.default.join(DATA_DIR, "licenses.json");
class LicenseStore {
    licenses = new Map();
    constructor() {
        this.init();
    }
    init() {
        try {
            if (!fs_1.default.existsSync(DATA_DIR)) {
                fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
            }
            if (fs_1.default.existsSync(DATA_FILE)) {
                const raw = fs_1.default.readFileSync(DATA_FILE, "utf-8");
                const list = JSON.parse(raw);
                for (const lic of list) {
                    // Migration: Ensure userId and password exist
                    if (!lic.userId) {
                        lic.userId = `QOX-${lic.rawDigits ? lic.rawDigits.slice(0, 5) : crypto_1.default.randomInt(10000, 99999)}`;
                    }
                    if (!lic.password) {
                        lic.password = `${crypto_1.default.randomInt(100000, 999999)}`;
                    }
                    if (!lic.id) {
                        lic.id = lic.userId;
                    }
                    this.licenses.set(lic.userId.toUpperCase(), lic);
                }
                console.log(`📦 Loaded ${this.licenses.size} account records from storage.`);
                this.save();
            }
            else {
                this.save();
            }
        }
        catch (err) {
            console.error("Failed to initialize LicenseStore:", err);
        }
    }
    save() {
        try {
            const list = Array.from(this.licenses.values());
            const tempPath = `${DATA_FILE}.tmp`;
            fs_1.default.writeFileSync(tempPath, JSON.stringify(list, null, 2), "utf-8");
            fs_1.default.renameSync(tempPath, DATA_FILE);
        }
        catch (err) {
            console.error("Failed to save licenses to file:", err);
        }
    }
    normalizeKey(input) {
        return input.replace(/[^0-9]/g, "");
    }
    formatKey(rawDigits) {
        const clean = this.normalizeKey(rawDigits);
        if (clean.length !== 15)
            return rawDigits;
        return `${clean.slice(0, 5)}-${clean.slice(5, 10)}-${clean.slice(10, 15)}`;
    }
    /**
     * Generates a unique User ID and 6-digit numeric Password
     */
    generateCredentials() {
        let userId = `QOX-${crypto_1.default.randomInt(10000, 99999)}`;
        while (Array.from(this.licenses.values()).some((l) => l.userId?.toUpperCase() === userId.toUpperCase())) {
            userId = `QOX-${crypto_1.default.randomInt(10000, 99999)}`;
        }
        const password = `${crypto_1.default.randomInt(100000, 999999)}`;
        return { userId, password };
    }
    /**
     * Generates a 15-digit cryptographic random key (for backward compatibility)
     */
    generate15DigitKey() {
        let rawDigits = "";
        rawDigits += (crypto_1.default.randomInt(1, 10)).toString();
        for (let i = 0; i < 14; i++) {
            rawDigits += (crypto_1.default.randomInt(0, 10)).toString();
        }
        const keyId = this.formatKey(rawDigits);
        return { rawDigits, keyId };
    }
    /**
     * Creates and registers a new account upon verified payment or owner issue
     */
    createLicense(params) {
        const creds = this.generateCredentials();
        const userId = params.customUserId?.trim() || creds.userId;
        const password = params.customPassword?.trim() || creds.password;
        let keyInfo;
        if (params.customKey && this.normalizeKey(params.customKey).length === 15) {
            const norm = this.normalizeKey(params.customKey);
            keyInfo = { rawDigits: norm, keyId: this.formatKey(norm) };
        }
        else {
            keyInfo = this.generate15DigitKey();
        }
        const now = new Date();
        let expiresAt = null;
        if (params.durationDays > 0) {
            const expDate = new Date(now.getTime() + params.durationDays * 24 * 60 * 60 * 1000);
            expiresAt = expDate.toISOString();
        }
        const record = {
            id: userId,
            userId,
            password,
            keyId: keyInfo.keyId,
            rawDigits: keyInfo.rawDigits,
            telegramId: params.telegramId,
            telegramUsername: params.telegramUsername || "Anonymous Trader",
            planId: params.planId,
            planTag: params.planTag,
            durationDays: params.durationDays,
            priceUsdt: params.priceUsdt,
            createdAt: now.toISOString(),
            expiresAt,
            status: "ACTIVE",
            txId: params.txId,
        };
        this.licenses.set(userId.toUpperCase(), record);
        this.save();
        return record;
    }
    /**
     * Validates User ID and Password credentials
     */
    validateCredentials(userIdInput, passwordInput, deviceId) {
        const cleanId = userIdInput?.trim() || "";
        const cleanPass = passwordInput?.trim() || "";
        if (!cleanId || !cleanPass) {
            return {
                valid: false,
                status: "NOT_FOUND",
                message: "Please enter both your User ID and Password.",
            };
        }
        const license = this.findAccount(cleanId);
        if (!license) {
            return {
                valid: false,
                status: "NOT_FOUND",
                message: "Account not found. Please verify your User ID or purchase a plan.",
            };
        }
        // Check Password match
        if (license.password !== cleanPass) {
            return {
                valid: false,
                status: "NOT_FOUND",
                message: "Incorrect password. Please verify your credentials or retrieve them via /myaccount in Telegram.",
            };
        }
        // Check if manually terminated by bot owner
        if (license.status === "TERMINATED") {
            return {
                valid: false,
                status: "TERMINATED",
                license,
                message: license.terminationReason
                    ? `Account revoked: ${license.terminationReason}`
                    : "Account has been terminated by the administrator.",
            };
        }
        // Permanent plan check
        if (license.durationDays === -1 || !license.expiresAt) {
            license.lastLoginAt = new Date().toISOString();
            if (deviceId && !license.deviceFingerprint) {
                license.deviceFingerprint = deviceId;
            }
            this.save();
            return {
                valid: true,
                status: "ACTIVE",
                license,
                isPermanent: true,
                remainingDays: 9999,
                remainingHours: 0,
                remainingMinutes: 0,
                message: "Permanent Grandmaster VIP access confirmed.",
            };
        }
        // Expiration check for time-based plans (10 Days / 30 Days)
        const now = new Date();
        const expiry = new Date(license.expiresAt);
        const diffMs = expiry.getTime() - now.getTime();
        if (diffMs <= 0) {
            license.status = "EXPIRED";
            this.save();
            return {
                valid: false,
                status: "EXPIRED",
                license,
                message: `Your ${license.durationDays}-day subscription expired on ${expiry.toLocaleDateString()}. Please renew your plan.`,
            };
        }
        // Active and valid!
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const days = Math.floor(totalMinutes / (60 * 24));
        const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
        const minutes = totalMinutes % 60;
        license.lastLoginAt = now.toISOString();
        if (deviceId && !license.deviceFingerprint) {
            license.deviceFingerprint = deviceId;
        }
        this.save();
        return {
            valid: true,
            status: "ACTIVE",
            license,
            isPermanent: false,
            remainingDays: days,
            remainingHours: hours,
            remainingMinutes: minutes,
            message: `Access granted (${days}d ${hours}h remaining).`,
        };
    }
    /**
     * Validates legacy 15-digit key (calls validateCredentials internally)
     */
    validateKey(inputKey, deviceId) {
        const raw = this.normalizeKey(inputKey);
        const account = this.findAccount(inputKey);
        if (account) {
            return this.validateCredentials(account.userId, account.password, deviceId);
        }
        if (raw.length !== 15) {
            return {
                valid: false,
                status: "NOT_FOUND",
                message: "Invalid license format.",
            };
        }
        return {
            valid: false,
            status: "NOT_FOUND",
            message: "License key not recognized.",
        };
    }
    /**
     * Update password for an account
     */
    updatePassword(userIdOrTerm, newPassword) {
        const account = this.findAccount(userIdOrTerm);
        if (!account)
            return false;
        account.password = newPassword.trim();
        this.save();
        return true;
    }
    /**
     * Terminate an account manually by bot owner
     */
    terminateKey(inputKeyOrId, reason) {
        const account = this.findAccount(inputKeyOrId);
        if (!account)
            return false;
        account.status = "TERMINATED";
        account.terminatedAt = new Date().toISOString();
        account.terminationReason = reason || "Terminated by Owner";
        this.save();
        return true;
    }
    /**
     * Extend an existing account by N days
     */
    extendKey(inputKeyOrId, extraDays) {
        const account = this.findAccount(inputKeyOrId);
        if (!account)
            return null;
        if (account.durationDays === -1 || !account.expiresAt) {
            return account;
        }
        const currentExp = new Date(account.expiresAt);
        const baseDate = currentExp > new Date() ? currentExp : new Date();
        const newExp = new Date(baseDate.getTime() + extraDays * 24 * 60 * 60 * 1000);
        account.expiresAt = newExp.toISOString();
        account.durationDays += extraDays;
        account.status = "ACTIVE";
        this.save();
        return account;
    }
    /**
     * Return all accounts (sorted with newest first)
     */
    getAllLicenses() {
        return Array.from(this.licenses.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    /**
     * Find account by User ID, Telegram Username, Telegram ID, or Key
     */
    findAccount(term) {
        if (!term)
            return undefined;
        const clean = term.trim();
        const lower = clean.toLowerCase();
        const noAt = lower.replace(/^@/, "");
        // Direct User ID match
        if (this.licenses.has(clean.toUpperCase())) {
            return this.licenses.get(clean.toUpperCase());
        }
        for (const lic of this.licenses.values()) {
            if (lic.userId?.toLowerCase() === lower)
                return lic;
            if (lic.id?.toLowerCase() === lower)
                return lic;
            if (lic.telegramUsername?.toLowerCase() === noAt)
                return lic;
            if (lic.telegramId?.toString() === clean)
                return lic;
            if (lic.keyId?.toLowerCase() === lower)
                return lic;
            if (lic.rawDigits && this.normalizeKey(clean) === lic.rawDigits)
                return lic;
        }
        return undefined;
    }
    findLicense(term) {
        return this.findAccount(term);
    }
}
exports.licenseStore = new LicenseStore();
