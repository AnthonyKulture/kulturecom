// Full answers of each edition of the AI barometer, with their cited links,
// served straight from data/barometre-ia/<YYYY-MM>/reponses.json.
import { readFileSync, readdirSync } from "node:fs";

export const getStaticPaths = () =>
  readdirSync("data/barometre-ia").filter((d) => /^\d{4}-\d{2}$/.test(d)).map((edition) => ({ params: { edition } }));

export const GET = ({ params }: { params: { edition: string } }) =>
  new Response(readFileSync(`data/barometre-ia/${params.edition}/reponses.json`, "utf8"), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
