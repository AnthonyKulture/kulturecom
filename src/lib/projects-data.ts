import type { Lang } from "~/i18n/ui";
import { ui } from "~/i18n/ui";
import { CASE_STUDIES } from "~/lib/case-studies";

type Translations = (typeof ui)[Lang];

export interface ProjectEntry {
  slug: string;
  title: string;
  client: string;
  tag: string;
  problem: string;
  summary: string;
  metric: string;
  image: string;
  num: string;
  video?: string;
}

/**
 * Grid entries (short fields) for the desktop (Projects.astro) and mobile
 * (ProjectsMobile.astro) layouts. Built from CASE_STUDIES — the single source
 * of truth for slug / asset / order — so the grid and the case-study detail
 * pages can never drift. `slug` lets each card link to its case study.
 *
 * Display order: Surly → Eden Rock → Sun Beach House → Royal Yacht → Vaulk.
 */
export function getProjects(t: Translations): ProjectEntry[] {
  const p = t.projects as Record<string, string>;
  return CASE_STUDIES.map((c) => ({
    slug: c.slug,
    title: p[`${c.key}.title`],
    client: p[`${c.key}.client`],
    tag: p[`${c.key}.tag`],
    problem: p[`${c.key}.problem`],
    summary: p[`${c.key}.summary`],
    metric: p[`${c.key}.metric`],
    image: c.image,
    num: c.num,
    video: c.video,
  }));
}
