import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync, readdirSync } from "node:fs";

// Sitemap <lastmod> — real dates only (a wrong lastmod is worse than none):
// blog posts from their frontmatter (updatedDate ?? pubDate), blog hubs from
// their newest post, and pages from PAGE_LASTMOD, a hand-kept list of
// deliberate editorial changes. Bump an entry when you really edit a page.
const PAGE_LASTMOD = {
  "/": "2026-10-21",
  "/en/": "2026-10-21",
  "/services/": "2026-10-19",
  "/en/services/": "2026-10-19",
  "/creation-site-internet/": "2026-10-21",
  "/en/web-development/": "2026-10-21",
  "/seo-geo/": "2026-10-21",
  "/en/seo-geo/": "2026-10-21",
  "/identite-de-marque/": "2026-10-21",
  "/en/brand-design/": "2026-10-21",
  "/outils-applications-ia/": "2026-10-21",
  "/en/apps-ai-tools/": "2026-10-21",
  "/a-propos/": "2026-10-19",
  "/en/about/": "2026-10-19",
};
const frontmatter = (src, key) =>
  src.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)`, "m"))?.[1].trim();
const LASTMOD = new Map(Object.entries(PAGE_LASTMOD));
for (const lang of ["fr", "en"]) {
  const dir = new URL(`./src/content/blog/${lang}/`, import.meta.url);
  const base = lang === "fr" ? "/blog/" : "/en/blog/";
  for (const file of readdirSync(dir)) {
    const src = readFileSync(new URL(file, dir), "utf8");
    if (frontmatter(src, "draft") === "true") continue;
    const date = new Date(frontmatter(src, "updatedDate") ?? frontmatter(src, "pubDate"))
      .toISOString()
      .slice(0, 10);
    LASTMOD.set(`${base}${frontmatter(src, "slug")}/`, date);
    if (!(LASTMOD.get(base) > date)) LASTMOD.set(base, date);
  }
}

export default defineConfig({
  site: "https://anthonyprofit.com",
  i18n: {
    defaultLocale: "fr",
    locales: ["fr", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    // MDX powers the blog (src/content/blog/**). MDX files can import .astro
    // components (e.g. <ServiceCTA/>).
    mdx(),
    sitemap({
      // Keep error pages out of the sitemap — the EN /404/ is a routable page
      // that returns 200, so @astrojs/sitemap would otherwise list it. Blog
      // tag archives are excluded too: they stay `noindex` until they list
      // TAG_INDEX_MIN posts (src/lib/blog.ts), and even then they mostly repeat
      // the blog index — internal links handle their discovery instead.
      filter: (page) =>
        !/\/404\/?$/.test(page) && !/\/blog\/tag\//.test(page) && !/\/platine\/?$/.test(page),
      serialize(item) {
        const date = LASTMOD.get(new URL(item.url).pathname);
        if (date) item.lastmod = date;
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
