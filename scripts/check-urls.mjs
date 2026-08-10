/**
 * check-urls.mjs — fail the build when the site links to its own redirects.
 *
 * Search Console reported "Page with redirect" because the sitemap listed
 * /about while the deployed page lives at /about/. Nothing in the repo could
 * catch that: the sitemap, the canonical tag and the nav were each internally
 * consistent, and the disagreement between them only showed up in production.
 *
 * This resolves every self-referential URL in the built output the way the
 * Cloudflare asset layer resolves it (dist/_redirects first, then
 * html_handling: force-trailing-slash) and fails if any of them is anything
 * other than a 200. Run against dist/, so it checks what actually deploys.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const ORIGIN = 'https://gregjones.io';

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

/** Every file in dist, as site-absolute paths ("/about/index.html"). */
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [`/${relative(DIST, full).split(/[\\/]/).join('/')}`];
  });
}
const files = new Set(walk(DIST));

/** Redirect rules as deployed: "from" → "to". */
const redirects = new Map(
  (existsSync(join(DIST, '_redirects')) ? readFileSync(join(DIST, '_redirects'), 'utf8') : '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split(/\s+/))
    .map(([from, to]) => [from, to])
);

/**
 * What the asset layer does with a path. Mirrors the behaviour verified
 * against wrangler: _redirects wins, then an exact file match, then
 * force-trailing-slash sends any other HTML path to its slashed form.
 */
function resolve(path) {
  if (redirects.has(path)) return { status: 301, to: redirects.get(path) };
  if (files.has(path)) return { status: 200 };
  if (path.endsWith('/') && files.has(`${path}index.html`)) return { status: 200 };
  if (path.endsWith('/index.html')) return { status: 307, to: path.slice(0, -'index.html'.length) };
  if (!path.endsWith('/') && files.has(`${path}/index.html`)) return { status: 307, to: `${path}/` };
  return { status: 404 };
}

const problems = [];
const check = (source, kind, url) => {
  const { status, to } = resolve(url);
  if (status !== 200) {
    problems.push(`${source}: ${kind} ${url} → ${status}${to ? ` ${to}` : ''} (expected 200)`);
  }
};

/** Site-absolute path for a same-origin URL, or null if it points elsewhere. */
function internalPath(href) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null;
  if (href.startsWith('//')) return null;
  if (href.startsWith('/')) return href.split(/[?#]/)[0];
  if (href.startsWith(`${ORIGIN}/`) || href === ORIGIN) {
    return new URL(href).pathname.split(/[?#]/)[0] || '/';
  }
  return null;
}

// 1. Sitemap: the list Google is handed. Every entry must be a live page.
const sitemap = join(DIST, 'sitemap.xml');
if (!existsSync(sitemap)) {
  problems.push('sitemap.xml: missing from the build');
} else {
  for (const [, loc] of readFileSync(sitemap, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const path = internalPath(loc);
    if (path === null) problems.push(`sitemap.xml: <loc> ${loc} is not on ${ORIGIN}`);
    else check('sitemap.xml', '<loc>', path);
  }
}

// 2. Each page's canonical must be the URL that page is actually served at,
//    and every link it emits must land on a page rather than a redirect.
for (const file of [...files].filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(join(DIST, file), 'utf8');
  const served = file === '/index.html' ? '/' : file.replace(/index\.html$/, '');
  const source = file.slice(1);

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical) {
    problems.push(`${source}: no <link rel="canonical">`);
  } else if (canonical !== `${ORIGIN}${served}`) {
    problems.push(`${source}: canonical is ${canonical}, page is served at ${ORIGIN}${served}`);
  }

  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
  if (ogUrl && ogUrl !== canonical) {
    problems.push(`${source}: og:url ${ogUrl} disagrees with canonical ${canonical}`);
  }

  for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const path = internalPath(href);
    if (path !== null) check(source, 'link', path);
  }
}

// 3. Every route in the table must be reachable, and its unslashed form must
//    redirect permanently rather than with the asset layer's default 307.
const { routes } = await import('../src/data/content.js');
for (const route of routes) {
  check('routes', 'path', route.path);
  if (route.path === '/') continue;
  const unslashed = route.path.replace(/\/$/, '');
  const { status } = resolve(unslashed);
  if (status !== 301) {
    problems.push(`_redirects: ${unslashed} → ${status} (expected a 301 to ${route.path})`);
  }
}

if (problems.length) {
  console.error(`URL check failed (${problems.length}):`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(`URL check passed: ${files.size} files, ${redirects.size} redirects, ${routes.length} routes.`);
