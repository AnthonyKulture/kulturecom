// Propose les doublons de noms d'une édition du baromètre (variantes d'une même
// entreprise : « Maître » / « Me », ville ajoutée, forme juridique…), à relire avant
// de les ajouter à data/barometre-ia/<édition>/alias.json. Rien n'est appliqué ici.
//
// Deux passes sur synthese.json (lancer d'abord scripts/barometre-ia.mjs) :
//   1. comparaison de mots clés : deux noms d'une même question qui partagent leur
//      premier mot distinctif ;
//   2. un modèle regroupe les noms qui désignent certainement le même établissement.
//
//   node --env-file=.env scripts/barometre-ia-doublons.mjs [--edition 2026-12]
//
// Écrit data/barometre-ia/<édition>/doublons-proposes.json et l'affiche.

import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: { edition: { type: "string", default: new Date().toISOString().slice(0, 7) } },
});
const dir = new URL(`../data/barometre-ia/${args.edition}/`, import.meta.url);
const s = JSON.parse(readFileSync(new URL("synthese.json", dir), "utf8"));

const norm = (x) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
// Words too common to tell two businesses apart.
const GENERIC = new Set(("le la les l de du des d chez dr docteur maitre me mme cabinet centre restaurant hotel spa agence garage " +
  "auto ecole boulangerie patisserie pizzeria plage glacier bar cafe salon studio clinique veterinaire maison boutique " +
  "fromagerie librairie cave caves atelier sas scp selarl selas nice yoga coiffure institut optique opticien and et by " +
  "the a au aux en sur").split(" "));
const key = (n) => norm(n).split(" ").filter((w) => w.length > 2 && !GENERIC.has(w));

const proposals = [];
for (const q of s.parRequete) {
  const names = q.entreprises.map((e) => e.nom);
  for (let i = 0; i < names.length; i++)
    for (const b of names.slice(i + 1)) {
      const [ka, kb] = [key(names[i]), key(b)];
      if (ka[0] && ka[0] === kb[0]) proposals.push({ id: q.id, source: "mots clés", groupe: [names[i], b] });
    }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.BAROMETRE_DOUBLONS_MODEL || "gpt-6.1-sol",
      messages: [
        {
          role: "system",
          content:
            "Tu reçois une liste de noms d'établissements à Nice, cités en réponse à une même question. Regroupe uniquement les noms " +
            "qui désignent certainement le même établissement (variantes d'écriture, ajout de ville, de quartier, de titre comme " +
            "Maître/Me, de forme juridique). Ne regroupe pas deux établissements distincts d'une même chaîne ou d'un même groupe " +
            "s'ils ont des adresses différentes. Ne renvoie que les groupes d'au moins deux noms, en recopiant les noms exactement.",
        },
        { role: "user", content: `Question : ${q.requete}\nNoms :\n${names.map((n) => `- ${n}`).join("\n")}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "groupes",
          strict: true,
          schema: {
            type: "object", additionalProperties: false, required: ["groupes"],
            properties: { groupes: { type: "array", items: { type: "array", items: { type: "string" } } } },
          },
        },
      },
    }),
  });
  const j = await res.json();
  if (j.error) {
    console.error(`${q.id} : ${j.error.message}`);
    if (j.error.type === "insufficient_quota") process.exit(1);
    continue;
  }
  for (const groupe of JSON.parse(j.choices[0].message.content).groupes)
    if (groupe.length > 1) proposals.push({ id: q.id, source: "modèle", groupe });
}

writeFileSync(new URL("doublons-proposes.json", dir), JSON.stringify(proposals, null, 2) + "\n");
for (const p of proposals) console.log(`${p.id} (${p.source}) : ${p.groupe.join(" | ")}`);
console.log(`${proposals.length} proposition(s) dans data/barometre-ia/${args.edition}/doublons-proposes.json`);
