// Baromètre « Quels commerces niçois ChatGPT recommande-t-il ? »
//
// Pose chaque requête de data/barometre-ia/requetes.json à l'API OpenAI,
// recherche web activée et localisée à Nice, plusieurs fois (les réponses
// varient d'un passage à l'autre), puis extrait les entreprises citées.
// Passe par Chat Completions et gpt-5-search-api : en novembre 2026, l'API
// Responses refusait les crédits du compte alors que Chat Completions les acceptait.
// Les réponses brutes vont dans data/barometre-ia/<édition>/reponses.json ;
// un passage déjà fait n'est pas refait, donc on peut relancer après une coupure.
//
//   node --env-file=.env scripts/barometre-ia.mjs [--limit 2] [--runs 3] [--edition 2026-11]
//
// Variables : OPENAI_API_KEY (obligatoire), BAROMETRE_MODEL, BAROMETRE_EXTRACT_MODEL.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    limit: { type: "string" },
    runs: { type: "string", default: "3" },
    edition: { type: "string", default: new Date().toISOString().slice(0, 7) },
  },
});

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) {
  console.error("OPENAI_API_KEY manquante : ajoute-la dans .env puis lance avec node --env-file=.env");
  process.exit(1);
}
const MODEL = process.env.BAROMETRE_MODEL || "gpt-5-search-api";
const EXTRACT_MODEL = process.env.BAROMETRE_EXTRACT_MODEL || "gpt-6-luna";
const RUNS = Number(args.runs);
// One answer at a time: a new account is capped at 45k tokens per minute for
// gpt-5-search-api, and each answer reads about 17k tokens of search results.
const CONCURRENCY = 1;

const dir = new URL(`../data/barometre-ia/${args.edition}/`, import.meta.url);
mkdirSync(dir, { recursive: true });
const outFile = new URL("reponses.json", dir);

const queries = JSON.parse(readFileSync(new URL("../data/barometre-ia/requetes.json", import.meta.url), "utf8"))
  .slice(0, args.limit ? Number(args.limit) : undefined);

const out = existsSync(outFile)
  ? JSON.parse(readFileSync(outFile, "utf8"))
  : { edition: args.edition, modele: MODEL, modeleExtraction: EXTRACT_MODEL, lieu: "Nice, FR", reponses: [] };
const done = new Set(out.reponses.map((r) => `${r.id}#${r.passage}`));

async function openai(body) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();
    const text = await res.text();
    // An empty balance also comes back as a 429: retrying won't help, and every
    // other call would fail the same way.
    if (text.includes("insufficient_quota")) {
      console.error("Plus de crédit sur le compte OpenAI : ajoute du crédit dans Settings > Billing, puis relance.");
      process.exit(1);
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 6) {
      await new Promise((r) => setTimeout(r, 30000 * attempt));
      continue;
    }
    throw new Error(`OpenAI ${res.status} : ${text.slice(0, 300)}`);
  }
}

// The question goes in exactly as a user would type it: no system prompt.
async function ask(requete) {
  const res = await openai({
    model: MODEL,
    web_search_options: {
      user_location: { type: "approximate", approximate: { country: "FR", city: "Nice", region: "Provence-Alpes-Côte d'Azur", timezone: "Europe/Paris" } },
    },
    messages: [{ role: "user", content: requete }],
  });
  const message = res.choices[0].message;
  return {
    texte: message.content,
    citations: (message.annotations ?? []).filter((a) => a.type === "url_citation")
      .map(({ url_citation: { url, title } }) => ({ url: url.replace(/[?&]utm_source=openai$/, ""), title })),
    usage: res.usage,
  };
}

async function extract(texte) {
  const res = await openai({
    model: EXTRACT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "Liste les établissements précis que cette réponse recommande ou cite : entreprises, commerces, cabinets, professionnels nommés. " +
          "Ignore les catégories (« une boulangerie ») et les plateformes ou annuaires (Google, TripAdvisor, PagesJaunes, Doctolib…). " +
          "Garde le nom tel qu'il est écrit, et le site web s'il apparaît dans la réponse.",
      },
      { role: "user", content: texte },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "entreprises",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["entreprises"],
          properties: {
            entreprises: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["nom", "site"],
                properties: { nom: { type: "string" }, site: { type: ["string", "null"] } },
              },
            },
          },
        },
      },
    },
  });
  return JSON.parse(res.choices[0].message.content).entreprises;
}

const tasks = queries.flatMap((q) =>
  Array.from({ length: RUNS }, (_, i) => ({ ...q, passage: i + 1 })).filter((t) => !done.has(`${t.id}#${t.passage}`)),
);
console.log(`${tasks.length} passage(s) à faire (${queries.length} requêtes × ${RUNS}), modèle ${MODEL}`);

