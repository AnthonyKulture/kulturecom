// Tous les chiffres de l'article du baromètre pour une édition, calculés depuis
// data/barometre-ia/<édition>/ : on les reporte dans l'article au lieu de les recopier
// à la main. Avec --tableaux, réécrit aussi les tableaux « question par question »
// des articles FR et EN (les questions anglaises existantes sont gardées, dans l'ordre).
//
//   node scripts/barometre-ia-chiffres.mjs [--edition 2026-12] [--tableaux]

import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    edition: { type: "string", default: new Date().toISOString().slice(0, 7) },
    tableaux: { type: "boolean", default: false },
  },
});
const dir = new URL(`../data/barometre-ia/${args.edition}/`, import.meta.url);
const s = JSON.parse(readFileSync(new URL("synthese.json", dir), "utf8"));
const R = JSON.parse(readFileSync(new URL("reponses.json", dir), "utf8")).reponses;
const pct = (n, d) => `${Math.round((100 * n) / d)} %`;
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const answersCiting = (test) => R.filter((r) => r.citations.some((c) => test(host(c.url)))).length;

const st = s.stabilite.total;
const pairs = st[1] + st[2] + st[3];
const se = s.sitesEntreprises;
const out = {
  edition: s.edition,
  questions: s.requetes,
  reponses: s.passages,
  entreprisesDistinctes: s.entreprisesDistinctes,
  citeesParReponse: s.citationsParReponse.toFixed(1).replace(".", ","),
  uneFois: pct(st[1], pairs), deuxFois: pct(st[2], pairs), troisFois: pct(st[3], pairs),
  secteurs: Object.entries(s.stabilite.parSecteur)
    .map(([secteur, c]) => {
      const n = c[1] + c[2] + c[3];
      return { secteur, questions: s.parRequete.filter((q) => q.secteur === secteur).length, noms: n, troisFois: pct(c[3], n), uneFois: pct(c[1], n), _o: c[3] / n };
    })
    .sort((a, b) => b._o - a._o)
    .map(({ _o, ...row }) => row),
  sitesEntreprises: pct(se.dontSiteDUneEntrepriseCitee, se.domainesCites),
  reponsesAvecSiteEntreprise: pct(se.reponsesCitantUnSiteDEntreprise, s.passages),
  liens: R.reduce((n, r) => n + r.citations.length, 0),
  sitesDifferents: new Set(R.flatMap((r) => r.citations.map((c) => host(c.url)))).size,
  liensDistincts: new Set(R.flatMap((r) => r.citations.map((c) => c.url))).size,
  topSites: s.domainesCites.slice(0, 12),
  reponsesCitant: {
    tripadvisor: answersCiting((h) => h.includes("tripadvisor")),
    pagesjaunes: answersCiting((h) => h.includes("pagesjaunes")),
    googleOuMaps: answersCiting((h) => /(^|\.)google\.|goo\.gl|g\.page/.test(h)),
    facebookOuInstagram: answersCiting((h) => /facebook|instagram/.test(h)),
    niceMatin: answersCiting((h) => h.includes("nicematin")),
    leMonde: answersCiting((h) => h.includes("lemonde")),
    theFork: answersCiting((h) => /thefork|lafourchette/.test(h)),
    michelin: answersCiting((h) => h.includes("michelin")),
    doctolib: answersCiting((h) => h.includes("doctolib")),
  },
  questionsSansAdresseStable: s.parRequete.filter((q) => !q.entreprises.some((e) => e.passages === 3)).map((q) => q.requete),
  parQuestion: s.parRequete.map((q) => ({ id: q.id, noms: q.entreprises.length, stables: q.entreprises.filter((e) => e.passages === 3).length })),
  anthonyProfit: s.parRequete
    .map((q) => ({ id: q.id, reponses: R.filter((r) => r.id === q.id && /anthony ?profit/i.test(r.texte)).length }))
    .filter((q) => q.reponses > 0),
};
console.log(JSON.stringify(out, null, 2));

if (args.tableaux) {
  const files = [
    ["src/content/blog/fr/barometre-chatgpt-commerces-nice.mdx", "question par question", "aucun"],
    ["src/content/blog/en/chatgpt-nice-businesses-barometer.mdx", "question by question", "none"],
  ];
  for (const [path, heading, none] of files) {
    let t = readFileSync(path, "utf8");
    const start = t.indexOf("### ", t.indexOf(heading));
    const end = t.indexOf("\n## ", start);
    let block = t.slice(start, end);
    const rows = block.split("\n").filter((l) => /^\| .+ \| \d+ \| .+ \|$/.test(l));
    if (rows.length !== s.parRequete.length) throw new Error(`${path} : ${rows.length} lignes de tableau, ${s.parRequete.length} questions`);
    rows.forEach((row, i) => {
      const q = s.parRequete[i];
      const stables = q.entreprises.filter((e) => e.passages === 3).map((e) => e.nom);
      const question = path.includes("/fr/") ? q.requete : row.split(" | ")[0].slice(2);
      block = block.replace(`${row}\n`, `| ${question} | ${q.entreprises.length} | ${stables.join(", ") || none} |\n`);
    });
    writeFileSync(path, t.slice(0, start) + block + t.slice(end));
    console.error(`Tableaux réécrits : ${path}`);
  }
}
