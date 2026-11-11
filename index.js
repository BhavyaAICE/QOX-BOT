/**
 * QOX Trading Software & Telegram Bot
 * Unified Production Entrypoint for Pterodactyl Panels, VPS & Docker Containers
 */

const path = require("path");
const fs = require("fs");

// 1. Load Environment Configuration (.env in root or bot/)
const candidateEnvFiles = [
  path.resolve(__dirname, ".env"),
  path.resolve(__dirname, "bot/.env"),
];

for (const envPath of candidateEnvFiles) {
  if (fs.existsSync(envPath)) {
    try {
      require("dotenv").config({ path: envPath });
      console.log(`[QOX] Loaded environment configuration from: ${envPath}`);
    } catch (e) {
      // dotenv might not be in root, will load once in bot scope
    }
  }
}

// 2. Locate compiled bot application
const botDistPath = path.resolve(__dirname, "bot/dist/index.js");

if (!fs.existsSync(botDistPath)) {
  console.log("[QOX] Production build not detected in bot/dist. Compiling TypeScript now...");
  try {
    const { execSync } = require("child_process");
    execSync("npm run build:bot", { stdio: "inherit", cwd: __dirname });
    console.log("[QOX] Compilation completed successfully.");
  } catch (err) {
    console.error("[QOX] Automated compilation failed. Please run 'npm run build' first:", err.message);
  }
}

// 3. Start the application
try {
  require(botDistPath);
} catch (err) {
  console.error("[QOX FATAL] Failed to launch server:", err);
  process.exit(1);
}
