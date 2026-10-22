import type { Lang } from "~/i18n/ui";
import { servicePagePath, type ServiceId } from "~/lib/service-pages";
import { CALLBACK, CONTACT, DELAY, PRICE, formatPrice } from "~/lib/facts";

/**
 * Copy for the home page (hero + 4 doors, proof, "Conçu. Codé. Cité.",
 * recent work, FAQ) and for the contact form / callback dialog used site-wide.
 * Positioning (2026-10-21): "Conçu, codé, cité" — one person who designs,
 * builds and makes the business visible, in Google and in AI answers.
 */

export interface Door {
  id: ServiceId;
  title: string;
  desc: string;
}

export interface Faq {
  q: string;
  a: string;
  /** Follow-up link under the answer (service page or guide): internal
   *  linking with a descriptive anchor. */
  link?: { href: string; label: string };
}

export interface Choice {
  value: string;
  label: string;
}

/** A Google review quoted on the home page (first name + initial, or the
 *  company name when the review comes from a business). */
export interface Review {
  quote: string;
  author: string;
}

export interface HomeContent {
  kicker: string;
  h1: [string, string];
  sub: string;
  doorsLabel: string;
  /** Hero button that reveals the four doors; hint shown next to it. */
  doorsCta: string;
  doorsHint: string;
  doors: Door[];
  trustedBy: string;
  pillars: { word: string; body: string }[];
  pillarsTitle: string;
  compare: {
    caption: string;
    cols: [string, string, string, string];
    rows: [string, string, string, string][];
  };
  workTitle: string;
  workAll: string;
  workLink: string;
  reviewsTitle: string;
  reviewsCount: string;
  reviewsLink: string;
  /** Shown when the quotes are translated (EN page). */
  reviewsNote?: string;
  reviews: Review[];
  faqTitle: string;
  faqAside: string;
  faq: Faq[];
}

export interface FormContent {
  title: [string, string];
  step: string;
  back: string;
  needQ: string;
  needs: Choice[];
  contactQ: string;
  name: string;
  email: string;
  phone: string;
  phoneHint: string;
  message: string;
  messageHint: string;
  consent: string;
  privacy: string;
  privacyHref: string;
  submit: string;
  sending: string;
  successTitle: string;
  successBody: string;
  errorTitle: string;
  errorBody: string;
  invalid: { name: string; email: string; phone: string };
  orWrite: string;
  emailLabel: string;
  whatsappLabel: string;
  callbackLabel: string;
  whatsappMessage: string;
  mailSubject: string;
}

export interface CallbackContent {
  open: string;
  title: string;
  bodyOpen: string;
  bodyClosed: string;
  name: string;
  phone: string;
  submit: string;
  sending: string;
  close: string;
  successOpen: string;
  successClosed: string;
  error: string;
  orCall: string;
}

const fr = (lang: Lang) => lang === "fr";

