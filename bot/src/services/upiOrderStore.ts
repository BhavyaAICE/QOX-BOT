import fs from "fs";
import path from "path";

export interface PurchaseOrderRecord {
  orderId: string;
  telegramId?: number;
  telegramUsername?: string;
  planTag: string;
  planId: string;
  durationDays: number;
  priceUsdt: number;
  amountInr?: number;
  amountText?: string;
  paymentMethod?: string; // "UPI", "BINANCE", "TRUST", "TRC20", etc.
  utr?: string;
  txRef?: string;
  customUserId?: string;
  customPassword?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  resolvedAt?: string;
  assignedLicenseId?: string;
}

// Backward-compatibility alias
export type UpiOrderRecord = PurchaseOrderRecord;

const DATA_DIR = path.resolve(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "upi_orders.json");

class PurchaseOrderStore {
  private orders: Map<string, PurchaseOrderRecord> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const list: PurchaseOrderRecord[] = JSON.parse(raw);
        for (const order of list) {
          this.orders.set(order.orderId.toUpperCase(), order);
        }
      }
    } catch (err) {
      console.error("Failed to load upi_orders.json:", err);
    }
  }

  private save() {
    try {
      const list = Array.from(this.orders.values());
      const tempPath = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(list, null, 2), "utf-8");
      fs.renameSync(tempPath, DATA_FILE);
    } catch (err) {
      console.error("Failed to save upi_orders.json:", err);
    }
  }

  public createOrder(
    params: Omit<PurchaseOrderRecord, "status" | "submittedAt">
  ): PurchaseOrderRecord {
    const cleanRef = params.txRef || params.utr || "N/A";
    const record: PurchaseOrderRecord = {
      ...params,
      orderId: params.orderId.toUpperCase(),
      paymentMethod: (params.paymentMethod || "UPI").toUpperCase(),
      txRef: cleanRef,
      utr: params.utr || cleanRef,
      status: "PENDING",
      submittedAt: new Date().toISOString(),
    };

    this.orders.set(record.orderId, record);
    this.save();
    return record;
  }

  public getOrder(orderId: string): PurchaseOrderRecord | undefined {
    return this.orders.get(orderId.toUpperCase());
  }

  public approveOrder(
    orderId: string,
    assignedLicenseId: string
  ): PurchaseOrderRecord | null {
    const order = this.getOrder(orderId);
    if (!order) return null;

    order.status = "APPROVED";
    order.resolvedAt = new Date().toISOString();
    order.assignedLicenseId = assignedLicenseId;
    this.save();
    return order;
  }

  public rejectOrder(orderId: string): PurchaseOrderRecord | null {
    const order = this.getOrder(orderId);
    if (!order) return null;

    order.status = "REJECTED";
    order.resolvedAt = new Date().toISOString();
    this.save();
    return order;
  }

  public getPendingOrders(): PurchaseOrderRecord[] {
    return Array.from(this.orders.values()).filter(
      (o) => o.status === "PENDING"
    );
  }

  public getAllOrders(): PurchaseOrderRecord[] {
    return Array.from(this.orders.values());
  }
}

export const upiOrderStore = new PurchaseOrderStore();
export const purchaseOrderStore = upiOrderStore;
