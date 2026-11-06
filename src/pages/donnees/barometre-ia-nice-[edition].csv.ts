// Dataset of each edition of the AI barometer (one row per business cited in an
// answer), served straight from the file scripts/barometre-ia.mjs wrote in
// data/barometre-ia/<YYYY-MM>/. A new edition folder publishes a new file.
import { readFileSync, readdirSync } from "node:fs";

export const getStaticPaths = () =>
  readdirSync("data/barometre-ia").filter((d) => /^\d{4}-\d{2}$/.test(d)).map((edition) => ({ params: { edition } }));

export const GET = ({ params }: { params: { edition: string } }) =>
  new Response(readFileSync(`data/barometre-ia/${params.edition}/cites.csv`, "utf8"), {
    headers: { "Content-Type": "text/csv; charset=utf-8" },
  });
