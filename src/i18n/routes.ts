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
import { DELAY, LOWEST_PRICE, STARTING_PRICE, formatPrice } from "~/lib/facts";
import type { ServiceId } from "~/lib/service-pages";

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
// Lowest entry price, quoted in the home descriptions.
const LOWEST_FR = formatPrice(LOWEST_PRICE, "fr");
const LOWEST_EN = formatPrice(LOWEST_PRICE, "en");
// Starting price of one service, for its meta description.
const fr = (id: ServiceId): string => formatPrice(STARTING_PRICE[id] ?? 0, "fr");
const en = (id: ServiceId): string => formatPrice(STARTING_PRICE[id] ?? 0, "en");

export const routes: Record<string, RouteMeta> = {
  // ---- FR ----
  "/": {
    lang: "fr",
    alt: "/en/",
    pageType: "WebPage",
    title: `Freelance web à Nice : sites, IA, SEO & GEO | ${SITE}`,
    description:
      `Designer-développeur freelance à Nice : sites sur-mesure, outils et IA, SEO & GEO. Votre site trouvé sur Google et recommandé par ChatGPT. Dès ${LOWEST_FR}.`,
  },
  "/a-propos/": {
    lang: "fr",
    alt: "/en/about/",
    crumb: "À propos",
    pageType: "AboutPage",
    title: `À propos de moi | Anthony Profit, freelance web à Nice`,
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

  // ---- FR · blog ----
  "/blog/": {
    lang: "fr",
    alt: "/en/blog/",
    crumb: "Guides",
    pageType: "WebPage",
    title: `Guides SEO & GEO : Nice, Cannes, Monaco | Anthony Profit`,
    description:
      "Guides concrets sur le référencement local, le GEO (ChatGPT, Perplexity, AI Overviews) et ChatGPT Ads, pour les entreprises de Nice, Cannes et Monaco.",
  },

  // ---- FR · services ----
  "/services/": {
    lang: "fr",
    alt: "/en/services/",
    crumb: "Services",
    pageType: "WebPage",
    title: `Services — web, apps & IA, SEO & brand | Anthony Profit`,
    description:
      "Quatre services, un seul interlocuteur à Nice : site sur-mesure, outils, apps & IA, SEO & GEO (dont ChatGPT Ads) et identité de marque.",
  },
  "/creation-site-internet/": {
    lang: "fr",
    alt: "/en/web-development/",
    crumb: "Création de site internet",
    title: `Création de site internet sur-mesure à Nice | Anthony Profit`,
    description:
      `Création de site internet sur-mesure à Nice : design, code Astro/React, rapide et bien référencé. Site une page dès ${fr("web")}, réponse sous 48 h.`,
  },
  "/seo-geo/": {
    lang: "fr",
    alt: "/en/seo-geo/",
    crumb: "SEO & GEO",
    title: `Consultant SEO, GEO & ChatGPT Ads à Nice | Anthony Profit`,
    description:
      `SEO et GEO à Nice : être trouvé sur Google et cité par ChatGPT. Stratégie, plan éditorial, contenus et veille. Audit de visibilité dès ${fr("seo")}, ChatGPT Ads.`,
  },
  "/identite-de-marque/": {
    lang: "fr",
    alt: "/en/brand-design/",
    crumb: "Identité de marque",
    title: `Identité visuelle & de marque à Nice | Anthony Profit`,
    description:
      `Identité visuelle à Nice : logo, charte, typographie et déclinaisons web, print et réseaux. Logo et mini-charte dès ${fr("brand")}, offerts avec votre site.`,
  },
  "/outils-applications-ia/": {
    lang: "fr",
    alt: "/en/apps-ai-tools/",
    crumb: "Outils, apps & IA",
    title: `Outils, applications & IA sur-mesure à Nice | Anthony Profit`,
    description:
      `Outils métier, apps web et mobiles, IA intégrée (Claude, OpenAI) et automatisations près de Nice. Premier outil dès ${fr("apps")}, livré en ${DELAY.appsStarter.fr}.`,
  },

  // ---- FR · études de cas ----
  "/projets/surly/": {
    lang: "fr",
    alt: "/en/work/surly/",
    crumb: "Surly",
    title: `Surly — marketplace banque & assurance | Étude de cas`,
    description:
      "Étude de cas Surly : marketplace banque & assurance co-fondée et développée sur React + Supabase. Architecture, full-stack et growth — 1 600 consultants, 8 entreprises clientes.",
  },
  "/projets/eden-rock-yacht-rental/": {
    lang: "fr",
    alt: "/en/work/eden-rock-yacht-rental/",
    crumb: "Eden Rock Yacht Rental",
    title: `Eden Rock Yacht Rental — identité & site | Étude de cas`,
    description:
      "Étude de cas Eden Rock Yacht Rental : étendre une marque hôtelière iconique de Saint-Barth au yachting. Identité, site WordPress et SEO pour une clientèle internationale.",
  },
  "/projets/sun-beach-house/": {
    lang: "fr",
    alt: "/en/work/sun-beach-house/",
    crumb: "Sun Beach House",
    title: `Sun Beach House — villas de luxe à Saint-Barth | Étude de cas`,
    description:
      "Étude de cas Sun Beach House : identité, site éditorial Next.js + Sanity et SEO/GEO pour une agence de villas de prestige à Saint-Barthélemy. Visible sur Google et dans les IA.",
  },
  "/projets/royal-yacht-international/": {
    lang: "fr",
    alt: "/en/work/royal-yacht-international/",
    crumb: "Royal Yacht International",
    title: `Royal Yacht International — courtier superyachts | Étude de cas`,
    description:
      "Étude de cas Royal Yacht International : refonte d'identité, site WordPress et SEO pour un courtier de superyachts à Monaco. Crédibilité et visibilité internationale.",
  },
  "/projets/vaulk/": {
    lang: "fr",
    alt: "/en/work/vaulk/",
    crumb: "Vaulk",
    title: `Vaulk — abris durcis NRBC | Étude de cas web & 3D`,
    description:
      "Étude de cas Vaulk : site éditorial et cinématographique pour un concepteur d'abris de protection civile. Next.js, Strapi, intégration 3D et vidéo au scroll. Livré en 3 mois.",
  },

  // ---- EN ----
  "/en/": {
    lang: "en",
    alt: "/",
    pageType: "WebPage",
    title: `Web freelancer in Nice: sites, AI, SEO & GEO | ${SITE}`,
    description:
      `Freelance designer & developer in Nice: custom websites, tools and AI, SEO & GEO. Your site found on Google and recommended by ChatGPT. From ${LOWEST_EN}.`,
  },
  "/en/about/": {
    lang: "en",
    alt: "/a-propos/",
    crumb: "About",
    pageType: "AboutPage",
    title: `About me | Anthony Profit, freelance web in Nice`,
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

  // ---- EN · blog ----
  "/en/blog/": {
    lang: "en",
    alt: "/blog/",
    crumb: "Guides",
    pageType: "WebPage",
    title: `SEO & GEO guides: Nice, Cannes, Monaco | Anthony Profit`,
    description:
      "Practical guides on local SEO, GEO (ChatGPT, Perplexity, AI Overviews) and ChatGPT Ads for businesses in Nice, Cannes and Monaco on the French Riviera.",
  },

  // ---- EN · services ----
  "/en/services/": {
    lang: "en",
    alt: "/services/",
    crumb: "Services",
    pageType: "WebPage",
    title: `Services — web, apps & AI, SEO & brand | Anthony Profit`,
    description:
      "Four services, one point of contact in Nice: custom websites, tools, apps & AI, SEO & GEO (incl. ChatGPT Ads) and brand identity.",
  },
  "/en/web-development/": {
    lang: "en",
    alt: "/creation-site-internet/",
    crumb: "Web development",
    title: `Custom web development in Nice | Anthony Profit`,
    description:
      `Custom website design and development near Nice: Astro/React, fast and search-ready. One-page site from ${en("web")}, reply within 2 business days.`,
  },
  "/en/seo-geo/": {
    lang: "en",
    alt: "/seo-geo/",
    crumb: "SEO & GEO",
    title: `SEO, GEO & ChatGPT Ads consultant in Nice | Anthony Profit`,
    description:
      `SEO and GEO near Nice: get found on Google and cited by ChatGPT. Strategy, editorial plan, content and market watch. Visibility audit from ${en("seo")}, ChatGPT Ads.`,
  },
  "/en/brand-design/": {
    lang: "en",
    alt: "/identite-de-marque/",
    crumb: "Brand identity",
    title: `Brand identity & visual design in Nice | Anthony Profit`,
    description:
      `Brand identity on the French Riviera: logo, style guide, typography and web, print and social applications. Logo and mini guide from ${en("brand")}, free with your website.`,
  },
  "/en/apps-ai-tools/": {
    lang: "en",
    alt: "/outils-applications-ia/",
    crumb: "Tools, apps & AI",
    title: `Custom tools, apps & AI development | Anthony Profit`,
    description:
      `Business tools, web and mobile apps, built-in AI (Claude, OpenAI) and automations near Nice. First tool from ${en("apps")}, delivered in ${DELAY.appsStarter.en}.`,
  },

  // ---- EN · case studies ----
  "/en/work/surly/": {
    lang: "en",
    alt: "/projets/surly/",
    crumb: "Surly",
    title: `Surly — banking & insurance marketplace | Case study`,
    description:
      "Surly case study: a banking & insurance marketplace co-founded and built on React + Supabase. Architecture, full-stack and growth — 1,600 consultants, 8 enterprise clients.",
  },
  "/en/work/eden-rock-yacht-rental/": {
    lang: "en",
    alt: "/projets/eden-rock-yacht-rental/",
    crumb: "Eden Rock Yacht Rental",
    title: `Eden Rock Yacht Rental — identity & site | Case study`,
    description:
      "Eden Rock Yacht Rental case study: extending an iconic St Barth hospitality brand into yachting. Identity, WordPress site and SEO for an international clientele.",
  },
  "/en/work/sun-beach-house/": {
    lang: "en",
    alt: "/projets/sun-beach-house/",
    crumb: "Sun Beach House",
    title: `Sun Beach House — luxury villas in St Barth | Case study`,
    description:
      "Sun Beach House case study: identity, an editorial Next.js + Sanity site and SEO/GEO for a prestige villa agency in Saint Barthélemy. Visible on Google and in AI answers.",
  },
  "/en/work/royal-yacht-international/": {
    lang: "en",
    alt: "/projets/royal-yacht-international/",
    crumb: "Royal Yacht International",
    title: `Royal Yacht International — superyacht broker | Case study`,
    description:
      "Royal Yacht International case study: brand redesign, WordPress site and SEO for a Monaco superyacht broker. Credibility and international visibility.",
  },
  "/en/work/vaulk/": {
    lang: "en",
    alt: "/projets/vaulk/",
    crumb: "Vaulk",
    title: `Vaulk — CBRN-hardened shelters | Web & 3D case study`,
    description:
      "Vaulk case study: an editorial, cinematic site for a designer of civil-protection shelters. Next.js, Strapi, scroll-driven 3D and video. Shipped in 3 months.",
  },
};

export const getRoute = (pathname: string): RouteMeta | undefined =>
  routes[pathname];