export function getHomeContent(lang: Lang): HomeContent {
  if (fr(lang)) {
    return {
      kicker: "Designer & développeur freelance à Nice",
      h1: ["Des sites sur-mesure,", "recommandés par ChatGPT."],
      sub: "Je dessine et je code chaque site pour votre marque, puis je travaille sa visibilité sur Google et dans les réponses des IA.",
      doorsLabel: "Vous voulez…",
      doorsCta: "Choisir mon projet",
      doorsHint: "4 services · dès {price}",
      doors: [
        { id: "seo", title: "Être trouvé sur Google et cité par les IA", desc: "SEO, GEO, ChatGPT Ads" },
        { id: "web", title: "Créer ou refaire mon site", desc: "Design et code sur-mesure" },
        { id: "apps", title: "Gagner du temps avec l'IA", desc: "Outils métier, apps et automatisations" },
        { id: "brand", title: "Lancer ou moderniser ma marque", desc: "Logo et charte graphique" },
      ],
      trustedBy: "Ils m'ont confié leur image et leur visibilité",
      pillarsTitle: "Un seul interlocuteur à Nice, du design jusqu'aux réponses des IA.",
      pillars: [
        { word: "Conçu.", body: "Un design sur-mesure, pensé pour votre marque et pour que vos visiteurs passent à l'action." },
        { word: "Codé.", body: "Un code rapide et accessible, livré avec un score Lighthouse d'au moins 95 et des Core Web Vitals au vert." },
        { word: "Cité.", body: "SEO, données structurées et llms.txt dès la mise en ligne, pour être trouvé sur Google et cité par ChatGPT, Perplexity ou Gemini." },
      ],
      compare: {
        caption: "Freelance, agence ou plateforme : ce qui change pour vous",
        cols: ["", "Avec moi", "Agence", "Plateforme (Wix, Squarespace…)"],
        rows: [
          ["Qui fait le travail", "Moi, du brief à la mise en ligne", "Une équipe, via un chef de projet", "Vous"],
          ["Design", "Sur-mesure", "Sur-mesure", "Modèle à adapter"],
          ["SEO et visibilité IA", "Inclus dès la conception", "Souvent en option", "À faire soi-même"],
          ["Performance", "Lighthouse ≥ 95", "Variable", "Limitée par la plateforme"],
        ],
      },
      workTitle: "Projets récents",
      workAll: "Tous les projets",
      workLink: "Voir le projet",
      reviewsTitle: "Avis clients",
      reviewsCount: "avis sur Google",
      reviewsLink: "Lire tous les avis sur Google",
      reviews: [
        { quote: "Un grand merci pour ton excellent travail sur ma communication et mon référencement. Grâce à ton accompagnement, j’ai gagné en visibilité et j’ai été contacté par de nouveaux clients. Je recommande vivement les services d’Anthony à tous ceux qui souhaitent développer leur activité et améliorer leur présence sur Internet !", author: "CCS · Chauffage Clim Services" },
        { quote: "Très satisfait de la création de mon site web et de l’accompagnement d’Anthony. Professionnel, à l’écoute et de bon conseil, il a su répondre à mes attentes. Je recommande vivement ses services !", author: "Théo P." },
        { quote: "Un plaisir de bosser avec Anthony ! Un bon oeil créa et de bons conseils pour la conversion du site. Je recommande", author: "Reveletna.fr" },
        { quote: "Anthony est très professionnel et à l’écoute, je recommande.", author: "Francese con Laura" },
      ],
      faqTitle: "Questions fréquentes : site, SEO et IA",
      faqAside: "Une autre question ? Écrivez-moi, je réponds sous 48 h ouvrées.",
      faq: [
        {
          q: "Combien coûte un site internet sur-mesure à Nice ?",
          a: `Chez Anthony Profit, designer-développeur freelance à Nice, un site une page sur-mesure coûte ${formatPrice(PRICE.webOnePage, lang)} et un site vitrine de 5 à 8 pages démarre à ${formatPrice(PRICE.webShowcase, lang)}. Le logo et l'identité de marque sont offerts. Les prix sont nets (TVA non applicable) et fixés par écrit avec le délai, après un premier échange.`,
          link: { href: servicePagePath("web", lang), label: "Voir les formules site internet" },
        },
        {
          q: "En combien de temps mon projet est-il livré ?",
          a: `Comptez ${DELAY.webOnePage.fr} pour un site une page, ${DELAY.webShowcase.fr} pour un site vitrine, ${DELAY.seoAudit.fr} pour un audit de visibilité Google + IA et ${DELAY.appsStarter.fr} pour une automatisation ou un assistant IA. Le planning est fixé par écrit dès le départ.`,
          link: { href: "/services/", label: "Comparer les services" },
        },
        {
          q: "Pourquoi choisir un freelance plutôt qu'une agence web ?",
          a: "Avec un freelance, vous parlez directement à la personne qui conçoit, code et référence votre site : pas d'intermédiaire, des décisions rapides et des prix sans frais de structure. Je réunis design, développement, SEO et IA, des compétences qu'une agence répartit souvent entre plusieurs équipes.",
          link: { href: "/a-propos/", label: "Mon parcours" },
        },
        {
          q: "Comment faire apparaître mon entreprise dans ChatGPT ?",
          a: "Grâce au GEO (Generative Engine Optimization), le prolongement du SEO pour les IA : des pages claires qui répondent aux questions de vos clients, des données structurées Schema.org, un fichier llms.txt et des mentions sur des sites de confiance. ChatGPT, Perplexity ou Gemini citent les sources qu'ils comprennent et jugent fiables.",
          link: { href: "/blog/seo-geo-apparaitre-dans-chatgpt/", label: "Lire le guide : apparaître dans ChatGPT" },
        },
        {
          q: "Travaillez-vous seulement à Nice ?",
          a: "Non. Je suis basé à Nice et je rencontre volontiers les entreprises de la Côte d'Azur, de Monaco à Cannes. Je travaille aussi à distance partout en France et à l'international, en français comme en anglais.",
          link: { href: "/blog/referencement-nice-dominer-google-et-ia/", label: "Guide : se faire trouver à Nice, sur Google et dans les IA" },
        },
        {
          q: "Pouvez-vous gérer mes campagnes ChatGPT Ads ?",
          a: `Oui. Je configure le ciblage, les annonces, la page d'arrivée et un suivi des conversions conforme au RGPD, puis j'optimise pendant le premier mois. Le lancement coûte ${formatPrice(PRICE.adsLaunch, lang)} et se fait en ${DELAY.adsLaunch.fr}, budget publicitaire en plus.`,
          link: { href: servicePagePath("seo", lang), label: "Voir l'offre SEO, GEO & ChatGPT Ads" },
        },
      ],
    };
  }
  return {
    kicker: "Freelance designer & developer in Nice",
    h1: ["Custom websites,", "recommended by ChatGPT."],
    sub: "I design and code every site for your brand, then work on its visibility on Google and in AI answers.",
    doorsLabel: "You want to…",
    doorsCta: "Choose your project",
    doorsHint: "4 services · from {price}",
    doors: [
      { id: "seo", title: "Get found on Google and cited by AI", desc: "SEO, GEO, ChatGPT Ads" },
      { id: "web", title: "Build or rebuild my website", desc: "Custom design and code" },
      { id: "apps", title: "Save time with AI", desc: "Business tools, apps and automations" },
      { id: "brand", title: "Launch or refresh my brand", desc: "Logo and style guide" },
    ],
    trustedBy: "Brands that trusted me with their image and visibility",
    pillarsTitle: "One point of contact in Nice, from design to AI answers.",
    pillars: [
      { word: "Designed.", body: "A custom design, built around your brand and around getting your visitors to act." },
      { word: "Built.", body: "Fast, accessible code, shipped with a Lighthouse score of 95 or more and green Core Web Vitals." },
      { word: "Cited.", body: "SEO, structured data and llms.txt from launch day, to be found on Google and cited by ChatGPT, Perplexity or Gemini." },
    ],
    compare: {
      caption: "Freelancer, agency or platform: what changes for you",
      cols: ["", "With me", "Agency", "Platform (Wix, Squarespace…)"],
      rows: [
        ["Who does the work", "Me, from brief to launch", "A team, through a project manager", "You"],
        ["Design", "Custom", "Custom", "Template to adapt"],
        ["SEO and AI visibility", "Built in from day one", "Often an add-on", "Do it yourself"],
        ["Performance", "Lighthouse ≥ 95", "Varies", "Capped by the platform"],
      ],
    },
    workTitle: "Recent work",
    workAll: "All projects",
    workLink: "View the project",
    reviewsTitle: "Client reviews",
    reviewsCount: "reviews on Google",
    reviewsLink: "Read all the reviews on Google",
    reviewsNote: "Translated from French.",
    reviews: [
      { quote: "A huge thank you for your excellent work on my communication and my search rankings. Thanks to your support, I gained visibility and was contacted by new clients. I highly recommend Anthony's services to anyone who wants to grow their business and improve their online presence!", author: "CCS · Chauffage Clim Services" },
      { quote: "Very happy with the creation of my website and with Anthony's support. Professional, attentive and full of good advice, he met my expectations. I highly recommend his services!", author: "Théo P." },
      { quote: "A pleasure working with Anthony! A good creative eye and sound advice on the site's conversion. I recommend him.", author: "Reveletna.fr" },
      { quote: "Anthony is very professional and attentive, I recommend him.", author: "Francese con Laura" },
    ],
    faqTitle: "Questions on websites, SEO and AI",
    faqAside: "Another question? Write to me, I reply within 2 business days.",
    faq: [
      {
        q: "How much does a custom website cost in Nice?",
        a: `With Anthony Profit, a freelance designer-developer in Nice, a custom one-page site costs ${formatPrice(PRICE.webOnePage, lang)} and a 5 to 8-page showcase site starts at ${formatPrice(PRICE.webShowcase, lang)}. Logo and brand identity are included free. Prices are net (no VAT charged) and fixed in writing with the timeline, after a first call.`,
        link: { href: servicePagePath("web", lang), label: "See the website packages" },
      },
      {
        q: "How long does a project take?",
        a: `Plan ${DELAY.webOnePage.en} for a one-page site, ${DELAY.webShowcase.en} for a showcase site, ${DELAY.seoAudit.en} for a Google + AI visibility audit and ${DELAY.appsStarter.en} for an automation or an AI assistant. The schedule is set in writing from the start.`,
        link: { href: "/en/services/", label: "Compare the services" },
      },
      {
        q: "Why hire a freelancer rather than a web agency?",
        a: "With a freelancer, you talk directly to the person who designs, builds and ranks your site: no middleman, quick decisions and prices without agency overhead. I bring together design, development, SEO and AI, skills an agency often splits across several teams.",
        link: { href: "/en/about/", label: "About me" },
      },
      {
        q: "How do I get my business to show up in ChatGPT?",
        a: "Through GEO (Generative Engine Optimization), SEO's extension for AI: clear pages that answer your customers' questions, Schema.org structured data, an llms.txt file and mentions on trusted sites. ChatGPT, Perplexity or Gemini cite the sources they understand and trust.",
        link: { href: "/en/blog/seo-geo-appear-in-chatgpt/", label: "Read the guide: showing up in ChatGPT" },
      },
      {
        q: "Do you only work in Nice?",
        a: "No. I'm based in Nice and happy to meet businesses on the French Riviera, from Monaco to Cannes. I also work remotely across France and abroad, in French or English.",
        link: { href: "/en/blog/rank-on-google-in-nice-local-seo/", label: "Guide: getting found in Nice, on Google and in AI" },
      },
      {
        q: "Can you run my ChatGPT Ads campaigns?",
        a: `Yes. I set up targeting, ads, the landing page and GDPR-compliant conversion tracking, then optimize during the first month. Launch costs ${formatPrice(PRICE.adsLaunch, lang)} and takes ${DELAY.adsLaunch.en}, ad budget on top.`,
        link: { href: servicePagePath("seo", lang), label: "See the SEO, GEO & ChatGPT Ads offer" },
      },
    ],
  };
}

