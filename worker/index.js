/* worker/index.js — serves the static site (assets binding) plus a tiny
   first-party analytics layer. Privacy-first: no cookies, no IP storage.
   Visitors are counted via a salted daily hash (ip+ua+day) that cannot be
   reversed or correlated across days.

   POST /api/beacon  { e: "pv" | "enter" | "cmd:<name>" | "ask:question" }
   GET  /api/stats?days=7  → aggregated JSON (public; aggregates only) */

const KNOWN_EVENTS = new Set([
  'pv', 'enter', 'ask:question',
  'cmd:about', 'cmd:automation', 'cmd:capital', 'cmd:principles',
  'cmd:status', 'cmd:contact', 'cmd:ask', 'cmd:help', 'cmd:ls',
  'cmd:menu', 'cmd:whoami', 'cmd:clear', 'cmd:exit',
]);

async function visitorId(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || '';
  const ua = request.headers.get('user-agent') || '';
  const day = new Date().toISOString().slice(0, 10);
  const salt = env.STATS_SALT || 'gregjones-io-stats';
  const data = new TextEncoder().encode(`${ip}|${ua}|${day}|${salt}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class SiteStats {
  constructor(state) {
    this.sql = state.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS events (day TEXT, name TEXT, n INTEGER, PRIMARY KEY (day, name));
      CREATE TABLE IF NOT EXISTS visitors (day TEXT, vid TEXT, PRIMARY KEY (day, vid));
    `);
  }

  async fetch(request) {
    const url = new URL(request.url);
    const day = new Date().toISOString().slice(0, 10);

    if (url.pathname === '/track' && request.method === 'POST') {
      const { event, vid, country } = await request.json();
      this.sql.exec(
        `INSERT INTO events (day, name, n) VALUES (?, ?, 1)
         ON CONFLICT (day, name) DO UPDATE SET n = n + 1`, day, event);
      if (country) {
        this.sql.exec(
          `INSERT INTO events (day, name, n) VALUES (?, ?, 1)
           ON CONFLICT (day, name) DO UPDATE SET n = n + 1`, day, `geo:${country}`);
      }
      if (vid) {
        this.sql.exec(`INSERT OR IGNORE INTO visitors (day, vid) VALUES (?, ?)`, day, vid);
      }
      return new Response(null, { status: 204 });
    }

    if (url.pathname === '/stats') {
      const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days')) || 7));
      const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

      const totals = {};
      for (const row of this.sql.exec(
        `SELECT name, SUM(n) AS n FROM events WHERE day > ? GROUP BY name ORDER BY n DESC`, since)) {
        totals[row.name] = row.n;
      }
      const perDay = [];
      for (const row of this.sql.exec(
        `SELECT e.day AS day,
                COALESCE((SELECT n FROM events WHERE day = e.day AND name = 'pv'), 0) AS pageviews,
                (SELECT COUNT(*) FROM visitors v WHERE v.day = e.day) AS visitors
         FROM (SELECT DISTINCT day FROM events WHERE day > ?) e ORDER BY day`, since)) {
        perDay.push({ day: row.day, pageviews: row.pageviews, visitors: row.visitors });
      }
      const events = {}, geo = {};
      let pageviews = 0;
      for (const [name, n] of Object.entries(totals)) {
        if (name === 'pv') pageviews = n;
        else if (name.startsWith('geo:')) geo[name.slice(4)] = n;
        else events[name] = n;
      }
      const visitors = perDay.reduce((s, d) => s + d.visitors, 0);

      return Response.json(
        { since, days, pageviews, visitors, events, geo, perDay },
        { headers: { 'cache-control': 'no-store' } });
    }

    return new Response('not found', { status: 404 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/beacon' && request.method === 'POST') {
      let event;
      try { event = String((await request.json()).e || ''); } catch (_) { event = ''; }
      if (!KNOWN_EVENTS.has(event)) return new Response(null, { status: 204 });
      const stub = env.STATS.get(env.STATS.idFromName('site'));
      const vid = event === 'pv' ? await visitorId(request, env) : null;
      const country = event === 'pv' ? (request.cf && request.cf.country) || null : null;
      await stub.fetch('https://stats/track', {
        method: 'POST',
        body: JSON.stringify({ event, vid, country }),
      });
      return new Response(null, { status: 204 });
    }

    if (url.pathname === '/api/stats') {
      const stub = env.STATS.get(env.STATS.idFromName('site'));
      return stub.fetch(`https://stats/stats?days=${url.searchParams.get('days') || 7}`);
    }

    return env.ASSETS.fetch(request);
  },
};
