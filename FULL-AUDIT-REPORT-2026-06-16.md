# Full SEO Audit — anthonyprofit.com

**Date:** 2026-06-16 · **Audit type:** live-site (production) · **Method:** direct crawl/fetch + specialist sub-agents (Technical, Content, Performance, Schema, GEO)
**Business type detected:** Solo **Professional Service / Local Service** — freelance web development + SEO/GEO + brand design, based in **Nice / Côte d'Azur (FR)**, serving local + national + international clients. Bilingual (FR/EN). Portfolio + lead-gen + a just-launched bilingual blog. *Not* e-commerce.

---

## Executive Summary

### 🎯 SEO Health Score: **76 / 100** — *Good, with one critical AI-visibility blocker*

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 22% | 85 | 18.7 |
| Content Quality | 23% | 80 | 18.4 |
| On-Page SEO | 20% | 88 | 17.6 |
| Schema / Structured Data | 10% | 68 | 6.8 |
| Performance (CWV) | 10% | 72 | 7.2 |
| AI Search Readiness | 10% | 40 | 4.0 |
| Images | 5% | 70 | 3.5 |
| **TOTAL** | **100%** | | **≈ 76** |

The site is **technically excellent for classic SEO** (clean architecture, correct canonicals/hreflang, strong security, fast money pages) and on-page discipline is high. The score is pulled down by **one critical issue** — Cloudflare is blocking AI crawlers — plus schema refinements, homepage performance, and a young blog. *(Up from 70/100 on 2026-06-11: shared titles/descriptions and hreflang-404s are now fixed; the blog and its cluster are new.)*

### 🚨 Top 5 issues
1. **[CRITICAL] Cloudflare blocks all major AI crawlers** — GPTBot, OAI-SearchBot, ClaudeBot and PerplexityBot all return **HTTP 403** (verified). Googlebot/Bingbot/real browsers get 200. A UA-based Cloudflare rule ("Block AI bots" / Bot Fight Mode) is **overriding `robots.txt`**. The site that *sells GEO* is invisible to ChatGPT, Claude and Perplexity crawlers. *(Recurs per memory note of 2026-06-11.)*
2. **[HIGH] Homepage mobile Core Web Vitals** — `hero-image.jpeg` (~810 KB, unoptimized JPEG) is a likely LCP element, and the home ships ~527 KB of JS (incl. a React hydration runtime). Estimated mobile perf ~45–55. *(Money pages are fine — see below.)*
3. **[HIGH] `llms.txt` omits the most citable pages** — the 2 blog posts and the 3 service detail pages are absent from `/llms.txt`.
4. **[HIGH] BlogPosting schema** — `image` falls back to the generic `/og.png` on every post, and `publisher` (a Person `@id`) lacks an Organization/logo → Article rich results likely suppressed.
5. **[HIGH] Entity graph gaps** — homepage has no `WebPage` node, service pages' `Service.provider` is an inline blank node (not `@id` → `#person`), and `ProfessionalService` NAP lacks `postalCode`; `areaServed` is "France" (not city-level for Nice).

### ⚡ Top 5 quick wins
1. **Unblock AI crawlers in Cloudflare** (~10 min, highest impact) — Security → Bots → disable "Block AI bots"/Bot Fight Mode, or add a WAF **Skip** rule for GPTBot/OAI-SearchBot/ClaudeBot/PerplexityBot. Prefer a permanent WAF rule (toggles tend to re-enable).
2. **Add Blog + Services sections to `llms.txt`** (~15 min).
3. **Convert `hero-image.jpeg` → WebP ≤150 KB + `fetchpriority="high"` preload** (~30 min) — biggest mobile LCP win.
4. **Scope the hero-image preload to the homepage only** (~5 min) — every inner page currently preloads `slide-01.webp` (55 KB wasted).
5. **One JSON-LD pass** (~30 min): `postalCode`, city-level `areaServed`, `alternateName: "Kulturecom"`, `Service.provider` → `{"@id":"…#person"}`, add homepage `WebPage` + `SearchAction`.

---

## 1. Technical SEO — 85/100

**Strong, classic-SEO foundation.** Verified live:

- ✅ `robots.txt` clean (`Allow: /`, AI bots explicitly allowed, sitemap referenced).
- ✅ Sitemap index → `sitemap-0.xml` with **36 indexable URLs**; thin tag archives + EN `/404` correctly excluded.
- ✅ **Canonicals** correct and self-referential; **hreflang** is 3-way (self / alt-lang / `x-default`→home) and **reciprocal** (verified FR `creation-site-internet` ↔ EN `web-development`).
- ✅ **HTTP→HTTPS 301** and **www→non-www 301**; single canonical host.
- ✅ Proper **404s** (real 404 status, no soft-404).
- ✅ **Security headers**: HSTS (2y, `includeSubDomains; preload`), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo/FLoC off).
- ✅ Primary content is in **static SSR HTML** (Astro) — Googlebot/Bingbot don't need JS to read it.
- ✅ Thin blog tag archives correctly `noindex` and excluded from the sitemap.

