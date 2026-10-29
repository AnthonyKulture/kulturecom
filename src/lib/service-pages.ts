import type { Lang } from "~/i18n/ui";
import { DELAY, PRICE, formatPrice } from "~/lib/facts";

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
}

/** A priced formula shown in the "Formules" block of a service page. */
export interface ServiceOffer {
  name: string;
  /** Key of the shared price list (src/lib/facts.ts); none → "sur devis". */
  price?: keyof typeof PRICE;
  /** true → "dès X €" (starting price of a full project). */
  from?: boolean;
  /** e.g. "/mois" for a monthly plan. */
  unit?: string;
  delay: string;
  items: string[];
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

const CONTENT: Record<ServiceId, Record<Lang, ServicePageContent>> = {
  web: {
    fr: {
      name: "Création de site internet",
      eyebrow: "Service · Développement",
      h1Lines: ["Création de site", "sur-mesure à Nice."],
      lead: "Des sites internet conçus et codés à la main sur la Côte d'Azur — rapides, accessibles, taillés pour votre marque. Aucun template, aucun compromis sur la performance.",
      intro: [
        "Un site sur-mesure n'est pas un thème acheté qu'on habille à vos couleurs. C'est une architecture pensée pour vos objectifs : convertir, rassurer, durer. Je conçois et développe chaque projet de la première maquette à la mise en ligne — design, code et performance sous une seule main, sans agence à trois équipes qui se renvoient des fichiers.",
        "Stack moderne (Astro, React, TypeScript), Core Web Vitals au vert, accessibilité WCAG AA, et un code que vous possédez entièrement à la livraison. Un site qui charge avant que le concurrent ait fini son animation d'entrée, et qui tient dix ans plutôt que dix mois.",
        "Basé à Nice, je travaille avec des PME, des marques B2B techniques et des créateurs partout en France et à l'international.",
      ],
      includesTitle: "Ce qui est inclus",
      includes: [
        "Cadrage et architecture de l'information",
        "Direction artistique et maquettes haute-fidélité (Figma)",
        "Développement front sur-mesure (Astro / React / TypeScript)",
        "Intégration CMS headless pour votre autonomie (Sanity, Strapi)",
        "Performance : Lighthouse ≥ 95, Core Web Vitals au vert",
        "Accessibilité WCAG AA, SEO technique de base, mise en ligne",
      ],
      methodTitle: "La méthode",
      method: [
        { n: "01", title: "Audit & cadrage", body: "Comprendre votre marché, vos objectifs et votre cible avant de dessiner quoi que ce soit. Pas de devis sans cette étape." },
        { n: "02", title: "Design", body: "Maquettes haute-fidélité Figma, itérations rapides commentées en vidéo. Pas de wireframe basse-fi qui retarde la décision." },
        { n: "03", title: "Développement", body: "Code propre, performance-first, intégration CMS. Vous suivez l'avancement sur un environnement de préversion." },
        { n: "04", title: "Mise en ligne & suivi", body: "Déploiement, Search Console branchée, tracking validé. 30 jours de suivi inclus." },
      ],
      proofTitle: "Projets liés",
      relatedTitle: "Autres services",
      offers: [
        { name: "Site une page", price: "webOnePage", delay: DELAY.webOnePage.fr, items: ["Design et code sur-mesure", "Mobile et rapide (Lighthouse ≥ 95)", "SEO et visibilité IA de base, mise en ligne"] },
        { name: "Site vitrine", price: "webShowcase", from: true, delay: DELAY.webShowcase.fr, items: ["5 à 8 pages sur-mesure", "Outil d'édition pour être autonome", "SEO complet et 30 jours de suivi"] },
      ],
      offersPerk: "Identité de marque offerte : logo, mini-charte ou identité complète, inclus dans la création ou la refonte de votre site.",
      faqTitle: "Questions fréquentes",
      faq: [
        { q: "Combien coûte un site internet sur-mesure ?", a: `Un site une page sur-mesure coûte ${formatPrice(PRICE.webOnePage, "fr")} et se livre en ${DELAY.webOnePage.fr} ; un site vitrine de 5 à 8 pages avec outil d'édition démarre à ${formatPrice(PRICE.webShowcase, "fr")}, livré en ${DELAY.webShowcase.fr}. Le logo et l'identité de marque sont offerts. Prix nets (TVA non applicable), fixés par écrit avec le délai après un premier échange : le montant exact dépend du nombre de pages et des fonctionnalités.` },
        { q: "Combien de temps faut-il pour créer un site internet ?", a: `Comptez ${DELAY.webOnePage.fr} pour un site une page et ${DELAY.webShowcase.fr} pour un site vitrine de 5 à 8 pages. Les projets plus lourds (e-commerce, plateforme, 3D) sont planifiés au cadrage. Pendant le projet, vous suivez l'avancement sur une préversion en ligne et validez chaque étape.` },
        { q: "Site sur-mesure ou WordPress, Wix : que choisir ?", a: "Un site sur-mesure (Astro, Next.js) charge plus vite, se référence mieux et ne dépend d'aucun thème ni plugin à mettre à jour. Wix ou un thème WordPress peuvent suffire pour un petit budget sans objectif de visibilité. Pour modifier vos contenus vous-même, j'intègre un outil d'édition simple, ou WordPress si votre équipe le connaît déjà." },
        { q: "Mon site sera-t-il visible sur Google et dans les IA ?", a: `Oui, les fondations sont incluses : SEO technique, données structurées Schema.org, fichier llms.txt, score Lighthouse ≥ 95 et Core Web Vitals au vert. Le site vitrine ajoute le SEO complet et 30 jours de suivi. Pour aller plus loin (contenus, ChatGPT Ads, suivi mensuel), l'accompagnement SEO & GEO démarre à ${formatPrice(PRICE.seoAudit, "fr")}.` },
        { q: "Faites-vous la refonte de sites existants ?", a: "Oui. Je refais votre site (WordPress, Wix ou autre) sans perdre votre référencement : redirections 301, URLs et contenus qui performent conservés, Search Console suivie après la mise en ligne. La refonte du logo et de l'identité de marque est offerte dans le même projet." },
        { q: "Le code de mon site m'appartient-il ?", a: "Oui, entièrement. À la livraison, vous récupérez le code source, les accès et la documentation. Aucun verrou propriétaire : vous pouvez faire évoluer le site avec moi ou avec un autre prestataire." },
      ],
    },
    en: {
      name: "Web development",
      eyebrow: "Service · Development",
      h1Lines: ["Custom web", "development."],
      lead: "Websites designed and coded by hand on the French Riviera — fast, accessible, built for your brand. No templates, no compromise on performance.",
      intro: [
        "A custom website isn't a bought theme dressed in your colors. It's an architecture built for your goals: convert, reassure, last. I design and develop every project from the first mockup to launch — design, code and performance under a single hand, with no three-team agency passing files around.",
        "Modern stack (Astro, React, TypeScript), green Core Web Vitals, WCAG AA accessibility, and code you fully own on delivery. A site that loads before the competitor finishes its intro animation, and lasts ten years rather than ten months.",
        "Based in Nice, I work with SMBs, technical B2B brands and creators across France and internationally.",
      ],
      includesTitle: "What's included",
      includes: [
        "Scoping and information architecture",
        "Art direction and high-fidelity mockups (Figma)",
        "Custom front-end development (Astro / React / TypeScript)",
        "Headless CMS integration for your autonomy (Sanity, Strapi)",
        "Performance: Lighthouse ≥ 95, green Core Web Vitals",
        "WCAG AA accessibility, technical SEO baseline, launch",
      ],
      methodTitle: "The method",
      method: [
        { n: "01", title: "Audit & scoping", body: "Understand your market, goals and audience before drawing anything. No quote without this step." },
        { n: "02", title: "Design", body: "High-fidelity Figma mockups, fast iterations reviewed over video. No low-fi wireframes that stall decisions." },
        { n: "03", title: "Development", body: "Clean, performance-first code with CMS integration. You follow progress on a preview environment." },
        { n: "04", title: "Launch & follow-up", body: "Deployment, Search Console connected, tracking validated. 30 days of follow-up included." },
      ],
      proofTitle: "Related projects",
      relatedTitle: "Other services",
      offers: [
        { name: "One-page site", price: "webOnePage", delay: DELAY.webOnePage.en, items: ["Custom design and code", "Mobile-ready and fast (Lighthouse ≥ 95)", "Core SEO and AI visibility, launch"] },
        { name: "Showcase site", price: "webShowcase", from: true, delay: DELAY.webShowcase.en, items: ["5 to 8 custom pages", "Editing tool so you stay autonomous", "Full SEO and 30 days of follow-up"] },
      ],
      offersPerk: "Brand identity included free: logo, mini style guide or complete identity come with your new or redesigned website.",
      faqTitle: "Frequently asked questions",
      faq: [
        { q: "How much does a custom website cost?", a: `A custom one-page site costs ${formatPrice(PRICE.webOnePage, "en")} and ships in ${DELAY.webOnePage.en}; a 5 to 8-page showcase site with an editing tool starts at ${formatPrice(PRICE.webShowcase, "en")}, delivered in ${DELAY.webShowcase.en}. Logo and brand identity are included free. Net prices (no VAT charged), fixed in writing with the timeline after a first call: the exact amount depends on page count and features.` },
        { q: "How long does it take to build a website?", a: `Plan ${DELAY.webOnePage.en} for a one-page site and ${DELAY.webShowcase.en} for a 5 to 8-page showcase site. Heavier builds (e-commerce, platform, 3D) are scheduled during scoping. Throughout the project you follow progress on a live preview and sign off each step.` },
        { q: "Custom website or WordPress, Wix: which to choose?", a: "A custom site (Astro, Next.js) loads faster, ranks better and depends on no theme or plugin to keep updated. Wix or a WordPress theme can do for a small budget with no visibility goal. To edit your content yourself, I add a simple editing tool, or WordPress if your team already knows it." },
        { q: "Will my site be visible on Google and in AI answers?", a: `Yes, the foundations are included: technical SEO, Schema.org structured data, an llms.txt file, a Lighthouse score ≥ 95 and green Core Web Vitals. The showcase site adds full SEO and 30 days of follow-up. To go further (content, ChatGPT Ads, monthly follow-up), SEO & GEO work starts at ${formatPrice(PRICE.seoAudit, "en")}.` },
        { q: "Do you redesign existing websites?", a: "Yes. I rebuild your site (WordPress, Wix or other) without losing your rankings: 301 redirects, top-performing URLs and content kept, Search Console monitored after launch. Redesigning your logo and brand identity is included free in the same project." },
        { q: "Do I own my website's code?", a: "Yes, fully. On delivery you get the source code, access and documentation. No proprietary lock-in: you can evolve the site with me or with another provider." },
      ],
    },
  },
  seo: {
    fr: {
      name: "SEO & GEO",
      eyebrow: "Service · Visibilité",
      h1Lines: ["Stratégie", "SEO & GEO."],
      lead: "Être trouvé sur Google, cité par les IA et visible jusque dans ChatGPT Ads. Une stratégie complète, de la veille aux contenus en passant par la technique, qui transforme un beau site invisible en source de trafic durable.",
      intro: [
        "Le SEO ne se résume plus à Google. ChatGPT, Perplexity, Gemini et les AI Overviews répondent désormais aux questions de vos clients en citant des sources. Le GEO (Generative Engine Optimization) consiste à structurer votre site pour qu'il soit cité, pas seulement listé.",
        "Je travaille les deux ensemble, de la stratégie à l'exécution. D'abord, je cherche les leviers : ce que vos clients tapent sur Google, les questions qu'ils posent aux IA, les sujets que vos concurrents ont laissés libres. J'en tire un plan d'action et un calendrier éditorial, puis je rédige ou j'optimise les contenus qui vont chercher ce trafic.",
        "La technique sert de fondation : audit (crawl, indexation, Core Web Vitals), données structurées Schema.org, llms.txt et optimisation on-page. Une veille marketing et concurrentielle continue ajuste ensuite le plan, mois après mois.",
        "Depuis fin août 2026, ChatGPT affiche aussi de la publicité en France : ChatGPT Ads. Les annonces apparaissent sous la réponse, marquées « sponsorisé », et n'influencent pas son contenu — OpenAI s'y engage. Le GEO vous fait citer dans la réponse, ChatGPT Ads vous place juste en dessous : je configure et pilote les campagnes, du ciblage par contexte de conversation au suivi des conversions.",
        "Basé à Nice, j'accompagne des marques en France et à l'international, du référencement local à la visibilité internationale.",
      ],
      includesTitle: "Ce qui est inclus",
      includes: [
        "Stratégie SEO & GEO : leviers de croissance, mots-clés, questions de vos clients",
        "Plan éditorial et calendrier de publication",
        "Rédaction et optimisation des contenus : pages, articles, FAQ",
        "Veille marketing et concurrentielle",
        "Audit technique (crawl, indexation, logs, Core Web Vitals) et données structurées Schema.org",
        "Optimisation GEO : llms.txt, citabilité, entités",
        "Campagnes ChatGPT Ads : ciblage, annonces, enchères, suivi des conversions",
        "Search Console, GA4, suivi des positions",
      ],
      methodTitle: "La méthode",
      method: [
        { n: "01", title: "Audit & veille", body: "État des lieux technique, éditorial et concurrentiel, et ce que vos clients cherchent vraiment. Ce qui bloque, ce qui manque, ce qui rapporte." },
        { n: "02", title: "Stratégie", body: "Les leviers classés par impact, un plan d'action et un calendrier éditorial. Vous savez quoi faire, dans quel ordre et pourquoi." },
        { n: "03", title: "Contenus & technique", body: "Corrections techniques en fondation, puis rédaction et optimisation des contenus, signaux d'entité pour Google et les IA." },
        { n: "04", title: "Mesure & ajustement", body: "Search Console, positions, citations dans les IA. On pilote sur des chiffres et on ajuste le plan chaque mois." },
      ],
      proofTitle: "Projets liés",
      relatedTitle: "Autres services",
      offers: [
        { name: "Audit visibilité Google + IA", price: "seoAudit", delay: DELAY.seoAudit.fr, items: ["Audit technique, éditorial et concurrentiel", "Votre présence testée dans ChatGPT, Perplexity et Gemini", "Stratégie et plan d'action priorisés, visio d'1 h"] },
        { name: "Lancement ChatGPT Ads", price: "adsLaunch", delay: DELAY.adsLaunch.fr, items: ["Ciblage et annonces", "Suivi des conversions conforme au RGPD", "1 mois d'optimisation, budget pub en plus"] },
        { name: "Suivi SEO & GEO", price: "seoMonthly", from: true, unit: "/mois", delay: "3 mois minimum", items: ["Plan éditorial et rédaction des contenus", "Veille marketing et concurrentielle", "Corrections techniques et rapport chaque mois"] },
      ],
      faqTitle: "Questions fréquentes",
      faq: [
        { q: "Qu'est-ce que le GEO, et quelle différence avec le SEO ?", a: "Le GEO (Generative Engine Optimization) vise à être cité par les moteurs génératifs (ChatGPT, Perplexity, Gemini, Google AI Overviews), quand le SEO vise le classement dans les résultats Google. Les deux partagent les mêmes fondations : site rapide, contenus utiles, données structurées. Le GEO y ajoute des réponses courtes et citables, un fichier llms.txt et des mentions sur des sources de confiance." },
        { q: "Faites-vous seulement du SEO technique ?", a: "Non. La technique n'est que la fondation. L'essentiel du travail est stratégique et éditorial : je cherche les leviers (requêtes de vos clients, questions posées aux IA, angles laissés libres par vos concurrents), je construis un plan et un calendrier éditorial, je rédige ou j'optimise les contenus, et une veille marketing continue ajuste le plan au fil des mois." },
        { q: "Comment savoir si mon entreprise est citée par ChatGPT ?", a: `C'est le point de départ de l'audit de visibilité Google + IA (${formatPrice(PRICE.seoAudit, "fr")}, livré en ${DELAY.seoAudit.fr}) : je pose à ChatGPT, Perplexity et Gemini les questions de vos clients, je relève qui est cité à votre place et pourquoi, puis je vous présente un plan d'action priorisé en visio d'1 h.` },
        { q: "Combien coûte un consultant SEO & GEO à Nice ?", a: `L'audit de visibilité Google + IA coûte ${formatPrice(PRICE.seoAudit, "fr")} (livré en ${DELAY.seoAudit.fr}), le suivi mensuel SEO & GEO démarre à ${formatPrice(PRICE.seoMonthly, "fr")} par mois (3 mois minimum) et le lancement d'une campagne ChatGPT Ads coûte ${formatPrice(PRICE.adsLaunch, "fr")}, budget publicitaire en plus. Prix nets, TVA non applicable.` },
        { q: "En combien de temps voit-on des résultats en SEO ?", a: "Les corrections techniques agissent en quelques semaines ; les gains de positions sur des requêtes concurrentielles prennent généralement 3 à 6 mois. Dans les IA qui consultent le web, comme ChatGPT Search ou Perplexity, une page bien structurée peut être citée dès qu'elle est indexée. Le SEO est un investissement, pas un interrupteur." },
        { q: "Qu'est-ce que ChatGPT Ads, et faut-il s'y mettre ?", a: `ChatGPT Ads est la régie publicitaire d'OpenAI, ouverte aux annonceurs en France depuis fin août 2026 : des annonces affichées sous les réponses de ChatGPT (offres gratuite et Go), marquées « sponsorisé ». Pas de mots-clés à acheter : on décrit les contextes de conversation où l'annonce doit apparaître, on choisit les zones, et on paie au clic ou à l'impression. C'est le complément payant du GEO, pas un raccourci : les annonces n'influencent pas les réponses. Je lance votre campagne en ${DELAY.adsLaunch.fr} pour ${formatPrice(PRICE.adsLaunch, "fr")}, avec un budget maîtrisé et un suivi des conversions conforme au RGPD.` },
        { q: "Faites-vous du référencement local à Nice ?", a: "Oui : fiche Google Business Profile, cohérence du nom, de l'adresse et du téléphone (NAP) sur les annuaires, avis clients, données structurées LocalBusiness et pages par ville. L'objectif : apparaître dans le Local Pack et sur Google Maps à Nice, Antibes, Cannes, Monaco ou dans votre zone." },
        { q: "Travaillez-vous sur un site existant ?", a: "Oui, la plupart des missions SEO partent d'un site déjà en ligne, quel que soit l'outil : WordPress, Wix, Shopify ou site sur-mesure. L'audit mesure le potentiel avant tout engagement." },
      ],
    },
    en: {
      name: "SEO & GEO",
      eyebrow: "Service · Visibility",
      h1Lines: ["SEO & GEO", "strategy."],
      lead: "Get found on Google, cited by AI and visible right inside ChatGPT Ads. A complete strategy, from market watch to content to technical work, that turns a beautiful, invisible site into lasting traffic.",
      intro: [
        "SEO is no longer just Google. ChatGPT, Perplexity, Gemini and AI Overviews now answer your customers' questions by citing sources. GEO (Generative Engine Optimization) structures your site to be cited, not just listed.",
        "I work both together, from strategy to execution. First I look for the levers: what your customers type into Google, the questions they ask AI, the topics your competitors have left open. That becomes an action plan and an editorial calendar, then I write or optimize the content that goes after that traffic.",
        "Technical work is the foundation: audit (crawl, indexing, Core Web Vitals), Schema.org structured data, llms.txt and on-page optimization. Ongoing marketing and competitor watch then adjusts the plan, month after month.",
        "Since late August 2026, ChatGPT also shows ads in France and across Europe: ChatGPT Ads. Ads appear below the answer, labeled “sponsored”, and don't influence its content — OpenAI commits to that. GEO gets you cited in the answer, ChatGPT Ads places you right below it: I set up and run the campaigns, from conversation-context targeting to conversion tracking.",
        "Based in Nice, I work with brands across France and internationally — from local search to international visibility.",
      ],
      includesTitle: "What's included",
      includes: [
        "SEO & GEO strategy: growth levers, keywords, your customers' questions",
        "Editorial plan and publishing calendar",
        "Content writing and optimization: pages, articles, FAQs",
        "Marketing and competitor watch",
        "Technical audit (crawl, indexing, logs, Core Web Vitals) and Schema.org structured data",
        "GEO optimization: llms.txt, citability, entities",
        "ChatGPT Ads campaigns: targeting, ads, bidding, conversion tracking",
        "Search Console, GA4, rank tracking",
      ],
      methodTitle: "The method",
      method: [
        { n: "01", title: "Audit & watch", body: "Technical, editorial and competitive baseline, and what your customers are really searching for. What blocks, what's missing, what pays." },
        { n: "02", title: "Strategy", body: "Levers ranked by impact, an action plan and an editorial calendar. You know what to do, in what order and why." },
        { n: "03", title: "Content & technical", body: "Technical fixes as the foundation, then content writing and optimization, entity signals for Google and AI." },
        { n: "04", title: "Measure & adjust", body: "Search Console, rankings, AI citations. We steer on numbers and adjust the plan every month." },
      ],
      proofTitle: "Related projects",
      relatedTitle: "Other services",
      offers: [
        { name: "Google + AI visibility audit", price: "seoAudit", delay: DELAY.seoAudit.en, items: ["Technical, editorial and competitive audit", "Your presence tested in ChatGPT, Perplexity and Gemini", "Prioritized strategy and action plan, 1-hour call"] },
        { name: "ChatGPT Ads launch", price: "adsLaunch", delay: DELAY.adsLaunch.en, items: ["Targeting and ads", "GDPR-compliant conversion tracking", "1 month of optimization, ad budget on top"] },
        { name: "SEO & GEO follow-up", price: "seoMonthly", from: true, unit: "/month", delay: "3 months minimum", items: ["Editorial plan and content writing", "Marketing and competitor watch", "Technical fixes and a monthly report"] },
      ],
      faqTitle: "Frequently asked questions",
      faq: [
        { q: "What is GEO, and how is it different from SEO?", a: "GEO (Generative Engine Optimization) aims to get you cited by generative engines (ChatGPT, Perplexity, Gemini, Google AI Overviews), while SEO aims to rank you in Google's results. Both share the same foundations: a fast site, useful content, structured data. GEO adds short, quotable answers, an llms.txt file and mentions on trusted sources." },
        { q: "Do you only do technical SEO?", a: "No. Technical work is only the foundation. Most of the job is strategic and editorial: I look for the levers (your customers' searches, the questions they ask AI, angles your competitors have left open), build a plan and an editorial calendar, write or optimize the content, and ongoing marketing watch adjusts the plan over the months." },
        { q: "How do I know if ChatGPT cites my business?", a: `That's where the Google + AI visibility audit starts (${formatPrice(PRICE.seoAudit, "en")}, delivered in ${DELAY.seoAudit.en}): I ask ChatGPT, Perplexity and Gemini your customers' questions, note who gets cited instead of you and why, then walk you through a prioritized action plan in a 1-hour call.` },
        { q: "How much does an SEO & GEO consultant cost in Nice?", a: `The Google + AI visibility audit costs ${formatPrice(PRICE.seoAudit, "en")} (delivered in ${DELAY.seoAudit.en}), monthly SEO & GEO follow-up starts at ${formatPrice(PRICE.seoMonthly, "en")} per month (3 months minimum) and a ChatGPT Ads campaign launch costs ${formatPrice(PRICE.adsLaunch, "en")}, ad budget on top. Net prices, no VAT charged.` },
        { q: "How long until SEO shows results?", a: "Technical fixes act within weeks; ranking gains on competitive queries usually take 3 to 6 months. In AI tools that search the web, like ChatGPT Search or Perplexity, a well-structured page can be cited as soon as it's indexed. SEO is an investment, not a switch." },
        { q: "What is ChatGPT Ads, and should I use it?", a: `ChatGPT Ads is OpenAI's ad platform, open to advertisers in France and across Europe since late August 2026: ads shown below ChatGPT's answers (Free and Go plans), labeled “sponsored”. There are no keywords to buy: you describe the conversation contexts where the ad should appear, pick locations, and pay per click or per impression. It's the paid complement to GEO, not a shortcut: ads don't influence the answers. I launch your campaign in ${DELAY.adsLaunch.en} for ${formatPrice(PRICE.adsLaunch, "en")}, with a controlled budget and GDPR-compliant conversion tracking.` },
        { q: "Do you do local SEO in Nice?", a: "Yes: Google Business Profile, consistent name, address and phone (NAP) across directories, customer reviews, LocalBusiness structured data and city pages. The goal: show up in the Local Pack and on Google Maps in Nice, Antibes, Cannes, Monaco or your own area." },
        { q: "Do you work on an existing site?", a: "Yes, most SEO work starts from a live site, whatever it runs on: WordPress, Wix, Shopify or custom code. The audit measures the potential before any commitment." },
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
        { q: "Combien coûte un logo et une identité de marque ?", a: `Un logo avec sa mini-charte démarre à ${formatPrice(PRICE.brandLogo, "fr")} (livré en ${DELAY.brandLogo.fr}), une identité complète avec plateforme et guide de marque à ${formatPrice(PRICE.brandIdentity, "fr")} (${DELAY.brandIdentity.fr}). Prix nets (TVA non applicable), fixés par écrit avec le délai. Et c'est offert si vous me confiez la création ou la refonte de votre site.` },
        { q: "Combien de temps faut-il pour créer un logo ?", a: `Comptez ${DELAY.brandLogo.fr} pour un logo avec sa mini-charte : 2 pistes, couleurs, typographies et kit réseaux sociaux. Une identité complète, avec plateforme de marque et guide, prend ${DELAY.brandIdentity.fr}. Le planning est fixé par écrit dès le départ.` },
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
        { q: "How much does a logo and brand identity cost?", a: `A logo with its mini style guide starts at ${formatPrice(PRICE.brandLogo, "en")} (delivered in ${DELAY.brandLogo.en}), a complete identity with brand platform and guidelines at ${formatPrice(PRICE.brandIdentity, "en")} (${DELAY.brandIdentity.en}). Net prices (no VAT charged), fixed in writing with the timeline. And it's free when I build or redesign your website.` },
        { q: "How long does it take to design a logo?", a: `Plan ${DELAY.brandLogo.en} for a logo with its mini style guide: 2 directions, colors, typefaces and a social media kit. A complete identity, with brand platform and guidelines, takes ${DELAY.brandIdentity.en}. The schedule is set in writing from the start.` },
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
        { q: "Combien coûte une application ou un outil sur-mesure ?", a: `Une automatisation ou un assistant IA sur vos documents coûte ${formatPrice(PRICE.appsStarter, "fr")}, livré en ${DELAY.appsStarter.fr}. Un outil ou une application sur-mesure démarre à ${formatPrice(PRICE.appsCustom, "fr")}. Le prix exact dépend du périmètre, des intégrations et de la plateforme (web, mobile ou les deux). Quand c'est possible, je commence par un MVP ciblé pour valider l'usage avant d'aller plus loin.` },
        { q: "Combien de temps faut-il pour développer une application ?", a: `Une automatisation ou un assistant IA est livré en ${DELAY.appsStarter.fr}. Pour un outil ou une application sur-mesure, le planning est fixé au cadrage, après un prototype cliquable : on commence souvent par un MVP centré sur l'usage principal, puis on l'enrichit.` },
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
        { q: "How much does a custom app or business tool cost?", a: `An automation or an AI assistant on your documents costs ${formatPrice(PRICE.appsStarter, "en")}, delivered in ${DELAY.appsStarter.en}. A custom tool or app starts at ${formatPrice(PRICE.appsCustom, "en")}. The exact price depends on scope, integrations and platform (web, mobile or both). When possible, I start with a focused MVP to validate usage before going further.` },
        { q: "How long does it take to build an app?", a: `An automation or an AI assistant ships in ${DELAY.appsStarter.en}. For a custom tool or app, the schedule is set during scoping, after a clickable prototype: we often start with an MVP focused on the main use, then build on it.` },
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
