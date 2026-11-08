/* tutorial.js — shared interactive tutorial for tally.mk and shift.mk.
   Load with: <script src="/assets/layout/tutorial.js" defer></script>
   Adds a "? tutorial" link to the navbar. Highlights the real input boxes and,
   on action steps, waits until you actually use them (skip is always available). */
(function () {
  "use strict";
  if (window.__mkTut) return;
  window.__mkTut = 1;

  const PAGE = (document.title || "").toLowerCase().startsWith("shift") ? "shift" : "tally";
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  const byText = (s, t) => qa(s).find((e) => e.textContent.toLowerCase().includes(t));
  const last = (s) => { const a = qa(s); return a[a.length - 1] || null; };
  const after = (s, t) => () => { const e = byText(s, t); return e && e.nextElementSibling; };
  const parentOf = (s) => () => { const e = q(s); return e && e.parentElement; };

  /* ---------- steps: {t,x,sel,on:[event,selector],opt} ---------- */
  const T = {};

  /* ===== tally.mk ===== */
  T.overview = [
    { t: "Welcome to tally.mk", x: "Counters, notepads, timers and time slots, all saved in this browser. The tutorial button always teaches whatever is open right now." },
    { t: "Add things here", x: "Each button creates one item. Counter and notepad ask for a name; a time slot names itself from shift.mk.", sel: ".addrow", opt: 1 },
    { t: "Grid or list", x: "Switch how your items are shown.", sel: ".seg", opt: 1 },
    { t: "Open an item", x: "Click any card to open it. Then press the tutorial button again to get the lesson for that item.", sel: ".items", opt: 1 },
    { t: "Simple view and data", x: "'simple view' is a big ticket display for fast tallying. 'data' backs up or restores everything, including shift.mk.", sel: "[data-simple]", opt: 1 },
  ];
  T.counter = [
    { t: "Counter", x: "A counter keeps one number and a full history of every change.", sel: ".detail .val" },
    { t: "Add", x: "Press + to add your saved interval. Try it.", sel: "[data-act=plus]", on: ["click", "[data-act=plus]"] },
    { t: "Subtract", x: "− removes the interval. Go on, press it.", sel: "[data-act=minus]", on: ["click", "[data-act=minus]"] },
    { t: "Keyboard", x: "Space or + adds, − subtracts, u undoes. These work as soon as you switch back to the tab.", sel: () => byText(".hint", "keys:"), opt: 1 },
    { t: "One-off amount", x: "Type any amount and add or subtract it without changing your interval.", sel: () => byText(".sub_t", "one-off"), opt: 1 },
    { t: "Undo", x: "Undo reverts the last change. Press it.", sel: "[data-act=undo]", on: ["click", "[data-act=undo]"] },
    { t: "Saved interval", x: "This is how much + and − move. Change it to anything above 0.", sel: 'input.num[min="0"]', on: ["change", 'input.num[min="0"]'] },
    { t: "History", x: "Every change is logged with its time. Only the last 8 show; 'show all' opens the rest (up to 500).", sel: ".hist_wrap", opt: 1 },
    { t: "Attachments", x: "Attach a notepad or a timer to this counter, and detach them later.", sel: () => byText(".sub_t", "attachments"), opt: 1 },
  ];
  T.notepad = [
    { t: "Notepad", x: "Plain notes, saved as you type. Write something.", sel: "textarea.note", on: ["input", "textarea.note"] },
    { t: "Saved indicator", x: "It says 'saving…' then 'saved'. Notes can also be attached to a counter or slot.", sel: ".detail .hint", opt: 1 },
    { t: "Rename or delete", x: "Rename it in the header box. 'delete' removes it and anything attached.", sel: ".dhead", opt: 1 },
  ];
  T.timer = [
    { t: "Timer", x: "A stopwatch or a countdown. The display keeps running even if you leave the page.", sel: ".detail .val" },
    { t: "Mode", x: "Pick count up (stopwatch) or count down.", sel: ".detail select", on: ["change", ".detail select"], opt: 1 },
    { t: "Duration", x: "In countdown mode, set the duration as mm:ss or h:mm:ss. Hidden in stopwatch mode.", sel: ".detail input.num", opt: 1 },
    { t: "Start / pause", x: "Press start.", sel: ".detail .big_b", on: ["click", ".detail .big_b"] },
    { t: "Reset", x: "Reset zeroes the timer. In countdown mode, starting after it hits zero restarts it.", sel: ".detail .big_b.ghost", opt: 1 },
  ];
  T.slot = [
    { t: "Time slot", x: "A slot card is a live counter wired to shift.mk: every tally goes into the matching interval of your shift, so both pages always agree. It needs shift.mk to be set up first (tags and shift times).", sel: "[data-slot] .slot_head, [data-slot] a.btn", opt: 1 },
    { t: "Slot and navigation", x: "The current interval is shown big. ‹ prev and next › move between intervals; 'auto next' jumps ahead when a slot ends. PRE-OT / POST-OT mark overtime slots.", sel: ".slot_head", opt: 1 },
    { t: "Time left", x: "Countdown to the end of this slot. It pulses in the last minute.", sel: ".slot_cd_row", opt: 1 },
    { t: "1 · Pick a tag first", x: "Choose what you are doing this slot (tags come from shift.mk setup). Untagged tallies are not saved.", sel: ".slot_bar .f:nth-child(3) select", on: ["change", ".slot_bar .f:nth-child(3) select"] },
    { t: "2 · Then tally", x: "Press + to add tickets to this interval.", sel: "[data-slot] [data-act=plus]", on: ["click", "[data-slot] [data-act=plus]"] },
    { t: "Breaks are automatic", x: "If a scheduled break from shift.mk overlaps this slot, the hint shows it and the minutes are deducted for you.", sel: "[id^=slot_rule]", opt: 1 },
    { t: "Minutes override", x: "Leave minutes blank for automatic. Type a number only if you worked a different amount of this slot.", sel: ".slot_bar + .slot_bar input", opt: 1 },
    { t: "Sync", x: "'sync to shift' pushes the tag and minutes to shift.mk right now. Tallies already sync on every press.", sel: () => byText("button", "sync to shift"), opt: 1 },
    { t: "Day totals", x: "Tickets, productive hours and tickets/hr for the whole day, live.", sel: () => byText(".sub_t", "day totals"), opt: 1 },
    { t: "Note and history", x: "Attach a note to this slot. History lists every tally change.", sel: () => byText(".sub_t", "note"), opt: 1 },
  ];
  T.simple = [
    { t: "Simple view", x: "Just the current slot and big buttons. It reads and writes the same data as shift.mk." },
    { t: "Slot", x: "Arrows move between slots; 'now' returns to the running one. It follows overnight shifts automatically.", sel: ".sx_top", opt: 1 },
    { t: "Pick a tag", x: "Choose a tag first. 'use last' repeats the previous slot's tag.", sel: ".sx select", on: ["change", ".sx select"] },
    { t: "Tally", x: "Big number = tickets in this slot. Press the + button.", sel: ".sx_btns", on: ["click", ".sx_btns [data-act=plus], .sx_btns [data-act=plus1]"] },
    { t: "Step size", x: "Change how much the big buttons move. When it is 1, the extra ±1 buttons hide.", sel: ".sx input.num", opt: 1 },
    { t: "Back to full view", x: "Use 'full view' in the navbar to leave.", sel: "#simple-link", opt: 1 },
  ];

  /* ===== shift.mk ===== */
  const SETUP = [
    { t: "Welcome to shift.mk", x: "This walks you through setup first, then tracking. Steps with a ▶ wait for you to use the highlighted box; 'skip step' is always there." },
    { t: "Open setup", x: "Everything starts in the setup tab.", sel: "[data-tab=setup]", on: ["click", "[data-tab=setup]"] },
    { t: "Presets (optional)", x: "A preset fills unit, times, tags, quotas and breaks in one click. You do not have to use one: press Next to do it by hand. In presets, breaks live in the scheduled breaks list, not as tags.", sel: () => q("[data-tpl]") && q("[data-tpl]").closest(".panel"), opt: 1 },
    { t: "What you count", x: "Tickets, calls, items… labels everywhere follow this. Optional.", sel: '[data-unit="many"]', opt: 1 },
    { t: "Shift start", x: "Set when your shift starts (an overnight shift like 23:00 works).", sel: "[data-cfg=start]", on: ["change", "[data-cfg=start]"] },
    { t: "Shift end", x: "Set when it ends. If it is earlier than the start, the shift crosses midnight.", sel: "[data-cfg=end]", on: ["change", "[data-cfg=end]"] },
    { t: "Interval", x: "How long one slot is, in minutes. You will log tickets once per slot.", sel: "[data-cfg=interval]", on: ["change", "[data-cfg=interval]"] },
    { t: "Productive or not", x: "A tag is what you do in a slot. Productive tags count toward tickets/hr and can have a quota. Non-productive ones (idle, meeting) only take up time.", sel: () => { const c = q("input[data-f=prod]"); return c && c.closest(".row2"); }, opt: 1 },
    { t: "Quota per hour", x: "Type how many tickets per hour this task expects. This is what the overview and attainment % compare against. (Enabled only for productive tags.)", sel: () => last("input[data-f=quota]:not(:disabled)"), on: ["change", "input[data-f=quota]"] },
    { t: "Add a tag", x: "Press + tag for another task. Rename it, tick productive, set its quota.", sel: "[data-add=tags]", on: ["click", "[data-add=tags]"] },
    { t: "Name the new tag", x: "Give the tag a name.", sel: () => last("input[data-l=tags][data-f=name]"), on: ["change", "input[data-l=tags][data-f=name]"] },
    { t: "Breaks are not tags", x: "Do not make Break or Lunch tags. Add them as scheduled breaks: they get their own timed rows, are deducted automatically, and split a slot they only partly cover. Press + break.", sel: "[data-add=breaks]", on: ["click", "[data-add=breaks]"] },
    { t: "Break name", x: "Name it (Break, Lunch…).", sel: () => last("input[data-l=breaks][data-f=name]"), on: ["change", "input[data-l=breaks][data-f=name]"] },
    { t: "Break start", x: "When it begins.", sel: () => last("input[data-l=breaks][data-f=start]"), on: ["change", "input[data-l=breaks][data-f=start]"] },
    { t: "Break minutes", x: "How long it lasts.", sel: () => last("input[data-l=breaks][data-f=mins]"), on: ["change", "input[data-l=breaks][data-f=mins]"] },
  ];
  const TRACK = [
    { t: "Track tab", x: "Now log your day.", sel: "[data-tab=track]", on: ["click", "[data-tab=track]"] },
    { t: "Day, week, month", x: "Switch the range. Week and month show totals by day; logging happens in day view.", sel: parentOf("[data-view]"), opt: 1 },
    { t: "Shift times and overtime", x: "Each day can override the shift times. Add pre-OT or post-OT (4h on one side, or 2h + 2h) to extend the grid; OT slots are tagged like normal ones.", sel: ".ot_row", opt: 1 },
    { t: "Pick a tag", x: "Choose a tag for a slot. Slots covered by a scheduled break show an automatic break row.", sel: "tr[data-k] select", on: ["change", "tr[data-k] select"] },
    { t: "Tickets", x: "Enter tickets for that slot. Only productive tags accept them.", sel: "tr[data-k] input[data-f=tickets]:not(:disabled)", on: ["change", "input[data-f=tickets]"] },
    { t: "Minutes", x: "Leave blank for automatic. Fill only if you worked part of the slot; the rest is deducted.", sel: "tr[data-k] input[data-f=mins]", opt: 1 },
  ];
  const QUOTA = [
    { t: "Quota per hour, by tag", x: "This table is where you read it: tickets, hours, tickets/hr, your quota/h, expected tickets and attainment % for each productive tag.", sel: after(".sub_t", "vs quota") },
    { t: "Time by tag", x: "Shows where the hours went, including breaks as automatic entries.", sel: after(".sub_t", "time by tag"), opt: 1 },
  ];
  const OVERVIEW = [
    { t: "Overview tab", x: "A live dashboard for the shift that is running now.", sel: "[data-tab=overview]", on: ["click", "[data-tab=overview]"] },
    { t: "Clock", x: "Current time and date.", sel: "#ov > .panel", opt: 1 },
    { t: "Shift card", x: "Time remaining, or time until it starts, with a progress bar. Overnight shifts stay on yesterday's date until they end.", sel: "#ov .ovgrid > .panel:nth-child(1)", opt: 1 },
    { t: "Current slot", x: "Time left in this slot, its tag, tickets so far, and how many you still need in it.", sel: "#ov .ovgrid > .panel:nth-child(2)", opt: 1 },
    { t: "Quota card", x: "Tickets still needed by end of shift, the rate per hour you need for the open time, per-slot target, and each task's remaining count.", sel: "#ov .ovgrid > .panel:nth-child(3)", opt: 1 },
    { t: "Today so far", x: "Tickets, productive hours and tickets/hr right now.", sel: "#ov .ovgrid > .panel:nth-child(4)", opt: 1 },
  ];
  const SHEET = [
    { t: "Sheet tab", x: "An Excel-style view of the same data.", sel: "[data-tab=sheet]", on: ["click", "[data-tab=sheet]"] },
    { t: "Days or intervals", x: "'days' is one row per day with start, end, OT and totals (editable in the cells). 'intervals' is one row per slot.", sel: parentOf("[data-smode]"), opt: 1 },
    { t: "Table", x: "Enter and arrow keys move between rows. Paste a column of numbers into tickets or mins to fill downward.", sel: "#sheetT", opt: 1 },
    { t: "Copy to Google Sheets", x: "'copy for sheets' copies values plus live formulas; 'copy values' copies plain data. Set the top-left cell in 'paste at' first.", sel: "[data-sc=f]", opt: 1 },
    { t: "Paste at", x: "The cell you will paste into, such as A1. Formulas are built around it.", sel: "#sa", opt: 1 },
  ];
  const END = [
    { t: "You are set", x: "Open tally.mk for fast tallying: its time slot card writes straight into this tracker. Press ? tutorial any time to replay." },
  ];
  T.flow = [].concat(SETUP, TRACK, QUOTA, OVERVIEW, SHEET, END);
  T.setup = [].concat(SETUP.slice(1), END);
  T.quota = [].concat(TRACK.slice(0, 1), QUOTA, OVERVIEW.slice(0, 1), OVERVIEW.slice(4, 5));
  T.views = [].concat(TRACK, OVERVIEW, SHEET, END);

  /* ---------- styles ---------- */
  const css = document.createElement("style");
  css.textContent =
    "#tut-hl{position:fixed;z-index:10001;pointer-events:none;border:2px solid var(--blood);box-shadow:0 0 0 9999px rgba(0,0,0,.62);transition:all .15s}" +
    "#tut-card{position:fixed;z-index:10002;left:50%;transform:translateX(-50%);width:min(440px,94vw);background:var(--panel);color:var(--txt);border:2px solid var(--blood);padding:14px 16px;font-family:var(--mono);font-size:12px;display:flex;flex-direction:column;gap:8px;box-shadow:4px 4px 0 #000}" +
    "#tut-card h3{font-family:var(--display);font-size:14px;margin:0;letter-spacing:1px}" +
    "#tut-card .p{color:var(--dim);font-size:10px;letter-spacing:1.5px;text-transform:uppercase}" +
    "#tut-card .x{line-height:1.5}" +
    "#tut-card .w{color:var(--blood);font-size:11px}" +
    "#tut-card .r{display:flex;gap:8px;flex-wrap:wrap;align-items:center}" +
    "#tut-card .r .sp{margin-left:auto}" +
    "#tut-link{font-size:12px}";
  document.head.append(css);

  /* ---------- engine ---------- */
  let lesson = null, i = 0, hit = false, adv = false, scrolled = false, card, hl, tickId = null;

  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const btn = (txt, fn, cls) => { const b = mk("button", "btn sm " + (cls || ""), txt); b.type = "button"; b.onclick = fn; return b; };
  const targetOf = (st) => { if (!st || !st.sel) return null; try { return typeof st.sel === "function" ? st.sel() : q(st.sel); } catch (_) { return null; } };

  function ensureUi() {
    if (!hl) { hl = mk("div"); hl.id = "tut-hl"; document.body.append(hl); }
    if (!card) { card = mk("div"); card.id = "tut-card"; document.body.append(card); }
    hl.style.display = card.style.display = "";
  }
  function close() {
    lesson = null; clearInterval(tickId); tickId = null;
    if (hl) hl.remove(); if (card) card.remove(); hl = card = null;
  }
  function open(steps) {
    close(); lesson = steps; i = 0; ensureUi(); show();
    tickId = setInterval(tick, 200);
  }
  function show() {
    hit = false; adv = false; scrolled = false;
    const st = lesson[i], pending = st.on && !st.opt;
    card.replaceChildren(
      mk("div", "p", "step " + (i + 1) + " / " + lesson.length),
      mk("h3", "", st.t),
      mk("div", "x", st.x),
      pending ? mk("div", "w", "▶ do it in the highlighted box to continue") : mk("div"),
      (() => {
        const r = mk("div", "r");
        r.append(
          btn("‹ back", () => { if (i > 0) { i--; show(); } }, "ghost"),
          (st.on && !st.opt) ? btn("skip step", next, "ghost") : mk("span"),
          (() => { const s = mk("span", "sp"); return s; })(),
          btn("exit", close, "ghost"),
          i === lesson.length - 1 ? btn("done", close) : (pending ? mk("span") : btn("next ›", next)),
        );
        return r;
      })(),
    );
    tick();
  }
  function next() { if (!lesson) return; if (i >= lesson.length - 1) return close(); i++; show(); }

  function tick() {
    if (!lesson || !hl) return;
    const st = lesson[i], t = targetOf(st);
    if (t && t.getBoundingClientRect) {
      if (!scrolled) { scrolled = true; try { t.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (_) {} }
      const r = t.getBoundingClientRect();
      hl.style.cssText = "top:" + (r.top - 6) + "px;left:" + (r.left - 6) + "px;width:" + (r.width + 12) + "px;height:" + (r.height + 12) + "px";
      const low = r.top + r.height / 2 > innerHeight / 2;
      card.style.top = low ? "64px" : "auto";
      card.style.bottom = low ? "auto" : "12px";
    } else {
      hl.style.cssText = "top:50%;left:50%;width:0;height:0";
      card.style.top = "auto"; card.style.bottom = "12px";
    }
    if (st.on && !st.opt && hit && !adv) { adv = true; setTimeout(() => { if (lesson && lesson[i] === st) next(); }, 450); }
  }

  ["click", "input", "change"].forEach((type) =>
    document.addEventListener(type, (e) => {
      if (!lesson) return;
      const st = lesson[i];
      if (st && st.on && st.on[0] === type && e.target.closest && e.target.closest(st.on[1])) hit = true;
    }, true));
  window.addEventListener("resize", tick);
  window.addEventListener("scroll", tick, true);

  /* ---------- menus ---------- */
  function menu(title, note, items) {
    close(); ensureUi();
    hl.style.cssText = "top:50%;left:50%;width:0;height:0";
    card.style.top = "auto"; card.style.bottom = "12px";
    const col = mk("div", "r"); col.style.flexDirection = "column"; col.style.alignItems = "stretch";
    items.forEach(([label, fn]) => col.append(btn(label, fn, "ghost")));
    card.replaceChildren(mk("div", "p", "tutorial"), mk("h3", "", title), note ? mk("div", "x", note) : mk("div"), col, btn("close", close));
    lesson = null;
  }

  /* tally: pick the lesson that matches what is open */
  function tallyKind() {
    try {
      if (S.simple) return "simple";
      const it = route && get(route);
      return it ? it.type : "overview";
    } catch (_) { return "overview"; }
  }
  const NAMES = { overview: "Overview", counter: "Counter", notepad: "Notepad", timer: "Timer", slot: "Time slots (shift.mk)", simple: "Simple view" };
  function goTo(k, msg) {
    try {
      if (k === "simple") { if (!S.simple) { S.simple = true; save(); render(); } }
      else {
        if (S.simple) { S.simple = false; save(); }
        if (k === "overview") go(null);
        else {
          const it = S.items.find((x) => x.type === k && !x.parent) || S.items.find((x) => x.type === k);
          if (it) go(it.id); else { go(null); k = "overview"; msg = "Add a " + (msg || "") + " with the + buttons first, then open this lesson again."; }
        }
      }
    } catch (_) {}
    setTimeout(() => { open(T[k]); if (msg && k === "overview") lesson[0] = Object.assign({}, lesson[0], { x: msg }); show(); }, 150);
  }
  function tallyMenu() {
    const k = tallyKind();
    menu("tally.mk tutorials", "Currently open: " + NAMES[k] + ". Pick a lesson, or start the one for what is open.",
      [["▶ " + NAMES[k] + " (what is open now)", () => open(T[k])]]
        .concat(Object.keys(NAMES).filter((x) => x !== k).map((x) => [NAMES[x], () => goTo(x, x)])));
  }

  /* shift: one guided flow plus shorter lessons */
  function shiftMenu() {
    menu("shift.mk tutorials", "The full flow starts at setup and does not force a preset.", [
      ["▶ Full flow: setup → track → quota → overview → sheet", () => open(T.flow)],
      ["Setup only (times, tags, quota, breaks)", () => open(T.setup)],
      ["How to see quota per hour", () => open(T.quota)],
      ["Tour of track, overview and sheet", () => open(T.views)],
    ]);
  }

  /* ---------- navbar link ---------- */
  function mount() {
    const end = q(".toolbar-end");
    if (!end || q("#tut-link")) return;
    const a = mk("a", "", "? tutorial");
    a.id = "tut-link"; a.href = "#"; a.title = "interactive tutorial";
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (lesson) return close();
      if (PAGE === "shift") shiftMenu();
      else if (e.shiftKey) tallyMenu();
      else tallyMenu();
    });
    end.prepend(a);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
