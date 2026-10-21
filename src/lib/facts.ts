import type { Lang } from "~/i18n/ui";
import type { ServiceId } from "~/lib/service-pages";

/**
 * Business facts shown in several places (home doors, nav, service pages,
 * contact form, callback). One source so a price or a phone number can never
 * disagree between two pages — search engines and LLMs read that drift as a
 * trust problem.
 */
export const CONTACT = {
  email: "contact@kulturecom.fr",
  phoneDisplay: "+33 6 60 50 16 82",
  phoneHref: "tel:+33660501682",
  /** wa.me format: digits only, country code first. */
  whatsapp: "33660501682",
  /** Written reply time (business hours). */
  replyHours: 48,
} as const;

/**
 * Google Business Profile. Rating and count are copied by hand from the
 * profile: update them when new reviews come in.
 */
export const GOOGLE_PROFILE = {
  url: "https://www.google.com/maps?cid=13963690267531536578",
  rating: 5,
  reviewCount: 17,
} as const;

/**
 * Callback ("rappel immédiat") promise. Inside these hours (Europe/Paris) the
 * visitor is told they'll be called within `delayMin` minutes; outside, the
 * next opening (e.g. tomorrow 9 am).
 */
export const CALLBACK = {
  days: [1, 2, 3, 4, 5], // Mon–Fri (Date.getDay)
  fromHour: 9,
  toHour: 19,
  delayMin: 15,
} as const;

/**
 * Prices in euros (net: VAT not applicable, art. 293 B CGI). Entry offers have
 * a fixed scope and timeline; `*Full` / `*Custom` are "from" prices for the
 * complete project.
 */
export const PRICE = {
  seoAudit: 390, // Audit visibilité Google + IA, 7 days
  seoMonthly: 490, // Suivi mensuel SEO/GEO, per month
  adsLaunch: 490, // Lancement ChatGPT Ads (ad budget excluded)
  webOnePage: 790, // Site une page sur-mesure, 2-3 weeks
  webShowcase: 1690, // Site vitrine 5-8 pages + CMS
  appsStarter: 690, // Automatisation ou assistant IA, 2 weeks
  appsCustom: 2900, // Outil / app sur-mesure
  brandLogo: 150, // Logo + mini-charte, 2 weeks
  brandIdentity: 250, // Identité complète
} as const;

/**
 * Delivery times of the packages (shown in the offers, FAQs, meta
 * descriptions). Same rule as the prices: one source, so two pages can never
 * promise different timelines.
 */
export const DELAY = {
  seoAudit: { fr: "5 jours", en: "5 days" },
  adsLaunch: { fr: "7 jours", en: "7 days" },
  webOnePage: { fr: "1 à 2 semaines", en: "1 to 2 weeks" },
  webShowcase: { fr: "3 à 5 semaines", en: "3 to 5 weeks" },
  appsStarter: { fr: "10 jours", en: "10 days" },
  brandLogo: { fr: "1 semaine", en: "1 week" },
  brandIdentity: { fr: "2 à 3 semaines", en: "2 to 3 weeks" },
} as const satisfies Partial<Record<keyof typeof PRICE, Record<Lang, string>>>;

/** The lowest price a visitor can pay per service (its entry offer). Brand
 *  identity is offered free with a website build or redesign. */
export const STARTING_PRICE: Partial<Record<ServiceId, number>> = {
  seo: PRICE.seoAudit,
  web: PRICE.webOnePage,
  apps: PRICE.appsStarter,
  brand: PRICE.brandLogo,
};

/** Lowest entry price of the services named in the home description (sites,
 *  tools & AI, SEO & GEO): "Dès 390 €". Brand is left out: offered with a
 *  site, its 150 € would read as the price of a website. */
export const LOWEST_PRICE = Math.min(PRICE.seoAudit, PRICE.webOnePage, PRICE.appsStarter);

/** "1 490 €" / "€1,490", no decimals. Intl's narrow no-break space (U+202F)
 *  is swapped for a regular one: the site fonts have no U+202F glyph. */
export const formatPrice = (amount: number, lang: Lang): string =>
  new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\u202f/g, "\u00a0");

/** "dès 390 €" / "from €390"; null for a service quoted on request. */
export const fromPrice = (id: ServiceId, lang: Lang): string | null => {
  const amount = STARTING_PRICE[id];
  return amount === undefined ? null : `${lang === "fr" ? "dès" : "from"} ${formatPrice(amount, lang)}`;
};
