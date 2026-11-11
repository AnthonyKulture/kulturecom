import type { Lang } from "~/i18n/ui";
import { COMMITMENT, DELAY, GOOGLE_PROFILE, PRICE, formatPrice } from "~/lib/facts";

/**
 * Standalone service / local-SEO landing pages (Reco 2). Distinct from
 * `services-data.ts`, which feeds the homepage's animated 3-axis teaser. Each
 * page targets buyer-intent + local queries (Nice / Côte d'Azur / France) and
 * cross-links to the relevant case studies for proof.
 *
 * Localized slugs improve relevance: /creation-site-internet/ ↔ /en/web-development/.
 */
export type ServiceId = "web" | "seo" | "brand" | "apps";

export interface ServiceStep {
  n: string;
  title: string;
  body: string;
}

export interface ServiceFaq {
  q: string;
  a: string;
  /** Optional link shown under the answer (not in the FAQPage schema). */
  link?: { href: string; label: string };
}

/** A priced formula shown in the "Formules" block of a service page. */
export interface ServiceOffer {
  name: string;
  /** One line under the name: who it is for, what it brings. */
  pitch?: string;
  /** A short label on the card (e.g. "Le plus complet"). */
  badge?: string;
  /** Set apart from the others (accent frame). */
  featured?: boolean;
  /** true → "Gratuit" instead of a price. */
  free?: boolean;
  /** Key of the shared price list (src/lib/facts.ts); none → "sur devis". */
  price?: keyof typeof PRICE;
  /** true → "dès X €" (starting price of a full project). */
  from?: boolean;
  /** e.g. "/mois" for a monthly plan. */
  unit?: string;
  /** What follows the first price, e.g. "puis 90 €/mois". */
  then?: { price: keyof typeof PRICE; unit: string };
  /** A line under the price, e.g. what the pack saves. */
  saving?: string;
  delay?: string;
  /** Minimum commitment, e.g. "6 mois". */
  term?: string;
  items: string[];
  /** The card's button, if not "Choisir cette formule". */
  cta?: string;
  /** Its group (offerGroups), by index. */
  group?: number;
}

/** A titled row of offers (e.g. natural search, then ads). */
export interface ServiceOfferGroup {
  title: string;
  /** A note under the row (e.g. ad budget, commitment). */
  note?: string;
}

export interface ServicePageContent {
  /** Short label used for cross-links, breadcrumb and the About-page link. */
  name: string;
  eyebrow: string;
  /** Display H1, split into 1–2 lines. */
  h1Lines: string[];
  lead: string;
  intro: string[];
  includesTitle: string;
  includes: string[];
  methodTitle: string;
  method: ServiceStep[];
  proofTitle: string;
  relatedTitle: string;
  offers: ServiceOffer[];
  /** Optional line under the packages' title: how they fit together. */
  offersIntro?: string;
  /** Optional rows the offers fall into (ServiceOffer.group). */
  offerGroups?: ServiceOfferGroup[];
  /** Optional line under the packages (e.g. brand identity offered with a site). */
  offersPerk?: string;
  faqTitle: string;
  faq: ServiceFaq[];
}

export interface ServicePageMeta {
  id: ServiceId;
  path: Record<Lang, string>;
  /** Case-study slugs featured as proof on this page. */
  proofSlugs: string[];
}

export const SERVICE_PAGES: ServicePageMeta[] = [
  {
    id: "web",
    path: { fr: "/creation-site-internet/", en: "/en/web-development/" },
    proofSlugs: ["alexalu", "surly", "sun-beach-house"],
  },
  {
    id: "seo",
    path: { fr: "/seo-geo/", en: "/en/seo-geo/" },
    proofSlugs: ["sun-beach-house", "royal-yacht-international", "eden-rock-yacht-rental"],
  },
  {
    id: "brand",
    path: { fr: "/identite-de-marque/", en: "/en/brand-design/" },
    proofSlugs: ["royal-yacht-international", "eden-rock-yacht-rental", "sun-beach-house"],
  },
  {
    id: "apps",
    path: { fr: "/outils-applications-ia/", en: "/en/apps-ai-tools/" },
    proofSlugs: ["surly"],
  },
];

export const servicePagePath = (id: ServiceId, lang: Lang): string =>
  SERVICE_PAGES.find((s) => s.id === id)!.path[lang];

// What the Google Ads + ChatGPT Ads pack saves over its commitment, against
// the two taken apart.
const ADS_SAVING =
  PRICE.googleAdsLaunch + PRICE.chatgptAdsLaunch - PRICE.adsComboLaunch +
  COMMITMENT.ads * (PRICE.googleAdsMonthly + PRICE.chatgptAdsMonthly - PRICE.adsComboMonthly);

