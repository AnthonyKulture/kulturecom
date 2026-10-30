// Visuel carré 1080 × 1080 pour les réseaux, dans la DA du site ("Riviera" :
// fond blanc, gris froids, un seul accent bleu Méditerranée, Urbanist + Geist).
//
// Usage :
//   node .claude/blog/social-card.mjs --out .claude/blog/social/<slug-fr>.png \
//     --kicker "SEO local · Nice" \
//     --title "Votre restaurant sur *Google Maps* et dans ChatGPT" \
//     --subtitle "Fiche, menu, avis : ce qui compte vraiment."
// Un passage entre *astérisques* dans le titre passe en bleu (un seul, comme sur le site).

import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
for (const k of ["out", "kicker", "title"]) {
  if (!args[k]) {
    console.error(`Argument manquant : --${k}`);
    process.exit(1);
  }
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const title = esc(args.title).replace(/\*([^*]+)\*/, '<em>$1</em>');
// Les polices du site, embarquées (une page about:blank ne charge pas de file://).
const font = (f) => `data:font/woff2;base64,${readFileSync(resolve("public/fonts", f)).toString("base64")}`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Urbanist; font-weight: 400 700; src: url("${font("urbanist-latin.woff2")}") format("woff2"); }
@font-face { font-family: Geist; font-weight: 400 500; src: url("${font("geist-latin.woff2")}") format("woff2"); }
:root { --bg:#fff; --ink:#10151d; --muted:#556070; --line:rgb(16 21 29 / .14); --accent:#24508c; }
* { margin:0; box-sizing:border-box; }
body { width:1080px; height:1080px; background:var(--bg); color:var(--ink); font-family:Geist, sans-serif; position:relative; overflow:hidden; }
.guides { position:absolute; inset:0;
  background:
    repeating-linear-gradient(to bottom, var(--line) 0 3px, transparent 3px 7px) 80px 0 / 1px 100% no-repeat,
    repeating-linear-gradient(to bottom, var(--line) 0 3px, transparent 3px 7px) calc(100% - 80px) 0 / 1px 100% no-repeat; }
.rule { position:absolute; left:0; right:0; height:1px; background:repeating-linear-gradient(to right, var(--line) 0 3px, transparent 3px 7px); }
.wrap { position:absolute; inset:0 80px; padding:0 56px; display:flex; flex-direction:column; }
.label { font-size:24px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); display:flex; align-items:center; gap:14px; }
.label::before { content:""; width:12px; height:12px; border-radius:50%; background:var(--accent); }
.top { height:200px; display:flex; align-items:center; }
.main { flex:1; display:flex; flex-direction:column; justify-content:center; gap:40px; }
h1 { font-family:Urbanist, sans-serif; font-weight:600; font-size:92px; line-height:1.04; letter-spacing:-.025em; }
h1 em { font-style:normal; color:var(--accent); }
p { font-size:36px; line-height:1.4; color:var(--muted); max-width:820px; }
.bottom { height:180px; display:flex; align-items:center; justify-content:space-between; }
.logo { font-family:Urbanist, sans-serif; font-size:40px; letter-spacing:-.02em; display:flex; align-items:baseline; }
.logo i { width:9px; height:9px; border-radius:50%; background:var(--accent); margin:0 3px 0 4px; display:inline-block; }
.site { font-size:24px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
</style></head><body>
<div class="guides"></div>
<div class="rule" style="top:200px"></div>
<div class="rule" style="bottom:180px"></div>
<div class="wrap">
  <div class="top"><span class="label">${esc(args.kicker)}</span></div>
  <div class="main"><h1>${title}</h1>${args.subtitle ? `<p>${esc(args.subtitle)}</p>` : ""}</div>
  <div class="bottom"><span class="logo">Anthony<i></i>Profit</span><span class="site">anthonyprofit.com</span></div>
</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
const overflow = await page.evaluate(() => {
  const m = document.querySelector(".main");
  return m.scrollHeight > m.clientHeight;
});
mkdirSync(dirname(resolve(args.out)), { recursive: true });
await page.screenshot({ path: args.out, type: "png" });
await browser.close();
if (overflow) {
  console.error("Le texte déborde : raccourcis le titre ou le sous-titre.");
  process.exit(2);
}
console.log(`OK ${args.out}`);
