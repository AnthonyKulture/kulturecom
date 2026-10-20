// /llms-full.txt — the full text of the key pages (services, case studies,
// guides) as Markdown, for LLMs and AI search engines. Companion of the curated
// /llms.txt index (public/llms.txt). Built from the same sources as the pages,
// so it can't drift from the site.
import type { APIContext } from "astro";
import { ui, type Lang } from "~/i18n/ui";
import { SERVICE_PAGES, getServicePage } from "~/lib/service-pages";
import { CASE_STUDIES, caseStudyPath, getCaseStudy } from "~/lib/case-studies";
import { getPosts, postPath } from "~/lib/blog";

const day = (d: Date): string => d.toISOString().slice(0, 10);

/** MDX body → plain Markdown: drop imports and service CTA cards, keep callout text. */
const mdxToMarkdown = (body: string): string =>
  body
    .replace(/^import .*$/gm, "")
    .replace(/^<ServiceCTA[^>]*\/>\s*$/gm, "")
    .replace(/^<Callout title="([^"]*)">\s*$/gm, "**$1**")
    .replace(/^<\/Callout>\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export async function GET(context: APIContext) {
  const site = context.site!;
  const abs = (path: string): string => new URL(path, site).toString();
  const out: string[] = [
    "# Anthony Profit (Kulturecom) — texte intégral / full text",
    "",
    "> Designer et développeur web freelance à Nice (Côte d'Azur, France), sous le nom Kulturecom : sites internet sur-mesure, outils / apps & IA, SEO & GEO (dont campagnes ChatGPT Ads), identité de marque. Contact : contact@kulturecom.fr · WhatsApp +33 6 60 50 16 82.",
    "",
    `Index : ${abs("/llms.txt")} · Généré le ${day(new Date())}.`,
  ];

  for (const lang of ["fr", "en"] as Lang[]) {
    const fr = lang === "fr";
    out.push("", "---", "", fr ? "# Version française" : "# English version");

    out.push("", fr ? "## Services" : "## Services");
    for (const meta of SERVICE_PAGES) {
      const sp = getServicePage(meta.id, lang)!;
      const c = sp.content;
      out.push("", `### ${c.name} — ${abs(meta.path[lang])}`, "", c.lead, "", ...c.intro.flatMap((p) => [p, ""]));
      out.push(`**${c.includesTitle}**`, "", ...c.includes.map((i) => `- ${i}`), "");
      out.push(`**${c.methodTitle}**`, "", ...c.method.map((s) => `${s.n}. ${s.title} — ${s.body}`), "");
      out.push(`**${c.faqTitle}**`, "", ...c.faq.flatMap((f) => [`- ${f.q}`, `  ${f.a}`]));
    }

    out.push("", fr ? "## Études de cas" : "## Case studies");
    for (const meta of CASE_STUDIES) {
      const cs = getCaseStudy(ui[lang], meta.slug)!;
      out.push(
        "",
        `### ${cs.title} — ${cs.headline} — ${abs(caseStudyPath(meta.slug, lang))}`,
        "",
        `${cs.subtitle}. ${cs.metric}. Stack : ${cs.stack}.${meta.liveUrl ? ` ${fr ? "Site" : "Live site"} : ${meta.liveUrl}` : ""}`,
        ...cs.sections.flatMap((s) => ["", `**${s.label}** — ${s.body}`]),
      );
    }

    out.push("", fr ? "## Guides" : "## Guides");
    for (const post of await getPosts(lang)) {
      const d = post.data;
      const dates = d.updatedDate
        ? `${fr ? "publié le" : "published"} ${day(d.pubDate)}, ${fr ? "mis à jour le" : "updated"} ${day(d.updatedDate)}`
        : `${fr ? "publié le" : "published"} ${day(d.pubDate)}`;
      out.push("", `### ${d.title} — ${abs(postPath(post))}`, "", `_${dates} · ${d.author}_`, "", mdxToMarkdown(post.body ?? ""));
    }
  }

  return new Response(out.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
