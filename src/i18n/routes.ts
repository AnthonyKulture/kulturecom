// Per-route SEO metadata, keyed by the page's OWN pathname.
//
// Single source of truth for two things that previously lived nowhere and so
// drifted into bugs:
//   1. Unique <title> + meta description per page (every page used to inherit
//      the site-wide homepage title/description).
//   2. The hreflang counterpart URL (`alt`). The old default just swapped the
//      `/en` prefix, which produced 404s for localized slugs — e.g.
//      `/a-propos/` → `/en/a-propos/` instead of `/en/about/`.
//
// `BaseLayout` looks a route up by `pathname`; anything not listed here (e.g.
// the 404 pages) falls back to the site-wide i18n defaults.

import type { Lang } from "./ui";

export interface RouteMeta {
  /** Counterpart-locale path — powers hreflang + the language switcher. */
  alt: string;
  /** Unique <title> for this page (also OG/Twitter title). */
  title: string;
  /** Unique meta description (also OG/Twitter description). */
  description: string;
  /** Short label for the breadcrumb trail. Omitted on the homepage. */
  crumb?: string;
  /** schema.org WebPage subtype emitted for this route. */
  pageType?: "AboutPage" | "ContactPage" | "CollectionPage" | "WebPage";
  /** Locale of the page (used for schema inLanguage / breadcrumb home label). */
  lang: Lang;
}

const SITE = "Anthony Profit";

export const routes: Record<string, RouteMeta> = {
  // ---- FR ----
  "/": {
    lang: "fr",
    alt: "/en/",
    title: `${SITE} — Freelance développeur web, SEO & brand design`,
    description:
      "Freelance développeur web, stratégie SEO et brand design. Sites sur-mesure pour PME, B2B et marques créatives. 8 ans d'expérience. Disponible Q4 2026.",
  },
  "/a-propos/": {
    lang: "fr",
    alt: "/en/about/",
    crumb: "À propos",
    pageType: "AboutPage",
    title: `À propos — Anthony Profit, freelance web & SEO depuis 2018`,
    description:
      "Designer et développeur freelance sur la Côte d'Azur. Mon parcours, ma méthode design → code → SEO, et mes engagements pour des sites qui durent et se font trouver.",
  },
  "/projets/": {
    lang: "fr",
    alt: "/en/work/",
    crumb: "Projets",
    pageType: "CollectionPage",
    title: `Projets — études de cas web, design & SEO | Anthony Profit`,
    description:
      "Sélection de projets : Surly, Vaulk, Sun Beach House, Royal Yacht International, Eden Rock. Identité, développement sur-mesure et SEO/GEO. Des preuves, pas des promesses.",
  },
  "/contact/": {
    lang: "fr",
    alt: "/en/contact/",
    crumb: "Contact",
    pageType: "ContactPage",
    title: `Contact — discutons de votre projet web | Anthony Profit`,
    description:
      "Un projet de site sur-mesure, une refonte ou du SEO ? Écrivez-moi à contact@kulturecom.fr ou sur WhatsApp. Réponse sous 48 h ouvrées.",
  },
  "/mentions-legales/": {
    lang: "fr",
    alt: "/en/legal-notice/",
    crumb: "Mentions légales",
    pageType: "WebPage",
    title: `Mentions légales | Anthony Profit`,
    description:
      "Mentions légales du site anthonyprofit.com — éditeur, hébergement, propriété intellectuelle et responsabilité.",
  },
  "/confidentialite/": {
    lang: "fr",
    alt: "/en/privacy/",
    crumb: "Confidentialité",
    pageType: "WebPage",
    title: `Politique de confidentialité | Anthony Profit`,
    description:
      "Politique de confidentialité d'anthonyprofit.com — données collectées, finalités, base légale, durée de conservation et vos droits (RGPD).",
  },

  // ---- EN ----
  "/en/": {
    lang: "en",
    alt: "/",
    title: `${SITE} — Freelance web developer, SEO & brand design`,
    description:
      "Freelance web developer, SEO strategy and brand design. Custom websites for SMBs, B2B and creative brands. 8 years of experience. Available Q4 2026.",
  },
  "/en/about/": {
    lang: "en",
    alt: "/a-propos/",
    crumb: "About",
    pageType: "AboutPage",
    title: `About — Anthony Profit, freelance web & SEO since 2018`,
    description:
      "Freelance designer & developer on the French Riviera. My background, my design → code → SEO method, and how I build sites that last and get found.",
  },
  "/en/work/": {
    lang: "en",
    alt: "/projets/",
    crumb: "Work",
    pageType: "CollectionPage",
    title: `Work — web, design & SEO case studies | Anthony Profit`,
    description:
      "Selected projects: Surly, Vaulk, Sun Beach House, Royal Yacht International, Eden Rock. Identity, custom development and SEO/GEO. Proof, not promises.",
  },
  "/en/contact/": {
    lang: "en",
    alt: "/contact/",
    crumb: "Contact",
    pageType: "ContactPage",
    title: `Contact — let's talk about your web project | Anthony Profit`,
    description:
      "A custom website, a redesign or SEO work? Email contact@kulturecom.fr or reach me on WhatsApp. Reply within 48 business hours.",
  },
  "/en/legal-notice/": {
    lang: "en",
    alt: "/mentions-legales/",
    crumb: "Legal notice",
    pageType: "WebPage",
    title: `Legal notice | Anthony Profit`,
    description:
      "Legal notice for anthonyprofit.com — publisher, hosting, intellectual property and liability.",
  },
  "/en/privacy/": {
    lang: "en",
    alt: "/confidentialite/",
    crumb: "Privacy policy",
    pageType: "WebPage",
    title: `Privacy policy | Anthony Profit`,
    description:
      "Privacy policy for anthonyprofit.com — data collected, purposes, legal basis, retention and your rights (GDPR).",
  },
};

export const getRoute = (pathname: string): RouteMeta | undefined =>
  routes[pathname];
