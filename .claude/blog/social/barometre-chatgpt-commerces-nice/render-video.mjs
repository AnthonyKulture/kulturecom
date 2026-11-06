// Rend video.html en MP4 1080 × 1920 à 30 i/s : reel.mp4, story.mp4 et la couverture du reel.
//
// Usage (depuis la racine du dépôt) :
//   node .claude/blog/social/barometre-chatgpt-commerces-nice/render-video.mjs [reel|story]
//
// Variables : PLAYWRIGHT_CORE (chemin du paquet playwright-core), CHROMIUM (exécutable).
// ffmpeg doit être dans le PATH.

import { readFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { homedir, tmpdir } from "node:os";

const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_CORE ?? "/Users/anthony/Developer/Oqoo/node_modules/.pnpm/playwright-core@1.63.0/node_modules/playwright-core",
);
const executablePath = process.env.CHROMIUM
  ?? join(homedir(), "Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell");

const here = dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const font = (f) => `data:font/woff2;base64,${readFileSync(resolve("public/fonts", f)).toString("base64")}`;
const html = readFileSync(join(here, "video.html"), "utf8")
  .replaceAll("__URBANIST__", font("urbanist-latin.woff2"))
  .replaceAll("__GEIST__", font("geist-latin.woff2"));

const browser = await chromium.launch({ executablePath });
for (const variant of process.argv[2] ? [process.argv[2]] : ["reel", "story"]) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const { duration } = await page.evaluate((v) => window.setup(v), variant);

  const frames = join(tmpdir(), `barometre-${variant}-frames`);
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames, { recursive: true });
  const n = Math.round(duration * FPS);
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.render(t), i / FPS);
    await page.screenshot({ path: join(frames, `${String(i).padStart(5, "0")}.png`) });
  }
  if (variant === "reel") {
    // Cover: the hook once its headline is in place.
    await page.evaluate(() => window.render(3.2));
    await page.screenshot({ path: join(here, "reel-cover.jpg"), type: "jpeg", quality: 92 });
  }
  await page.close();

  // H.264 + a silent AAC track: Instagram accepts it everywhere, and music can be added in the app.
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(frames, "%05d.png"),
    "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-shortest",
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-profile:v", "high",
    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", join(here, `${variant}.mp4`),
  ]);
  rmSync(frames, { recursive: true, force: true });
  console.log(`${variant}.mp4 : ${n} images, ${duration.toFixed(1)} s`);
}
await browser.close();
