import type { Lang } from "~/i18n/ui";
import { ui } from "~/i18n/ui";

type Translations = (typeof ui)[Lang];

export interface ServiceItem {
  label: string;
  title: string;
  body: string;
}

/**
 * Single source of truth for the 3 service axes, shared by the desktop
 * (Services.astro) and mobile (ServicesMobile.astro) layouts so the data can
 * never drift between the two.
 */
export function getServices(t: Translations): ServiceItem[] {
  return [
    {
      label: t.services["item1.label"],
      title: t.services["item1.title"],
      body: t.services["item1.body"],
    },
    {
      label: t.services["item2.label"],
      title: t.services["item2.title"],
      body: t.services["item2.body"],
    },
    {
      label: t.services["item3.label"],
      title: t.services["item3.title"],
      body: t.services["item3.body"],
    },
  ];
}
