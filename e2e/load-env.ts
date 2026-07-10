import { readFileSync } from "fs";
import path from "path";

/**
 * Playwright's config/global-setup run as plain Node scripts — Next.js's
 * automatic `.env*` loading doesn't apply here. Parses `.env` then `.env.local`
 * (later file wins, matching Next.js's own precedence) into `process.env`.
 */
export function loadEnv(): void {
  for (const file of [".env", ".env.local"]) {
    let contents: string;
    try {
      contents = readFileSync(path.resolve(__dirname, "..", file), "utf-8");
    } catch {
      continue;
    }
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  }
}
