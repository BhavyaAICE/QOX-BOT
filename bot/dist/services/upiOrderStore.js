"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseOrderStore = exports.upiOrderStore = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.resolve(__dirname, "../../data");
const DATA_FILE = path_1.default.join(DATA_DIR, "upi_orders.json");
class PurchaseOrderStore {
    orders = new Map();
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
                for (const order of list) {
                    this.orders.set(order.orderId.toUpperCase(), order);
                }
            }
        }
        catch (err) {
            console.error("Failed to load upi_orders.json:", err);
        }
    }
    save() {
        try {
            const list = Array.from(this.orders.values());
            const tempPath = `${DATA_FILE}.tmp`;
            fs_1.default.writeFileSync(tempPath, JSON.stringify(list, null, 2), "utf-8");
            fs_1.default.renameSync(tempPath, DATA_FILE);
        }
        catch (err) {
            console.error("Failed to save upi_orders.json:", err);
        }
    }
    createOrder(params) {
        const cleanRef = params.txRef || params.utr || "N/A";
        const record = {
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
    getOrder(orderId) {
        return this.orders.get(orderId.toUpperCase());
    }
    approveOrder(orderId, assignedLicenseId) {
        const order = this.getOrder(orderId);
        if (!order)
            return null;
        order.status = "APPROVED";
        order.resolvedAt = new Date().toISOString();
        order.assignedLicenseId = assignedLicenseId;
        this.save();
        return order;
    }
    rejectOrder(orderId) {
        const order = this.getOrder(orderId);
        if (!order)
            return null;
        order.status = "REJECTED";
        order.resolvedAt = new Date().toISOString();
        this.save();
        return order;
    }
    getPendingOrders() {
        return Array.from(this.orders.values()).filter((o) => o.status === "PENDING");
    }
    getAllOrders() {
        return Array.from(this.orders.values());
    }
}
exports.upiOrderStore = new PurchaseOrderStore();
exports.purchaseOrderStore = exports.upiOrderStore;
