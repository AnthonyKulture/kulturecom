import fr from "./fr.json";
import en from "./en.json";

export const languages = {
  fr: "Français",
  en: "English",
} as const;

export const defaultLang = "fr" as const;

export type Lang = keyof typeof languages;

export const ui = { fr, en } as const;
