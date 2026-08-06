/**
 * rss.xml — a feed of the essays, published from the owned domain.
 *
 * The essays live on Substack and Substack has its own feed. This one exists
 * so the work is discoverable from gregjones.io itself: aggregators and
 * crawlers that reach the domain find the writing without having to know the
 * Substack exists, and each item points at the canonical Substack URL rather
 * than duplicating the text.
 *
 * Generated from the same `essays` array that renders /writing/, so the two
 * cannot drift.
 */
import { essays, identity } from '../data/content.js';

/** XML text nodes: escape the five predefined entities. */
const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const rfc822 = (iso) => new Date(`${iso}T12:00:00Z`).toUTCString();

export function GET({ site }) {
  const origin = (site ?? new URL('https://gregjones.io')).origin;

  const items = essays
    .map(
      (e) => `    <item>
      <title>${esc(e.title)}</title>
      <link>${esc(e.href)}</link>
      <guid isPermaLink="true">${esc(e.href)}</guid>
      <pubDate>${rfc822(e.date)}</pubDate>
      <description>${esc(e.summary)}</description>
    </item>`
    )
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(identity.displayName)}</title>
    <link>${origin}/writing/</link>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${esc(
      'Essays on how small, high-trust organizations achieve institutional excellence.'
    )}</description>
    <language>en-us</language>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