export function getFormContent(lang: Lang): FormContent {
  if (fr(lang)) {
    return {
      title: ["Parlons de", "votre projet."],
      step: "Étape",
      back: "Retour",
      needQ: "De quoi avez-vous besoin ?",
      needs: [
        { value: "seo", label: "Être trouvé sur Google et cité par les IA" },
        { value: "web", label: "Créer ou refaire mon site" },
        { value: "apps", label: "Gagner du temps avec l'IA" },
        { value: "brand", label: "Lancer ou moderniser ma marque" },
        { value: "checkup", label: "Check-up visibilité IA offert" },
        { value: "other", label: "Autre chose" },
      ],
      contactQ: "Comment vous répondre ?",
      name: "Prénom",
      email: "E-mail",
      phone: "Téléphone",
      phoneHint: "Facultatif, si vous préférez un appel",
      message: "Votre projet en une phrase",
      messageHint: "Facultatif : votre site actuel, votre activité, une échéance…",
      consent: "Vos coordonnées servent uniquement à vous répondre.",
      privacy: "Confidentialité",
      privacyHref: "/confidentialite/",
      submit: "Envoyer ma demande",
      sending: "Envoi…",
      successTitle: "C'est bien reçu.",
      successBody: `Je vous réponds sous ${CONTACT.replyHours} h ouvrées, souvent le jour même.`,
      errorTitle: "L'envoi n'a pas abouti.",
      errorBody: "Votre demande est prête : envoyez-la directement par e-mail ou WhatsApp.",
      invalid: {
        name: "Indiquez votre prénom.",
        email: "Cette adresse e-mail ne semble pas valide.",
        phone: "Ce numéro ne semble pas valide.",
      },
      orWrite: "Vous préférez écrire ?",
      emailLabel: "E-mail",
      whatsappLabel: "WhatsApp",
      callbackLabel: "Être rappelé",
      whatsappMessage: "Bonjour Anthony, j'ai un projet à discuter.",
      mailSubject: "Projet : j'aimerais en discuter",
    };
  }
  return {
    title: ["Let's talk about", "your project."],
    step: "Step",
    back: "Back",
    needQ: "What do you need?",
    needs: [
      { value: "seo", label: "Get found on Google and cited by AI" },
      { value: "web", label: "Build or rebuild my website" },
      { value: "apps", label: "Save time with AI" },
      { value: "brand", label: "Launch or refresh my brand" },
      { value: "checkup", label: "Free AI visibility check-up" },
      { value: "other", label: "Something else" },
    ],
    contactQ: "How can I reach you?",
    name: "First name",
    email: "Email",
    phone: "Phone",
    phoneHint: "Optional, if you'd rather talk",
    message: "Your project in one sentence",
    messageHint: "Optional: your current site, your business, a deadline…",
    consent: "Your details are only used to reply to you.",
    privacy: "Privacy",
    privacyHref: "/en/privacy/",
    submit: "Send my request",
    sending: "Sending…",
    successTitle: "Got it.",
    successBody: "I'll reply within 2 business days, often the same day.",
    errorTitle: "Sending failed.",
    errorBody: "Your request is ready: send it directly by email or WhatsApp.",
    invalid: {
      name: "Please enter your first name.",
      email: "This email address doesn't look valid.",
      phone: "This number doesn't look valid.",
    },
    orWrite: "Rather write?",
    emailLabel: "Email",
    whatsappLabel: "WhatsApp",
    callbackLabel: "Get a call back",
    whatsappMessage: "Hello Anthony, I have a project to discuss.",
    mailSubject: "Project: I'd like to discuss",
  };
}

