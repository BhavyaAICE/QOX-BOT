# ⚡ QOX SOFTWARE — AI Trading Signals & Automated Telegram Bot

> **Production-Ready Telegram Mini App (TMA) & License Management Bot for Quotex Traders**  
> Built with **React 19, TypeScript, Vite, Tailwind, Express 5, and grammY**. Designed for seamless 1-click deployment on **Pterodactyl Panel**, **VPS**, or **Docker containers**.

---

## 🌟 Key Architecture & Highlights

- **Unified Single-Port Architecture**: Runs both the **Telegram Mini App Frontend** (React SPA) and the **Telegram Bot + License API** within a single Node.js process. Requires only **one external port** on Pterodactyl / VPS.
- **AI Chart Vision & OCR Scanner**: Real-time candlestick pattern detection, OTC broker liquidity analysis, and automatic asset pair recognition from uploaded chart screenshots.
- **3-Way Multi-Gateway Checkout**:
  - ⚡ **UPI Instant Flow**: Dynamic QR generation + Reference UTR matching with 1-tap admin desk query.
  - 🟡 **Binance Pay (BEP-20)**: Official SafePal QR code with centered BNB insignia and on-chain TxID verification.
  - 🔴 **Trust Wallet (TRC-20)**: Official SafePal QR code with centered TRX insignia and on-chain TxID verification.
- **Admin Control Desk**:
  - Live Telegram notifications dispatched simultaneously to **all 3 Bot Owners**.
  - 1-Tap Payment Approval with auto-generated Terminal credentials (`QOX-XXXXX` + custom password).
  - Admin Gateway Toggle (`/payments`) to temporarily disable/enable any payment method on the fly with custom maintenance popups in the Mini App.
  - User Registry & License lifecycle management (Active, Terminated, Expired).

---

## 🚀 How to Deploy on a Pterodactyl Node.js Server

### Step 1: Create or Prepare Server on Pterodactyl
1. In your Pterodactyl Panel, create a new server using a **Node.js Egg** (Node.js 18, 20, or 22 LTS).
2. Allocate **1 port** (Pterodactyl will expose this as `SERVER_PORT`).
3. Recommended Server Specs: **512 MB to 1 GB RAM** is plenty (the compiled server idles at ~45 MB RAM).

### Step 2: Configure Startup Command
In your Pterodactyl server's **Startup** tab:
- **Startup Command**:
  ```bash
  npm start
  ```
  *(or `node index.js` — both work identically)*
- **Node.js Version**: Select `Node.js 20` or `Node.js 22`.

### Step 3: Clone or Upload the Repository
In the **Files** manager or via Git / SFTP:
```bash
git clone https://github.com/BhavyaAICE/QOX-BOT.git .
```
*(Make sure the files are placed directly in `/home/container/`)*

### Step 4: Configure Environment Variables
Copy `.env.example` to `.env` or set the variables in the Pterodactyl panel:
```bash
cp .env.example .env
```
Edit `.env` with your values:
```env
# Telegram Bot Token from @BotFather
BOT_TOKEN=8696673279:AAFfm47Aqyw5Gp3xCAaL18oEi4JRGyht89s

# Public WebApp URL (Where traders access the terminal)
# If using a domain or Cloudflare Tunnel:
WEBAPP_URL=https://your-domain.com

# Server Port (Pterodactyl sets SERVER_PORT automatically)
PORT=5001
SERVER_PORT=5001

# Primary Owner (Telegram ID & Username without @)
OWNER_TELEGRAM_ID=5073404292
OWNER_USERNAME=Bhavya49

# Co-Owner 2
OWNER_2_ID=8901640695
OWNER_2_USERNAME=FrootiPay

# Co-Owner 3
OWNER_3_ID=8045677665
OWNER_3_USERNAME=varshithofficial
```

### Step 5: Install Dependencies & Build
In the Pterodactyl server console or terminal, run:
```bash
npm run install:all
npm run build
```
*(The repository already includes pre-compiled production builds in `client/dist` and `bot/dist`, so `npm run build` is optional on low-RAM containers!)*

### Step 6: Start the Server
Click **Start** on your Pterodactyl dashboard. You will see:
```text
[QOX] Loaded environment configuration from: .env
📦 Loaded 4 account records from storage.
[API] Production mode: Serving Mini App frontend from: client/dist
[API] QOX Software Server & License API running on 0.0.0.0:5001
[BOT] @test4925bot is running
[URL] Active WebApp URL: https://your-domain.com
[OWNER] Verified Owner ID: 5073404292
[MENU] Global Menu Button successfully configured
```

---

## 🛠️ Local Development & Scripts

| Command | Description |
|---|---|
| `npm run start` | Runs the unified production server (`node index.js`). |
| `npm run build` | Builds both the React client (`client/dist`) and TypeScript bot (`bot/dist`). |
| `npm run build:client` | Builds Vite frontend production assets. |
| `npm run build:bot` | Compiles bot TypeScript files using `tsc`. |
| `npm run install:all` | Installs dependencies for root, client, and bot. |
| `npm run dev:client` | Launches Vite dev server with Hot Module Replacement on port `5173`. |
| `npm run dev:bot` | Launches grammY bot in watch mode with `tsx`. |

---

## 🤖 Telegram Bot Commands

- `/start` — Launches user onboarding and displays the interactive Mini App launch button.
- `/id` — Displays the user's numeric Telegram ID.
- `/admin` — Opens the private Owner Control Dashboard (only accessible by the 3 configured owners).
- `/payments` — Opens the live Payment Gateway Toggle menu to enable/disable gateways.
- `/status` — Displays server metrics, total registered traders, and active software licenses.

---

## 📁 Repository Directory Structure

```text
├── index.js              # Pterodactyl & Production single-entry bootloader
├── package.json          # Root scripts, build pipelines & workspaces
├── .env.example          # Environment variables template
├── client/               # React 19 + Vite Frontend Mini App
│   ├── src/
│   │   ├── components/   # UI components (PlanCard, QTXCheckoutModal, StickyCtaBar, etc.)
│   │   ├── assets/       # Authentic SafePal QR images (Binance BEP20 & Trust TRC20)
│   │   └── data/         # Plan prices, OTC rates & wallet configurations
│   └── dist/             # Pre-compiled static assets served by Express
└── bot/                  # grammY Telegram Bot & Express License Server
    ├── src/
    │   ├── api.ts        # API routes + static client SPA serving
    │   ├── index.ts      # Bot lifecycle, multi-owner alerts & webapp menu sync
    │   └── services/     # License, payment, OCR vision, & registry stores
    ├── data/             # Persistent JSON stores (licenses, orders, gateways)
    └── dist/             # Compiled CommonJS production server
```

---

## 🔒 Security & Data Integrity
- Sensitive credentials (`BOT_TOKEN`, private keys, owner IDs) must remain strictly within `.env` and are excluded from git tracking via `.gitignore`.
- Owner authorization checks occur on every incoming message and inline callback query.
- On-chain crypto transactions are matched against the official deposit addresses.
