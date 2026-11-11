"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRegistry = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.resolve(__dirname, "../../data");
const DATA_FILE = path_1.default.join(DATA_DIR, "user_registry.json");
class UserRegistry {
    usersById = new Map();
    usersByUsername = new Map();
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
                for (const u of list) {
                    this.usersById.set(u.id, u);
                    if (u.username) {
                        this.usersByUsername.set(u.username.toLowerCase().replace(/^@/, ""), u.id);
                    }
                }
            }
        }
        catch (err) {
            console.error("Failed to load user_registry.json:", err);
        }
    }
    save() {
        try {
            const list = Array.from(this.usersById.values());
            const tempPath = `${DATA_FILE}.tmp`;
            fs_1.default.writeFileSync(tempPath, JSON.stringify(list, null, 2), "utf-8");
            fs_1.default.renameSync(tempPath, DATA_FILE);
        }
        catch (err) {
            console.error("Failed to save user_registry.json:", err);
        }
    }
    registerUser(id, username, firstName) {
        const cleanUsername = username ? username.replace(/^@/, "").trim() : undefined;
        const existing = this.usersById.get(id);
        const record = {
            id,
            username: cleanUsername || existing?.username,
            firstName: firstName || existing?.firstName,
            lastSeen: new Date().toISOString(),
        };
        this.usersById.set(id, record);
        if (record.username) {
            this.usersByUsername.set(record.username.toLowerCase(), id);
        }
        this.save();
        return record;
    }
    getIdByUsername(username) {
        const clean = username.replace(/^@/, "").trim().toLowerCase();
        return this.usersByUsername.get(clean);
    }
    getUser(query) {
        if (typeof query === "number") {
            return this.usersById.get(query);
        }
        const clean = query.replace(/^@/, "").trim();
        const asNum = parseInt(clean, 10);
        if (!isNaN(asNum) && this.usersById.has(asNum)) {
            return this.usersById.get(asNum);
        }
        const id = this.usersByUsername.get(clean.toLowerCase());
        if (id) {
            return this.usersById.get(id);
        }
        return undefined;
    }
    getAllUsers() {
        return Array.from(this.usersById.values());
    }
}
exports.userRegistry = new UserRegistry();
