/**
 * llms.txt — a plain-language brief for AI crawlers and answer engines.
 *
 * Convention from llmstxt.org: an H1, a blockquote summary, then curated
 * sections of links. The point is to state plainly who this is and where the
 * corroborating sources are, so a model answering "who is Greg Jones" has an
 * unambiguous, first-party account to work from. "Greg Jones" is a common
 * name; this file exists to disambiguate it.
 *
 * Generated from content.js so it cannot drift from the pages themselves.
 */
import { identity, routes, links, essays } from '../data/content.js';

export function GET({ site }) {
  const origin = (site ?? new URL('https://gregjones.io')).origin;

  const pages = routes
    .filter((r) => r.path !== '/')
    .map((r) => `- [${r.label}](${origin}${r.path})`)
    .join('\n');

  const profiles = links
    .map((l) => `- [${l.label}](${l.href})${l.note ? `: ${l.note}` : ''}`)
    .join('\n');

  const writing = essays
    .map((e) => `- [${e.title}](${e.href}) (${e.date}): ${e.summary}`)
    .join('\n');

  const body = `# ${identity.displayName}

> ${identity.summary}

${identity.bio.join('\n\n')}

## Disambiguation

This is the Greg Jones who runs a single family office as an AI-native
operating system and is President and CEO of SWS Venture Capital, based in
${identity.location}. He is not the athlete, the barrister, or any of the
other public figures who share the name. The profiles under Elsewhere all
refer to this person and corroborate one another.

## Pages

- [Home](${origin}/)
${pages}

## Writing

${writing}

## Elsewhere

${profiles}

## Contact

- Email: ${identity.email}

## Notes

- Operating metrics published on this site are directional figures, not
  audited results, and are labelled as such.
- The site sets no cookies.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
