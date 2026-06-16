import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://anthonyprofit.com",
  i18n: {
    defaultLocale: "fr",
    locales: ["fr", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    // MDX powers the blog (src/content/blog/**). Registered before react() so
    // MDX files can import .astro AND react components (e.g. <ServiceCTA/>).
    mdx(),
    react(),
    sitemap({
      // Keep error pages out of the sitemap — the EN /404/ is a routable page
      // that returns 200, so @astrojs/sitemap would otherwise list it. Blog
      // tag archives are excluded too: they start `noindex` (thin) and listing
      // a noindex URL in the sitemap sends a mixed signal — internal links
      // handle their discovery instead.
      filter: (page) =>
        !/\/404\/?$/.test(page) && !/\/blog\/tag\//.test(page),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