let finished = 0;
async function worker() {
  for (let t = tasks.shift(); t; t = tasks.shift()) {
    try {
      const answer = await ask(t.requete);
      const entreprises = await extract(answer.texte);
      out.reponses.push({ id: t.id, secteur: t.secteur, requete: t.requete, passage: t.passage, date: new Date().toISOString(), ...answer, entreprises });
      writeFileSync(outFile, JSON.stringify(out, null, 2));
      console.log(`[${++finished}] ${t.id} #${t.passage} : ${entreprises.length} entreprise(s)`);
    } catch (e) {
      console.error(`${t.id} #${t.passage} : ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// Synthesis: for each query, how many passages cite each business; overall,
// how stable the recommendations are and which sites the answers lean on.
// Names are matched loosely (case, accents, punctuation), then through the
// edition's alias.json, where variants of one business are merged by hand.
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return null; } };
const count = (list) => Object.entries(list.reduce((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
const aliasFile = new URL("alias.json", dir);
const alias = new Map(existsSync(aliasFile) ? Object.entries(JSON.parse(readFileSync(aliasFile, "utf8"))).map(([k, v]) => [norm(k), v]) : []);
const canon = (nom) => alias.get(norm(nom)) ?? nom;

const parRequete = queries.map((q) => {
  const rs = out.reponses.filter((r) => r.id === q.id);
  const noms = new Map();
  for (const r of rs) for (const e of r.entreprises) {
    const k = norm(canon(e.nom));
    const cur = noms.get(k) ?? { nom: canon(e.nom), site: e.site, passages: new Set() };
    cur.site ??= e.site;
    cur.passages.add(r.passage);
    noms.set(k, cur);
  }
  return {
    id: q.id, secteur: q.secteur, requete: q.requete, passages: rs.length,
    entreprises: [...noms.values()].map((e) => ({ nom: e.nom, site: e.site, passages: e.passages.size })).sort((a, b) => b.passages - a.passages),
  };
});
// Businesses per query by number of passages citing them (1, 2 or 3).
const stabilite = (qs) => {
  const c = Object.fromEntries(Array.from({ length: RUNS }, (_, i) => [i + 1, 0]));
  for (const q of qs) for (const e of q.entreprises) c[e.passages]++;
  return c;
};
// Domains cited in each answer, and among them the site of a business the answer
// names (a lower bound: the extraction only keeps a site written in the answer).
const domaines = out.reponses.map((r) => {
  const cites = new Set(r.citations.map((c) => host(c.url)).filter(Boolean));
  const sites = new Set(r.entreprises.map((e) => e.site && host(e.site)).filter(Boolean));
  return { cites, propres: [...cites].filter((d) => sites.has(d)).length };
});

writeFileSync(new URL("synthese.json", dir), JSON.stringify({
  edition: out.edition, modele: out.modele, passages: out.reponses.length, requetes: queries.length,
  entreprisesDistinctes: new Set(out.reponses.flatMap((r) => r.entreprises.map((e) => norm(canon(e.nom))))).size,
  citationsParReponse: out.reponses.reduce((n, r) => n + r.entreprises.length, 0) / out.reponses.length,
  stabilite: {
    total: stabilite(parRequete),
    parSecteur: Object.fromEntries([...new Set(queries.map((q) => q.secteur))].map((s) => [s, stabilite(parRequete.filter((q) => q.secteur === s))])),
  },
  sitesEntreprises: {
    domainesCites: domaines.reduce((n, d) => n + d.cites.size, 0),
    dontSiteDUneEntrepriseCitee: domaines.reduce((n, d) => n + d.propres, 0),
    reponsesCitantUnSiteDEntreprise: domaines.filter((d) => d.propres > 0).length,
  },
  // Number of answers citing each domain at least once.
  domainesCites: count(domaines.flatMap((d) => [...d.cites])).slice(0, 40),
  parRequete,
}, null, 2));

const csv = [["secteur", "requete", "passage", "entreprise", "nom_dans_la_reponse", "site"]];
for (const r of out.reponses) for (const e of r.entreprises) csv.push([r.secteur, r.requete, r.passage, canon(e.nom), e.nom, e.site ?? ""]);
writeFileSync(new URL("cites.csv", dir), csv.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n") + "\n");

const tokens = out.reponses.reduce((n, r) => n + (r.usage?.total_tokens ?? 0), 0);
console.log(`Fini : ${out.reponses.length} passage(s), ${tokens} tokens (réponses), fichiers dans data/barometre-ia/${args.edition}/`);
