"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentConfigStore = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.resolve(__dirname, "../../data");
const CONFIG_FILE = path_1.default.join(DATA_DIR, "payment_gateways.json");
const DEFAULT_CONFIG = {
    upi: {
        key: "upi",
        name: "PAY WITH UPI / QR",
        badge: "INR",
        enabled: true,
        disabledReason: "UPI / QR payment gateway is temporarily disabled by admin for routine banking maintenance. Please use Binance Pay or Trust Wallet (Crypto) to complete your order, or reach out to admin support.",
        updatedAt: new Date().toISOString(),
    },
    binance: {
        key: "binance",
        name: "PAY WITH BINANCE",
        badge: "USDT",
        enabled: true,
        disabledReason: "Binance Pay gateway is temporarily disabled by admin for system synchronization. Please use UPI / QR or Trust Wallet, or contact admin desk.",
        updatedAt: new Date().toISOString(),
    },
    trust: {
        key: "trust",
        name: "PAY WITH TRUST WALLET",
        badge: "USDT",
        enabled: true,
        disabledReason: "Trust Wallet gateway is temporarily disabled by admin for node maintenance. Please use UPI / QR or Binance Pay, or contact admin desk.",
        updatedAt: new Date().toISOString(),
    },
};
class PaymentConfigStore {
    config;
    constructor() {
        this.config = this.load();
    }
    load() {
        try {
            if (!fs_1.default.existsSync(DATA_DIR)) {
                fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
            }
            if (fs_1.default.existsSync(CONFIG_FILE)) {
                const raw = fs_1.default.readFileSync(CONFIG_FILE, "utf-8");
                const parsed = JSON.parse(raw);
                if (parsed.upi && parsed.binance && parsed.trust) {
                    return {
                        upi: { ...DEFAULT_CONFIG.upi, ...parsed.upi },
                        binance: { ...DEFAULT_CONFIG.binance, ...parsed.binance },
                        trust: { ...DEFAULT_CONFIG.trust, ...parsed.trust },
                    };
                }
            }
        }
        catch (err) {
            console.error("[PAYMENT_CONFIG] Failed reading payment_gateways.json:", err);
        }
        this.save(DEFAULT_CONFIG);
        return { ...DEFAULT_CONFIG };
    }
    save(cfg) {
        try {
            if (!fs_1.default.existsSync(DATA_DIR)) {
                fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
            }
            const dataToSave = cfg || this.config;
            const tempPath = `${CONFIG_FILE}.tmp`;
            fs_1.default.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), "utf-8");
            fs_1.default.renameSync(tempPath, CONFIG_FILE);
        }
        catch (err) {
            console.error("[PAYMENT_CONFIG] Failed writing payment_gateways.json:", err);
        }
    }
    getGateways() {
        return this.config;
    }
    isEnabled(method) {
        return this.config[method]?.enabled ?? true;
    }
    toggle(method, forceState) {
        if (!this.config[method]) {
            throw new Error(`Unknown payment method: ${method}`);
        }
        const currentState = this.config[method].enabled;
        const newState = forceState !== undefined ? forceState : !currentState;
        this.config[method].enabled = newState;
        this.config[method].updatedAt = new Date().toISOString();
        this.save();
        console.log(`[PAYMENT_CONFIG] Payment method '${method}' toggled to: ${newState ? "ENABLED (Active)" : "DISABLED (Temp Off)"}`);
        return {
            method,
            enabled: newState,
            config: this.config,
        };
    }
    setDisabledReason(method, reason) {
        if (this.config[method] && reason.trim()) {
            this.config[method].disabledReason = reason.trim();
            this.config[method].updatedAt = new Date().toISOString();
            this.save();
        }
    }
}
exports.paymentConfigStore = new PaymentConfigStore();
