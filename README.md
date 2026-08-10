# gregjones.io

A personal command interface for **Greg Jones** — CEO of a single family office and SWS Venture Capital.
Not a portfolio. An operating system for a modern capital allocator.

> Building systems that compound.

Bloomberg Terminal × Apple minimalism × private family office. Dark, minimal, high-status.
Static-first, near-zero JavaScript, no stock imagery. Analytics are first-party,
cookieless aggregates only (page views, daily visitor counts via a salted daily
hash, command usage) — no third parties, no IPs stored, no cross-day tracking.

---

## Stack

- **[Astro](https://astro.build)** — static-first, ships almost no JS by default
- Vanilla ES module for the terminal engine (`public/terminal.js`) — zero runtime dependencies
- One data file (`src/data/content.js`) is the single source of truth for all copy, status metrics, and the Ask Greg knowledge base
- Deploys cleanly to **Cloudflare Pages**

```
src/
  data/content.js      # ← edit copy, metrics, AI answers here
  layouts/Base.astro   # head, meta, OG tags
  pages/index.astro    # boot screen + terminal markup + scoped styles
  styles/global.css    # design tokens (palette, type)
  pages/sitemap.xml.js # sitemap, rss and llms.txt are generated from the routes
public/
  terminal.js          # terminal engine (commands, status, Ask Greg)
  _headers             # Cloudflare security + cache headers
  favicon.svg, robots.txt
scripts/
  check-urls.mjs       # post-build guard: no page may link to a redirect
```

---

## Local development

Requires Node 18.20+ (Node 20 recommended — see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to ./dist
npm run preview    # serve the production build locally
npm run lint       # astro check
npm run verify     # check dist/ for self-inflicted redirects (run after build)
```

---

## URLs and redirects

**Every page URL ends in a slash: `/about/`, not `/about`.** Astro builds pages as
directories, so `/about/index.html` is the file and `/about/` is the URL. The
canonical tag, the sitemap, the nav and the JSON-LD all have to agree with that,
and Cloudflare has to be told the same thing:

- `astro.config.mjs` — `trailingSlash: 'always'`, so the dev server behaves like
  production instead of hiding the difference until deploy.
- `wrangler.jsonc` — `html_handling: "force-trailing-slash"`, pinned rather than
  inferred from the shape of the build output.
- `dist/_redirects` — generated at build time from the route table, sending each
  unslashed path to its canonical form with a **301**. Cloudflare's built-in
  trailing-slash redirect is a 307, and a temporary redirect tells Google to keep
  the old URL indexed instead of folding it into the canonical.

`npm run verify` (`scripts/check-urls.mjs`) enforces all of it against the built
output: every sitemap entry, canonical tag and internal link must resolve to a 200,
and every route's unslashed form must be a 301. It runs in CI after the build.
Adding a page means adding it to `routes` in `src/data/content.js` — with the
slash — and everything else follows.

---

## Deploy to Cloudflare Pages

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit — gregjones.io"
git branch -M main
git remote add origin https://github.com/<you>/gregjones-io.git
git push -u origin main
```

### 2. Create the Pages project
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select the `gregjones-io` repository.
3. Build settings:

| Setting | Value |
|---|---|
| Framework preset | **Astro** |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `20` (set env var `NODE_VERSION=20` if needed) |

4. **Save and Deploy.** Every push to `main` redeploys automatically; pull requests get preview URLs.

### 3. Custom domain
Pages project → **Custom domains** → add `gregjones.io` (and `www`). If the domain is on Cloudflare, DNS is configured for you. Otherwise point a CNAME at the `*.pages.dev` target.

### Environment variables
None are required for Phase 1 — the site is fully static. Variables are only needed if you wire real data (below). Set them under Pages → **Settings → Environment variables**.

---

## Editing content

Everything visitor-facing lives in **`src/data/content.js`**:

- `identity` — name, tagline, pillars, email
- `commands` — the command menu (order = display order)
- `sections` — about / automation / capital / principles / contact copy
- `status` — dashboard metrics
- `askGreg` — curated Q&A knowledge base

Change a value, commit, push — Cloudflare redeploys. No code changes needed for routine copy edits.

---

## Connecting real data (Phase 2)

### Status dashboard → live metrics
The dashboard is simulated locally but **already wired to go live**. In `src/data/content.js`:

```js
export const status = {
  source: '/api/status',   // ← set to your endpoint (was null)
  ...
};
```

`terminal.js` will `fetch(status.source)` on the `/status` command and fall back to the
simulated values if the request fails. Expected JSON shape:

```json
{
  "metrics": {
    "automations_running": 51,
    "hours_reclaimed": 4310,
    "documents_processed": 320145,
    "signals_monitored": 1290,
    "active_workflows": 64,
    "uptime": 99.99
  }
}
```

A natural backend is a **Cloudflare Pages Function** at `functions/api/status.js` (or a Worker)
that reads from n8n / Zapier / a database and returns the JSON above.

### Ask Greg → live model
Phase 1 is intentionally constrained: curated answers, no API, no keys — it never pretends to be
autonomous. To upgrade, add a Pages Function (e.g. `functions/api/ask.js`) that calls a model
provider with a tight system prompt, and point `runAsk()` in `terminal.js` at it (keep the curated
set as the fallback). Store the API key as a Cloudflare environment variable — never in the repo.

---

## Continuous improvement

See **[SITE_REVIEW.md](./SITE_REVIEW.md)** for the 60-day review process, changelog, and backlog.
A scheduled GitHub Action (`.github/workflows/site-review.yml`) opens a review issue every 60 days
and runs dependency/build checks.

---

## Performance & quality

- Static HTML, CSS inlined where small, single ~10KB JS module
- Semantic HTML, `prefers-reduced-motion` respected, keyboard-navigable, no-JS fallback
- Security headers via `public/_headers`
- No external fonts, images, analytics, or trackers

## License

Private. © Greg Jones.