const CONTENT: Record<ServiceId, Record<Lang, ServicePageContent>> = {
  web: {
    fr: {
      name: "Création de site internet",
      eyebrow: "Service · Création & design",
      h1Lines: ["Création de site", "sur-mesure à Nice."],
      lead: "Des sites créés à partir de votre entreprise, pas d'un modèle : recherche de fond, direction artistique, design et animations sur-mesure, puis un code rapide qui les porte. Un site qui vous ressemble et que personne d'autre ne peut avoir.",
      intro: [
        "Aujourd'hui, l'IA produit un site correct en une heure. Il ressemble à tous les autres, parce qu'il part de ce qui existe déjà. Ce qu'elle ne fait pas, c'est comprendre votre entreprise : pourquoi vos clients vous choisissent, ce qui vous distingue de vos concurrents, le ton juste pour en parler. C'est là que commence mon travail, et c'est ce qui justifie mon prix.",
        "Chaque projet démarre par une phase de recherche : échanges avec vous, étude de votre marché, de vos concurrents et de vos clients. J'en tire un positionnement et un message clairs, puis une direction artistique : univers visuel, typographie, couleurs, images, rythme. Le design et les animations en découlent, page par page, pour raconter votre histoire et guider le visiteur jusqu'au contact.",
        "Le code suit le design, pas l'inverse. Je développe moi-même chaque site (Astro, React, TypeScript) pour que les animations restent fluides et que les pages chargent vite : Core Web Vitals au vert, accessibilité WCAG AA, SEO et visibilité IA de base inclus. Création, design et code sous une seule main, sans agence à trois équipes qui se renvoient des fichiers, et un code qui vous appartient à la livraison.",
        "Basé à Nice, je travaille avec des PME, des marques et des créateurs partout en France et à l'international.",
      ],
      includesTitle: "Ce qui est inclus",
      includes: [
        "Immersion dans votre entreprise : échanges, marché, concurrents, clients",
        "Positionnement et message : ce qui vous rend unique, dit simplement",
        "Direction artistique : univers visuel, typographie, couleurs, images",
        "Maquettes haute-fidélité de chaque page (Figma), validées avec vous",
        "Animations et interactions sur-mesure, au service du message",
        "Développement sur-mesure rapide (Astro / React / TypeScript), Core Web Vitals au vert",
        "Outil d'édition pour rester autonome (Sanity, Strapi ou WordPress)",
        "Accessibilité WCAG AA, SEO et visibilité IA de base, mise en ligne",
      ],
      methodTitle: "La méthode",
      method: [
        { n: "01", title: "Immersion & recherche", body: "Comprendre votre entreprise, votre marché et vos clients avant de dessiner quoi que ce soit. Ce travail de fond donne au site son message et sa raison d'être." },
        { n: "02", title: "Direction artistique", body: "Un univers visuel qui n'appartient qu'à vous : typographie, couleurs, images, ton. Vous le validez avant la première page." },
        { n: "03", title: "Design & animation", body: "Maquettes haute-fidélité et animations pensées page par page, itérations commentées en vidéo. Chaque mouvement sert le propos." },
        { n: "04", title: "Développement & mise en ligne", body: "Un code rapide qui garde le design intact, une préversion pour suivre l'avancement, puis la mise en ligne. 30 jours de suivi inclus." },
      ],
      proofTitle: "Projets liés",
      relatedTitle: "Autres services",
      offers: [
        { name: "Site une page", pitch: "Une page forte, pensée pour votre activité, qui donne envie de vous contacter.", price: "webOnePage", delay: DELAY.webOnePage.fr, items: ["Recherche sur votre entreprise et votre marché", "Direction artistique et design sur-mesure", "Animations soignées, code rapide (Lighthouse ≥ 95)", "SEO et visibilité IA de base, mise en ligne"] },
        { name: "Site vitrine", badge: "Le plus complet", featured: true, pitch: "Votre univers complet, sur 5 à 8 pages qui racontent votre entreprise.", price: "webShowcase", from: true, delay: DELAY.webShowcase.fr, items: ["Atelier de découverte et recherche approfondie", "Direction artistique complète : typographie, couleurs, images", "5 à 8 pages designées et animées sur-mesure", "Outil d'édition pour rester autonome", "SEO complet et 30 jours de suivi"] },
      ],
      offersPerk: "Identité de marque offerte : logo, mini-charte ou identité complète, inclus dans la création ou la refonte de votre site.",
      faqTitle: "Questions fréquentes",
      faq: [
        { q: "Combien coûte un site internet sur-mesure ?", a: `Il n'y a pas de prix unique : il dépend du travail de recherche et de design, du nombre de pages, des animations, des fonctionnalités et des contenus à produire. Un site généré à partir d'un modèle ou par une IA coûte peu, mais il ressemble à tous les autres. Chez moi, un site une page sur-mesure coûte ${formatPrice(PRICE.webOnePage, "fr")} et se livre en ${DELAY.webOnePage.fr} ; un site vitrine de 5 à 8 pages avec outil d'édition démarre à ${formatPrice(PRICE.webShowcase, "fr")}, livré en ${DELAY.webShowcase.fr}. Les deux incluent la recherche, la direction artistique et le design. Le logo et l'identité de marque sont offerts. Prix nets (TVA non applicable), fixés par écrit avec le délai après un premier échange.` },
        { q: "Pourquoi payer un site sur-mesure quand l'IA peut en créer un ?", a: "Parce que l'IA assemble ce qui existe déjà : elle produit vite un site correct, mais générique, qui ne dit rien de précis sur votre entreprise et que vos concurrents peuvent obtenir de la même façon. Un site sur-mesure part d'un travail de fond : comprendre vos clients, trouver ce qui vous distingue, le traduire en message, en direction artistique, en design et en animations. C'est ce qui fait qu'un visiteur se souvient de vous et vous contacte. J'utilise l'IA comme un outil pour aller plus vite sur le code, pas pour remplacer la réflexion ni la création." },
        { q: "Que comprend la direction artistique ?", a: "La direction artistique fixe l'univers visuel du site avant le design des pages : typographies, palette de couleurs, style d'images ou d'illustrations, mise en page, ton des textes et principes d'animation. Elle garantit que chaque page, et plus tard chaque support, parle la même langue. Chez moi, elle est incluse dans chaque site, et l'identité de marque (logo, charte) est offerte avec la création ou la refonte." },
        { q: "Combien de temps faut-il pour créer un site internet ?", a: `Cela dépend surtout du travail de recherche, du nombre de pages et du contenu à produire. Avec moi, comptez ${DELAY.webOnePage.fr} pour un site une page et ${DELAY.webShowcase.fr} pour un site vitrine de 5 à 8 pages. Les projets plus lourds (e-commerce, plateforme, 3D) sont planifiés au cadrage. Pendant le projet, vous suivez l'avancement sur une préversion en ligne et validez chaque étape.` },
        { q: "Site sur-mesure ou WordPress, Wix : que choisir ?", a: "Un site sur-mesure (Astro, Next.js) laisse une liberté totale au design et aux animations, charge plus vite, se référence mieux et ne dépend d'aucun thème ni plugin à mettre à jour. Wix ou un thème WordPress peuvent suffire pour un petit budget sans objectif d'image ni de visibilité. Pour modifier vos contenus vous-même, j'intègre un outil d'édition simple, ou WordPress si votre équipe le connaît déjà." },
        { q: "Mon site sera-t-il visible sur Google et dans les IA ?", a: `Oui, les fondations sont incluses : SEO technique, données structurées Schema.org, fichier llms.txt, score Lighthouse ≥ 95 et Core Web Vitals au vert. Le site vitrine ajoute le SEO complet et 30 jours de suivi. Pour aller plus loin (contenus, Google Ads, ChatGPT Ads, suivi mensuel), l'accompagnement SEO & GEO démarre par un audit gratuit.` },
        { q: "Faites-vous la refonte de sites existants ?", a: "Oui. Je repense votre site (WordPress, Wix ou autre) avec le même travail de recherche et de direction artistique, sans perdre votre référencement : redirections 301, URLs et contenus qui performent conservés, Search Console suivie après la mise en ligne. La refonte du logo et de l'identité de marque est offerte dans le même projet." },
        { q: "Le code de mon site m'appartient-il ?", a: "Oui, entièrement. À la livraison, vous récupérez le code source, les accès et la documentation. Aucun verrou propriétaire : vous pouvez faire évoluer le site avec moi ou avec un autre prestataire." },
      ],
    },
    en: {
      name: "Web development",
      eyebrow: "Service · Creation & design",
      h1Lines: ["Custom web", "design & development."],
      lead: "Websites created from your business, not from a template: in-depth research, art direction, custom design and animation, then fast code that carries them. A site that looks like you and that nobody else can have.",
      intro: [
        "Today, AI produces a decent website in an hour. It looks like all the others, because it starts from what already exists. What it doesn't do is understand your business: why your customers choose you, what sets you apart from your competitors, the right tone to talk about it. That's where my work begins, and it's what my price pays for.",
        "Every project starts with research: conversations with you, a look at your market, your competitors and your customers. From that I draw a clear positioning and message, then an art direction: visual world, typography, colors, imagery, rhythm. Design and animation follow from it, page by page, to tell your story and lead visitors to get in touch.",
        "The code follows the design, not the other way round. I build every site myself (Astro, React, TypeScript) so animations stay smooth and pages load fast: green Core Web Vitals, WCAG AA accessibility, baseline SEO and AI visibility included. Creation, design and code under a single hand, with no three-team agency passing files around, and code you own on delivery.",
        "Based in Nice, I work with SMBs, brands and creators across France and internationally.",
      ],
      includesTitle: "What's included",
      includes: [
        "Immersion in your business: conversations, market, competitors, customers",
        "Positioning and message: what makes you unique, said simply",
        "Art direction: visual world, typography, colors, imagery",
        "High-fidelity mockups of every page (Figma), signed off with you",
        "Custom animation and interactions that serve the message",
        "Fast custom development (Astro / React / TypeScript), green Core Web Vitals",
        "Editing tool so you stay autonomous (Sanity, Strapi or WordPress)",
        "WCAG AA accessibility, baseline SEO and AI visibility, launch",
      ],
      methodTitle: "The method",
      method: [
        { n: "01", title: "Immersion & research", body: "Understand your business, your market and your customers before drawing anything. This groundwork gives the site its message and its reason to exist." },
        { n: "02", title: "Art direction", body: "A visual world that belongs only to you: typography, colors, imagery, tone. You sign it off before the first page." },
        { n: "03", title: "Design & animation", body: "High-fidelity mockups and animation designed page by page, iterations reviewed over video. Every movement serves the point." },
        { n: "04", title: "Development & launch", body: "Fast code that keeps the design intact, a preview to follow progress, then launch. 30 days of follow-up included." },
      ],
      proofTitle: "Related projects",
      relatedTitle: "Other services",
      offers: [
        { name: "One-page site", pitch: "One strong page, designed around your business, that makes people want to contact you.", price: "webOnePage", delay: DELAY.webOnePage.en, items: ["Research on your business and your market", "Art direction and custom design", "Polished animation, fast code (Lighthouse ≥ 95)", "Baseline SEO and AI visibility, launch"] },
        { name: "Showcase site", badge: "Most complete", featured: true, pitch: "Your whole world, across 5 to 8 pages that tell your business's story.", price: "webShowcase", from: true, delay: DELAY.webShowcase.en, items: ["Discovery workshop and in-depth research", "Full art direction: typography, colors, imagery", "5 to 8 custom designed and animated pages", "Editing tool so you stay autonomous", "Full SEO and 30 days of follow-up"] },
      ],
      offersPerk: "Brand identity included free: logo, mini style guide or complete identity come with your new or redesigned website.",
      faqTitle: "Frequently asked questions",
      faq: [
        { q: "How much does a custom website cost?", a: `There is no single price: it depends on the research and design work, the number of pages, the animation, the features and the content to produce. A site generated from a template or by AI costs little, but it looks like all the others. With me, a custom one-page site costs ${formatPrice(PRICE.webOnePage, "en")} and ships in ${DELAY.webOnePage.en}; a 5 to 8-page showcase site with an editing tool starts at ${formatPrice(PRICE.webShowcase, "en")}, delivered in ${DELAY.webShowcase.en}. Both include research, art direction and design. Logo and brand identity are included free. Net prices (no VAT charged), fixed in writing with the timeline after a first call.` },
        { q: "Why pay for a custom website when AI can make one?", a: "Because AI assembles what already exists: it quickly produces a decent but generic site that says nothing specific about your business, and that your competitors can get the same way. A custom site starts from groundwork: understanding your customers, finding what sets you apart, turning it into a message, an art direction, a design and animation. That's what makes a visitor remember you and get in touch. I use AI as a tool to move faster on code, not to replace thinking or creative work." },
        { q: "What does art direction cover?", a: "Art direction sets the site's visual world before the pages are designed: typefaces, color palette, image or illustration style, layout, tone of the copy and animation principles. It makes sure every page, and later every medium, speaks the same language. With me, it's included in every site, and brand identity (logo, guidelines) is free with a new site or a redesign." },
        { q: "How long does it take to build a website?", a: `It depends mainly on the research work, the number of pages and the content to produce. With me, plan ${DELAY.webOnePage.en} for a one-page site and ${DELAY.webShowcase.en} for a 5 to 8-page showcase site. Heavier builds (e-commerce, platform, 3D) are scheduled during scoping. Throughout the project you follow progress on a live preview and sign off each step.` },
        { q: "Custom website or WordPress, Wix: which to choose?", a: "A custom site (Astro, Next.js) gives design and animation complete freedom, loads faster, ranks better and depends on no theme or plugin to keep updated. Wix or a WordPress theme can do for a small budget with no image or visibility goal. To edit your content yourself, I add a simple editing tool, or WordPress if your team already knows it." },
        { q: "Will my site be visible on Google and in AI answers?", a: `Yes, the foundations are included: technical SEO, Schema.org structured data, an llms.txt file, a Lighthouse score ≥ 95 and green Core Web Vitals. The showcase site adds full SEO and 30 days of follow-up. To go further (content, Google Ads, ChatGPT Ads, monthly follow-up), SEO & GEO work starts with a free audit.` },
        { q: "Do you redesign existing websites?", a: "Yes. I rethink your site (WordPress, Wix or other) with the same research and art direction work, without losing your rankings: 301 redirects, top-performing URLs and content kept, Search Console monitored after launch. Redesigning your logo and brand identity is included free in the same project." },
        { q: "Do I own my website's code?", a: "Yes, fully. On delivery you get the source code, access and documentation. No proprietary lock-in: you can evolve the site with me or with another provider." },
      ],
    },
  },
  seo: {
    fr: {
      name: "SEO & GEO",
      eyebrow: "Service · Visibilité",
      h1Lines: ["Stratégie", "SEO & GEO."],
      lead: "Être trouvé sur Google, cité par ChatGPT et les autres IA, puis accélérer avec Google Ads et ChatGPT Ads. Ça commence par un audit gratuit : vous savez où vous en êtes avant de dépenser un euro.",
      intro: [
        "Le SEO ne se résume plus à Google. ChatGPT, Perplexity, Gemini et les AI Overviews répondent désormais aux questions de vos clients en citant des sources. Le GEO (Generative Engine Optimization) consiste à structurer votre site pour qu'il soit cité, pas seulement listé.",
        "Le parcours est simple. L'audit gratuit fait l'état des lieux : ce qui bloque votre site, ce que vos clients cherchent, qui est cité à votre place dans les IA. Ensuite, deux options : je corrige tout en une fois (la mise en conformité), ou je prends en charge votre visibilité chaque mois (le suivi, qui inclut l'audit approfondi et toutes les corrections).",
        "Le suivi, c'est de la stratégie et de l'exécution : les requêtes et les questions qui rapportent, un plan éditorial, des contenus rédigés ou optimisés, une veille concurrentielle, et des corrections techniques au fil de l'eau. On pilote sur des chiffres : positions, trafic, contacts, citations dans les IA.",
        "La publicité vient en dernier, pour accélérer ce qui marche déjà. Google Ads vous place en tête des recherches dès la première semaine. ChatGPT Ads, ouvert aux annonceurs en France depuis fin août 2026, affiche votre annonce juste sous la réponse de ChatGPT, marquée « sponsorisé », sans influencer son contenu. Le GEO vous fait citer dans la réponse, ChatGPT Ads vous place juste en dessous.",
        "Basé à Nice, j'accompagne des marques en France et à l'international, du référencement local à la visibilité internationale.",
      ],
      includesTitle: "Ce qui est inclus",
      includes: [
        "Audit gratuit : santé du site, positions, présence dans les IA",
        "Corrections techniques : indexation, vitesse, mobile, redirections",
        "Données structurées Schema.org, fichier llms.txt, citabilité dans les IA",
        "Stratégie SEO & GEO : requêtes, questions de vos clients, angles libres",
        "Plan éditorial, rédaction et optimisation des contenus",
        "Référencement local : fiche Google Business Profile, avis, annuaires",
        "Campagnes Google Ads et ChatGPT Ads, suivi des conversions conforme au RGPD",
        "Search Console, GA4, suivi des positions et rapport mensuel",
      ],
      methodTitle: "La méthode",
      method: [
        { n: "01", title: "Audit gratuit", body: "État des lieux technique, éditorial et concurrentiel, et votre présence testée dans ChatGPT, Perplexity et Gemini. Ce qui bloque, ce qui manque, ce qui rapporte." },
        { n: "02", title: "Mise en conformité", body: "Je corrige ce que l'audit a relevé : technique, balises, données structurées, llms.txt, fiche Google. Votre site part sur des bases saines." },
        { n: "03", title: "Contenus & optimisation", body: "Chaque mois, les contenus qui vont chercher le trafic, la veille concurrentielle et les ajustements. On pilote sur des chiffres." },
        { n: "04", title: "Accélération Ads", body: "Quand le site convertit, Google Ads et ChatGPT Ads amènent des contacts tout de suite, avec un budget que vous maîtrisez." },
      ],
      proofTitle: "Projets liés",
      relatedTitle: "Autres services",
      offersIntro: "Tout commence par l'audit gratuit. Ensuite, je corrige tout en une fois, ou je m'occupe de votre visibilité chaque mois, corrections incluses. La publicité vient en dernier, pour accélérer ce qui marche déjà.",
      offerGroups: [
        { title: "Référencement naturel : Google et les IA" },
        { title: "Publicité : Google Ads et ChatGPT Ads", note: `Budget publicitaire en plus, payé directement à Google ou à OpenAI : vous le fixez et le gardez en main. Suivi mensuel obligatoire et engagement de ${COMMITMENT.ads} mois, le temps que les campagnes apprennent et deviennent rentables.` },
      ],
      offers: [
        { group: 0, name: "Audit visibilité Google + IA", badge: "Sans engagement", pitch: "Savoir où vous en êtes avant de dépenser un euro.", free: true, delay: DELAY.seoAudit.fr, cta: "Demander l'audit gratuit", items: ["Santé technique du site : indexation, vitesse, erreurs bloquantes", "Vos positions sur Google et ce que tapent vos clients", "Votre présence testée dans ChatGPT, Perplexity, Gemini et les AI Overviews", "Qui est cité à votre place, et pourquoi", "Les actions prioritaires, présentées en visio"] },
        { group: 0, name: "Mise en conformité SEO & GEO", pitch: "Je corrige tout ce que l'audit a relevé, en une fois.", price: "seoFix", from: true, delay: DELAY.seoFix.fr, items: ["Corrections techniques : indexation, redirections, vitesse, mobile", "Titres et descriptions réécrits pour donner envie de cliquer", "Données structurées Schema.org et fichier llms.txt pour les IA", "Fiche Google Business Profile optimisée", "Search Console et GA4 branchés, rapport avant / après"] },
        { group: 0, name: "Suivi & optimisation SEO & GEO", badge: "Le plus complet", featured: true, pitch: "Je prends en charge votre visibilité, chaque mois.", price: "seoMonthly", from: true, unit: "/mois", term: `${COMMITMENT.seo} mois minimum`, items: ["Audit approfondi et mise en conformité inclus", "Stratégie : les requêtes et les questions qui rapportent", "Plan éditorial, rédaction et optimisation des contenus", "Veille concurrentielle et ajustements continus", "Positions et citations dans les IA suivies", "Rapport mensuel clair et point en visio"] },
        { group: 1, name: "Google Ads", pitch: "Des contacts dès la première semaine, sur les recherches qui comptent.", price: "googleAdsLaunch", then: { price: "googleAdsMonthly", unit: "/mois" }, delay: DELAY.googleAdsLaunch.fr, term: `${COMMITMENT.ads} mois`, items: ["Mots-clés rentables, et exclusion de ceux qui gaspillent", "Campagne et annonces rédigées", "Suivi des conversions (appels, formulaires) conforme au RGPD", "Optimisation chaque mois : enchères, mots-clés, annonces", "Rapport mensuel : coût par contact, ce qui marche"] },
        { group: 1, name: "Pack Google Ads + ChatGPT Ads", badge: "Le plus rentable", featured: true, pitch: "Présent là où vos clients cherchent, et là où ils posent leurs questions.", price: "adsComboLaunch", then: { price: "adsComboMonthly", unit: "/mois" }, saving: `${formatPrice(ADS_SAVING, "fr")} d'économie sur ${COMMITMENT.ads} mois`, delay: DELAY.adsComboLaunch.fr, term: `${COMMITMENT.ads} mois`, items: ["Les deux campagnes lancées et suivies ensemble", "Un message cohérent sur Google et dans ChatGPT", "Budget réparti chaque mois là où il rapporte le plus", "Suivi des conversions unique, conforme au RGPD", "Un seul rapport mensuel pour les deux"] },
        { group: 1, name: "ChatGPT Ads", badge: "Nouveau", pitch: "Votre annonce juste sous la réponse de ChatGPT.", price: "chatgptAdsLaunch", then: { price: "chatgptAdsMonthly", unit: "/mois" }, delay: DELAY.chatgptAdsLaunch.fr, term: `${COMMITMENT.ads} mois`, items: ["Ciblage par contextes de conversation et par zone", "Annonces rédigées et testées", "Page d'arrivée et suivi des conversions conforme au RGPD", "Optimisation chaque mois : budget, contextes, annonces", "Rapport mensuel, croisé avec vos citations GEO"] },
      ],
      faqTitle: "Questions fréquentes",
      faq: [
        { q: "Qu'est-ce que le GEO, et quelle différence avec le SEO ?", a: "Le GEO (Generative Engine Optimization) vise à être cité par les moteurs génératifs (ChatGPT, Perplexity, Gemini, Google AI Overviews), quand le SEO vise le classement dans les résultats Google. Les deux partagent les mêmes fondations : site rapide, contenus utiles, données structurées. Le GEO y ajoute des réponses courtes et citables, un fichier llms.txt et des mentions sur des sources de confiance.", link: { href: "/consultant-geo-nice/", label: "Le GEO à Nice, en détail" } },
        { q: "Pourquoi faire confiance à Anthony Profit pour son SEO, son GEO et ses Ads ?", a: `Parce que tout se vérifie. Les avis : ${GOOGLE_PROFILE.rating.toFixed(1).replace(".", ",")}/5 sur ${GOOGLE_PROFILE.reviewCount} avis Google (${GOOGLE_PROFILE.url}). Les résultats : des sites clients en ligne, présentés en études de cas avec leurs liens (Sun Beach House en SEO et GEO continus depuis Saint-Barthélemy, AlexAlu en référencement payant et SEO, Movida en SEO local à Nice). Les prix : publiés sur cette page, sans surprise, et l'audit est gratuit et sans engagement, pour juger sur pièces avant de payer. La méthode : ce site l'applique lui-même (données structurées Schema.org, fichier llms.txt, pages rapides). Et un seul interlocuteur, Anthony Profit, entrepreneur individuel à Nice (SIREN 850 723 552), qui réalise le travail en personne et ne promet jamais de « première place garantie ».` },
        { q: "Pourquoi l'audit est-il gratuit ?", a: `Parce qu'on ne décide bien qu'en connaissant le point de départ. En ${DELAY.seoAudit.fr}, je vérifie la santé technique de votre site, vos positions sur Google et votre présence dans ChatGPT, Perplexity et Gemini, puis je vous présente les actions prioritaires en visio. Vous repartez avec le diagnostic, sans engagement : libre à vous de corriger vous-même, de me confier la mise en conformité ou le suivi.` },
        { q: "Mise en conformité ou suivi mensuel : que choisir ?", a: `La mise en conformité (dès ${formatPrice(PRICE.seoFix, "fr")}, en ${DELAY.seoFix.fr}) corrige en une fois ce que l'audit a relevé : technique, balises, données structurées, llms.txt, fiche Google. Le suivi (dès ${formatPrice(PRICE.seoMonthly, "fr")} par mois, ${COMMITMENT.seo} mois minimum) inclut ces corrections, puis va chercher du trafic chaque mois : stratégie, contenus, veille, rapport. Si votre marché est concurrentiel ou que vous voulez de la croissance, le suivi ; si vous voulez juste des bases saines, la mise en conformité.` },
        { q: "Faites-vous seulement du SEO technique ?", a: "Non. La technique n'est que la fondation. L'essentiel du travail est stratégique et éditorial : je cherche les leviers (requêtes de vos clients, questions posées aux IA, angles laissés libres par vos concurrents), je construis un plan et un calendrier éditorial, je rédige ou j'optimise les contenus, et une veille marketing continue ajuste le plan au fil des mois." },
        { q: "Combien coûte un consultant SEO & GEO à Nice ?", a: `Il n'existe pas de grille officielle : le prix dépend surtout de la concurrence sur vos requêtes, de l'état de votre site et du contenu à produire. En repère, un consultant SEO freelance expérimenté facture autour de 500 € HT la journée en France, et autour de 280 € en début de carrière (baromètre des tarifs Malt, 2026). Au mois, l'étude d'Ahrefs auprès de 439 prestataires (2024) relève un forfait moyen d'environ 1 349 $ chez un freelance et de 3 209 $ en agence. Chez moi, l'audit de visibilité Google + IA est gratuit, la mise en conformité coûte dès ${formatPrice(PRICE.seoFix, "fr")} et le suivi SEO & GEO dès ${formatPrice(PRICE.seoMonthly, "fr")} par mois, audit approfondi et corrections inclus (${COMMITMENT.seo} mois minimum) : sous le forfait mensuel moyen d'un freelance. Prix nets, TVA non applicable.`, link: { href: "/blog/prix-referencement-nice-seo/", label: "Voir la grille des prix du référencement à Nice" } },
        { q: "En combien de temps voit-on des résultats en SEO ?", a: "Les corrections techniques agissent en quelques semaines ; les gains de positions sur des requêtes concurrentielles prennent généralement 3 à 6 mois. Dans les IA qui consultent le web, comme ChatGPT Search ou Perplexity, une page bien structurée peut être citée dès qu'elle est indexée. Pour des contacts tout de suite, Google Ads et ChatGPT Ads prennent le relais pendant que le SEO monte." },
        { q: "Google Ads ou ChatGPT Ads : par quoi commencer ?", a: `Google Ads capte les personnes qui cherchent déjà votre service : c'est le plus direct pour générer des contacts. ChatGPT Ads touche celles qui se renseignent et comparent dans ChatGPT, souvent plus tôt dans leur décision, avec encore peu de concurrence. Le pack combiné (${formatPrice(PRICE.adsComboLaunch, "fr")} puis ${formatPrice(PRICE.adsComboMonthly, "fr")} par mois) fait les deux avec un message cohérent et un budget réparti là où il rapporte le plus, pour ${formatPrice(ADS_SAVING, "fr")} de moins sur ${COMMITMENT.ads} mois qu'en séparé.` },
        { q: "Qu'est-ce que ChatGPT Ads, et faut-il s'y mettre ?", a: `ChatGPT Ads est la régie publicitaire d'OpenAI, ouverte aux annonceurs en France depuis fin août 2026 : des annonces affichées sous les réponses de ChatGPT (offres gratuite et Go), marquées « sponsorisé ». Pas de mots-clés à acheter : on décrit les contextes de conversation où l'annonce doit apparaître, on choisit les zones, et on paie au clic ou à l'impression. C'est le complément payant du GEO, pas un raccourci : les annonces n'influencent pas les réponses. Je lance votre campagne en ${DELAY.chatgptAdsLaunch.fr} pour ${formatPrice(PRICE.chatgptAdsLaunch, "fr")}, puis je l'optimise pour ${formatPrice(PRICE.chatgptAdsMonthly, "fr")} par mois.` },
        { q: "Pourquoi un engagement de 6 mois sur la publicité ?", a: `Une campagne a besoin de temps pour apprendre : les premières semaines servent à trouver les recherches, les contextes et les annonces qui convertissent, les mois suivants à baisser le coût par contact. Sur ${COMMITMENT.ads} mois, on mesure un vrai retour sur investissement. Le budget publicitaire reste le vôtre : vous le fixez, vous pouvez le baisser ou le mettre en pause.` },
        { q: "Faites-vous du référencement local à Nice ?", a: "Oui : fiche Google Business Profile, cohérence du nom, de l'adresse et du téléphone (NAP) sur les annuaires, avis clients, données structurées LocalBusiness et pages par ville. L'objectif : apparaître dans le Local Pack et sur Google Maps à Nice, Antibes, Cannes, Monaco ou dans votre zone.", link: { href: "/blog/referencement-cannes-seo-local/", label: "Lire le guide du consultant SEO local à Cannes" } },
        { q: "Travaillez-vous sur un site existant ?", a: "Oui, la plupart des missions SEO partent d'un site déjà en ligne, quel que soit l'outil : WordPress, Wix, Shopify ou site sur-mesure. L'audit gratuit mesure le potentiel avant tout engagement." },
      ],
    },
    en: {
      name: "SEO & GEO",
      eyebrow: "Service · Visibility",
      h1Lines: ["SEO & GEO", "strategy."],
      lead: "Get found on Google, cited by ChatGPT and other AI, then speed up with Google Ads and ChatGPT Ads. It starts with a free audit: you know where you stand before spending a cent.",
      intro: [
        "SEO is no longer just Google. ChatGPT, Perplexity, Gemini and AI Overviews now answer your customers' questions by citing sources. GEO (Generative Engine Optimization) structures your site to be cited, not just listed.",
        "The path is simple. The free audit takes stock: what holds your site back, what your customers search for, who gets cited instead of you in AI answers. Then two options: I fix everything in one go (the compliance fix), or I take care of your visibility every month (the follow-up, which includes the in-depth audit and every fix).",
        "The follow-up is strategy and execution: the searches and questions that pay, an editorial plan, content written or optimized, competitor watch, and technical fixes as they come. We steer on numbers: rankings, traffic, leads, AI citations.",
        "Ads come last, to speed up what already works. Google Ads puts you at the top of searches from the first week. ChatGPT Ads, open to advertisers in France since late August 2026, shows your ad right below ChatGPT's answer, labeled “sponsored”, without influencing its content. GEO gets you cited in the answer, ChatGPT Ads places you right below it.",
        "Based in Nice, I work with brands across France and internationally — from local search to international visibility.",
      ],
      includesTitle: "What's included",
      includes: [
        "Free audit: site health, rankings, presence in AI answers",
        "Technical fixes: indexing, speed, mobile, redirects",
        "Schema.org structured data, llms.txt file, AI citability",
        "SEO & GEO strategy: searches, your customers' questions, open angles",
        "Editorial plan, content writing and optimization",
        "Local search: Google Business Profile, reviews, directories",
        "Google Ads and ChatGPT Ads campaigns, GDPR-compliant conversion tracking",
        "Search Console, GA4, rank tracking and a monthly report",
      ],
      methodTitle: "The method",
      method: [
        { n: "01", title: "Free audit", body: "Technical, editorial and competitive baseline, and your presence tested in ChatGPT, Perplexity and Gemini. What blocks, what's missing, what pays." },
        { n: "02", title: "Compliance fix", body: "I fix what the audit found: technical issues, tags, structured data, llms.txt, Google profile. Your site starts on sound foundations." },
        { n: "03", title: "Content & optimization", body: "Every month, the content that goes after traffic, competitor watch and adjustments. We steer on numbers." },
        { n: "04", title: "Ads acceleration", body: "Once the site converts, Google Ads and ChatGPT Ads bring leads right away, on a budget you control." },
      ],
      proofTitle: "Related projects",
      relatedTitle: "Other services",
      offersIntro: "Everything starts with the free audit. Then I fix everything in one go, or take care of your visibility every month, fixes included. Ads come last, to speed up what already works.",
      offerGroups: [
        { title: "Organic search: Google and AI" },
        { title: "Ads: Google Ads and ChatGPT Ads", note: `Ad budget on top, paid directly to Google or OpenAI: you set it and keep control of it. Monthly management required, ${COMMITMENT.ads}-month commitment, so the campaigns have time to learn and pay off.` },
      ],
      offers: [
        { group: 0, name: "Google + AI visibility audit", badge: "No commitment", pitch: "Know where you stand before spending a cent.", free: true, delay: DELAY.seoAudit.en, cta: "Get the free audit", items: ["Technical health: indexing, speed, blocking errors", "Your Google rankings and what your customers type", "Your presence tested in ChatGPT, Perplexity, Gemini and AI Overviews", "Who gets cited instead of you, and why", "Priority actions, walked through on a call"] },
        { group: 0, name: "SEO & GEO compliance fix", pitch: "I fix everything the audit found, in one go.", price: "seoFix", from: true, delay: DELAY.seoFix.en, items: ["Technical fixes: indexing, redirects, speed, mobile", "Titles and descriptions rewritten to earn the click", "Schema.org structured data and an llms.txt file for AI", "Optimized Google Business Profile", "Search Console and GA4 set up, before / after report"] },
        { group: 0, name: "SEO & GEO follow-up & optimization", badge: "Most complete", featured: true, pitch: "I take care of your visibility, every month.", price: "seoMonthly", from: true, unit: "/month", term: `${COMMITMENT.seo} months minimum`, items: ["In-depth audit and compliance fix included", "Strategy: the searches and questions that pay", "Editorial plan, content writing and optimization", "Competitor watch and continuous adjustments", "Rankings and AI citations tracked", "Clear monthly report and a call"] },
        { group: 1, name: "Google Ads", pitch: "Leads from the first week, on the searches that matter.", price: "googleAdsLaunch", then: { price: "googleAdsMonthly", unit: "/month" }, delay: DELAY.googleAdsLaunch.en, term: `${COMMITMENT.ads} months`, items: ["Profitable keywords, and the wasteful ones excluded", "Campaign and ads written", "GDPR-compliant conversion tracking (calls, forms)", "Monthly optimization: bids, keywords, ads", "Monthly report: cost per lead, what works"] },
        { group: 1, name: "Google Ads + ChatGPT Ads pack", badge: "Best value", featured: true, pitch: "Present where your customers search, and where they ask questions.", price: "adsComboLaunch", then: { price: "adsComboMonthly", unit: "/month" }, saving: `${formatPrice(ADS_SAVING, "en")} saved over ${COMMITMENT.ads} months`, delay: DELAY.adsComboLaunch.en, term: `${COMMITMENT.ads} months`, items: ["Both campaigns launched and managed together", "One consistent message on Google and in ChatGPT", "Budget shifted each month to where it pays most", "Single GDPR-compliant conversion tracking", "One monthly report for both"] },
        { group: 1, name: "ChatGPT Ads", badge: "New", pitch: "Your ad right below ChatGPT's answer.", price: "chatgptAdsLaunch", then: { price: "chatgptAdsMonthly", unit: "/month" }, delay: DELAY.chatgptAdsLaunch.en, term: `${COMMITMENT.ads} months`, items: ["Targeting by conversation context and location", "Ads written and tested", "Landing page and GDPR-compliant conversion tracking", "Monthly optimization: budget, contexts, ads", "Monthly report, cross-checked with your GEO citations"] },
      ],
      faqTitle: "Frequently asked questions",
      faq: [
        { q: "What is GEO, and how is it different from SEO?", a: "GEO (Generative Engine Optimization) aims to get you cited by generative engines (ChatGPT, Perplexity, Gemini, Google AI Overviews), while SEO aims to rank you in Google's results. Both share the same foundations: a fast site, useful content, structured data. GEO adds short, quotable answers, an llms.txt file and mentions on trusted sources.", link: { href: "/en/geo-consultant-nice/", label: "GEO in Nice, in detail" } },
        { q: "Why trust Anthony Profit with your SEO, GEO and ads?", a: `Because everything can be checked. Reviews: ${GOOGLE_PROFILE.rating.toFixed(1)}/5 from ${GOOGLE_PROFILE.reviewCount} Google reviews (${GOOGLE_PROFILE.url}). Results: live client sites, shown as case studies with their links (Sun Beach House with ongoing SEO and GEO from Saint-Barthélemy, AlexAlu with paid search and SEO, Movida with local SEO in Nice). Prices: published on this page, no surprises, and the audit is free with no commitment, so you judge the work before paying. Method: this site applies it to itself (Schema.org structured data, an llms.txt file, fast pages). And one point of contact, Anthony Profit, sole trader in Nice (SIREN 850 723 552), who does the work in person and never promises a “guaranteed first place”.` },
        { q: "Why is the audit free?", a: `Because good decisions start from knowing where you stand. In ${DELAY.seoAudit.en}, I check your site's technical health, your Google rankings and your presence in ChatGPT, Perplexity and Gemini, then walk you through the priority actions on a call. You keep the diagnosis, with no commitment: fix it yourself, or hand me the compliance fix or the follow-up.` },
        { q: "Compliance fix or monthly follow-up: which one?", a: `The compliance fix (from ${formatPrice(PRICE.seoFix, "en")}, in ${DELAY.seoFix.en}) fixes what the audit found in one go: technical issues, tags, structured data, llms.txt, Google profile. The follow-up (from ${formatPrice(PRICE.seoMonthly, "en")} a month, ${COMMITMENT.seo} months minimum) includes those fixes, then goes after traffic every month: strategy, content, watch, report. Competitive market or growth goals: the follow-up; sound foundations only: the compliance fix.` },
        { q: "Do you only do technical SEO?", a: "No. Technical work is only the foundation. Most of the job is strategic and editorial: I look for the levers (your customers' searches, the questions they ask AI, angles your competitors have left open), build a plan and an editorial calendar, write or optimize the content, and ongoing marketing watch adjusts the plan over the months." },
        { q: "How much does an SEO & GEO consultant cost in Nice?", a: `There is no official rate card: the price depends mainly on how competitive your searches are, the state of your site and the content to produce. As a benchmark, an experienced freelance SEO consultant charges around €500 a day before VAT in France, and around €280 early in a career (Malt rate barometer, 2026). On monthly retainers, Ahrefs' survey of 439 providers (2024) found an average of about $1,349 for a freelancer and $3,209 for an agency. With me, the Google + AI visibility audit is free, the compliance fix starts at ${formatPrice(PRICE.seoFix, "en")} and SEO & GEO follow-up at ${formatPrice(PRICE.seoMonthly, "en")} a month, in-depth audit and fixes included (${COMMITMENT.seo} months minimum): below a freelancer's average monthly retainer. Net prices, no VAT charged.`, link: { href: "/en/blog/seo-cost-nice-pricing/", label: "See the SEO price grid for Nice" } },
        { q: "How long until SEO shows results?", a: "Technical fixes act within weeks; ranking gains on competitive queries usually take 3 to 6 months. In AI tools that search the web, like ChatGPT Search or Perplexity, a well-structured page can be cited as soon as it's indexed. For leads right away, Google Ads and ChatGPT Ads take over while SEO builds up." },
        { q: "Google Ads or ChatGPT Ads: where to start?", a: `Google Ads reaches people already searching for your service: the most direct way to get leads. ChatGPT Ads reaches people researching and comparing in ChatGPT, often earlier in their decision, with little competition so far. The combined pack (${formatPrice(PRICE.adsComboLaunch, "en")} then ${formatPrice(PRICE.adsComboMonthly, "en")} a month) does both with one consistent message and a budget shifted to where it pays most, ${formatPrice(ADS_SAVING, "en")} less over ${COMMITMENT.ads} months than separately.` },
        { q: "What is ChatGPT Ads, and should I use it?", a: `ChatGPT Ads is OpenAI's ad platform, open to advertisers in France and across Europe since late August 2026: ads shown below ChatGPT's answers (Free and Go plans), labeled “sponsored”. There are no keywords to buy: you describe the conversation contexts where the ad should appear, pick locations, and pay per click or per impression. It's the paid complement to GEO, not a shortcut: ads don't influence the answers. I launch your campaign in ${DELAY.chatgptAdsLaunch.en} for ${formatPrice(PRICE.chatgptAdsLaunch, "en")}, then optimize it for ${formatPrice(PRICE.chatgptAdsMonthly, "en")} a month.` },
        { q: "Why a 6-month commitment on ads?", a: `A campaign needs time to learn: the first weeks find the searches, contexts and ads that convert, the following months bring the cost per lead down. Over ${COMMITMENT.ads} months you measure a real return on investment. The ad budget stays yours: you set it, and can lower or pause it.` },
        { q: "Do you do local SEO in Nice?", a: "Yes: Google Business Profile, consistent name, address and phone (NAP) across directories, customer reviews, LocalBusiness structured data and city pages. The goal: show up in the Local Pack and on Google Maps in Nice, Antibes, Cannes, Monaco or your own area." },
        { q: "Do you work on an existing site?", a: "Yes, most SEO work starts from a live site, whatever it runs on: WordPress, Wix, Shopify or custom code. The free audit measures the potential before any commitment." },
      ],
    },
  },
  brand: {
    fr: {
      name: "Identité de marque",
      eyebrow: "Service · Design",
      h1Lines: ["Identité", "de marque."],
      lead: "Une identité visuelle forte et cohérente, du logo au site. Pas une jolie mise en page — l'image qui rend votre marque crédible et mémorable.",
      intro: [
        "Votre marque est jugée en quelques secondes. Avant de lire un mot, un prospect ressent un niveau de sérieux. La direction artistique consiste à maîtriser cette première impression : typographie, couleurs, rythme, ton — un système cohérent qui sert votre crédibilité partout.",
        "Je conçois des identités déclinables sur le web, le print et le social : pas un thème acheté, pas un logo isolé, mais un brand system qui tient dans le temps. L'identité et le site sont pensés ensemble, pour que la qualité perçue soit à la hauteur de la qualité réelle.",
        "Basé sur la Côte d'Azur, je travaille avec des marques exigeantes — luxe, B2B technique, créateurs — en France et à l'international.",
      ],
      includesTitle: "Ce qui est inclus",
      includes: [
        "Plateforme de marque & direction artistique",
        "Logotype et système d'identité",
        "Palette, typographie, design tokens",
        "Déclinaisons web, print et réseaux sociaux",
        "Guide de marque (brand guidelines)",
        "Cohérence identité ↔ site, pensée ensemble",
      ],
      methodTitle: "La méthode",
      method: [
        { n: "01", title: "Immersion", body: "Comprendre votre positionnement, votre marché et ce qui vous distingue vraiment." },
        { n: "02", title: "Direction artistique", body: "Pistes visuelles, territoire de marque, choix typographiques et chromatiques." },
        { n: "03", title: "Système", body: "Logo, déclinaisons, tokens et règles. Une identité cohérente, pas une image isolée." },
        { n: "04", title: "Livraison", body: "Guide de marque et fichiers sources. Prête à vivre sur le web comme ailleurs." },
      ],
      proofTitle: "Projets liés",
      relatedTitle: "Autres services",
      offers: [
        { name: "Logo + mini-charte", price: "brandLogo", from: true, delay: DELAY.brandLogo.fr, items: ["2 pistes de logo", "Couleurs et typographies", "Kit réseaux sociaux"] },
        { name: "Identité complète", price: "brandIdentity", from: true, delay: DELAY.brandIdentity.fr, items: ["Plateforme de marque", "Système visuel complet", "Guide de marque et fichiers sources"] },
      ],
      offersPerk: "Offert si vous me confiez la création ou la refonte de votre site : logo, mini-charte ou identité complète.",
      faqTitle: "Questions fréquentes",
      faq: [
        { q: "Combien coûte un logo et une identité de marque ?", a: `Le prix dépend de ce qu'on attend : un logo seul, un logo avec ses règles d'usage, ou une identité complète avec plateforme de marque et guide. Chez moi, un logo avec sa mini-charte démarre à ${formatPrice(PRICE.brandLogo, "fr")} (livré en ${DELAY.brandLogo.fr}), une identité complète avec plateforme et guide de marque à ${formatPrice(PRICE.brandIdentity, "fr")} (${DELAY.brandIdentity.fr}). Prix nets (TVA non applicable), fixés par écrit avec le délai. Et c'est offert si vous me confiez la création ou la refonte de votre site.` },
        { q: "Combien de temps faut-il pour créer un logo ?", a: `Cela dépend du nombre de pistes explorées et des allers-retours. Avec moi, comptez ${DELAY.brandLogo.fr} pour un logo avec sa mini-charte : 2 pistes, couleurs, typographies et kit réseaux sociaux. Une identité complète, avec plateforme de marque et guide, prend ${DELAY.brandIdentity.fr}. Le planning est fixé par écrit dès le départ.` },
        { q: "Quelle différence entre logo, charte graphique et identité de marque ?", a: "Le logo est le signe qui vous identifie. La charte graphique fixe ses règles d'usage : couleurs, typographies, espacements, déclinaisons. L'identité de marque englobe le tout, avec la plateforme de marque (positionnement, valeurs, ton), pour que votre image reste cohérente sur le site, les réseaux sociaux et le print." },
        { q: "Peut-on faire l'identité de marque sans le site ?", a: "Oui, l'identité de marque est une mission à part entière. Mais identité et site pensés ensemble donnent la meilleure cohérence, et dans ce cas l'identité est offerte : vous ne payez que le site." },
        { q: "Travaillez-vous avec des marques haut de gamme ?", a: "Oui : Sun Beach House (villas de luxe à Saint-Barthélemy), Eden Rock Yacht Rental (St Barths) et Royal Yacht International (superyachts, Monaco) font partie de mes projets d'identité. Le haut de gamme exige une précision que je traite comme un standard, pas une option." },
        { q: "Fournissez-vous un guide de marque et les fichiers sources ?", a: "Oui. Chaque identité est livrée avec ses règles d'usage et ses fichiers sources vectoriels, prêts pour le web, le print et les réseaux sociaux, pour que vos prestataires gardent la cohérence." },
      ],
    },
    en: {
      name: "Brand identity",
      eyebrow: "Service · Design",
      h1Lines: ["Brand", "identity."],
      lead: "A strong, coherent visual identity, from logo to website. Not a pretty layout — the image that makes your brand credible and memorable.",
      intro: [
        "Your brand is judged in seconds. Before reading a word, a prospect senses a level of seriousness. Art direction is about mastering that first impression: typography, color, rhythm, tone — a coherent system that serves your credibility everywhere.",
        "I design identities that scale across web, print and social: not a bought theme, not an isolated logo, but a brand system that lasts. Identity and website are designed together, so perceived quality matches the real thing.",
        "Based on the French Riviera, I work with demanding brands — luxury, technical B2B, creators — across France and internationally.",
      ],
      includesTitle: "What's included",
      includes: [
        "Brand platform & art direction",
        "Logotype and identity system",
        "Palette, typography, design tokens",
        "Web, print and social applications",
        "Brand guidelines",
        "Identity ↔ website coherence, designed together",
      ],
      methodTitle: "The method",
      method: [
        { n: "01", title: "Immersion", body: "Understand your positioning, market and what truly sets you apart." },
        { n: "02", title: "Art direction", body: "Visual directions, brand territory, typographic and chromatic choices." },
        { n: "03", title: "System", body: "Logo, applications, tokens and rules. A coherent identity, not an isolated image." },
        { n: "04", title: "Delivery", body: "Brand guide and source files. Ready to live on the web and beyond." },
      ],
      proofTitle: "Related projects",
      relatedTitle: "Other services",
      offers: [
        { name: "Logo + mini style guide", price: "brandLogo", from: true, delay: DELAY.brandLogo.en, items: ["2 logo directions", "Colors and typefaces", "Social media kit"] },
        { name: "Complete identity", price: "brandIdentity", from: true, delay: DELAY.brandIdentity.en, items: ["Brand platform", "Complete visual system", "Brand guidelines and source files"] },
      ],
      offersPerk: "Free when I build or redesign your website: logo, mini style guide or complete identity.",
      faqTitle: "Frequently asked questions",
      faq: [
        { q: "How much does a logo and brand identity cost?", a: `The price depends on what you need: a logo alone, a logo with its usage rules, or a complete identity with brand platform and guide. With me, a logo with its mini style guide starts at ${formatPrice(PRICE.brandLogo, "en")} (delivered in ${DELAY.brandLogo.en}), a complete identity with brand platform and guidelines at ${formatPrice(PRICE.brandIdentity, "en")} (${DELAY.brandIdentity.en}). Net prices (no VAT charged), fixed in writing with the timeline. And it's free when I build or redesign your website.` },
        { q: "How long does it take to design a logo?", a: `It depends on the number of directions explored and the rounds of feedback. With me, plan ${DELAY.brandLogo.en} for a logo with its mini style guide: 2 directions, colors, typefaces and a social media kit. A complete identity, with brand platform and guidelines, takes ${DELAY.brandIdentity.en}. The schedule is set in writing from the start.` },
        { q: "What's the difference between a logo, a style guide and a brand identity?", a: "The logo is the mark that identifies you. The style guide sets its usage rules: colors, typefaces, spacing, applications. The brand identity covers all of it, plus the brand platform (positioning, values, tone), so your image stays coherent on the website, social media and print." },
        { q: "Can I get the brand identity without the website?", a: "Yes, brand identity is a standalone engagement. But identity and site designed together give the strongest coherence, and in that case the identity is free: you only pay for the site." },
        { q: "Do you work with high-end brands?", a: "Yes: Sun Beach House (luxury villas in Saint-Barthélemy), Eden Rock Yacht Rental (St Barths) and Royal Yacht International (superyachts, Monaco) are among my identity projects. The high end demands a precision I treat as a standard, not an option." },
        { q: "Do you provide brand guidelines and source files?", a: "Yes. Every identity ships with its usage rules and vector source files, ready for web, print and social media, so your providers keep the consistency." },
      ],
    },
  },
  apps: {
    fr: {
      name: "Outils, apps & IA",
      eyebrow: "Service · Produit & IA",
      h1Lines: ["Outils, apps", "& IA sur-mesure."],
      lead: "Des outils métier, des applications web et mobiles et de l'IA branchée sur vos données — conçus et développés sur-mesure sur la Côte d'Azur. Moins de tâches répétitives, plus de temps pour votre métier.",
      intro: [
        "Tableurs qui débordent, copier-coller entre cinq logiciels, devis refaits à la main : beaucoup d'entreprises perdent des heures chaque semaine sur des tâches qu'un outil bien pensé ferait à leur place. Je conçois et développe ces outils sur-mesure — back-office, portail client, application web ou mobile — à partir de votre façon de travailler, pas l'inverse.",
        "L'IA n'est utile que branchée sur vos données et vos process. J'intègre les modèles de Claude et d'OpenAI là où ils font gagner du temps : un assistant qui répond à partir de vos documents, des premiers jets de devis ou de comptes-rendus, le tri des demandes entrantes, l'extraction d'informations, des agents qui enchaînent les tâches. Avec des garde-fous : vos données restent maîtrisées, et l'humain garde la main sur les décisions.",
        "Côté technique : Next.js, React et Node pour les applications, Supabase / PostgreSQL pour les données et l'authentification, n8n, Make ou Zapier quand une automatisation suffit — sans développement inutile. Je le pratique au quotidien sur Surly, la marketplace banque et assurance que j'ai co-fondée et dont je suis CTO depuis 2022. Comme pour mes sites, le code vous appartient. Basé près de Nice, je travaille avec des entreprises partout en France.",
      ],
      includesTitle: "Ce qui est inclus",
      includes: [
        "Cadrage métier : vos process, vos irritants, ce qui mérite vraiment d'être outillé",
        "Outils internes, back-offices, tableaux de bord et portails clients",
        "Applications web et mobiles (iOS / Android), du MVP à la mise en production",
        "IA intégrée (API Claude / OpenAI) : assistants sur vos documents, agents, génération et extraction de contenu",
        "Automatisations et intégrations : CRM, paiement, e-mail, ERP, API — via n8n, Make, Zapier ou code",
        "Base de données et authentification (Supabase / PostgreSQL), mise en ligne, documentation",
      ],
      methodTitle: "La méthode",
      method: [
        { n: "01", title: "Cadrage", body: "On part de votre quotidien : qui fait quoi, où ça coince, combien de temps ça coûte. Je chiffre ce qui vaut la peine d'être construit — et je vous dis quand un outil existant suffit." },
        { n: "02", title: "Prototype", body: "Une première version cliquable, vite, testée par les personnes qui l'utiliseront vraiment. On ajuste avant d'investir dans le développement complet." },
        { n: "03", title: "Développement", body: "Livraisons régulières sur un environnement de test. Pour l'IA, on mesure la qualité des réponses sur vos cas réels avant de la généraliser." },
        { n: "04", title: "Mise en production", body: "Déploiement, accès, documentation et prise en main par votre équipe, puis évolutions selon vos besoins." },
      ],
      proofTitle: "Projets liés",
      relatedTitle: "Autres services",
      offers: [
        { name: "Automatisation ou assistant IA", price: "appsStarter", delay: DELAY.appsStarter.fr, items: ["Une tâche automatisée (n8n, Make ou code)", "ou un assistant IA sur vos documents", "1 mois de suivi"] },
        { name: "Outil ou application sur-mesure", price: "appsCustom", from: true, delay: "fixé au devis", items: ["Cadrage et prototype cliquable", "Web ou mobile, base de données et comptes", "Mise en ligne et documentation"] },
      ],
      faqTitle: "Questions fréquentes",
      faq: [
        { q: "Combien coûte une application ou un outil sur-mesure ?", a: `Le prix dépend surtout du périmètre, des intégrations avec vos outils et de la plateforme (web, mobile ou les deux). Chez moi, une automatisation ou un assistant IA sur vos documents coûte ${formatPrice(PRICE.appsStarter, "fr")}, livré en ${DELAY.appsStarter.fr}. Un outil ou une application sur-mesure démarre à ${formatPrice(PRICE.appsCustom, "fr")}. Quand c'est possible, je commence par un MVP ciblé pour valider l'usage avant d'aller plus loin.` },
        { q: "Combien de temps faut-il pour développer une application ?", a: `Cela dépend du périmètre et des intégrations. Avec moi, une automatisation ou un assistant IA est livré en ${DELAY.appsStarter.fr}. Pour un outil ou une application sur-mesure, le planning est fixé au cadrage, après un prototype cliquable : on commence souvent par un MVP centré sur l'usage principal, puis on l'enrichit.` },
        { q: "Comment l'IA peut-elle aider une petite entreprise ?", a: "En la branchant sur un vrai besoin : répondre aux questions récurrentes à partir de vos documents, préparer des devis ou des comptes-rendus, trier les demandes entrantes, extraire les données de PDF. J'intègre les modèles de Claude et d'OpenAI, et je vous dis honnêtement quand une simple automatisation suffit." },
        { q: "Que deviennent mes données avec l'IA ?", a: "Elles restent sous votre contrôle : hébergement choisi avec vous, accès limités, et API d'IA utilisées dans des conditions où vos données ne servent pas à entraîner les modèles. Les sujets sensibles (RGPD, données clients) sont traités dès le cadrage." },
        { q: "No-code (n8n, Make, Zapier) ou développement sur-mesure ?", a: "Les deux, selon le besoin. n8n, Make ou Zapier sont parfaits pour connecter des outils rapidement ; dès que la logique métier se complexifie ou que les volumes augmentent, un développement sur-mesure devient plus fiable et moins cher à long terme." },
        { q: "Développez-vous des applications mobiles iOS et Android ?", a: "Oui, quand l'usage le justifie : équipes sur le terrain, clients réguliers, fonctions du téléphone (photo, géolocalisation, notifications). Souvent, une application web installable sur l'écran d'accueil suffit et coûte moins cher : je vous le dis dès le cadrage." },
        { q: "Le code m'appartient-il ?", a: "Oui, entièrement. À la livraison, vous récupérez le code, les accès et la documentation. Aucun verrou propriétaire." },
      ],
    },
    en: {
      name: "Tools, apps & AI",
      eyebrow: "Service · Product & AI",
      h1Lines: ["Custom tools,", "apps & AI."],
      lead: "Business tools, web and mobile apps, and AI wired into your data — designed and built to measure on the French Riviera. Fewer repetitive tasks, more time for your actual work.",
      intro: [
        "Overflowing spreadsheets, copy-pasting between five tools, quotes rebuilt by hand: many businesses lose hours every week on tasks a well-designed tool would do for them. I design and build those tools to measure — back-office, client portal, web or mobile app — around the way you work, not the other way round.",
        "AI only helps when it's plugged into your data and processes. I integrate Claude and OpenAI models where they save time: an assistant that answers from your documents, first drafts of quotes or reports, triage of incoming requests, data extraction, agents that chain tasks together. With guardrails: your data stays under control, and humans keep the final say.",
        "Under the hood: Next.js, React and Node for the apps, Supabase / PostgreSQL for data and authentication, n8n, Make or Zapier when an automation is enough — no needless development. I practice it daily on Surly, the banking & insurance marketplace I co-founded and have run as CTO since 2022. As with my websites, you own the code. Based near Nice, I work with businesses across France and internationally.",
      ],
      includesTitle: "What's included",
      includes: [
        "Business scoping: your processes, your pain points, what's really worth building",
        "Internal tools, back-offices, dashboards and client portals",
        "Web and mobile apps (iOS / Android), from MVP to production",
        "Built-in AI (Claude / OpenAI APIs): assistants on your documents, agents, content generation and extraction",
        "Automations and integrations: CRM, payments, email, ERP, APIs — via n8n, Make, Zapier or code",
        "Database and authentication (Supabase / PostgreSQL), launch, documentation",
      ],
      methodTitle: "The method",
      method: [
        { n: "01", title: "Scoping", body: "We start from your day-to-day: who does what, where it jams, what it costs in time. I price what's worth building — and tell you when an existing tool will do." },
        { n: "02", title: "Prototype", body: "A first clickable version, fast, tested by the people who will actually use it. We adjust before investing in the full build." },
        { n: "03", title: "Development", body: "Regular deliveries on a test environment. For AI, we measure answer quality on your real cases before rolling it out." },
        { n: "04", title: "Launch", body: "Deployment, access, documentation and onboarding for your team, then improvements as your needs evolve." },
      ],
      proofTitle: "Related projects",
      relatedTitle: "Other services",
      offers: [
        { name: "Automation or AI assistant", price: "appsStarter", delay: DELAY.appsStarter.en, items: ["One automated task (n8n, Make or code)", "or an AI assistant on your documents", "1 month of follow-up"] },
        { name: "Custom tool or app", price: "appsCustom", from: true, delay: "set in the quote", items: ["Scoping and clickable prototype", "Web or mobile, database and accounts", "Launch and documentation"] },
      ],
      faqTitle: "Frequently asked questions",
      faq: [
        { q: "How much does a custom app or business tool cost?", a: `The price depends mainly on the scope, the integrations with your tools and the platform (web, mobile or both). With me, an automation or an AI assistant on your documents costs ${formatPrice(PRICE.appsStarter, "en")}, delivered in ${DELAY.appsStarter.en}. A custom tool or app starts at ${formatPrice(PRICE.appsCustom, "en")}. When possible, I start with a focused MVP to validate usage before going further.` },
        { q: "How long does it take to build an app?", a: `It depends on the scope and the integrations. With me, an automation or an AI assistant ships in ${DELAY.appsStarter.en}. For a custom tool or app, the schedule is set during scoping, after a clickable prototype: we often start with an MVP focused on the main use, then build on it.` },
        { q: "How can AI help a small business?", a: "By plugging it into a real need: answering recurring questions from your documents, preparing quotes or reports, triaging incoming requests, extracting data from PDFs. I integrate Claude and OpenAI models, and I'll tell you honestly when a simple automation is enough." },
        { q: "What happens to my data with AI?", a: "It stays under your control: hosting chosen with you, restricted access, and AI APIs used under terms where your data isn't used to train the models. Sensitive topics (GDPR, customer data) are handled from scoping." },
        { q: "No-code (n8n, Make, Zapier) or custom development?", a: "Both, depending on the need. n8n, Make or Zapier are great for connecting tools quickly; once business logic gets complex or volumes grow, custom development becomes more reliable and cheaper over time." },
        { q: "Do you build iOS and Android mobile apps?", a: "Yes, when the use case calls for it: field teams, returning customers, phone features (camera, location, notifications). Often a web app installable on the home screen is enough and costs less: I'll tell you during scoping." },
        { q: "Do I own the code?", a: "Yes, fully. On delivery you get the code, access and documentation. No proprietary lock-in." },
      ],
    },
  },
};

