/**
 * portrait.js — build-time check for the headshot.
 *
 * The Person schema's `image` and the portrait on /about both depend on a file
 * that lives in /public rather than in source. Rather than ship a broken
 * reference when it is missing, both consumers ask here first.
 *
 * Drop the file at public/greg-jones.jpg and it appears everywhere. Remove it
 * and it disappears everywhere. No other change is needed either way.
 */
import fs from 'node:fs';
import { identity } from '../data/content.js';

export const portraitPath = identity.image;

export const hasPortrait =
  !!portraitPath && fs.existsSync(new URL(`../../public${portraitPath}`, import.meta.url));
