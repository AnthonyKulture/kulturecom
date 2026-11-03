// Pack Instagram d'un article : visuel carré (1080 × 1080), carrousel 4:5 (1080 × 1350) et légende, dans la DA du
// site ("Riviera" : fond blanc, gris froids, un seul accent bleu Méditerranée, Urbanist + Geist).
//
// Usage : node .claude/blog/social-pack.mjs .claude/blog/social/<slug-fr>/pack.json
// Écrit à côté du JSON : card.jpg, slide-01.jpg… slide-NN.jpg et post.txt (légende, hashtags, stories, reel). JPEG : le seul format d'image accepté
// par l'API de publication d'Instagram, si la publication est automatisée un jour.
//
// pack.json :
// {
//   "card":   { "kicker": "SEO local · Nice", "title": "Votre restaurant sur *Google Maps*", "subtitle": "…" },
//   "slides": [
//     { "type": "cover",     "eyebrow": "…", "title": "…", "body": "…" },
//     { "type": "statement", "eyebrow": "…", "title": "…", "body": "…" },
//     { "type": "list",      "eyebrow": "…", "title": "…", "items": [{ "t": "…", "sub": "…" }] },
//     { "type": "cta",       "eyebrow": "…", "title": "…", "body": "…", "cta": "…" }
//   ],
//   "caption": "…", "hashtags": ["#nice", "…"],
//   "stories": ["Story 1 : le visuel carré + sticker lien vers l'article", "…"],
//   "reel": "Script face caméra de 30 à 45 secondes"
// }
// Un passage entre *astérisques* dans un titre passe en bleu (un seul par visuel).

import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const specPath = process.argv[2];
if (!specPath) {
  console.error("Usage : node .claude/blog/social-pack.mjs <chemin>/pack.json");
  process.exit(1);
}
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const outDir = dirname(resolve(specPath));

// Garde-fous : mêmes règles que les articles, et ce qu'Instagram impose.
const errors = [];
const allText = JSON.stringify(spec);
if (/[—–]/.test(allText)) errors.push("tiret cadratin ou demi-cadratin dans le pack");
if (!spec.card) errors.push("card manquant");
const slides = spec.slides ?? [];
if (slides.length < 5 || slides.length > 8) errors.push("le carrousel doit avoir 5 à 8 slides");
if (slides[0]?.type !== "cover") errors.push("la première slide doit être de type cover");
if (slides.at(-1)?.type !== "cta") errors.push("la dernière slide doit être de type cta");
if (!spec.caption) errors.push("caption manquante");
if (!Array.isArray(spec.stories) || spec.stories.length < 2) errors.push("au moins 2 stories");
if (!spec.reel) errors.push("reel manquant");
if (!Array.isArray(spec.hashtags) || spec.hashtags.length < 1 || spec.hashtags.length > 5)
  errors.push("1 à 5 hashtags (limite Instagram)");
if (errors.length) {
  console.error(errors.map((e) => `ERREUR ${e}`).join("\n"));
  process.exit(1);
}

const esc = (s = "") => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const rich = (s = "") => esc(s).replace(/\*([^*]+)\*/, "<em>$1</em>").replace(/\n/g, "<br>");
// Les polices du site, embarquées (une page about:blank ne charge pas de file://).
const font = (f) => `data:font/woff2;base64,${readFileSync(resolve("public/fonts", f)).toString("base64")}`;

