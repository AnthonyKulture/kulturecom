import type { Lang } from "~/i18n/ui";
import type { Choice } from "~/lib/home-content";
import { CONTACT } from "~/lib/facts";

/**
 * Copy of the guided "Démarrer un projet" form (ProjectDialog.astro): one
 * question per screen, most answered with one tap. The values are the ids
 * sent to /api/lead, which keeps its own French labels for the e-mail
 * (functions/api/lead.ts): change both together.
 *
 * Flow: need, then a detail that depends on it, then timeline and budget,
 * first name, how to reply, and a recap. The free check-up skips timeline
 * and budget.
 */

/** A question answered with one of a few choices. */
export interface ChoiceStep {
  q: string;
  hint?: string;
  choices: Choice[];
}

/** A question answered in a text field. */
export interface FieldStep {
  q: string;
  hint: string;
}

export interface ProjectContent {
  title: string;
  close: string;
  back: string;
  next: string;
  skip: string;
  enter: string;
  /** "Question 2 sur 6", for screen readers. */
  count: [string, string];
  sheet: string;
  sheetTitle: string;
  sheetReply: string;
  need: ChoiceStep;
  detail: Record<"web" | "seo" | "apps" | "brand", ChoiceStep>;
  site: FieldStep;
  other: FieldStep & { error: string };
  when: ChoiceStep;
  budget: ChoiceStep;
  name: FieldStep & { error: string };
  /** Text around the first name, e.g. ["Enchanté, ", "."]. */
  hello: [string, string];
  contact: {
    q: string;
    channels: Choice[];
    email: string;
    phone: string;
    errorEmail: string;
    errorPhone: string;
  };
  recap: [string, string];
  rows: { need: string; detail: string; site: string; other: string; when: string; budget: string; name: string; contact: string };
  edit: string;
  /** An optional answer left empty. */
  none: string;
  note: FieldStep;
  consent: string;
  privacy: string;
  privacyHref: string;
  submit: string;
  sending: string;
  done: [string, string];
  doneBody: string;
  errorTitle: string;
  errorBody: string;
  emailLabel: string;
  whatsappLabel: string;
  mailSubject: string;
  whatsappMessage: string;
}