export interface ServicePage extends ServicePageMeta {
  content: ServicePageContent;
  /** The other services, for the cross-link block. */
  related: { id: ServiceId; name: string; path: string }[];
}

export function getServicePage(id: ServiceId, lang: Lang): ServicePage | null {
  const meta = SERVICE_PAGES.find((s) => s.id === id);
  if (!meta) return null;
  const related = SERVICE_PAGES.filter((s) => s.id !== id).map((s) => ({
    id: s.id,
    name: CONTENT[s.id][lang].name,
    path: s.path[lang],
  }));
  return { ...meta, content: CONTENT[id][lang], related };
}

/** An offer's price in words: "dès 490 €/mois", "250 € puis 90 €/mois",
 *  "gratuit", "sur devis" (llms-full.txt, the project form). */
export const offerPriceText = (o: ServiceOffer, lang: Lang): string => {
  const fr = lang === "fr";
  const eur = (k: keyof typeof PRICE): string => formatPrice(PRICE[k], lang);
  if (o.free) return fr ? "gratuit" : "free";
  if (!o.price) return fr ? "sur devis" : "on quote";
  return `${o.from ? (fr ? "dès " : "from ") : ""}${eur(o.price)}${o.unit ?? ""}${o.then ? `${fr ? " puis " : " then "}${eur(o.then.price)}${o.then.unit}` : ""}`;
};

/** Compact list of all services for the /services/ hub page. */
export function getAllServicePages(
  lang: Lang
): { id: ServiceId; name: string; eyebrow: string; lead: string; path: string }[] {
  return SERVICE_PAGES.map((s) => ({
    id: s.id,
    name: CONTENT[s.id][lang].name,
    eyebrow: CONTENT[s.id][lang].eyebrow,
    lead: CONTENT[s.id][lang].lead,
    path: s.path[lang],
  }));
}
