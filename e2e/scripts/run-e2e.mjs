#!/usr/bin/env node
// Runs `playwright test`, auto-fetching missing headless-Chromium shared
// libraries first when this machine has no root/apt-get-install access
// (e.g. `npx playwright install-deps` needs sudo, which isn't available).
// No-op on non-Linux or when nothing is missing.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir, homedir, platform } from "node:os";
import { join } from "node:path";

const LOCAL_LIB_DIR = join(homedir(), ".cache", "playwright-local-libs", "usr", "lib", "x86_64-linux-gnu");

// Maps the .so name reported by `ldd` to the Debian/Ubuntu package that ships it.
const LIB_TO_PACKAGE = {
  "libnspr4.so": "libnspr4",
  "libnss3.so": "libnss3",
  "libnssutil3.so": "libnss3",
  "libsmime3.so": "libnss3",
  "libasound.so.2": "libasound2t64",
  "libatk-1.0.so.0": "libatk1.0-0t64",
  "libatk-bridge-2.0.so.0": "libatk-bridge2.0-0t64",
  "libcups.so.2": "libcups2t64",
  "libatspi.so.0": "libatspi2.0-0t64",
  "libXdamage.so.1": "libxdamage1",
  "libgtk-3.so.0": "libgtk-3-0t64",
  "libgbm.so.1": "libgbm1",
  "libxkbcommon.so.0": "libxkbcommon0",
  "libX11-xcb.so.1": "libx11-xcb1",
  "libXcomposite.so.1": "libxcomposite1",
  "libXrandr.so.2": "libxrandr2",
  "libpango-1.0.so.0": "libpango-1.0-0",
  "libcairo.so.2": "libcairo2",
  "libXfixes.so.3": "libxfixes3",
};

function findBrowserBinary() {
  const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH || join(homedir(), ".cache", "ms-playwright");
  if (!existsSync(browsersDir)) return null;
  for (const entry of readdirSync(browsersDir, { recursive: true, withFileTypes: true })) {
    if (entry.isFile() && (entry.name === "chrome-headless-shell" || entry.name === "chrome")) {
      return join(entry.parentPath ?? entry.path, entry.name);
    }
  }
  return null;
}

function findMissingLibs(binaryPath) {
  const env = { ...process.env, LD_LIBRARY_PATH: [LOCAL_LIB_DIR, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":") };
  let output;
  try {
    output = execFileSync("ldd", [binaryPath], { env, encoding: "utf8" });
  } catch (error) {
    // `ldd` exits non-zero when any dependency is missing, but still prints stdout.
    output = error.stdout?.toString() ?? "";
  }
  return [...output.matchAll(/^\s*(\S+)\s+=>\s+not found/gm)].map((match) => match[1]);
}

function fetchMissingLibs(missingLibs) {
  const packages = [...new Set(missingLibs.map((lib) => LIB_TO_PACKAGE[lib]).filter(Boolean))];
  const unmapped = missingLibs.filter((lib) => !LIB_TO_PACKAGE[lib]);
  if (unmapped.length > 0) {
    console.warn(`⚠ No known package for: ${unmapped.join(", ")} — install manually if the browser still fails to launch.`);
  }
  if (packages.length === 0) return;

  console.log(`⚒ Fetching missing headless-Chromium libraries without sudo: ${packages.join(", ")}`);
  const tmpDir = mkdtempSync(join(tmpdir(), "playwright-libs-"));
  try {
    execFileSync("apt-get", ["download", ...packages], { cwd: tmpDir, stdio: "inherit" });
    mkdirSync(LOCAL_LIB_DIR.replace(/\/usr\/lib\/x86_64-linux-gnu$/, ""), { recursive: true });
    for (const deb of readdirSync(tmpDir).filter((f) => f.endsWith(".deb"))) {
      execFileSync("dpkg-deb", ["-x", deb, LOCAL_LIB_DIR.replace(/\/usr\/lib\/x86_64-linux-gnu$/, "")], { cwd: tmpDir });
    }
    console.log(`⚒ Extracted libraries into ${LOCAL_LIB_DIR}`);
  } catch (error) {
    console.warn(`⚠ Could not auto-fetch missing libraries (${error.message}). Run 'sudo npx playwright install-deps' manually.`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

function ensureBrowserLibs() {
  if (platform() !== "linux") return;
  const binaryPath = findBrowserBinary();
  if (!binaryPath) return; // Not installed yet — `playwright test` will surface a clearer error.
  const missing = findMissingLibs(binaryPath);
  if (missing.length > 0) fetchMissingLibs(missing);
}

// This sandbox has repeatedly left stale `next dev`/`next start` processes bound to
// :3000 across sessions (sometimes serving a dev-mode bundle with its own hydration
// bugs). `playwright.config.ts` sets `reuseExistingServer: false` so a stale server
// causes a hard "port already in use" failure instead of a silent, confusing reuse —
// so clear the port here rather than requiring a manual `kill` before every run.
function freePort(port) {
  if (platform() !== "linux") return;
  let output = "";
  try {
    // `lsof` silently returns nothing for TCP sockets in this sandbox (confirmed:
    // it never finds a listener that `fuser`/`ss` see immediately) — use `fuser`,
    // which works reliably here, instead.
    output = execFileSync("fuser", [`${port}/tcp`], { encoding: "utf8" });
  } catch (error) {
    // `fuser` exits 1 when nothing is using the port.
    output = error.stdout?.toString() ?? "";
  }
  for (const pid of output.split(/\s+/).map((p) => p.trim()).filter(Boolean)) {
    let cmdline = "";
    try {
      // `ps -o comm=` truncates to ~15 chars (Next.js sets its process title to
      // "next-server (vX.Y.Z)", which never survives that truncation) — read
      // /proc directly instead, which isn't truncated.
      cmdline = readFileSync(`/proc/${pid}/cmdline`, "utf8").replace(/\0/g, " ").trim();
    } catch {
      continue; // Process vanished between lsof and this check — nothing to kill.
    }
    // Only take out processes that are actually this app's Next.js server — never
    // an unrelated service, or a developer's own `next dev` running for manual
    // testing in another terminal, that happens to share this port.
    if (!/^next-server\b/.test(cmdline)) {
      console.warn(`⚠ Port :${port} is held by an unrecognized process (pid ${pid}, "${cmdline}") — not killing it. Free the port manually if the run below fails.`);
      continue;
    }
    try {
      process.kill(Number(pid), "SIGKILL");
      console.log(`⚒ Killed stale Next.js process on :${port} (pid ${pid})`);
    } catch {
      // Already gone — fine.
    }
  }
}

ensureBrowserLibs();
freePort(3000);

const env = { ...process.env };
if (existsSync(LOCAL_LIB_DIR)) {
  env.LD_LIBRARY_PATH = [LOCAL_LIB_DIR, env.LD_LIBRARY_PATH].filter(Boolean).join(":");
}

const result = spawnSync("npx", ["playwright", "test", ...process.argv.slice(2)], { stdio: "inherit", env });
process.exit(result.status ?? 1);
