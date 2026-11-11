import fs from "fs";
import path from "path";

export interface UserRecord {
  id: number;
  username?: string;
  firstName?: string;
  lastSeen: string;
}

const DATA_DIR = path.resolve(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "user_registry.json");

class UserRegistry {
  private usersById: Map<number, UserRecord> = new Map();
  private usersByUsername: Map<string, number> = new Map();

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
        const list: UserRecord[] = JSON.parse(raw);
        for (const u of list) {
          this.usersById.set(u.id, u);
          if (u.username) {
            this.usersByUsername.set(u.username.toLowerCase().replace(/^@/, ""), u.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load user_registry.json:", err);
    }
  }

  private save() {
    try {
      const list = Array.from(this.usersById.values());
      const tempPath = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(list, null, 2), "utf-8");
      fs.renameSync(tempPath, DATA_FILE);
    } catch (err) {
      console.error("Failed to save user_registry.json:", err);
    }
  }

  public registerUser(id: number, username?: string, firstName?: string): UserRecord {
    const cleanUsername = username ? username.replace(/^@/, "").trim() : undefined;
    const existing = this.usersById.get(id);

    const record: UserRecord = {
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

  public getIdByUsername(username: string): number | undefined {
    const clean = username.replace(/^@/, "").trim().toLowerCase();
    return this.usersByUsername.get(clean);
  }

  public getUser(query: string | number): UserRecord | undefined {
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

  public getAllUsers(): UserRecord[] {
    return Array.from(this.usersById.values());
  }
}

export const userRegistry = new UserRegistry();

