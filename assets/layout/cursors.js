/* ============================================================
   Calamytryx — global pixel-cursor auto-fixer
   Any element whose computed cursor is a standard keyword (grab,
   move, *-resize, zoom-in, help, wait, copy, crosshair, ...) gets
   the matching pixel cursor swapped in automatically — no need to
   tag elements. Elements already using a url() cursor are skipped.
   ============================================================ */
(function () {
  'use strict';
  var BASE = '/assets/icons/cursors/png/';
  var HOT = {
    'default':'4 2','pointer':'10 6','text':'11 12','grab':'10 8','grabbing':'10 8',
    'not-allowed':'12 12','help':'4 2','wait':'12 12','progress':'12 12','move':'12 12',
    'crosshair':'12 12','copy':'12 12','zoom-in':'12 12','zoom-out':'12 12',
    'col-resize':'12 12','row-resize':'12 12','e-resize':'12 12','w-resize':'12 12',
    'n-resize':'12 12','s-resize':'12 12','ne-resize':'12 12','nw-resize':'12 12',
    'se-resize':'12 12','sw-resize':'12 12','ew-resize':'12 12','ns-resize':'12 12',
    'nesw-resize':'12 12','nwse-resize':'12 12'
  };
  /* keyword -> file name (a couple of keywords reuse one art) */
  var FILE = { 'progress':'wait' };
  function file(key){ return FILE[key] || key; }
  function cur(key){ return "url('" + BASE + file(key) + ".png') " + HOT[key] + ", " + key; }

  document.addEventListener('pointerover', function (e) {
    var t = e.target;
    if (!t || t.nodeType !== 1) return;
    var c = '';
    try { c = getComputedStyle(t).cursor; } catch (_) { return; }
    if (!c || c.indexOf('url(') > -1) return;        // none, or already a custom cursor
    var key = c.split(',').pop().trim();
    if (key === 'auto') key = 'default';
    if (HOT[key]) t.style.cursor = cur(key);
  }, true);
})();