export function getProjectContent(lang: Lang): ProjectContent {
  if (lang === "fr") {
    return {
      title: "Démarrer un projet",
      close: "Fermer",
      back: "Retour",
      next: "Continuer",
      skip: "Passer",
      enter: "Entrée",
      count: ["Question", "sur"],
      sheet: "Votre projet",
      sheetTitle: "Quelques questions, une minute à peine.",
      sheetReply: `Réponse sous ${CONTACT.replyHours} h ouvrées, souvent le jour même.`,
      need: {
        q: "Qu'est-ce qu'on construit ensemble ?",
        choices: [
          { value: "web", label: "Un site internet" },
          { value: "seo", label: "Être trouvé sur Google et cité par les IA" },
          { value: "apps", label: "Un outil ou une app avec l'IA" },
          { value: "brand", label: "Une identité de marque" },
          { value: "checkup", label: "Le check-up visibilité IA offert" },
          { value: "other", label: "Autre chose" },
        ],
      },
      detail: {
        web: {
          q: "Quel genre de site ?",
          choices: [
            { value: "first", label: "Un premier site" },
            { value: "redo", label: "Refaire mon site actuel" },
            { value: "shop", label: "Une boutique ou des réservations en ligne" },
          ],
        },
        seo: {
          q: "Votre priorité ?",
          choices: [
            { value: "maps", label: "Sortir sur Google Maps près de chez moi" },
            { value: "google", label: "Monter dans les résultats Google" },
            { value: "ai", label: "Être cité par ChatGPT, Perplexity, Gemini" },
            { value: "ads", label: "Lancer ChatGPT Ads" },
            { value: "audit", label: "Faire le point (audit)" },
          ],
        },
        apps: {
          q: "Qu'est-ce qui vous aiderait le plus ?",
          choices: [
            { value: "automate", label: "Automatiser une tâche répétitive" },
            { value: "assistant", label: "Un assistant IA pour mes clients" },
            { value: "tool", label: "Un outil métier sur-mesure" },
            { value: "unsure", label: "Je ne sais pas encore ce qui est possible" },
          ],
        },
        brand: {
          q: "De quoi a besoin votre marque ?",
          choices: [
            { value: "logo", label: "Un logo" },
            { value: "identity", label: "Une identité complète (logo, couleurs, typo)" },
            { value: "refresh", label: "Moderniser mon image" },
          ],
        },
      },
      site: {
        q: "L'adresse de votre site ?",
        hint: "Facultatif. Je regarde ce que Google et les IA en disent.",
      },
      other: {
        q: "Dites-m'en deux mots.",
        hint: "Votre activité, votre idée, une contrainte…",
        error: "Écrivez au moins quelques mots.",
      },
      when: {
        q: "Pour quand ?",
        choices: [
          { value: "asap", label: "Dès que possible" },
          { value: "month", label: "Dans le mois" },
          { value: "quarter", label: "D'ici 2 à 3 mois" },
          { value: "open", label: "Pas de date précise" },
        ],
      },
      budget: {
        q: "Quel budget avez-vous en tête ?",
        hint: "Sans engagement : c'est pour vous proposer la bonne formule.",
        choices: [
          { value: "lt500", label: "Moins de 500\u00a0€" },
          { value: "500-1500", label: "500 à 1\u00a0500\u00a0€" },
          { value: "1500-3000", label: "1\u00a0500 à 3\u00a0000\u00a0€" },
          { value: "gt3000", label: "Plus de 3\u00a0000\u00a0€" },
          { value: "advice", label: "Je ne sais pas, conseillez-moi" },
        ],
      },
      name: {
        q: "Comment vous appelez-vous ?",
        hint: "Votre prénom suffit.",
        error: "Indiquez votre prénom.",
      },
      hello: ["Enchanté, ", "."],
      contact: {
        q: "Où je vous réponds ?",
        channels: [
          { value: "email", label: "E-mail" },
          { value: "phone", label: "Téléphone" },
          { value: "whatsapp", label: "WhatsApp" },
        ],
        email: "Votre e-mail",
        phone: "Votre numéro",
        errorEmail: "Cette adresse e-mail ne semble pas valide.",
        errorPhone: "Ce numéro ne semble pas valide.",
      },
      recap: ["Tout est bon, ", " ?"],
      rows: {
        need: "Projet",
        detail: "Précision",
        site: "Site",
        other: "En deux mots",
        when: "Délai",
        budget: "Budget",
        name: "Prénom",
        contact: "Contact",
      },
      edit: "Modifier",
      none: "Non renseigné",
      note: {
        q: "Un dernier mot ?",
        hint: "Facultatif : votre site actuel, votre activité, une échéance…",
      },
      consent: "Vos coordonnées servent uniquement à vous répondre.",
      privacy: "Confidentialité",
      privacyHref: "/confidentialite/",
      submit: "Envoyer ma demande",
      sending: "Envoi…",
      done: ["C'est bien reçu, ", "."],
      doneBody: `Je vous réponds sous ${CONTACT.replyHours} h ouvrées, souvent le jour même.`,
      errorTitle: "L'envoi n'a pas abouti.",
      errorBody: "Votre demande est prête : envoyez-la directement par e-mail ou WhatsApp.",
      emailLabel: "E-mail",
      whatsappLabel: "WhatsApp",
      mailSubject: "Projet : j'aimerais en discuter",
      whatsappMessage: "Bonjour Anthony, j'ai un projet à discuter.",
    };
  }
  return {
    title: "Start a project",
    close: "Close",
    back: "Back",
    next: "Continue",
    skip: "Skip",
    enter: "Enter",
    count: ["Question", "of"],
    sheet: "Your project",
    sheetTitle: "A few questions, barely a minute.",
    sheetReply: "Reply within 2 business days, often the same day.",
    need: {
      q: "What are we building together?",
      choices: [
        { value: "web", label: "A website" },
        { value: "seo", label: "Get found on Google and cited by AI" },
        { value: "apps", label: "A tool or an app with AI" },
        { value: "brand", label: "A brand identity" },
        { value: "checkup", label: "The free AI visibility check-up" },
        { value: "other", label: "Something else" },
      ],
    },
    detail: {
      web: {
        q: "What kind of site?",
        choices: [
          { value: "first", label: "My first website" },
          { value: "redo", label: "Rebuild my current site" },
          { value: "shop", label: "An online shop or booking" },
        ],
      },
      seo: {
        q: "Your priority?",
        choices: [
          { value: "maps", label: "Show up on Google Maps near me" },
          { value: "google", label: "Climb Google's results" },
          { value: "ai", label: "Get cited by ChatGPT, Perplexity, Gemini" },
          { value: "ads", label: "Launch ChatGPT Ads" },
          { value: "audit", label: "Take stock (audit)" },
        ],
      },
      apps: {
        q: "What would help you most?",
        choices: [
          { value: "automate", label: "Automate a repetitive task" },
          { value: "assistant", label: "An AI assistant for my customers" },
          { value: "tool", label: "A custom business tool" },
          { value: "unsure", label: "I'm not sure what's possible yet" },
        ],
      },
      brand: {
        q: "What does your brand need?",
        choices: [
          { value: "logo", label: "A logo" },
          { value: "identity", label: "A full identity (logo, colours, type)" },
          { value: "refresh", label: "Refresh my image" },
        ],
      },
    },
    site: {
      q: "Your website's address?",
      hint: "Optional. I'll look at what Google and AI say about it.",
    },
    other: {
      q: "Tell me in a few words.",
      hint: "Your business, your idea, a constraint…",
      error: "Write at least a few words.",
    },
    when: {
      q: "When for?",
      choices: [
        { value: "asap", label: "As soon as possible" },
        { value: "month", label: "Within a month" },
        { value: "quarter", label: "In 2 to 3 months" },
        { value: "open", label: "No set date" },
      ],
    },
    budget: {
      q: "What budget do you have in mind?",
      hint: "No commitment: it helps me suggest the right package.",
      choices: [
        { value: "lt500", label: "Under €500" },
        { value: "500-1500", label: "€500 to €1,500" },
        { value: "1500-3000", label: "€1,500 to €3,000" },
        { value: "gt3000", label: "Over €3,000" },
        { value: "advice", label: "Not sure, advise me" },
      ],
    },
    name: {
      q: "What's your name?",
      hint: "Your first name is enough.",
      error: "Please enter your first name.",
    },
    hello: ["Nice to meet you, ", "."],
    contact: {
      q: "Where should I reply?",
      channels: [
        { value: "email", label: "Email" },
        { value: "phone", label: "Phone" },
        { value: "whatsapp", label: "WhatsApp" },
      ],
      email: "Your email",
      phone: "Your number",
      errorEmail: "This email address doesn't look valid.",
      errorPhone: "This number doesn't look valid.",
    },
    recap: ["All good, ", "?"],
    rows: {
      need: "Project",
      detail: "Detail",
      site: "Site",
      other: "In a few words",
      when: "Timing",
      budget: "Budget",
      name: "First name",
      contact: "Contact",
    },
    edit: "Edit",
    none: "Not given",
    note: {
      q: "One last word?",
      hint: "Optional: your current site, your business, a deadline…",
    },
    consent: "Your details are only used to reply to you.",
    privacy: "Privacy",
    privacyHref: "/en/privacy/",
    submit: "Send my request",
    sending: "Sending…",
    done: ["Got it, ", "."],
    doneBody: "I'll reply within 2 business days, often the same day.",
    errorTitle: "Sending failed.",
    errorBody: "Your request is ready: send it directly by email or WhatsApp.",
    emailLabel: "Email",
    whatsappLabel: "WhatsApp",
    mailSubject: "Project: I'd like to discuss it",
    whatsappMessage: "Hi Anthony, I have a project to discuss.",
  };
}
