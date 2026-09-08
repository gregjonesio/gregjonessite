/**
 * portrait.js — build-time check for the headshot.
 *
 * The Person schema's `image` and the portrait on /about both depend on a file
 * that lives in /public rather than in source. Rather than ship a broken
 * reference when it is missing, both consumers ask here first.
 *
 * Drop the file at public/greg-jones.jpg and it appears everywhere. Remove it
 * and it disappears everywhere. No other change is needed either way.
 *
 * The lookup is anchored to Astro's own `publicDir`, not to this module's
 * `import.meta.url`. Under Astro 4 the two happened to agree; the Astro 7
 * build bundles this module elsewhere, and a relative path from there
 * silently resolved to nothing, dropping the portrait and the schema `image`
 * from the built site with no error. Asking the framework where /public is
 * cannot drift that way.
 */
import fs from 'node:fs';
import { publicDir } from 'astro:config/server';
import { identity } from '../data/content.js';

export const portraitPath = identity.image;

export const hasPortrait =
  !!portraitPath && fs.existsSync(new URL(`.${portraitPath}`, publicDir));
