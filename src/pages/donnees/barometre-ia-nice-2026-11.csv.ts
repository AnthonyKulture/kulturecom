// Dataset of the November 2026 AI barometer (one row per business cited in an
// answer), served straight from the file scripts/barometre-ia.mjs wrote.
import csv from "../../../data/barometre-ia/2026-11/cites.csv?raw";

export const GET = () => new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8" } });
