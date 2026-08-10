import { writeFile } from 'node:fs/promises';
import { defineConfig } from 'astro/config';
import { routes } from './src/data/content.js';

/**
 * Emit dist/_redirects so the non-canonical form of every page redirects
 * permanently instead of temporarily.
 *
 * Astro builds these pages as directories, so the canonical URL is /about/.
 * Cloudflare's asset layer already sends /about → /about/, but it does so with
 * a 307, which is a *temporary* redirect: Google keeps the old URL in the
 * index, reports it under "Page with redirect", and never transfers the
 * signals it accumulated to the canonical. A 301 says the move is permanent
 * and lets that consolidation happen.
 *
 * Rules in _redirects are evaluated before html_handling, so these win over
 * the built-in 307. Verified against wrangler's asset router, which is the
 * same implementation that runs in production.
 *
 * Generated from the route table rather than checked in as a static file, for
 * the same reason the sitemap is: a hand-maintained copy of the route list is
 * a copy that drifts.
 */
function permanentTrailingSlashRedirects() {
  return {
    name: 'permanent-trailing-slash-redirects',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const rules = routes
          .filter((r) => r.path !== '/' && r.path.endsWith('/'))
          .map((r) => `${r.path.slice(0, -1)}  ${r.path}  301`);

        // Directory indexes are reachable by their filename too, and that form
        // is a duplicate of the canonical rather than a page of its own.
        rules.unshift('/index.html  /  301');

        const body = [
          '# Generated at build time from routes in src/data/content.js.',
          '# Edit the route table, not this file.',
          ...rules,
          '',
        ].join('\n');

        await writeFile(new URL('./_redirects', dir), body, 'utf8');
        logger.info(`wrote _redirects (${rules.length} rules)`);
      },
    },
  };
}

// Static-first build. Outputs to ./dist — the directory Cloudflare serves.
export default defineConfig({
  site: 'https://gregjones.io',
  output: 'static',
  compressHTML: true,
  // `always` makes the dev server agree with production, where /about without
  // the slash is a redirect rather than a page. Without it the canonical form
  // is something you only discover after deploying.
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
  integrations: [permanentTrailingSlashRedirects()],
});
