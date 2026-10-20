/**
 * Shared schema.org fragments. `AREA_SERVED` is used by the global
 * ProfessionalService node (BaseLayout) and by every Service node
 * (ServicePage), so the business and its services declare the same area.
 */
export const AREA_SERVED = [
  { "@type": "City", "name": "Nice", "sameAs": "https://www.wikidata.org/wiki/Q33959" },
  { "@type": "AdministrativeArea", "name": "Côte d'Azur" },
  { "@type": "Country", "name": "France" },
];
