(function () {
  'use strict';

  var STORAGE_KEY = 'calamytryx.theme.v1';
  var PRESETS = [
    { id: 'site', name: 'Site', group: 'dark', bg: '0b0b0c', panel: '141416', txt: 'e6e6e6', acc: 'e11d2e' },
    { id: 'ocean', name: 'Ocean', group: 'dark', bg: '0a1620', panel: '0f2230', txt: 'dbe9f3', acc: '38bdf8' },
    { id: 'forest', name: 'Forest', group: 'dark', bg: '0b140e', panel: '111d15', txt: 'dfeee3', acc: '34d399' },
    { id: 'amber', name: 'Amber', group: 'dark', bg: '140e06', panel: '1d1409', txt: 'f3e8d7', acc: 'f59e0b' },
    { id: 'violet', name: 'Lavender', group: 'light', bg: 'f3efff', panel: 'fffaff', txt: '2c2140', acc: '8352cc' },
    { id: 'mono', name: 'Mono', group: 'light', bg: 'f4f4f4', panel: 'ffffff', txt: '171717', acc: '343434' },
    { id: 'paper', name: 'Paper', group: 'light', bg: 'f1eee7', panel: 'ffffff', txt: '1c1c1c', acc: 'c21f30' },
    { id: 'pink', name: 'Girly Pink', group: 'pink', bg: 'fff0f7', panel: 'fff9fc', txt: '48283a', acc: 'e75480' }
  ];
  var DEFAULT_CUSTOM = { bg: '0b0b0c', panel: '141416', txt: 'e6e6e6', acc: 'e11d2e' };
  var current = null;
  var controls = null;

  function hex(value, fallback) {
    return typeof value === 'string' && /^[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
  }

  function normalize(value) {
    var id = value && PRESETS.some(function (preset) { return preset.id === value.id; })
      ? value.id
      : (value && value.id === 'custom' ? 'custom' : 'site');
    var custom = value && value.custom || {};
    return {
      id: id,
      custom: {
        bg: hex(custom.bg, DEFAULT_CUSTOM.bg),
        panel: hex(custom.panel, DEFAULT_CUSTOM.panel),
        txt: hex(custom.txt, DEFAULT_CUSTOM.txt),
        acc: hex(custom.acc, DEFAULT_CUSTOM.acc)
      }
    };
  }

  function palette(theme) {
    var selected = PRESETS.find(function (preset) { return preset.id === theme.id; });
    var source = theme.id === 'custom' ? theme.custom : (selected || PRESETS[0]);
    function mix(left, right, amount) {
      var a = [0, 2, 4].map(function (i) { return parseInt(left.slice(i, i + 2), 16); });
      var b = [0, 2, 4].map(function (i) { return parseInt(right.slice(i, i + 2), 16); });
      return a.map(function (value, i) {
        return Math.round(value * (1 - amount) + b[i] * amount).toString(16).padStart(2, '0');
      }).join('');
    }
    function complementary(color) {
      var rgb = [0, 2, 4].map(function (i) { return parseInt(color.slice(i, i + 2), 16) / 255; });
      var max = Math.max.apply(null, rgb);
      var min = Math.min.apply(null, rgb);
      var delta = max - min;
      if (delta === 0) {
        return rgb.map(function (channel) {
          return (255 - Math.round(channel * 255)).toString(16).padStart(2, '0');
        }).join('');
      }
      var hue = 0;
      var saturation = delta / (1 - Math.abs(2 * ((max + min) / 2) - 1));
      var lightness = (max + min) / 2;
      if (delta) {
        if (max === rgb[0]) hue = 60 * (((rgb[1] - rgb[2]) / delta) % 6);
        else if (max === rgb[1]) hue = 60 * ((rgb[2] - rgb[0]) / delta + 2);
        else hue = 60 * ((rgb[0] - rgb[1]) / delta + 4);
      }
      hue = (hue + 180 + 360) % 360;
      var chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
      var sector = hue / 60;
      var x = chroma * (1 - Math.abs((sector % 2) - 1));
      var channels = sector < 1 ? [chroma, x, 0]
        : sector < 2 ? [x, chroma, 0]
          : sector < 3 ? [0, chroma, x]
            : sector < 4 ? [0, x, chroma]
              : sector < 5 ? [x, 0, chroma] : [chroma, 0, x];
      var offset = lightness - chroma / 2;
      return channels.map(function (channel) {
        return Math.round((channel + offset) * 255).toString(16).padStart(2, '0');
      }).join('');
    }
    function contrast(color) {
      var channels = [0, 2, 4].map(function (i) {
        var channel = parseInt(color.slice(i, i + 2), 16) / 255;
        return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
      });
      var luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
      return luminance > 0.179 ? '000000' : 'ffffff';
    }
    function isLight(color) {
      var channels = [0, 2, 4].map(function (i) {
        var channel = parseInt(color.slice(i, i + 2), 16) / 255;
        return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2] > 0.42;
    }
    return {
      bg: source.bg,
      panel: source.panel,
      panel2: mix(source.panel, source.txt, 0.07),
      line: mix(source.panel, source.txt, 0.2),
      txt: source.txt,
      dim: mix(source.txt, source.panel, 0.5),
      blood: source.acc,
      bloodText: contrast(source.acc),
      glitch: complementary(source.acc),
      mode: isLight(source.bg) ? 'light' : 'dark'
    };
  }

  function applyTheme() {
    var colors = palette(current);
    document.documentElement.dataset.themeMode = colors.mode;
    var style = document.getElementById('global-theme-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'global-theme-style';
      document.head.appendChild(style);
    }
    style.textContent = ':root{--bg:#' + colors.bg + ';--panel:#' + colors.panel +
      ';--panel2:#' + colors.panel2 + ';--line:#' + colors.line + ';--txt:#' +
      colors.txt + ';--dim:#' + colors.dim + ';--blood:#' + colors.blood +
      ';--blood-text:#' + colors.bloodText + ';--glitch-alt:#' + colors.glitch +
      ';}body{background:var(--bg)!important;color:var(--txt)!important;}';
  }

  function notifyApps() {
    window.dispatchEvent(new CustomEvent('calamytryx:themechange', {
      detail: { id: current.id, custom: Object.assign({}, current.custom) }
    }));
  }

  function updateControls() {
    if (!controls) return;
    controls.querySelectorAll('[data-global-theme]').forEach(function (button) {
      var selected = button.dataset.globalTheme === current.id;
      button.setAttribute('aria-pressed', String(selected));
      button.title = button.dataset.themeName + (selected ? ' (selected)' : '');
    });
    controls.querySelectorAll('[data-global-color]').forEach(function (input) {
      input.value = '#' + current.custom[input.dataset.globalColor];
    });
    var customSwatch = controls.querySelector('[data-global-theme="custom"]');
    customSwatch.style.background = 'linear-gradient(135deg,#' + current.custom.bg +
      ' 0 50%,#' + current.custom.acc + ' 50% 100%)';
    var customFields = controls.querySelector('.global_theme_custom');
    customFields.hidden = current.id !== 'custom';
    var sample = controls.querySelector('.global_theme_sample');
    var colors = palette(current);
    sample.style.background = 'linear-gradient(135deg,#' + colors.bg + ' 0 50%,#' + colors.blood + ' 50% 100%)';
  }

  function setTheme(theme, persist) {
    current = normalize(theme);
    applyTheme();
    updateControls();
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      } catch (error) {
        console.error('[theme] could not save the global theme:', error);
        if (controls) controls.querySelector('.global_theme_status').textContent =
          'Theme applied here, but could not be saved in this browser.';
      }
    }
    notifyApps();
  }

  function readStoredTheme() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return normalize(JSON.parse(saved));
    } catch (error) {
      console.error('[theme] could not read the global theme:', error);
    }
    return null;
  }

  function readLegacyToolTheme() {
    var path = location.pathname;
    var keys = /\/shift\.html$/.test(path) ? ['shift.v1', 'tally.v1']
      : (/\/tally\.html$/.test(path) ? ['tally.v1', 'shift.v1'] : ['shift.v1', 'tally.v1']);
    for (var i = 0; i < keys.length; i++) {
      try {
        var saved = JSON.parse(localStorage.getItem(keys[i]) || 'null');
        if (saved && (saved.theme || saved.custom)) {
          return normalize({ id: saved.theme, custom: saved.custom });
        }
      } catch (error) {
        console.error('[theme] could not migrate the saved tool theme:', error);
      }
    }
    return null;
  }

  function buildControls() {
    var wrapper = document.createElement('div');
    wrapper.className = 'global_theme';
    wrapper.innerHTML = '<button class="global_theme_toggle" type="button" aria-expanded="false" aria-controls="global-theme-panel">'
      + '<span class="global_theme_sample" aria-hidden="true"></span><span>theme</span></button>'
      + '<section class="global_theme_panel" id="global-theme-panel" aria-label="Global color theme" hidden>'
      + '<h2 class="global_theme_title">site color theme</h2>'
      + '<h3 class="global_theme_group_title">dark themes <span>(4)</span></h3>'
      + '<div class="global_theme_swatches" data-theme-group="dark"></div>'
      + '<h3 class="global_theme_group_title">light themes <span>(3)</span></h3>'
      + '<div class="global_theme_swatches" data-theme-group="light"></div>'
      + '<h3 class="global_theme_group_title">girly pink</h3>'
      + '<div class="global_theme_swatches global_theme_single" data-theme-group="pink"></div>'
      + '<h3 class="global_theme_group_title">custom theme</h3>'
      + '<div class="global_theme_swatches global_theme_single" data-theme-group="custom"></div>'
      + '<div class="global_theme_custom" hidden>'
      + '<label>background<input type="color" data-global-color="bg"></label>'
      + '<label>panels<input type="color" data-global-color="panel"></label>'
      + '<label>text<input type="color" data-global-color="txt"></label>'
      + '<label>accent<input type="color" data-global-color="acc"></label>'
      + '</div><p class="global_theme_status" role="status" aria-live="polite"></p></section>';
    PRESETS.forEach(function (preset) {
      var swatches = wrapper.querySelector('[data-theme-group="' + preset.group + '"]');
      addSwatch(swatches, preset.id, preset.name, preset.bg, preset.acc);
    });
    addSwatch(wrapper.querySelector('[data-theme-group="custom"]'), 'custom', 'Custom', current.custom.bg, current.custom.acc);
    document.body.appendChild(wrapper);
    controls = wrapper;

    var toggle = wrapper.querySelector('.global_theme_toggle');
    var panel = wrapper.querySelector('.global_theme_panel');
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(expanded));
      panel.hidden = !expanded;
    });
    wrapper.addEventListener('click', function (event) {
      var button = event.target.closest('[data-global-theme]');
      if (!button) return;
      var id = button.dataset.globalTheme;
      if (id === 'custom') {
        setTheme({ id: id, custom: current.custom }, true);
        controls.querySelector('[data-global-color="bg"]').focus();
      } else {
        var preset = PRESETS.find(function (item) { return item.id === id; });
        setTheme({ id: id, custom: current.custom }, true);
        controls.querySelector('.global_theme_status').textContent = preset.name + ' theme applied site-wide.';
      }
    });
    wrapper.addEventListener('input', function (event) {
      var input = event.target.closest('[data-global-color]');
      if (!input) return;
      var custom = Object.assign({}, current.custom);
      custom[input.dataset.globalColor] = input.value.slice(1).toLowerCase();
      setTheme({ id: 'custom', custom: custom }, true);
      controls.querySelector('.global_theme_status').textContent = 'Custom theme applied site-wide.';
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) {
        panel.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
    updateControls();
  }

  function addSwatch(host, id, name, bg, accent) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'global_theme_swatch';
    button.dataset.globalTheme = id;
    button.dataset.themeName = name;
    button.setAttribute('aria-label', name + ' theme');
    button.setAttribute('aria-pressed', 'false');
    button.style.background = 'linear-gradient(135deg,#' + bg + ' 0 50%,#' + accent + ' 50% 100%)';
    host.appendChild(button);
  }

  function loadBirdEmbed() {
    if (document.getElementById('pocket-bird-embed')) return;
    var script = document.createElement('script');
    script.id = 'pocket-bird-embed';
    script.src = '/assets/vendor/pocket-bird/birb.embed.js';
    script.integrity = 'sha384-o8dVuA/2uKrOXjK4ELg6MeP+fFG12AV1cjJIjnHKsQ+ENufh6NlYTxDnZZ862rlN';
    script.addEventListener('error', function () {
      console.error('[pocket-bird] could not load the global bird embed.');
    }, { once: true });
    document.head.appendChild(script);
  }

  var storedTheme = readStoredTheme();
  var migratedTheme = storedTheme ? null : readLegacyToolTheme();
  current = storedTheme || migratedTheme || normalize({ id: 'site' });
  applyTheme();
  window.CalamytryxTheme = {
    set: function (id, custom) { setTheme({ id: id, custom: custom || current.custom }, true); },
    get: function () { return { id: current.id, custom: Object.assign({}, current.custom) }; }
  };
  window.addEventListener('storage', function (event) {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      setTheme(JSON.parse(event.newValue), false);
    } catch (error) {
      console.error('[theme] received an invalid global theme update:', error);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      buildControls();
      if (migratedTheme) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        } catch (error) {
          console.error('[theme] could not save the migrated theme:', error);
        }
      }
      notifyApps();
    }, { once: true });
  } else {
    buildControls();
    notifyApps();
  }

  window.addEventListener('load', function () {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(loadBirdEmbed, { timeout: 3000 });
    } else {
      window.setTimeout(loadBirdEmbed, 1000);
    }
  }, { once: true });
})();
