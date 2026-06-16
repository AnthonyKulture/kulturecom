import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts, postPath } from "~/lib/blog";

export async function GET(context: APIContext) {
  const posts = await getPosts("en");
  return rss({
    title: "Journal — Anthony Profit",
    description:
      "Articles on SEO, GEO (optimization for AI engines) and building custom websites.",
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: postPath(p),
      categories: p.data.tags,
    })),
    customData: `<language>en-US</language>`,
  });
}
