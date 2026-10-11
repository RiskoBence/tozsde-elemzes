// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages projekt-oldal: https://<felhasználó>.github.io/tozsde-elemzes/
// Ha a repo neve más, vagy saját domainre váltasz, a BASE_PATH környezeti változóval
// (vagy itt az alapértékkel) állítsd át. Saját domainnél: '/'.
export default defineConfig({
  site: process.env.SITE_URL,
  base: process.env.BASE_PATH ?? '/tozsde-elemzes',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  vite: { plugins: [tailwindcss()] },
});
