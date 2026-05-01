import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://zach.olinske.com',
  output: 'static',
  redirects: {
    '/posts/ai-agent-governance-starting-point': '/posts/000003-ai-agent-governance-framework'
  }
});
