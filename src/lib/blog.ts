// Blog data helpers — one place for every query the blog routes need, so the
// .astro pages stay declarative. Mirrors the lib/ pattern used by
// case-studies.ts / services-data.ts.
import { getCollection, type CollectionEntry } from "astro:content";
import type { Lang } from "~/i18n/ui";

export type Post = CollectionEntry<"blog">;

/** Drafts are visible while developing, hidden from production builds. */
const SHOW_DRAFTS = !import.meta.env.PROD;

/** A tag archive page is left `noindex` until it lists at least this many
 *  posts — stops thin, near-empty cluster pages from bloating the index while
 *  the blog is young. The links still work; only indexability is gated. */
export const TAG_INDEX_MIN = 2;

const publishable = (p: Post): boolean => SHOW_DRAFTS || p.data.draft !== true;

/** All publishable posts for a locale, newest first. */
export async function getPosts(lang: Lang): Promise<Post[]> {
  const all = await getCollection("blog");
  return all
    .filter((p) => p.data.lang === lang && publishable(p))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/** Canonical path for a post, e.g. /blog/<slug>/ or /en/blog/<slug>/. */
export function postPath(post: Post): string {
  return post.data.lang === "fr"
    ? `/blog/${post.data.slug}/`
    : `/en/blog/${post.data.slug}/`;
}

/** The same article in the OTHER language (matched by translationKey), if it
 *  exists and is publishable. Drives the hreflang pair + language switcher. */
export async function getTranslation(post: Post): Promise<Post | undefined> {
  const all = await getCollection("blog");
  return all.find(
    (p) =>
      p.data.translationKey === post.data.translationKey &&
      p.data.lang !== post.data.lang &&
      publishable(p)
  );
}

/** Accent- and case-insensitive tag → URL slug (e.g. "Développement web" →
 *  "developpement-web"). */
export function slugifyTag(tag: string): string {
  return tag
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface TagInfo {
  name: string;
  slug: string;
  count: number;
}

/** Distinct tags for a locale with their post counts, busiest first. */
export async function getTags(lang: Lang): Promise<TagInfo[]> {
  const posts = await getPosts(lang);
  const map = new Map<string, TagInfo>();
  for (const p of posts) {
    for (const name of p.data.tags) {
      const slug = slugifyTag(name);
      const existing = map.get(slug);
      if (existing) existing.count++;
      else map.set(slug, { name, slug, count: 1 });
    }
  }
  return [...map.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
}

/** Publishable posts for a locale that carry the given tag slug. */
export async function getPostsByTag(
  lang: Lang,
  tagSlug: string
): Promise<Post[]> {
  const posts = await getPosts(lang);
  return posts.filter((p) =>
    p.data.tags.some((t) => slugifyTag(t) === tagSlug)
  );
}

export function tagPath(lang: Lang, tagSlug: string): string {
  return lang === "fr"
    ? `/blog/tag/${tagSlug}/`
    : `/en/blog/tag/${tagSlug}/`;
}

/** Up to `limit` other posts sharing at least one tag, newest first. */
export async function getRelatedPosts(
  post: Post,
  limit = 3
): Promise<Post[]> {
  const posts = await getPosts(post.data.lang);
  const tags = new Set(post.data.tags.map(slugifyTag));
  return posts
    .filter((p) => p.id !== post.id)
    .filter((p) => p.data.tags.some((t) => tags.has(slugifyTag(t))))
    .slice(0, limit);
}

/** Reading time in minutes from the raw body (~200 wpm), floored at 1. */
export function readingMinutes(body: string | undefined): number {
  const words = (body ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Localised long date, e.g. "16 juin 2026" / "June 16, 2026". */
export function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
