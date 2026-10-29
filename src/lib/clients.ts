/**
 * Client logos for the home hero marquee. Files in /public/clients/<id>.webp
 * are uniform ink silhouettes on transparent backgrounds, exported at 2x;
 * `w` × `h` is the display size in CSS px, chosen so every logo covers about
 * the same visual area (wide wordmarks lower, square marks taller).
 */
export interface ClientLogo {
  id: string;
  name: string;
  w: number;
  h: number;
}

export const CLIENT_LOGOS: ClientLogo[] = [
  { id: "edenrock", name: "Eden Rock Yacht Rental", w: 132, h: 40 },
  { id: "royalyacht", name: "Royal Yacht International", w: 163, h: 31 },
  { id: "sunbeach", name: "Sun Beach House", w: 67, h: 58 },
  { id: "alexalu", name: "AlexAlu", w: 150, h: 33 },
  { id: "surly", name: "Surly", w: 112, h: 46 },
  { id: "ibd", name: "IBD Monaco", w: 95, h: 54 },
  { id: "adaly", name: "Adaly Yacht", w: 114, h: 46 },
  { id: "talisman", name: "Agence Talisman", w: 150, h: 34 },
  { id: "movida", name: "Movida", w: 144, h: 37 },
  { id: "orcal", name: "Orcal Motor", w: 147, h: 36 },
  { id: "ckatelier", name: "CK Atelier", w: 60, h: 58 },
  { id: "josephcap", name: "Joseph Cap 3000", w: 77, h: 58 },
  { id: "loubantry", name: "Lou Bantry", w: 100, h: 52 },
  { id: "cibo", name: "Cibo Trattoria", w: 78, h: 58 },
  { id: "sana", name: "Sana Jardins", w: 111, h: 46 },
  { id: "cordistes", name: "Les Cordistes", w: 126, h: 41 },
];
