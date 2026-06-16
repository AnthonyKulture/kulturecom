import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts, postPath } from "~/lib/blog";

export async function GET(context: APIContext) {
  const posts = await getPosts("fr");
  return rss({
    title: "Journal — Anthony Profit",
    description:
      "Articles sur le SEO, le GEO (optimisation pour les IA) et la création de sites web sur-mesure.",
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: postPath(p),
      categories: p.data.tags,
    })),
    customData: `<language>fr-FR</language>`,
  });
}
