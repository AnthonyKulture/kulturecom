import type { Lang } from "~/i18n/ui";
import type { ServiceId } from "~/lib/service-pages";

/**
 * Business facts shown in several places (home doors, nav, service pages,
 * contact form, callback). One source so a price or a phone number can never
 * disagree between two pages — search engines and LLMs read that drift as a
 * trust problem.
 */
export const CONTACT = {
  email: "anthony@anthonyprofit.com",
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
  reviewCount: 23,
} as const;

/**
 * Callback ("rappel immédiat") promise. Inside these hours (Europe/Paris) the
 * visitor is told they'll be called within `delayMin` minutes; outside, the
 * next opening (e.g. tomorrow 9 am).
 */
export const CALLBACK = {
  days: [1, 2, 3, 4, 5], // Mon–Fri (Date.getDay)
  fromHour: 9,
  toHour: 20,
  delayMin: 15,
} as const;

/**
 * Prices in euros (net: VAT not applicable, art. 293 B CGI). Entry offers have
 * a fixed scope and timeline; `*Full` / `*Custom` are "from" prices for the
 * complete project.
 */
export const PRICE = {
  seoFix: 390, // Mise en conformité SEO & GEO, one shot (the audit itself is free)
  seoMonthly: 490, // Suivi & optimisation SEO/GEO, per month, audit + fixes included
  googleAdsLaunch: 250, // Lancement Google Ads (ad budget excluded)
  googleAdsMonthly: 90, // Suivi Google Ads, per month, required
  chatgptAdsLaunch: 490, // Lancement ChatGPT Ads (ad budget excluded)
  chatgptAdsMonthly: 180, // Suivi ChatGPT Ads, per month, required
  adsComboLaunch: 590, // Google Ads + ChatGPT Ads together (740 € apart)
  adsComboMonthly: 220, // Their follow-up together (270 €/month apart)
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
  seoAudit: { fr: "5 jours", en: "5 days" }, // free
  seoFix: { fr: "1 à 2 semaines", en: "1 to 2 weeks" },
  googleAdsLaunch: { fr: "7 jours", en: "7 days" },
  chatgptAdsLaunch: { fr: "7 jours", en: "7 days" },
  adsComboLaunch: { fr: "10 jours", en: "10 days" },
  webOnePage: { fr: "1 à 2 semaines", en: "1 to 2 weeks" },
  webShowcase: { fr: "3 à 5 semaines", en: "3 to 5 weeks" },
  appsStarter: { fr: "10 jours", en: "10 days" },
  brandLogo: { fr: "1 semaine", en: "1 week" },
  brandIdentity: { fr: "2 à 3 semaines", en: "2 to 3 weeks" },
} as const satisfies Partial<Record<keyof typeof PRICE | "seoAudit", Record<Lang, string>>>;

/** Minimum commitments, in months: SEO & GEO follow-up, ad management. */
export const COMMITMENT = { seo: 3, ads: 6 } as const;

/** The lowest price a visitor can pay per service (its entry offer). Brand
 *  identity is offered free with a website build or redesign. SEO opens on a
 *  free audit (FREE_ENTRY); its first paid offer is the one-shot fix. */
export const STARTING_PRICE: Partial<Record<ServiceId, number>> = {
  seo: PRICE.seoFix,
  web: PRICE.webOnePage,
  apps: PRICE.appsStarter,
  brand: PRICE.brandLogo,
};

/** Lowest entry price of the services named in the home description (sites,
 *  tools & AI, SEO & GEO): "Dès 390 €". Brand is left out: offered with a
 *  site, its 150 € would read as the price of a website. */
export const LOWEST_PRICE = Math.min(PRICE.seoFix, PRICE.webOnePage, PRICE.appsStarter);

/** Services that open on a free offer: shown in place of their "dès" price. */
export const FREE_ENTRY: Partial<Record<ServiceId, Record<Lang, string>>> = {
  seo: { fr: "audit gratuit", en: "free audit" },
};

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

/** "dès 390 €" / "from €390", "audit gratuit" for a free entry; null for a
 *  service quoted on request. */
export const fromPrice = (id: ServiceId, lang: Lang): string | null => {
  const free = FREE_ENTRY[id];
  if (free) return free[lang];
  const amount = STARTING_PRICE[id];
  return amount === undefined ? null : `${lang === "fr" ? "dès" : "from"} ${formatPrice(amount, lang)}`;
};
