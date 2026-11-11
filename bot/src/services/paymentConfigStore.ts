import fs from "fs";
import path from "path";

export interface PaymentGatewayItem {
  key: "upi" | "binance" | "trust";
  name: string;
  badge: string;
  enabled: boolean;
  disabledReason: string;
  updatedAt: string;
}

export type PaymentGatewaysMap = Record<"upi" | "binance" | "trust", PaymentGatewayItem>;

const DATA_DIR = path.resolve(__dirname, "../../data");
const CONFIG_FILE = path.join(DATA_DIR, "payment_gateways.json");

const DEFAULT_CONFIG: PaymentGatewaysMap = {
  upi: {
    key: "upi",
    name: "PAY WITH UPI / QR",
    badge: "INR",
    enabled: true,
    disabledReason:
      "UPI / QR payment gateway is temporarily disabled by admin for routine banking maintenance. Please use Binance Pay or Trust Wallet (Crypto) to complete your order, or reach out to admin support.",
    updatedAt: new Date().toISOString(),
  },
  binance: {
    key: "binance",
    name: "PAY WITH BINANCE",
    badge: "USDT",
    enabled: true,
    disabledReason:
      "Binance Pay gateway is temporarily disabled by admin for system synchronization. Please use UPI / QR or Trust Wallet, or contact admin desk.",
    updatedAt: new Date().toISOString(),
  },
  trust: {
    key: "trust",
    name: "PAY WITH TRUST WALLET",
    badge: "USDT",
    enabled: true,
    disabledReason:
      "Trust Wallet gateway is temporarily disabled by admin for node maintenance. Please use UPI / QR or Binance Pay, or contact admin desk.",
    updatedAt: new Date().toISOString(),
  },
};

class PaymentConfigStore {
  private config: PaymentGatewaysMap;

  constructor() {
    this.config = this.load();
  }

  private load(): PaymentGatewaysMap {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.upi && parsed.binance && parsed.trust) {
          return {
            upi: { ...DEFAULT_CONFIG.upi, ...parsed.upi },
            binance: { ...DEFAULT_CONFIG.binance, ...parsed.binance },
            trust: { ...DEFAULT_CONFIG.trust, ...parsed.trust },
          };
        }
      }
    } catch (err) {
      console.error("[PAYMENT_CONFIG] Failed reading payment_gateways.json:", err);
    }

    this.save(DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG };
  }

  private save(cfg?: PaymentGatewaysMap): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const dataToSave = cfg || this.config;
      const tempPath = `${CONFIG_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), "utf-8");
      fs.renameSync(tempPath, CONFIG_FILE);
    } catch (err) {
      console.error("[PAYMENT_CONFIG] Failed writing payment_gateways.json:", err);
    }
  }

  public getGateways(): PaymentGatewaysMap {
    return this.config;
  }

  public isEnabled(method: "upi" | "binance" | "trust"): boolean {
    return this.config[method]?.enabled ?? true;
  }

  public toggle(
    method: "upi" | "binance" | "trust",
    forceState?: boolean
  ): { method: string; enabled: boolean; config: PaymentGatewaysMap } {
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

  public setDisabledReason(method: "upi" | "binance" | "trust", reason: string): void {
    if (this.config[method] && reason.trim()) {
      this.config[method].disabledReason = reason.trim();
      this.config[method].updatedAt = new Date().toISOString();
      this.save();
    }
  }
}

export const paymentConfigStore = new PaymentConfigStore();

