// Full answers of the November 2026 AI barometer, with their cited links,
// served straight from the file scripts/barometre-ia.mjs wrote.
import json from "../../../data/barometre-ia/2026-11/reponses.json?raw";

export const GET = () => new Response(json, { headers: { "Content-Type": "application/json; charset=utf-8" } });
