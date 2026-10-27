/**
 * Client side of the contact form (CTA.astro) and the callback dialog
 * (CallbackDialog.astro); the guided project form (ProjectDialog.astro) sends
 * through it too: step flow, validation, submission to the Cloudflare
 * Pages Function `/api/lead`, GA4 `generate_lead`, and a prefilled e-mail /
 * WhatsApp fallback if the request fails.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type Strings = {
  step: string;
  sending: string;
  submit: string;
  invalid: { name: string; email: string; phone: string };
  needs: Record<string, string>;
  labels: { name: string; email: string; phone: string; message: string };
  mailSubject: string;
  email: string;
  whatsapp: string;
  whatsappMessage: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{6,20}$/;

export const isValidPhone = (v: string): boolean =>
  PHONE_RE.test(v) && v.replace(/\D/g, "").length >= 6;

export const isValidEmail = (v: string): boolean => EMAIL_RE.test(v);

/** First-touch campaign data captured on landing (Analytics.astro). */
const attribution = (): Record<string, string> => {
  try {
    return JSON.parse(sessionStorage.getItem("ap-attrib") || "{}");
  } catch {
    return {};
  }
};

export async function sendLead(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...payload, page: location.pathname, attribution: attribution() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const trackLead = (method: string, need?: string): void => {
  window.gtag?.("event", "generate_lead", need ? { method, need } : { method });
};

export function initLeadForms(): void {
  document.querySelectorAll<HTMLFormElement>("[data-lead-form]").forEach(initForm);
}

function initForm(form: HTMLFormElement): void {
  if (form.dataset.js) return;
  form.dataset.js = "";
  const s = JSON.parse(form.dataset.strings || "{}") as Strings;
  const steps = Array.from(form.querySelectorAll<HTMLFieldSetElement>("[data-step]"));
  const count = form.querySelector<HTMLElement>("[data-lf-count]")!;
  const bar = form.querySelector<HTMLElement>("[data-lf-bar]")!;
  const back = form.querySelector<HTMLButtonElement>("[data-lf-back]")!;
  const submit = form.querySelector<HTMLButtonElement>("[data-lf-submit]")!;
  const submitLabel = form.querySelector<HTMLElement>("[data-lf-submit-label]")!;
  const startedAt = Date.now();
  const history: number[] = [];
  let current = 0;

  const value = (name: string): string =>
    (form.elements.namedItem(name) as RadioNodeList | HTMLInputElement | null)?.value?.trim() ?? "";

  const show = (index: number, focus = true): void => {
    current = index;
    steps.forEach((st, i) => st.toggleAttribute("data-current", i === index));
    count.textContent = `${s.step} ${index + 1}/${steps.length}`;
    bar.style.transform = `scaleX(${(index + 1) / steps.length})`;
    back.hidden = history.length === 0;
    syncNext();
    if (focus) {
      const target =
        steps[index].querySelector<HTMLInputElement>("input:checked") ??
        steps[index].querySelector<HTMLInputElement>("input:not([type=hidden]), textarea");
      target?.focus({ preventScroll: true });
    }
  };

  const go = (index: number): void => {
    history.push(current);
    show(index);
  };

  const syncNext = (): void => {
    steps.forEach((st) => {
      const next = st.querySelector<HTMLButtonElement>("[data-lf-next]");
      if (next) next.disabled = !st.querySelector("input:checked");
    });
  };

  back.addEventListener("click", () => {
    const prev = history.pop();
    if (prev !== undefined) show(prev);
  });

  steps.forEach((st, i) => {
    st.querySelector("[data-lf-next]")?.addEventListener("click", () => go(i + 1));
    st.addEventListener("change", syncNext);
    // Pointer clicks on a choice advance on their own; keyboard users move
    // with the arrows and confirm with the OK button (synthetic clicks from
    // arrow keys have detail 0).
    st.addEventListener("click", (e) => {
      const input = (e.target as HTMLElement).closest("input[type=radio]");
      if (!input || (e as MouseEvent).detail === 0) return;
      window.setTimeout(() => go(i + 1), 220);
    });
  });

  // Prefill from a page (a service page passes its need).
  const preselect = (need: string): void => {
    const radio = form.querySelector<HTMLInputElement>(`input[name=need][value="${need}"]`);
    if (!radio) return;
    radio.checked = true;
    history.length = 0;
    history.push(0);
    show(1, false);
  };
  if (form.dataset.need) preselect(form.dataset.need);
  else show(0, false);

  const setError = (name: string, message: string): boolean => {
    const input = form.elements.namedItem(name) as HTMLInputElement;
    const err = form.querySelector<HTMLElement>(`#lf-${name}-err`);
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (err) {
      err.textContent = message;
      err.hidden = !message;
    }
    return !message;
  };

  const validate = (): boolean => {
    const okName = setError("name", value("name") ? "" : s.invalid.name);
    const okEmail = setError("email", EMAIL_RE.test(value("email")) ? "" : s.invalid.email);
    const phone = value("phone");
    const okPhone = setError("phone", !phone || isValidPhone(phone) ? "" : s.invalid.phone);
    const firstBad = form.querySelector<HTMLElement>("[aria-invalid=true]");
    firstBad?.focus();
    return okName && okEmail && okPhone;
  };

  // Fallback links carry the whole request, so nothing typed is lost.
  const fillFallback = (): void => {
    const lines = [
      s.needs[value("need")] ?? "",
      value("message"),
      "",
      `${s.labels.name} : ${value("name")}`,
      `${s.labels.email} : ${value("email")}`,
      value("phone") ? `${s.labels.phone} : ${value("phone")}` : "",
    ].filter((l, i) => l || i === 2);
    const body = lines.join("\n");
    const mail = form.querySelector<HTMLAnchorElement>("[data-lf-mail]");
    const wa = form.querySelector<HTMLAnchorElement>("[data-lf-wa]");
    if (mail) mail.href = `mailto:${s.email}?subject=${encodeURIComponent(s.mailSubject)}&body=${encodeURIComponent(body)}`;
    if (wa) wa.href = `https://wa.me/${s.whatsapp}?text=${encodeURIComponent(`${s.whatsappMessage}\n\n${body}`)}`;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;
    submit.disabled = true;
    submitLabel.textContent = s.sending;
    const need = value("need");
    const ok = await sendLead({
      type: "project",
      lang: value("lang"),
      need,
      name: value("name"),
      email: value("email"),
      phone: value("phone"),
      message: value("message"),
      website: value("website"),
      elapsed: Date.now() - startedAt,
    });
    submit.disabled = false;
    submitLabel.textContent = s.submit;
    form.dataset.done = "";
    const panel = form.querySelector<HTMLElement>(ok ? "[data-lf-success]" : "[data-lf-error]")!;
    if (ok) trackLead("form", need);
    else fillFallback();
    panel.hidden = false;
    panel.setAttribute("tabindex", "-1");
    panel.focus({ preventScroll: true });
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
