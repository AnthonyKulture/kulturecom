import type { Lang } from "~/i18n/ui";
import { ui } from "~/i18n/ui";

type Translations = (typeof ui)[Lang];

export interface ProjectEntry {
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
 * Single source of truth for the project list, shared by the desktop
 * (Projects.astro) and mobile (ProjectsMobile.astro) layouts so the data can
 * never drift between the two.
 *
 * Display order: Surly → Eden Rock → Sun Beach House → Royal Yacht → Vaulk.
 * The i18n keys (project1..project5) stay tied to the project ENTITY; the `num`
 * label reflects the on-page POSITION.
 */
export function getProjects(t: Translations): ProjectEntry[] {
  return [
    {
      title: t.projects["project1.title"],
      client: t.projects["project1.client"],
      tag: t.projects["project1.tag"],
      problem: t.projects["project1.problem"],
      summary: t.projects["project1.summary"],
      metric: t.projects["project1.metric"],
      image: "/hero-slides/surly-superman.webp",
      num: "01",
    },
    {
      title: t.projects["project5.title"],
      client: t.projects["project5.client"],
      tag: t.projects["project5.tag"],
      problem: t.projects["project5.problem"],
      summary: t.projects["project5.summary"],
      metric: t.projects["project5.metric"],
      image: "/hero-slides/eden-rock.webp",
      num: "02",
    },
    {
      title: t.projects["project3.title"],
      client: t.projects["project3.client"],
      tag: t.projects["project3.tag"],
      problem: t.projects["project3.problem"],
      summary: t.projects["project3.summary"],
      metric: t.projects["project3.metric"],
      image: "/hero-slides/sunbeachhouse.webp",
      num: "03",
    },
    {
      title: t.projects["project4.title"],
      client: t.projects["project4.client"],
      tag: t.projects["project4.tag"],
      problem: t.projects["project4.problem"],
      summary: t.projects["project4.summary"],
      metric: t.projects["project4.metric"],
      image: "/hero-slides/royal-yacht.avif",
      num: "04",
    },
    {
      title: t.projects["project2.title"],
      client: t.projects["project2.client"],
      tag: t.projects["project2.tag"],
      problem: t.projects["project2.problem"],
      summary: t.projects["project2.summary"],
      metric: t.projects["project2.metric"],
      image: "/hero-slides/vaulk.webp",
      video:
        "https://fabulous-event-3b100f58f8.media.strapiapp.com/header_desktop_video_v2_59a6bf4363.webm",
      num: "05",
    },
  ];
}
