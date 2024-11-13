import { defineConfig } from "astro/config";
import mkcert from "vite-plugin-mkcert";
import storyblok from "@storyblok/astro";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel/serverless";
import { loadEnv } from "vite";

const allEnv = loadEnv(process.env.NODE_ENV, process.cwd(), "");
const { STORYBLOK_ACESS_TOKEN } = allEnv;

// https://astro.build/config
export default defineConfig({
  integrations: [
    storyblok({
      accessToken: STORYBLOK_ACESS_TOKEN,
      bridge: true,
      enableFallbackComponent: true,
      livePreview: true,
      components: {
        // page: "storyblok/Page",
        // feature: "storyblok/Feature",
        // grid: "storyblok/Grid",
        // teaser: "storyblok/Teaser",
      },
    }),
    tailwind(),
  ],
  output: "server",
  vite: {
    plugins: [mkcert()],
  },
  adapter: vercel(),
});
