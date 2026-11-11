"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ownerStore = void 0;
class OwnerStore {
    /**
     * Reads owners dynamically from process.env only.
     * Configure them in bot/.env via:
     * OWNER_TELEGRAM_ID / OWNER_USERNAME (Owner 1 - Primary)
     * OWNER_2_ID / OWNER_2_USERNAME (Owner 2)
     * OWNER_3_ID / OWNER_3_USERNAME (Owner 3)
     * or comma-separated OWNER_IDS / OWNER_USERNAMES
     */
    getOwners() {
        const owner1Id = (process.env.OWNER_TELEGRAM_ID || "").trim();
        const owner1User = (process.env.OWNER_USERNAME || "").replace(/^@/, "").trim().toLowerCase();
        const owner2Id = (process.env.OWNER_2_ID || "").trim();
        const owner2User = (process.env.OWNER_2_USERNAME || "").replace(/^@/, "").trim().toLowerCase();
        const owner3Id = (process.env.OWNER_3_ID || "").trim();
        const owner3User = (process.env.OWNER_3_USERNAME || "").replace(/^@/, "").trim().toLowerCase();
        return [
            { slot: 1, id: owner1Id, username: owner1User, label: "Owner 1 (Primary)" },
            { slot: 2, id: owner2Id, username: owner2User, label: "Owner 2" },
            { slot: 3, id: owner3Id, username: owner3User, label: "Owner 3" },
        ];
    }
    getAllOwnerIds() {
        const list = [];
        const addIf = (val) => {
            if (val && val.trim() && !list.includes(val.trim()))
                list.push(val.trim());
        };
        addIf(process.env.OWNER_TELEGRAM_ID);
        addIf(process.env.OWNER_2_ID);
        addIf(process.env.OWNER_3_ID);
        if (process.env.OWNER_IDS) {
            process.env.OWNER_IDS.split(",").forEach((id) => addIf(id));
        }
        return list;
    }
    getAllOwnerUsernames() {
        const list = [];
        const addIf = (val) => {
            if (!val)
                return;
            const clean = val.replace(/^@/, "").trim().toLowerCase();
            if (clean && !list.includes(clean))
                list.push(clean);
        };
        addIf(process.env.OWNER_USERNAME);
        addIf(process.env.OWNER_2_USERNAME);
        addIf(process.env.OWNER_3_USERNAME);
        if (process.env.OWNER_USERNAMES) {
            process.env.OWNER_USERNAMES.split(",").forEach((u) => addIf(u));
        }
        return list;
    }
    isOwner(userId, username) {
        if (userId) {
            const idStr = userId.toString().trim();
            if (this.getAllOwnerIds().includes(idStr))
                return true;
        }
        if (username) {
            const clean = username.replace(/^@/, "").trim().toLowerCase();
            if (clean && this.getAllOwnerUsernames().includes(clean))
                return true;
        }
        return false;
    }
}
exports.ownerStore = new OwnerStore();
