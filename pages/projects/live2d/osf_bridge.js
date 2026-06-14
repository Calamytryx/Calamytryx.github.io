/*
  osf_bridge.js — OpenSeeFace → browser bridge (zero dependencies)

  Browsers can't read OpenSeeFace's UDP, and a hosted https page can't open a
  local ws:// socket (mixed-content). This tiny Node server solves both:
    • receives OpenSeeFace UDP and forwards it to the browser over WebSocket
    • ALSO serves the Live2D pages over http://localhost, so when you open them
      from here, ws://localhost is allowed and OpenSeeFace just works.

  SETUP
    1) Get OpenSeeFace:  https://github.com/emilianavt/OpenSeeFace/releases/latest
       Run its tracker so it sends to 127.0.0.1:11573, e.g.
         python facetracker.py --capture 0 --ip 127.0.0.1 --port 11573
    2) From your copy of the site repo:   node pages/projects/live2d/osf_bridge.js
    3) Open  http://localhost:8080/pages/projects/live2d/stage.html
       → choose source "OpenSeeFace" → on.

  Ports (override with env): HTTP_PORT=8080  OSF_UDP=11573
*/
'use strict';
const http = require('http');
const dgram = require('dgram');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const HTTP_PORT = Number(process.env.HTTP_PORT || 8080);
const UDP_PORT  = Number(process.env.OSF_UDP  || 11573);
const ROOT = process.cwd();               // serve the repo you launch this from
const clients = new Set();

const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.svg':'image/svg+xml',
  '.webp':'image/webp', '.ico':'image/x-icon', '.moc3':'application/octet-stream', '.woff2':'font/woff2', '.ttf':'font/ttf', '.otf':'font/otf' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/pages/projects/live2d/stage.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }   // no path traversal
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found: ' + p); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

/* WebSocket upgrade on the SAME port (server→client frames only) */
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key']; if (!key) { socket.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  clients.add(socket);
  socket.on('close', () => clients.delete(socket));
  socket.on('error', () => clients.delete(socket));
  socket.on('data', () => {});
});
server.listen(HTTP_PORT, () => {
  console.log('serving on  http://localhost:' + HTTP_PORT + '/pages/projects/live2d/stage.html');
  console.log('WebSocket   ws://localhost:' + HTTP_PORT + '  (same port)');
});

function frame(buf) {
  const len = buf.length; let h;
  if (len < 126) h = Buffer.from([0x82, len]);
  else if (len < 65536) { h = Buffer.alloc(4); h[0]=0x82; h[1]=126; h.writeUInt16BE(len,2); }
  else { h = Buffer.alloc(10); h[0]=0x82; h[1]=127; h.writeUInt32BE(0,2); h.writeUInt32BE(len>>>0,6); }
  return Buffer.concat([h, buf]);
}

const udp = dgram.createSocket('udp4');
let pkts = 0;
udp.on('error', e => console.error('UDP error:', e.message));
udp.on('message', (msg, rinfo) => {
  if (++pkts === 1) console.log('✓ receiving OpenSeeFace data from ' + rinfo.address + ':' + rinfo.port);
  if (!clients.size) return;
  const f = frame(msg);
  for (const c of clients) { try { c.write(f); } catch (e) { clients.delete(c); } }
});
udp.bind(UDP_PORT, () => {
  console.log('listening for OpenSeeFace UDP on 127.0.0.1:' + UDP_PORT);
  console.log('(run the OpenSeeFace tracker too — that is what opens your camera)');
});
setInterval(() => { if (!pkts) console.log('…no OpenSeeFace data yet — is the tracker running on port ' + UDP_PORT + '?'); }, 3000);
