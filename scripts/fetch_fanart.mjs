#!/usr/bin/env node
/* Regenerate assets/data/fanart.json from the public #CalArts Drive folder.
 *
 * NO API KEY NEEDED — it scrapes Google's own public "embedded folder view"
 * (the same grid the site can iframe), which lists every file's id + name for a
 * folder shared "Anyone with the link → Viewer".
 *
 *     node scripts/fetch_fanart.mjs
 *
 * Commit the resulting JSON (like repos.json). The site renders it into a
 * credited gallery; image URLs (drive.google.com/thumbnail) need no key to view.
 * Override the folder with FANART_FOLDER_ID=… if needed.
 */
import fs from 'node:fs';

const FOLDER = process.env.FANART_FOLDER_ID || '1f8kTp0c46v4yJGJ3DantXlsPQZusCo2N';
const OUT = 'assets/data/fanart.json';
const url = `https://drive.google.com/embeddedfolderview?id=${FOLDER}#list`;

/* The public embed only exposes LAST-MODIFIED, which an edit changes — so we can't trust it
   as "published". Instead we freeze each file's "pub" time the FIRST time we ever see it and
   never touch it again, so later modifications can't reorder anything. A file that's shown
   with only a time (= modified today) has an unreliable date, so it seeds as 0 (undated). */
function dateTs(d) { d = (d || '').trim(); const m = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(d); if (m) { let y = +m[3]; if (y < 100) y += 2000; return Date.UTC(y, +m[1] - 1, +m[2]); } return 0; }

let prev = {};
try { (JSON.parse(fs.readFileSync(OUT, 'utf8')).art || []).forEach(a => { if (a.id) prev[a.id] = a; }); } catch (e) {}

try {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' — is the folder shared "anyone with link"?');
  const html = await res.text();
  const re = /flip-entry"[^>]*id="entry-([^"]+)"[\s\S]*?flip-entry-title">([^<]+)<[\s\S]*?flip-entry-last-modified">\s*<div>([^<]*)</g;
  const seen = new Set();
  let art = [], m;
  while ((m = re.exec(html))) {
    const id = m[1];
    const name = m[2].replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();
    const date = (m[3] || '').trim();
    if (seen.has(id)) continue; seen.add(id);
    if (!/\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(name)) continue;
    const old = prev[id];
    const pub = (old && old.pub != null) ? old.pub          // already recorded -> frozen forever
      : (id in prev ? dateTs(date)                          // seen before this scheme -> seed from its date
        : Date.now());                                      // brand-new file -> it's the newest
    art.push({ id, name, pub });
  }
  if (!art.length) throw new Error('no image files found — folder empty, private, or layout changed');
  art.sort((a, b) => (b.pub - a.pub) || a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  fs.writeFileSync(OUT, JSON.stringify({ folderId: FOLDER, updated: new Date().toISOString(), art }));
  console.log(`✓ wrote ${OUT} — ${art.length} images (scraped public folder, no API key)`);
} catch (e) {
  console.error('✗', e.message);
  process.exit(1);
}