const css = `
@font-face { font-family: Urbanist; font-weight: 400 700; src: url("${font("urbanist-latin.woff2")}") format("woff2"); }
@font-face { font-family: Geist; font-weight: 400 500; src: url("${font("geist-latin.woff2")}") format("woff2"); }
:root { --bg:#fff; --ink:#10151d; --muted:#556070; --line:rgb(16 21 29 / .14); --accent:#24508c; }
.blue { --bg:#24508c; --ink:#fff; --muted:rgb(255 255 255 / .74); --line:rgb(255 255 255 / .35); --accent:#fff; }
* { margin:0; box-sizing:border-box; }
body { width:1080px; background:var(--bg); color:var(--ink); font-family:Geist, sans-serif; position:relative; overflow:hidden; }
.guides { position:absolute; inset:0;
  background:
    repeating-linear-gradient(to bottom, var(--line) 0 3px, transparent 3px 7px) 80px 0 / 1px 100% no-repeat,
    repeating-linear-gradient(to bottom, var(--line) 0 3px, transparent 3px 7px) calc(100% - 80px) 0 / 1px 100% no-repeat; }
.rule { position:absolute; left:0; right:0; height:1px; background:repeating-linear-gradient(to right, var(--line) 0 3px, transparent 3px 7px); }
.wrap { position:absolute; inset:0 80px; padding:0 56px; display:flex; flex-direction:column; }
.top { height:200px; display:flex; align-items:center; justify-content:space-between; }
.label, .site, .count { font-size:24px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
.label { display:flex; align-items:center; gap:14px; }
.label::before { content:""; width:12px; height:12px; border-radius:50%; background:var(--accent); }
.count { color:var(--accent); }
.main { flex:1; display:flex; flex-direction:column; justify-content:center; gap:40px; overflow:hidden; }
h1 { font-family:Urbanist, sans-serif; font-weight:600; font-size:92px; line-height:1.04; letter-spacing:-.025em; }
h1.big { font-size:104px; }
h1.small { font-size:72px; }
h1 em { font-style:normal; color:var(--accent); }
.blue h1 em { text-decoration:underline; text-decoration-thickness:4px; text-underline-offset:10px; }
p { font-size:36px; line-height:1.4; color:var(--muted); max-width:820px; }
ol { list-style:none; padding:0; display:flex; flex-direction:column; gap:34px; counter-reset:i; }
li { counter-increment:i; display:flex; gap:28px; align-items:baseline; font-size:38px; font-weight:500; line-height:1.25; }
li::before { content:counter(i, decimal-leading-zero); font-size:26px; letter-spacing:.08em; color:var(--accent); min-width:44px; }
li span { display:block; margin-top:8px; font-size:30px; font-weight:400; color:var(--muted); }
.cta { font-size:34px; font-weight:500; color:var(--ink); }
.bottom { height:180px; display:flex; align-items:center; justify-content:space-between; }
.logo { font-family:Urbanist, sans-serif; font-size:40px; letter-spacing:-.02em; }
.logo i { width:9px; height:9px; border-radius:50%; background:var(--accent); margin:0 3px 0 4px; display:inline-block; }
`;

const page = (h, cls, top, main) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
<body class="${cls}" style="height:${h}px">
<div class="guides"></div><div class="rule" style="top:200px"></div><div class="rule" style="bottom:180px"></div>
<div class="wrap">
  <div class="top">${top}</div>
  <div class="main">${main}</div>
  <div class="bottom"><span class="logo">Anthony<i></i>Profit</span><span class="site">anthonyprofit.com</span></div>
</div></body></html>`;

const pad = (n) => String(n).padStart(2, "0");
const shots = [];
const c = spec.card;
shots.push({
  file: "card.jpg",
  h: 1080,
  html: page(1080, "", `<span class="label">${esc(c.kicker)}</span>`,
    `<h1>${rich(c.title)}</h1>${c.subtitle ? `<p>${esc(c.subtitle)}</p>` : ""}`),
});
slides.forEach((s, i) => {
  const top = `<span class="label">${esc(s.eyebrow)}</span><span class="count">${pad(i + 1)} / ${pad(slides.length)}</span>`;
  const size = s.type === "cover" ? "big" : s.type === "list" ? "small" : "";
  let main = `<h1 class="${size}">${rich(s.title)}</h1>`;
  if (s.type === "list") main += `<ol>${s.items.map((it) => `<li><div>${esc(it.t)}${it.sub ? `<span>${esc(it.sub)}</span>` : ""}</div></li>`).join("")}</ol>`;
  else if (s.body) main += `<p>${esc(s.body)}</p>`;
  if (s.type === "cta" && s.cta) main += `<div class="cta">${esc(s.cta)}</div>`;
  shots.push({ file: `slide-${pad(i + 1)}.jpg`, h: 1350, html: page(1350, s.type === "cta" ? "blue" : "", top, main) });
});

const browser = await chromium.launch();
const overflowing = [];
for (const s of shots) {
  const p = await browser.newPage({ viewport: { width: 1080, height: s.h } });
  await p.setContent(s.html, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  if (await p.evaluate(() => { const m = document.querySelector(".main"); return m.scrollHeight > m.clientHeight; }))
    overflowing.push(s.file);
  await p.screenshot({ path: join(outDir, s.file), type: "jpeg", quality: 92 });
  await p.close();
}
await browser.close();

writeFileSync(
  join(outDir, "post.txt"),
  [
    "LÉGENDE DU CARROUSEL", "", spec.caption.trim(), "", spec.hashtags.join(" "), "",
    "STORIES", "", ...spec.stories.map((t, i) => `${i + 1}. ${t}`), "",
    "REEL (face caméra, 30 à 45 s)", "", spec.reel.trim(), "",
  ].join("\n"),
);
if (overflowing.length) {
  console.error(`Le texte déborde sur : ${overflowing.join(", ")}. Raccourcis et relance.`);
  process.exit(2);
}
console.log(`OK ${shots.length} images + post.txt dans ${outDir}`);