**Findings**
- **[Critical]** Cloudflare 403 on AI crawler UAs (see §7 — counted under AI Readiness, but it is also a firewall/crawlability defect).
- **[Low]** No **Content-Security-Policy** header. Add a baseline CSP (the rest of the security stack is excellent).
- **[Low]** Homepage has **multiple `<h1>`** (responsive mobile/desktop duplicates of the hero heading "Des sites conçus pour séduire. Optimisés pour être trouvé."). Harmless for Google but ideally one semantic H1.
- **[Low]** HTML responses are `CF-Cache-Status: DYNAMIC` (not edge-cached) with `Cache-Control: max-age=0`. For a fully static site, add `Cache-Control: public, max-age=300, stale-while-revalidate=86400` on the `/*` HTML rule in `_headers` to cut origin round-trips.

## 2. Content Quality & E-E-A-T — 80/100

**Strong, credible, with a nascent blog.**

- ✅ **Experience**: five real case studies (Surly, Eden Rock, Sun Beach House, Royal Yacht International, Vaulk) — concrete proof, not stock claims.
- ✅ **Expertise/Authoritativeness**: clear author identity (Anthony Profit), `sameAs` LinkedIn/Instagram/Behance, service pages with method + FAQ, 2 well-structured GEO/local blog articles.
- ✅ **Trust**: legal pages (mentions légales, confidentialité), contact with NAP + WhatsApp + response SLA, availability stated.
- ✅ Bilingual parity (FR/EN), handled via hreflang (not duplication).

