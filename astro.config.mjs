import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://zach.olinske.com',
  output: 'static'
});
