# SEO Action Plan — anthonyprofit.com

**Generated:** 2026-06-16 · **Health Score:** 76/100 · Supersedes the 2026-06-11 plan (its items — per-page titles/descriptions, hreflang fixes, 404 hygiene, OG PNG, breadcrumb/WebPage schema — are **verified done**).

Priority key — **Critical**: blocks (AI) indexing, fix now · **High**: significant ranking/visibility impact, ≤1 week · **Medium**: optimization, ≤1 month · **Low**: backlog.
Owner key — 🟦 **Cloudflare dashboard** (you — I can't touch it) · 🟩 **In code** (I can implement on request).

---

## 🔴 CRITICAL

### C1 · Unblock the AI crawlers in Cloudflare 🟦
**Problem:** GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot all get **HTTP 403** (verified). A Cloudflare UA rule overrides `robots.txt`. ChatGPT/Claude/Perplexity cannot see the site at all.
**Fix:** Cloudflare dashboard → **Security → Bots** → turn **OFF** "Block AI bots" / Bot Fight Mode for this zone. *Better*, add a **WAF custom rule** (Skip → all remaining rules) so it can't silently re-enable:
`(http.user_agent contains "GPTBot") or (http.user_agent contains "OAI-SearchBot") or (http.user_agent contains "ClaudeBot") or (http.user_agent contains "PerplexityBot") or (http.user_agent contains "Google-Extended")`
**Verify:** re-run `curl -A GPTBot https://anthonyprofit.com/` → expect 200.
**Effort:** ~10 min · **Impact:** Very high (this is the whole GEO value prop). *Recurs — see memory note 2026-06-11.*

---

## 🟠 HIGH

### H1 · Add Blog + Services to `llms.txt` 🟩
The 2 blog posts + 3 service detail pages (the most citable URLs) are missing. Add `## Blog` and `## Services` sections with URL + one-line description each; add a date/version stamp. **~15 min.**

### H2 · BlogPosting schema → real per-article image + valid publisher 🟩
`image` falls back to generic `/og.png`; `publisher` is a Person `@id` with no logo → Article rich results suppressed. Add a `cover`-driven `ImageObject` (the `cover` field already exists in the content schema — wire it to `og:image` + BlogPosting `image`), and give `publisher` an Organization (or inline `image`/`logo`). **~1–2 h** (pairs with the cover-image work already discussed).

### H3 · Homepage performance (mobile CWV) 🟩
`hero-image.jpeg` (~810 KB) → convert to WebP/AVIF ≤150 KB + `<link rel="preload" fetchpriority="high">`. Audit the home's ~527 KB JS / React hydration (`client:load` → `client:visible` where possible). Lazy-load carousel slides 2+. **~half day.** Biggest LCP/INP win; money pages already pass.

### H4 · Self-host fonts + scope the hero preload 🟩
Self-host the 5 Google Font families (woff2 + `@font-face` `display:swap`), preload only above-fold faces; **stop preloading `slide-01.webp` on non-home pages** (one conditional in the layout). Helps blog/service LCP most. **~1–2 h** (preload scope alone is ~5 min).

### H5 · Homepage `WebPage` node + `SearchAction` 🟩
Homepage emits no `WebPage` node (every other route does). Add it + a `SearchAction` on `#website` (sitelinks searchbox). **~20 min.**

### H6 · Off-site entity authority 🟦/manual
Create a **Malt** profile (heavily indexed for FR freelancers) and a **YouTube** channel (high AI-citation correlation); add both to `Person.sameAs`. Resolve the **Anthony Profit ↔ Kulturecom** identity (state the DBA on About + `alternateName` in schema). **Ongoing.**

---

## 🟡 MEDIUM

### M1 · JSON-LD entity pass 🟩
One edit to the global graph + service pages: `PostalAddress.postalCode` (e.g. 06000); `areaServed` → city-level (Nice + Côte d'Azur) instead of Country=France; `ProfessionalService.sameAs` += LinkedIn/Behance + `alternateName: "Kulturecom"`; service pages' `Service.provider` → `{"@id":"…#person"}`; `Person.worksFor` → `#service`. **~30–45 min.** Strengthens local + entity-join signals.

### M2 · BlogPosting depth signals 🟩
Add `wordCount` (build-time) and a short `articleBody`/`description`; populate the blog-index `blogPost` stubs with `author`/`image`. **~30 min.**

### M3 · `/services/` hub citability 🟩
Add 3–4 FAQ entries (FAQPage) to the services hub and/or rewrite single-word blog H3s ("Performance") as question/declarative headings. **~30 min.**

### M4 · Real headshot for `Person.image` 🟩/manual
Replace `/og.png` with an actual portrait (`ImageObject` w/ dimensions). **~15 min once the photo exists.**

### M5 · Edge-cache HTML 🟩
In `_headers`, set `/*` HTML to `Cache-Control: public, max-age=300, stale-while-revalidate=86400` (currently `DYNAMIC`/`max-age=0`). **~10 min.**

---

## 🟢 LOW

- **L1 · CSP header** — add a baseline `Content-Security-Policy` in `_headers` (rest of the security stack is excellent). 🟩
- **L2 · Image dimensions** — add `width`/`height` (+ `loading="lazy"` below fold) to portrait/about images to remove CLS risk. 🟩
- **L3 · One semantic H1 on home** — consolidate the responsive mobile/desktop H1 duplicates. 🟩
- **L4 · Author bio block** on blog posts (name/role/Nice/link) for E-E-A-T. 🟩
- **L5 · CreativeWork dates** — add `dateCreated` to case studies; fix `keywords` to arrays. 🟩
- **L6 · Skip preloader off-home** for lighter inner-page FCP. 🟩

---

## Suggested sequence
1. **Today:** C1 (Cloudflare) + H1 (llms.txt) + H4 preload-scope + M1 (JSON-LD pass) — all fast, high leverage.
2. **This week:** H2 (BlogPosting image/publisher, with cover images) + H5 (WebPage/SearchAction) + H3 (home perf).
3. **This month:** H6 (Malt/YouTube/entity), M2–M5, Low items.

Most 🟩 in-code items can be batched into 1–2 commits. Say the word and I'll implement them (C1 and the 🟦 items are yours to do in the Cloudflare dashboard).
