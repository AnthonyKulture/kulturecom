import type { Lang } from "~/i18n/ui";

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
    proofSlugs: ["vaulk", "surly", "sun-beach-house"],
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
      h1Lines: ["Création de", "site sur-mesure."],
      lead: "Des sites internet conçus et codés à la main sur la Côte d'Azur — rapides, accessibles, taillés pour votre marque. Aucun template, aucun compromis sur la performance.",
      intro: [
        "Un site sur-mesure n'est pas un thème acheté qu'on habille à vos couleurs. C'est une architecture pensée pour vos objectifs : convertir, rassurer, durer. Je conçois et développe chaque projet de la première maquette à la mise en ligne — design, code et performance sous une seule main, sans agence à trois équipes qui se renvoient des fichiers.",
        "Stack moderne (Astro, React, TypeScript), Core Web Vitals au vert, accessibilité WCAG AA, et un code que vous possédez entièrement à la livraison. Un site qui charge avant que le concurrent ait fini son animation d'entrée, et qui tient dix ans plutôt que dix mois.",
        "Basé près de Nice, je travaille avec des PME, des marques B2B techniques et des créateurs partout en France et à l'international.",
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
      faqTitle: "Questions fréquentes",
      faq: [
        { q: "Combien coûte un site sur-mesure ?", a: "Chaque projet est chiffré après un brief écrit — le prix dépend du nombre de pages, des fonctionnalités et du CMS. Je ne donne pas de devis sans cadrage : le tarif d'un site vitrine premium est établi sur mesure, selon le périmètre de votre projet." },
        { q: "Quels sont les délais ?", a: "Comptez 4 à 8 semaines pour un site vitrine sur-mesure, davantage selon la complexité (e-commerce, plateforme, 3D). Le planning est fixé au cadrage." },
        { q: "Utilisez-vous WordPress ?", a: "Selon le besoin. Pour les sites éditoriaux performants je privilégie Astro ou Next.js avec un CMS headless ; pour des clients qui veulent gérer eux-mêmes sur un écosystème connu, WordPress reste pertinent." },
        { q: "Le code m'appartient-il ?", a: "Oui, entièrement. À la livraison, vous récupérez le dépôt et tous les accès. Aucun verrou propriétaire." },
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
        "Based near Nice, I work with SMBs, technical B2B brands and creators across France and internationally.",
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
      faqTitle: "Frequently asked questions",
      faq: [
        { q: "How much does a custom website cost?", a: "Every project is quoted after a written brief — price depends on page count, features and CMS. I don't quote without scoping, but a premium showcase site typically starts in the low thousands of euros." },
        { q: "How long does it take?", a: "Plan 4 to 8 weeks for a custom showcase site, more for complex builds (e-commerce, platform, 3D). The timeline is set during scoping." },
        { q: "Do you use WordPress?", a: "It depends. For high-performance editorial sites I favor Astro or Next.js with a headless CMS; for clients who want to manage a familiar ecosystem themselves, WordPress remains a fit." },
        { q: "Do I own the code?", a: "Yes, fully. On delivery you get the repository and all access. No proprietary lock-in." },
      ],
    },
  },
  seo: {
    fr: {
      name: "SEO & GEO",
      eyebrow: "Service · Visibilité",
      h1Lines: ["SEO & GEO", "techniques."],
      lead: "Être trouvé sur Google, cité par les IA et visible jusque dans ChatGPT Ads. Un référencement technique qui transforme un beau site invisible en source de trafic durable.",
      intro: [
        "Le SEO ne se résume plus à Google. ChatGPT, Perplexity, Gemini et les AI Overviews répondent désormais aux questions de vos clients en citant des sources. Le GEO (Generative Engine Optimization) consiste à structurer votre site pour qu'il soit cité, pas seulement listé.",
        "Je travaille les deux ensemble : audit technique (crawl, indexation, Core Web Vitals), données structurées Schema.org, llms.txt, architecture de contenu en clusters, et optimisation on-page. Un site indexé, compris par les machines, et préféré par les moteurs.",
        "Depuis fin août 2026, ChatGPT affiche aussi de la publicité en France : ChatGPT Ads. Les annonces apparaissent sous la réponse, marquées « sponsorisé », et n'influencent pas son contenu — OpenAI s'y engage. Le GEO vous fait citer dans la réponse, ChatGPT Ads vous place juste en dessous : je configure et pilote les campagnes, du ciblage par contexte de conversation au suivi des conversions.",
        "Basé près de Nice, j'accompagne des marques en France et à l'international, du référencement local à la visibilité internationale.",
      ],
      includesTitle: "Ce qui est inclus",
      includes: [
        "Audit technique complet (crawl, indexation, logs, Core Web Vitals)",
        "Données structurées Schema.org (JSON-LD)",
        "Optimisation GEO : llms.txt, citabilité, entités",
        "Architecture de contenu & clusters sémantiques",
        "Campagnes ChatGPT Ads : ciblage, annonces, enchères, suivi des conversions",
        "Search Console, GA4, suivi des positions",
      ],
      methodTitle: "La méthode",
      method: [
        { n: "01", title: "Audit", body: "État des lieux technique, sémantique et concurrentiel. Ce qui bloque, ce qui manque, ce qui rapporte." },
        { n: "02", title: "Corrections techniques", body: "Indexation, vitesse, Schema.org, balisage. Les fondations avant le contenu." },
        { n: "03", title: "Contenu & autorité", body: "Clusters de contenu, optimisation on-page, signaux d'entité pour Google et les IA." },
        { n: "04", title: "Mesure", body: "Search Console, positions, trafic. On pilote sur des chiffres, pas des impressions." },
      ],
      proofTitle: "Projets liés",
      relatedTitle: "Autres services",
      faqTitle: "Questions fréquentes",
      faq: [
        { q: "Quelle différence entre SEO et GEO ?", a: "Le SEO optimise pour les moteurs de recherche classiques (Google). Le GEO optimise pour les moteurs génératifs (ChatGPT, Perplexity, AI Overviews) qui citent des sources dans leurs réponses. Les deux partagent des fondations techniques mais demandent des signaux différents." },
        { q: "En combien de temps voit-on des résultats ?", a: "Les corrections techniques agissent en quelques semaines ; le gain de positions sur des requêtes concurrentielles prend généralement 3 à 6 mois. Le SEO est un investissement, pas un interrupteur." },
        { q: "Qu'est-ce que ChatGPT Ads, et faut-il s'y mettre ?", a: "C'est la régie publicitaire d'OpenAI, ouverte aux annonceurs en France depuis fin août 2026 : des annonces affichées sous les réponses de ChatGPT (offres gratuite et Go), marquées « sponsorisé ». Pas de mots-clés à acheter : on décrit les contextes de conversation où l'annonce doit apparaître, on choisit les zones, et on paie au clic ou à l'impression. C'est le complément payant du GEO, pas un raccourci : les annonces n'influencent pas les réponses, être cité dedans reste un travail de fond. Je vous aide à tester avec un budget maîtrisé et un suivi des conversions conforme au RGPD." },
        { q: "Faites-vous du référencement local ?", a: "Oui — fiche Google Business Profile, cohérence NAP, schema local et pages géolocalisées pour les entreprises ciblant Nice, la Côte d'Azur ou une zone précise." },
        { q: "Travaillez-vous sur un site existant ?", a: "Bien sûr. La plupart des missions SEO partent d'un site déjà en ligne. L'audit identifie le potentiel avant tout engagement." },
      ],
    },
    en: {
      name: "SEO & GEO",
      eyebrow: "Service · Visibility",
      h1Lines: ["Technical", "SEO & GEO."],
      lead: "Get found on Google, cited by AI and visible right inside ChatGPT Ads. Technical search optimization that turns a beautiful, invisible site into lasting traffic.",
      intro: [
        "SEO is no longer just Google. ChatGPT, Perplexity, Gemini and AI Overviews now answer your customers' questions by citing sources. GEO (Generative Engine Optimization) structures your site to be cited, not just listed.",
        "I work both together: technical audit (crawl, indexing, Core Web Vitals), Schema.org structured data, llms.txt, content cluster architecture, and on-page optimization. A site that's indexed, understood by machines, and preferred by engines.",
        "Since late August 2026, ChatGPT also shows ads in Europe: ChatGPT Ads. Ads appear below the answer, labeled “sponsored”, and don't influence its content — OpenAI commits to that. GEO gets you cited in the answer, ChatGPT Ads places you right below it: I set up and run the campaigns, from conversation-context targeting to conversion tracking.",
        "Based near Nice, I work with brands across France and internationally — from local search to international visibility.",
      ],
      includesTitle: "What's included",
      includes: [
        "Full technical audit (crawl, indexing, logs, Core Web Vitals)",
        "Schema.org structured data (JSON-LD)",
        "GEO optimization: llms.txt, citability, entities",
        "Content architecture & semantic clusters",
        "ChatGPT Ads campaigns: targeting, ads, bidding, conversion tracking",
        "Search Console, GA4, rank tracking",
      ],
      methodTitle: "The method",
      method: [
        { n: "01", title: "Audit", body: "Technical, semantic and competitive baseline. What blocks, what's missing, what pays." },
        { n: "02", title: "Technical fixes", body: "Indexing, speed, Schema.org, markup. Foundations before content." },
        { n: "03", title: "Content & authority", body: "Content clusters, on-page optimization, entity signals for Google and AI." },
        { n: "04", title: "Measurement", body: "Search Console, rankings, traffic. We steer on numbers, not impressions." },
      ],
      proofTitle: "Related projects",
      relatedTitle: "Other services",
      faqTitle: "Frequently asked questions",
      faq: [
        { q: "What's the difference between SEO and GEO?", a: "SEO optimizes for classic search engines (Google). GEO optimizes for generative engines (ChatGPT, Perplexity, AI Overviews) that cite sources in their answers. Both share technical foundations but need different signals." },
        { q: "How long until results?", a: "Technical fixes act within weeks; ranking gains on competitive queries usually take 3 to 6 months. SEO is an investment, not a switch." },
        { q: "What is ChatGPT Ads, and should I use it?", a: "It's OpenAI's ad platform, open to advertisers in France and across Europe since late August 2026: ads shown below ChatGPT's answers (Free and Go plans), labeled “sponsored”. There are no keywords to buy: you describe the conversation contexts where the ad should appear, pick locations, and pay per click or per impression. It's the paid complement to GEO, not a shortcut: ads don't influence the answers, so being cited in them remains long-term work. I help you test with a controlled budget and GDPR-compliant conversion tracking." },
        { q: "Do you do local SEO?", a: "Yes — Google Business Profile, NAP consistency, local schema and geo-targeted pages for businesses targeting Nice, the French Riviera or a specific area." },
        { q: "Do you work on an existing site?", a: "Of course. Most SEO work starts from a live site. The audit identifies the potential before any commitment." },
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
      faqTitle: "Questions fréquentes",
      faq: [
        { q: "Livrez-vous seulement un logo ?", a: "Non. Un logo seul ne fait pas une marque. Je conçois un système complet — typographie, couleurs, règles, déclinaisons — pour que votre identité reste cohérente partout." },
        { q: "Peut-on faire l'identité sans le site ?", a: "Oui, l'identité de marque est une mission à part entière. Mais comme je fais aussi le développement, identité et site peuvent être pensés ensemble — c'est là que la cohérence est la plus forte." },
        { q: "Travaillez-vous avec des marques de luxe ?", a: "Oui — yachting, hôtellerie, immobilier de prestige font partie de mes projets récents. Le haut de gamme exige une précision que je traite comme un standard, pas une option." },
        { q: "Fournissez-vous un guide de marque ?", a: "Oui, chaque identité est livrée avec ses règles d'usage et ses fichiers sources, pour que vos prestataires gardent la cohérence." },
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
      faqTitle: "Frequently asked questions",
      faq: [
        { q: "Do you only deliver a logo?", a: "No. A logo alone isn't a brand. I design a full system — typography, colors, rules, applications — so your identity stays coherent everywhere." },
        { q: "Can I get the identity without the website?", a: "Yes, brand identity is a standalone engagement. But since I also do development, identity and site can be designed together — that's where coherence is strongest." },
        { q: "Do you work with luxury brands?", a: "Yes — yachting, hospitality and prestige real estate are among my recent projects. The high end demands a precision I treat as a standard, not an option." },
        { q: "Do you provide brand guidelines?", a: "Yes, every identity ships with its usage rules and source files, so your providers keep the consistency." },
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
      faqTitle: "Questions fréquentes",
      faq: [
        { q: "Combien coûte un outil ou une application sur-mesure ?", a: "Chaque projet est chiffré après un cadrage écrit : le prix dépend du périmètre, des intégrations et de la plateforme (web, mobile ou les deux). Quand c'est possible, je commence par un MVP ciblé pour valider l'usage avant d'aller plus loin." },
        { q: "L'IA peut-elle vraiment servir à une petite entreprise ?", a: "Oui, si on la branche sur un vrai besoin : répondre aux questions récurrentes à partir de vos documents, préparer des devis ou des comptes-rendus, trier des demandes, extraire les données de PDF. Et je vous dis honnêtement quand elle n'apporte rien et qu'une simple automatisation suffit." },
        { q: "Que deviennent mes données ?", a: "Elles restent sous votre contrôle : hébergement choisi avec vous, accès limités, et API d'IA utilisées dans des conditions où vos données ne servent pas à entraîner les modèles. Les sujets sensibles (RGPD, données clients) sont traités dès le cadrage." },
        { q: "No-code ou développement sur-mesure ?", a: "Les deux, selon le besoin. n8n, Make ou Zapier sont parfaits pour connecter des outils rapidement ; dès que la logique métier se complexifie ou que les volumes augmentent, un développement sur-mesure devient plus fiable et moins cher à long terme." },
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
      faqTitle: "Frequently asked questions",
      faq: [
        { q: "How much does a custom tool or app cost?", a: "Every project is quoted after a written scoping: price depends on scope, integrations and platform (web, mobile or both). When possible, I start with a focused MVP to validate usage before going further." },
        { q: "Can AI really help a small business?", a: "Yes, when it's tied to a real need: answering recurring questions from your documents, preparing quotes or reports, triaging requests, extracting data from PDFs. And I'll tell you honestly when it adds nothing and a simple automation is enough." },
        { q: "What happens to my data?", a: "It stays under your control: hosting chosen with you, restricted access, and AI APIs used under terms where your data isn't used to train the models. Sensitive topics (GDPR, customer data) are handled from scoping." },
        { q: "No-code or custom development?", a: "Both, depending on the need. n8n, Make or Zapier are great for connecting tools quickly; once business logic gets complex or volumes grow, custom development becomes more reliable and cheaper over time." },
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
