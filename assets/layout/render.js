/* ============================================================
   Calamytryx — content renderer
   Pulls editable content from /assets/data/*.json and injects it
   into the DOM after the partials are included. The JSON files are
   the single source of truth; the markup in the partials is only a
   fallback shown if this script (or a fetch) fails.

   Hooks used in markup:
     [data-text="site.tagline"]      -> element.textContent
     [data-href="site.links.lore"]   -> element href     (+ [data-mailto] => mailto:)
     [data-src="sections.stream.embed"] -> element src
     [data-render="socials_cards"]   -> list/component built by RENDER[name]
   Data namespaces: site, socials, menu, sections, icons
   ============================================================ */
(function () {
  'use strict';

  var FILES = {
    site: '/assets/data/site.json',
    socials: '/assets/data/socials.json',
    menu: '/assets/data/menu.json',
    sections: '/assets/data/sections.json',
    icons: '/assets/icons/icons_grid.json'
  };

  var data_promise = load_all();

  function load_all() {
    var keys = Object.keys(FILES);
    return Promise.all(keys.map(function (k) {
      return fetch(FILES[k], { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error(FILES[k] + ' -> ' + r.status);
        return r.json();
      });
    })).then(function (vals) {
      var out = {};
      keys.forEach(function (k, i) { out[k] = vals[i]; });
      /* icons_grid.json is the raw icon set: an array of
         { baseName, nameWithoutExtension, source, style } — fold it into a
         name -> svg map, preferring the "sharp" variant. */
      if (Array.isArray(out.icons)) out.icons = build_icon_map(out.icons);
      return out;
    });
  }

  function build_icon_map(arr) {
    var map = {};
    arr.forEach(function (e) {
      var name = e.baseName || e.nameWithoutExtension;
      if (!name) return;
      if (!(name in map) || e.style === 'sharp') map[name] = e.source;
    });
    return map;
  }

  function get(obj, path) {
    return path.split('.').reduce(function (o, k) {
      return (o == null) ? undefined : o[k];
    }, obj);
  }

  function esc(s) {
    return (s == null ? '' : String(s)).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function icon(D, name) { return (D.icons && D.icons[name]) || ''; }

  /* optional leading icon for a menu link/nav item ({ icon: "name" }) */
  function link_icon(D, item) {
    var svg = item && item.icon ? icon(D, item.icon) : '';
    return svg ? '<span class="icon" aria-hidden="true">' + svg + '</span>' : '';
  }

  function compute_age(bday) {
    var bd = new Date(bday);
    if (isNaN(bd.getTime())) return '';
    var now = new Date();
    var age = now.getFullYear() - bd.getFullYear();
    var m = now.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
    return age;
  }

  /* ---- list / component renderers ---- */
  var RENDER = {
    age: function (D) { return String(compute_age(get(D, 'site.birthday'))); },

    'socials_cards': function (D) {
      return D.socials.filter(function (s) { return s.card !== false; }).map(function (s) {
        var badge = s.badge ? ' <span class="badge">' + esc(s.badge) + '</span>' : '';
        var feat = s.featured ? ' featured' : '';
        return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener" class="card social_card' + feat + '">'
          + '<span class="icon" aria-hidden="true">' + icon(D, s.icon) + '</span>'
          + '<h3 class="display" style="font-size:1.3rem">' + esc(s.name) + badge + '</h3>'
          + '<span class="url">' + esc(s.handle) + '</span></a></li>';
      }).join('');
    },

    'socials_row': function (D) {
      return D.socials.filter(function (s) { return s.row !== false; }).map(function (s) {
        return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener" aria-label="' + esc(s.name) + '">'
          + icon(D, s.icon) + '</a>';
      }).join('');
    },

    nav: function (D) {
      var page = document.body.getAttribute('data-page');
      return D.menu.nav.map(function (n) {
        var active = (n.page && n.page === page) ? ' class="active"' : '';
        return '<li><a data-nav="' + esc(n.page || '') + '"' + active
          + ' href="' + esc(n.href) + '">' + link_icon(D, n) + esc(n.label) + '</a></li>';
      }).join('');
    },

    'footer_menu': function (D) {
      function item(l) {
        return '<li><a href="' + esc(l.href) + '">' + link_icon(D, l) + esc(l.label) + '</a></li>';
      }
      function list(c) { return '<ul class="footer_links">' + c.links.map(item).join('') + '</ul>'; }
      var cols = D.menu.footer.map(function (c) {
        return '<nav class="flex_only" aria-label="' + esc(c.title) + '"><h4>' + esc(c.title) + '</h4>'
          + list(c) + '</nav>';
      }).join('');
      var det = '<div class="details_only" style="grid-column:1/-1">' + D.menu.footer.map(function (c) {
        return '<details><summary>' + esc(c.title) + '</summary>' + list(c) + '</details>';
      }).join('') + '</div>';
      return cols + det;
    },

    cdc: function (D) {
      return D.sections.cdc.map(function (c) {
        return '<article class="card"><h3 class="display h_md" style="color:var(--blood)">' + esc(c.title) + '</h3>'
          + '<p class="muted mt_1">' + esc(c.body) + '</p></article>';
      }).join('');
    }
  };

  /* ---- apply everything ---- */
  function apply(D) {
    /* tokens usable inside any bound string, e.g. "level {age} disaster" */
    var tokens = { age: String(compute_age(get(D, 'site.birthday'))) };
    function fill(s) {
      return String(s).replace(/\{(\w+)\}/g, function (m, k) {
        return (k in tokens) ? tokens[k] : m;
      });
    }

    document.querySelectorAll('[data-text]').forEach(function (el) {
      var v = get(D, el.getAttribute('data-text'));
      if (v != null) el.textContent = fill(v);
    });

    document.querySelectorAll('[data-href]').forEach(function (el) {
      var v = get(D, el.getAttribute('data-href'));
      if (v != null) el.setAttribute('href', el.hasAttribute('data-mailto') ? 'mailto:' + v : v);
    });

    document.querySelectorAll('[data-src]').forEach(function (el) {
      var v = get(D, el.getAttribute('data-src'));
      if (v != null) el.setAttribute('src', v);
    });

    /* generic single icon by name from the grid: <span data-icon="menu"> */
    document.querySelectorAll('[data-icon]').forEach(function (el) {
      var svg = icon(D, el.getAttribute('data-icon'));
      if (svg) el.innerHTML = svg;
    });

    document.querySelectorAll('[data-render]').forEach(function (el) {
      var fn = RENDER[el.getAttribute('data-render')];
      if (fn) {
        try { el.innerHTML = fn(D, el); }
        catch (e) { console.error('[render] ' + el.getAttribute('data-render'), e); }
      }
    });

    /* re-bind the hamburger to freshly rendered nav links */
    var links = document.getElementById('nav_links');
    if (links && !links.__bound) {
      links.__bound = true;
      links.addEventListener('click', function (e) {
        if (e.target.closest('a')) links.classList.remove('open');
      });
    }
  }

  function run() {
    data_promise.then(apply).catch(function (e) { console.error('[render] data load failed:', e); });
  }

  /* run after the shared partials are in the DOM (race-safe both ways) */
  if (window.__includesDone) run();
  else document.addEventListener('includes:done', run);
})();
