import type { Lang } from "~/i18n/ui";

/**
 * "À propos de moi" hero (About page): a short personal text with polaroids
 * scattered around it. Images are former hero slides
 * (/public/hero-slides/slide-NN.webp, 500 px wide). Desktop positions: `x` and
 * `y` in % of the board, `r` the tilt in degrees.
 */
export interface Polaroid {
  slide: string;
  height: number;
  caption: Record<Lang, string>;
  x: number;
  y: number;
  r: number;
}

export const POLAROIDS: Polaroid[] = [
  { slide: "12", height: 627, caption: { fr: "Paris, sans se presser", en: "Paris, no rush" }, x: 1, y: 0, r: -3 },
  { slide: "01", height: 594, caption: { fr: "Les routes à vélo", en: "Roads by bike" }, x: 11, y: 35, r: 3.5 },
  { slide: "17", height: 621, caption: { fr: "Un court au bord de l'eau", en: "Court by the sea" }, x: 1, y: 64, r: -2 },
  { slide: "05", height: 625, caption: { fr: "La Méditerranée en bateau", en: "The Med by boat" }, x: 66, y: 2, r: 3 },
  { slide: "18", height: 750, caption: { fr: "Parasols rayés", en: "Striped parasols" }, x: 84, y: 0, r: -2.5 },
  { slide: "16", height: 620, caption: { fr: "La douceur du Sud", en: "The soft South" }, x: 71, y: 35, r: -3.5 },
  { slide: "06", height: 625, caption: { fr: "Cap sur le large", en: "Heading out" }, x: 87, y: 41, r: 2.5 },
  { slide: "09", height: 669, caption: { fr: "Vent dans les herbes", en: "Wind in the grass" }, x: 64, y: 66, r: 2 },
];

export interface AboutMe {
  sheet: string;
  title: string;
  /** Paragraphs may open with a bold phrase (`strong`). */
  paragraphs: { strong?: string; text: string }[];
  cta: string;
  callback: string;
}

export function getAboutMe(lang: Lang): AboutMe {
  if (lang === "fr") {
    return {
      sheet: "À propos de moi",
      title: "Entre pixels, sommets et horizons.",
      paragraphs: [
        { text: "Curieux de nature, créatif par instinct, j’aime autant construire des idées que partir explorer le monde." },
        { text: "Entre l’effervescence de Paris et la douceur du Sud, je cultive le goût des contrastes. La montagne à pied, les routes à vélo, la Méditerranée en bateau… Toujours en quête de nouveaux horizons." },
        { text: "Passionné de sport, de voyages et d’échecs, j’aime les défis, les belles rencontres et les chemins de traverse." },
        { strong: "Développeur dans la vie, explorateur dans l’âme.", text: "Je crois aux belles idées, à la curiosité sans limites et à l’art de profiter du chemin autant que de la destination." },
      ],
      cta: "Démarrer un projet",
      callback: "Être rappelé",
    };
  }
  return {
    sheet: "About me",
    title: "Between pixels, peaks and horizons.",
    paragraphs: [
      { text: "Curious by nature, creative by instinct, I love building ideas as much as setting off to explore the world." },
      { text: "Between the buzz of Paris and the softness of the South, I have a taste for contrasts. Mountains on foot, roads by bike, the Mediterranean by boat… Always looking for new horizons." },
      { text: "Passionate about sport, travel and chess, I love challenges, good encounters and the road less travelled." },
      { strong: "A developer in life, an explorer at heart.", text: "I believe in good ideas, boundless curiosity and the art of enjoying the journey as much as the destination." },
    ],
    cta: "Start a project",
    callback: "Get a call back",
  };
}