**Findings**
- **[Medium]** Blog is **young (2 posts)** — content volume/topical authority is still thin. Sustain a cadence (the existing cluster plan + `redacteur-blog-seo` agent supports this).
- **[Medium]** **Entity ambiguity** "Anthony Profit" vs "Kulturecom" (the contact email is `@kulturecom.fr`). State the DBA relationship on the About page and in schema (`alternateName`).
- **[Medium]** **Homepage passage density** is thin/animated (word-by-word spans) → weak as an AI-citation source. Acceptable (it's the editorial page); rely on blog + service pages for citation.
- **[Low]** Articles would benefit from a visible **author bio block** (name, role, Nice, link) reinforcing E-E-A-T at the bottom of each post.

## 3. On-Page SEO — 88/100

**Disciplined and consistent** (centralized in `src/i18n/routes.ts`).

- ✅ **Unique title + meta description per route**; lengths in range (home title ~58c, desc ~155c).
- ✅ Correct canonical + reciprocal hreflang on every page.
- ✅ **Single H1** on inner pages (verified on blog post); descriptive, keyword-bearing.
- ✅ **Slugs** clean, localized, keyword-rich (`/creation-site-internet/`, `/blog/referencement-nice-dominer-google-et-ia/`).
- ✅ **Internal linking**: nav + footer + service cross-links + blog→service `ServiceCTA` + breadcrumbs + related posts.

**Findings**
- **[Low]** Multiple H1 on the homepage (responsive duplicates — see §1).
- **[Low]** Consider tightening a couple of service `<title>`s toward primary local keywords ("…à Nice").

## 4. Schema / Structured Data — 68/100

Consistent `@graph` architecture, valid JSON everywhere, good `@id` cross-referencing and ISO dates. Held back by:

- **[High]** **BlogPosting `image`** = generic `/og.png` on all posts → Article rich result likely suppressed (Google wants a representative per-article image, ≥1200×630).
- **[High]** **BlogPosting `publisher`** is a Person `@id` with no Organization/logo → non-conforming for Article rich results. Add an Organization node (or inline `image`/`logo` on the publisher).
- **[High]** **Homepage emits no `WebPage` node** (every other template does). Add `WebPage` (+ `SearchAction` on `#website` for sitelinks searchbox).
- **[Medium]** Service pages' **`Service.provider` is an inline blank node**, not `{"@id":"…#person"}` → breaks the entity-graph join LLMs/Knowledge Panel rely on.
- **[Medium]** **`ProfessionalService.sameAs`** only contains the Google Maps CID (duplicates `hasMap`); add LinkedIn/Behance. **`PostalAddress`** missing `postalCode` (e.g. 06000). **`areaServed`** is Country=France; use city-level (Nice/Côte d'Azur). **`Person.image`** uses `/og.png`, not a real headshot.
- **[Medium]** FAQPage on commercial pages **won't** produce Google FAQ rich results (Aug-2023 restriction) — keep them anyway (strong for AI citation).
- **[Low]** `CreativeWork` case studies lack `dateCreated`; `keywords` misused for tech-stack strings. Blog-index `blogPost` stubs lack `author`/`image`.

## 5. Performance / Core Web Vitals — 72/100

> ⚠️ PageSpeed Insights keyless quota was exhausted during the audit — **page scores below are lab estimates**; TTFB is measured. Validate field data in CrUX / Search Console.

| Page | Device | Est. score | LCP | INP risk | CLS | TTFB (measured) |
|---|---|---|---|---|---|---|
| Home (heavy) | Mobile | ~45–55 | ~3.5–5s | High | Low | 80 ms |
| Home | Desktop | ~65–75 | ~1.8–2.5s | Med | Low | — |
| Blog (light) | Mobile | ~85–92 | ~1.2–1.8s | Low | Low | 74 ms |
| Blog | Desktop | ~92–96 | ~0.8–1.2s | Low | Low | — |

**The architecture is right** — the SEO money pages (blog/service) are light (~3 KB JS) and fast; only the cinematic homepage is heavy.

**Findings**
- **[High]** `hero-image.jpeg` ≈ **810 KB** unoptimized JPEG, not preloaded as LCP → poor mobile LCP. Convert to WebP/AVIF ≤150 KB, `fetchpriority="high"`.
- **[High]** Home ships **~527 KB JS** (incl. a React hydration runtime `client.*.js` ~181 KB + ServicesTrail). Audit hydration directives (`client:load`→`client:visible`) to cut TBT/INP.
- **[Medium]** `eden-rock.webp` ≈ 475 KB; lazy-load non-LCP carousel slides.
- **[High]** Google Fonts loaded via render-blocking stylesheet (5 families); only Archivo Black preloaded → FOUT. Self-host woff2 + preload above-fold fonts (helps blog LCP most).
- **[Medium]** Every page preloads `slide-01.webp` (55 KB) even where unused — scope to homepage.
- **[Low]** Preloader runs on light inner pages too; consider skipping it off-home.

## 6. Images — 70/100

- ✅ **Alt text**: 0 missing on home + blog post sampled (good).
- ✅ WebP used for most assets.
- **[High]** Oversized hero assets (810 KB JPEG, 475 KB WebP) — see §5.
- **[Low]** Some images (portrait, about) lack explicit `width`/`height` → CLS risk; add dimensions + `loading="lazy"` below the fold.

## 7. AI Search Readiness (GEO) — 40/100

**High potential, capped by the crawler block.** The site is genuinely well-built for GEO (llms.txt, schema entities, FAQ, citable blog passages) — but most AI engines can't fetch it.

**Verified crawler access (live):**

| Crawler | robots.txt | Actual (Cloudflare) |
|---|---|---|
| GPTBot (OpenAI train/crawl) | Allow | **403 ❌** |
| OAI-SearchBot (ChatGPT search) | Allow | **403 ❌** |
| ClaudeBot (Anthropic) | Allow | **403 ❌** |
| PerplexityBot | Allow | **403 ❌** |
| Googlebot | Allow | 200 ✅ |
| Bingbot (→ Copilot) | Allow | 200 ✅ |

**Findings**
- **[Critical]** Cloudflare WAF/Bot-Fight blocks the AI crawlers (see Executive Summary). Until fixed, ChatGPT/Claude/Perplexity cannot index the site; only Google AIO / Bing Copilot (via Googlebot/Bingbot) have a path.
- **[High]** `llms.txt` is otherwise good (bilingual, services, cases, NAP) but **omits the 2 blog posts and the 3 service detail pages** — the most citable URLs. Add `## Blog` and `## Services` sections; add a date/version stamp.
- **[High]** Entity authority thin: add **YouTube** (high AI-citation correlation), a **Malt** profile (heavily indexed for FR freelancers), and resolve the Anthony Profit/Kulturecom split.
- **[Medium]** BlogPosting lacks `wordCount`/`articleBody`; service hub `/services/` has no FAQ; rewrite single-word H3s ("Performance") as question/declarative headings for citability.

---

## Methodology & Caveats
- Audited the **live production site** (what crawlers see), not the local build.
- Specialist sub-agents ran for Performance, Schema, and GEO; **Technical and Content were synthesized in-house** (two sub-agents hit an environment limit mid-run) from direct live checks + source knowledge.
- **Performance page scores are lab estimates** (PSI keyless quota exhausted); TTFB and asset/JS weights are measured. Confirm field CWV in Search Console / CrUX.
- The Cloudflare AI-crawler block and all crawlability/hreflang/redirect/header facts were **directly verified** via live requests.