export function getCallbackContent(lang: Lang): CallbackContent {
  const hours = `${CALLBACK.fromHour} h-${CALLBACK.toHour} h`;
  if (fr(lang)) {
    return {
      open: "Être rappelé",
      title: "Je vous rappelle.",
      bodyOpen: `Laissez votre numéro : je vous appelle dans les ${CALLBACK.delayMin} minutes.`,
      bodyClosed: `Laissez votre numéro : je vous appelle dès la réouverture (du lundi au vendredi, ${hours}).`,
      name: "Prénom",
      phone: "Téléphone",
      submit: "Rappelez-moi",
      sending: "Envoi…",
      close: "Fermer",
      successOpen: `C'est noté. Je vous appelle dans les ${CALLBACK.delayMin} minutes.`,
      successClosed: `C'est noté. Je vous appelle dès ${CALLBACK.fromHour} h, le prochain jour ouvré.`,
      error: "L'envoi n'a pas abouti. Appelez-moi directement :",
      orCall: "Ou appelez maintenant :",
    };
  }
  return {
    open: "Get a call back",
    title: "I'll call you back.",
    bodyOpen: `Leave your number: I'll call you within ${CALLBACK.delayMin} minutes.`,
    bodyClosed: `Leave your number: I'll call you as soon as I'm back (Monday to Friday, 9 am-7 pm Paris time).`,
    name: "First name",
    phone: "Phone",
    submit: "Call me back",
    sending: "Sending…",
    close: "Close",
    successOpen: `Noted. I'll call you within ${CALLBACK.delayMin} minutes.`,
    successClosed: `Noted. I'll call you from ${CALLBACK.fromHour} am Paris time, next business day.`,
    error: "Sending failed. Call me directly:",
    orCall: "Or call now:",
  };
}
