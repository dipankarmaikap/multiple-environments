import { defineConfig } from 'astro/config';
import mkcert from 'vite-plugin-mkcert';
import storyblok from '@storyblok/astro';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';
import { loadEnv } from 'vite';

// Load environment variables
const allEnv = loadEnv(process.env.NODE_ENV, process.cwd(), '');
const { STORYBLOK_ACESS_TOKEN, IS_PREVIEW, IS_LOCAL } = allEnv;

// Helper to determine environment
const isPreview = IS_PREVIEW === 'yes';
const isLocal = IS_LOCAL === 'yes';

// Storyblok configuration
const storyblokConfig = {
  accessToken: STORYBLOK_ACESS_TOKEN,
  bridge: isPreview,
  enableFallbackComponent: true,
  customFallbackComponent: 'storyblok/CustomFallback',
  livePreview: isPreview,
  components: {
    page: 'storyblok/Page',
    feature: 'storyblok/Feature',
    teaser: 'storyblok/Teaser',
    // grid: "storyblok/Grid",
  },
};

// https://astro.build/config
export default defineConfig({
  integrations: [storyblok(storyblokConfig), tailwind()],
  output: 'server',
  vite: {
    plugins: isLocal ? [mkcert()] : [],
  },
  adapter: vercel(
    isPreview
      ? {}
      : {
          isr: {
            expiration: 60, // Cache expiration in seconds
          },
        }
  ),
});
