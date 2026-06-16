// Blog content collection — bilingual MDX posts.
//
// Each post lives under src/content/blog/<lang>/<file>.mdx and declares its own
// `lang` + `slug` (so URLs stay clean and locale-correct) plus a
// `translationKey` shared by the FR and EN versions of the SAME article — that
// is what powers the hreflang pair + the language switcher on a post (see
// src/lib/blog.ts → getTranslation).
//
// Frontmatter is the single source of SEO truth for a post: `title` is the H1,
// `metaTitle` overrides the <title> tag (kept short), `description` feeds the
// meta description + OG, and `keywords` are surfaced in the BlogPosting schema.
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    // ── Identity / routing ─────────────────────────────────────────────
    lang: z.enum(["fr", "en"]),
    /** Clean URL slug, e.g. "seo-geo-apparaitre-dans-chatgpt". */
    slug: z.string(),
    /** Shared by the FR + EN versions of one article (hreflang pairing). */
    translationKey: z.string(),

    // ── On-page + SEO ──────────────────────────────────────────────────
    /** The H1 of the article. */
    title: z.string(),
    /** Short <title> override. Falls back to `title` when omitted. */
    metaTitle: z.string().optional(),
    /** Meta description + OG/Twitter description (~150 chars ideal). */
    description: z.string(),
    keywords: z.array(z.string()).default([]),

    // ── Taxonomy ───────────────────────────────────────────────────────
    /** Display tags; also generate /blog/tag/<slug>/ archive pages. */
    tags: z.array(z.string()).default([]),

    // ── Dates / authorship ─────────────────────────────────────────────
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default("Anthony Profit"),

    // ── Media (optional) ───────────────────────────────────────────────
    /** Social/share + schema image (absolute path under /public or a URL).
        Falls back to the site OG image when absent. */
    cover: z.string().optional(),
    coverAlt: z.string().optional(),

    // ── Publishing ─────────────────────────────────────────────────────
    /** Drafts are excluded from production builds + listings. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
