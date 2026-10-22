/**
 * POST /api/lead — contact form and callback requests (Cloudflare Pages
 * Function, deployed with the site). Each lead is e-mailed through Brevo's
 * transactional API; a callback request is flagged [RAPPEL] in the subject so
 * the phone notification stands out.
 *
 * Settings → Variables and secrets (Cloudflare Pages project):
 *   BREVO_API_KEY  secret, Brevo API key (SMTP & API → API keys)
 *   LEAD_FROM      sender verified in Brevo, e.g. site@anthonyprofit.com
 *   LEAD_TO        recipient (optional, defaults to contact@kulturecom.fr)
 *
 * Without them the endpoint answers 503 and the form shows its prefilled
 * e-mail / WhatsApp fallback, so no request is lost.
 */

interface Env {
  BREVO_API_KEY?: string;
  LEAD_FROM?: string;
  LEAD_TO?: string;
}

const NEEDS: Record<string, string> = {
  seo: "Être trouvé sur Google et cité par les IA (SEO, GEO, ChatGPT Ads)",
  web: "Créer ou refaire un site",
  apps: "Outils, apps & IA",
  brand: "Identité de marque",
  checkup: "Check-up visibilité IA offert",
  other: "Autre",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{6,20}$/;

/** Trimmed, length-capped string without control characters. */
const clean = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max) : "";

const validPhone = (v: string): boolean => PHONE_RE.test(v) && v.replace(/\D/g, "").length >= 6;

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const isJson = (request.headers.get("content-type") || "").includes("application/json");
  let data: Record<string, unknown>;
  try {
    data = isJson ? await request.json() : Object.fromEntries(await request.formData());
  } catch {
    return reply(400, isJson, "bad_request");
  }

  // Bots: honeypot filled, or sent faster than a person can type. Answer "ok"
  // so they don't retry, but send nothing.
  const elapsed = Number(data.elapsed ?? Infinity);
  if (clean(data.website, 200) || elapsed < 2000) return reply(200, isJson);

  const type = data.type === "callback" ? "callback" : "project";
  const name = clean(data.name, 80);
  const email = clean(data.email, 160);
  const phone = clean(data.phone, 24);
  const message = clean(data.message, 1000);
  const need = clean(data.need, 20);
  const page = clean(data.page, 200);

  const valid =
    type === "callback"
      ? validPhone(phone)
      : !!name && EMAIL_RE.test(email) && (!phone || validPhone(phone));
  if (!valid) return reply(422, isJson, "invalid");

  if (!env.BREVO_API_KEY || !env.LEAD_FROM) return reply(503, isJson, "not_configured");

  const when = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  const attribution =
    data.attribution && typeof data.attribution === "object"
      ? Object.entries(data.attribution as Record<string, unknown>)
          .map(([k, v]) => `${clean(k, 30)} : ${clean(v, 200)}`)
          .join("\n")
      : "";

  const lines =
    type === "callback"
      ? [
          "Demande de rappel",
          "",
          `Téléphone : ${phone}`,
          `Prénom : ${name || "non renseigné"}`,
          `Demande faite : ${data.openHours ? "pendant les horaires, rappel immédiat promis" : "hors horaires, rappel promis à la réouverture"}`,
        ]
      : [
          "Nouvelle demande de projet",
          "",
          `Besoin : ${NEEDS[need] ?? "non renseigné"}`,
          `Prénom : ${name}`,
          `E-mail : ${email}`,
          `Téléphone : ${phone || "non renseigné"}`,
          "",
          "Message :",
          message || "(aucun)",
        ];
  lines.push("", `Page : ${page || "?"}`, `Langue : ${clean(data.lang, 5) || "?"}`, `Reçu le : ${when}`);
  if (attribution) lines.push("", "Provenance (première page de la visite) :", attribution);

  const subject =
    type === "callback"
      ? `[RAPPEL] ${phone}${name ? ` · ${name}` : ""}`
      : `[Contact] ${NEEDS[need] ?? "Projet"} · ${name}`;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "anthonyprofit.com", email: env.LEAD_FROM },
      to: [{ email: env.LEAD_TO || "contact@kulturecom.fr" }],
      ...(type === "project" ? { replyTo: { email, name } } : {}),
      subject,
      textContent: lines.join("\n"),
    }),
  });
  // Brevo's answer goes to the Cloudflare logs (deployment → Functions →
  // real-time logs); its message id is returned so a lead can be found in
  // Brevo → Transactional → Logs.
  const body = await res.text();
  if (!res.ok) {
    console.error("brevo", res.status, body.slice(0, 500));
    return reply(502, isJson, "send_failed");
  }
  console.log("brevo", res.status, body.slice(0, 200));
  let id: string | undefined;
  try {
    id = (JSON.parse(body) as { messageId?: string }).messageId;
  } catch {}
  return reply(200, isJson, undefined, id);
}

/** JSON for the scripted form; a minimal page for a no-JS form post. */
function reply(status: number, isJson: boolean, error?: string, id?: string): Response {
  if (isJson) {
    return new Response(JSON.stringify(error ? { ok: false, error } : { ok: true, ...(id && { id }) }), {
      status,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  }
  const ok = status === 200;
  const text = ok
    ? "Merci, votre demande est bien reçue. Je vous réponds sous 48 h ouvrées."
    : "L'envoi n'a pas abouti. Écrivez-moi à contact@kulturecom.fr ou sur WhatsApp au +33 6 60 50 16 82.";
  const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${ok ? "Merci" : "Envoi impossible"}</title><body style="margin:0;padding:48px 20px;font:18px/1.5 system-ui,sans-serif;background:#efe9dc;color:#0b0b0b"><p>${text}</p><p><a href="/" style="color:inherit">Retour au site</a></p></body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

/**
 * TEMPORARY diagnostic (remove once leads arrive): GET /api/lead?diag[&id=<messageId>]
 * asks Brevo, with the server-side key, which account the key belongs to,
 * whether transactional sending is enabled, and what happened to a message.
 * Addresses are masked; nothing is sent.
 */
export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const url = new URL(request.url);
  if (!url.searchParams.has("diag")) return new Response(null, { status: 405 });
  if (!env.BREVO_API_KEY) return Response.json({ configured: false });
  const mask = (e: unknown): string => String(e ?? "").replace(/^(.{2}).*(@.*)$/, "$1•••$2");
  const brevo = (path: string) =>
    fetch(`https://api.brevo.com/v3${path}`, { headers: { "api-key": env.BREVO_API_KEY!, accept: "application/json" } }).then(
      async (r) => ({ status: r.status, body: (await r.json().catch(() => null)) as Record<string, any> | null }),
    );
  const account = await brevo("/account");
  const id = url.searchParams.get("id");
  const events = id ? await brevo(`/smtp/statistics/events?days=7&messageId=${encodeURIComponent(id)}`) : null;
  return Response.json(
    {
      configured: true,
      from: mask(env.LEAD_FROM),
      to: mask(env.LEAD_TO || "contact@kulturecom.fr"),
      account: {
        status: account.status,
        email: mask(account.body?.email),
        company: account.body?.companyName,
        relayEnabled: account.body?.relay?.enabled,
        plan: account.body?.plan?.map((p: any) => `${p.type}:${p.credits}`),
        error: account.status >= 300 ? account.body : undefined,
      },
      events: events && {
        status: events.status,
        list: events.body?.events?.map((e: any) => ({ event: e.event, reason: e.reason, date: e.date, to: mask(e.email) })),
        error: events.status >= 300 ? events.body : undefined,
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
