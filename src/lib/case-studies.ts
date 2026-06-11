import type { Lang } from "~/i18n/ui";
import { ui } from "~/i18n/ui";

type Translations = (typeof ui)[Lang];

/**
 * Single source of truth for the case-study pages AND the project grid.
 *
 * Maps each on-page POSITION to its project ENTITY key (project1..project5 in
 * the i18n files), its hero asset, the canonical URL of the live client site,
 * and the display number. `projects-data.ts` builds the homepage/work grid from
 * this same list, so the slug ↔ asset ↔ order mapping can never drift between
 * the grid and the detail pages.
 *
 * Display order: Surly → Eden Rock → Sun Beach House → Royal Yacht → Vaulk.
 */
export interface CaseStudyMeta {
  /** URL slug — stable across locales (/projets/<slug>/ ↔ /en/work/<slug>/). */
  slug: string;
  /** i18n entity key (project1..project5) the deep fields are read from. */
  key: string;
  /** Hero image (also the video poster when `video` is set). */
  image: string;
  /** Optional hero video (Vaulk). */
  video?: string;
  /** Canonical https URL of the live client site — a real outbound entity link. */
  liveUrl: string;
  /** On-page position label. */
  num: string;
}

export const CASE_STUDIES: CaseStudyMeta[] = [
  {
    slug: "surly",
    key: "project1",
    image: "/hero-slides/surly-superman.webp",
    liveUrl: "https://surly.fr",
    num: "01",
  },
  {
    slug: "eden-rock-yacht-rental",
    key: "project5",
    image: "/hero-slides/eden-rock.webp",
    liveUrl: "https://edenrockyachtrental.com",
    num: "02",
  },
  {
    slug: "sun-beach-house",
    key: "project3",
    image: "/hero-slides/sunbeachhouse.webp",
    liveUrl: "https://sun-beach-house.com",
    num: "03",
  },
  {
    slug: "royal-yacht-international",
    key: "project4",
    image: "/hero-slides/royal-yacht.avif",
    liveUrl: "https://royalyachtinternational.com",
    num: "04",
  },
  {
    slug: "vaulk",
    key: "project2",
    image: "/hero-slides/vaulk.webp",
    video:
      "https://fabulous-event-3b100f58f8.media.strapiapp.com/header_desktop_video_v2_59a6bf4363.webm",
    liveUrl: "https://vaulk.com",
    num: "05",
  },
];

/** Locale-aware path to a case-study page. */
export const caseStudyPath = (slug: string, lang: Lang): string =>
  lang === "fr" ? `/projets/${slug}/` : `/en/work/${slug}/`;

export interface CaseStudySection {
  label: string;
  body: string;
}

export interface CaseStudy extends CaseStudyMeta {
  title: string;
  headline: string;
  subtitle: string;
  client: string;
  tag: string;
  metric: string;
  roleMeta: string;
  stack: string;
  sections: CaseStudySection[];
  /** Previous / next case in display order (for the bottom pager). */
  prev: CaseStudyMeta;
  next: CaseStudyMeta;
}

/**
 * Resolve a fully-populated case study (deep i18n fields + assets + pager) for a
 * given slug and locale. Returns null for an unknown slug.
 */
export function getCaseStudy(t: Translations, slug: string): CaseStudy | null {
  const index = CASE_STUDIES.findIndex((c) => c.slug === slug);
  if (index === -1) return null;
  const meta = CASE_STUDIES[index];
  // The i18n project dictionary is a flat string map; index it dynamically.
  const p = t.projects as Record<string, string>;
  const f = (suffix: string): string => p[`${meta.key}.${suffix}`];

  return {
    ...meta,
    title: f("title"),
    headline: f("headline"),
    subtitle: f("subtitle"),
    client: f("client"),
    tag: f("tag"),
    metric: f("metric"),
    roleMeta: f("role_meta"),
    stack: f("stack"),
    sections: [
      { label: f("context.label"), body: f("context") },
      { label: f("challenge.label"), body: f("challenge") },
      { label: f("role.label"), body: f("role") },
      { label: f("approach.label"), body: f("approach") },
      { label: f("result.label"), body: f("result") },
    ],
    prev: CASE_STUDIES[(index - 1 + CASE_STUDIES.length) % CASE_STUDIES.length],
    next: CASE_STUDIES[(index + 1) % CASE_STUDIES.length],
  };
}
