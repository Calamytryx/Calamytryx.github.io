#!/usr/bin/env node
/* Regenerate assets/data/fanart.json from the #CalArts Drive folder.
 *
 * The folder must be shared "Anyone with the link → Viewer". You need a Google
 * API key with the Drive API enabled (the key only lists a public folder, so it
 * can be heavily restricted). Keep it OUT of the repo — pass it via env:
 *
 *     DRIVE_API_KEY=xxxx node scripts/fetch_fanart.mjs
 *
 * In CI, store it as a secret and run this step, then commit the JSON like
 * repos.json. The site renders the committed manifest; image URLs are public
 * (drive.google.com/thumbnail) and need no key at view time.
 */
import fs from 'node:fs';

const FOLDER = process.env.FANART_FOLDER_ID || '1f8kTp0c46v4yJGJ3DantXlsPQZusCo2N';
const KEY = process.env.DRIVE_API_KEY;
const OUT = 'assets/data/fanart.json';

if (!KEY) { console.error('✗ set DRIVE_API_KEY (Google API key with Drive API enabled)'); process.exit(1); }

const q = `'${FOLDER}' in parents and mimeType contains 'image/' and trashed = false`;
let art = [], pageToken = '';
try {
  do {
    const url = 'https://www.googleapis.com/drive/v3/files?'
      + 'q=' + encodeURIComponent(q)
      + '&fields=' + encodeURIComponent('nextPageToken,files(id,name,mimeType)')
      + '&orderBy=name_natural&pageSize=1000&key=' + encodeURIComponent(KEY)
      + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');
    const res = await fetch(url);
    const json = await res.json();
    if (json.error) { console.error('✗ Drive API:', json.error.message); process.exit(1); }
    art = art.concat((json.files || []).map(f => ({ id: f.id, name: f.name })));
    pageToken = json.nextPageToken || '';
  } while (pageToken);
} catch (e) { console.error('✗ fetch failed:', e.message); process.exit(1); }

art.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
const data = { folderId: FOLDER, updated: new Date().toISOString(), art };
fs.writeFileSync(OUT, JSON.stringify(data));
console.log(`✓ wrote ${OUT} — ${art.length} image${art.length === 1 ? '' : 's'}`);
