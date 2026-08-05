/**
 * sitemap.xml — generated from the route table rather than hand-maintained.
 *
 * This replaces a static file in /public that had to be edited by hand every
 * time a page was added, which is exactly the kind of step that gets skipped.
 * Routes live in content.js and feed both this and the primary nav.
 *
 * Prerendered at build time because the site is `output: 'static'`, so the
 * deployed artifact is still a plain file at /sitemap.xml. robots.txt keeps
 * pointing at the same URL.
 */
import { routes } from '../data/content.js';

export function GET({ site }) {
  const origin = (site ?? new URL('https://gregjones.io')).origin;

  const urls = routes
    .map(
      (r) => `  <url>
    <loc>${origin}${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    )
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
