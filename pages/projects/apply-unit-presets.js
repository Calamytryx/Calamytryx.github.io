#!/usr/bin/env node
/*
  Adds to shift.html + tally.html:
    #1  "what you count" setting (ticket/tickets, call/calls, order/orders ...)
        stored in shift.v1 -> cfg.unit, read by both pages, followed by labels,
        quota text, exports (csv + xlsx) and the sheet copy.
    #2  one-click starter presets in shift.html > setup
        (call center, ticket support, delivery, freelancer, study, moderation, blank)

  Usage:   node apply-unit-presets.js [folder-with-the-html-files]
  Safe:    every edit is matched exactly once (or the stated count) before anything is
           written. If any edit does not match, nothing is changed and it tells you which.
           Originals are saved as shift.html.bak / tally.html.bak.
*/
const fs = require("fs");
const path = require("path");
const dir = process.argv[2] || ".";
const r = String.raw;

/* [file, old, new, expectedCount] */
const E = [];
const add = (file, old, neu, n = 1) => E.push([file, old, neu, n]);

/* ================= shift.html ================= */
const SH = "shift.html";

add(SH,
  r`cfg:{start:'09:00', end:'18:00', interval:30},`,
  r`cfg:{start:'09:00', end:'18:00', interval:30, unit:{one:'ticket', many:'tickets'}},`);

add(SH,
  r`const tph = (t,h) => h > 0 ? t/h : 0;`,
  r`const tph = (t,h) => h > 0 ? t/h : 0;

/* ---------- unit: what you count (shared with tally.mk through shift.v1 cfg.unit) ---------- */
const U = () => { const u = (S && S.cfg && S.cfg.unit) || {}; return {one: u.one || 'ticket', many: u.many || 'tickets'}; };
const slug = s => String(s).trim().replace(/\s+/g,'_');
function applyUnit(){ const e = $('tbsub'); if(e) e.textContent = U().many+' per hour · quotas · sheets export — saved in this browser'; }`);

add(SH, r`<span class="tbsub">`, r`<span class="tbsub" id="tbsub">`);

add(SH,
  r`if(ui.tab==='track') calc(); else if(ui.tab==='sheet') sheetCalc(); else if(ui.tab==='overview') ovCalc();`,
  r`if(ui.tab==='track') calc(); else if(ui.tab==='sheet') sheetCalc(); else if(ui.tab==='overview') ovCalc();
  applyUnit();`);

/* track tab */
add(SH, r` h span · tickets only count on productive tags`, r` h span · '+U().many+' only count on productive tags`);
add(SH, r`<th class="n">tickets</th><th class="n">mins</th>`, r`<th class="n">'+U().many+'</th><th class="n">mins</th>`);

/* summary tables */
add(SH,
  r`tickets / hr = tickets ÷ productive hours, after deductions. Week and month`,
  r`'+U().many+' / hr = '+U().many+' ÷ productive hours, after deductions. Week and month`);
add(SH, r`<th class="n">deducted</th><th class="n">t/hr</th>`, r`<th class="n">deducted</th><th class="n">per hr</th>`);
add(SH,
  r`<th>tag</th><th class="n">tickets</th><th class="n">hours</th><th class="n">t/hr</th>`,
  r`<th>tag</th><th class="n">'+U().many+'</th><th class="n">hours</th><th class="n">per hr</th>`);

/* setup tab: presets + unit */
add(SH,
  r`function vSetup(){`,
  r`const UNITS = ['ticket','call','order','page','task','rep','item','chat','email','case','delivery','problem'];

/* preset: [name, productive(1/0), quota/h, auto-minutes]  ·  breaks: [name, start, mins] */
const TEMPLATES = [
  {id:'callcenter', name:'Call center', desc:'Calls per hour, 9–6, two short breaks and a lunch',
    unit:['call','calls'], cfg:{start:'09:00', end:'18:00', interval:30},
    tags:[['Inbound calls',1,12],['Callbacks / email',1,8],['Break (15 min)',0,null,15],['Lunch',0],['Coaching / training',0],['Idle / waiting',0]],
    breaks:[['Break','11:00',15],['Lunch','13:00',60],['Break','15:30',15]]},
  {id:'support', name:'Ticket support', desc:'Tickets per hour across two tiers',
    unit:['ticket','tickets'], cfg:{start:'09:00', end:'18:00', interval:30},
    tags:[['Tier 1',1,10],['Tier 2',1,6],['Break (15 min)',0,null,15],['Lunch',0],['Meeting / training',0],['Idle',0]],
    breaks:[['Break','11:00',15],['Lunch','13:00',60],['Break','15:30',15]]},
  {id:'delivery', name:'Delivery', desc:'Orders per hour, hourly slots, one lunch',
    unit:['order','orders'], cfg:{start:'08:00', end:'17:00', interval:60},
    tags:[['Deliveries',1,3],['Pickup / waiting',0],['Break (15 min)',0,null,15],['Lunch',0],['Vehicle / admin',0]],
    breaks:[['Lunch','12:00',60]]},
  {id:'freelance', name:'Freelancer hours', desc:'Billable vs non-billable time, no quota',
    unit:['task','tasks'], cfg:{start:'09:00', end:'17:00', interval:60},
    tags:[['Client work',1,null],['Admin / invoicing',0],['Outreach / pitching',0],['Break',0,null,15]],
    breaks:[]},
  {id:'study', name:'Study sessions', desc:'Pages per hour in an evening block',
    unit:['page','pages'], cfg:{start:'18:00', end:'21:00', interval:30},
    tags:[['Reading',1,15],['Notes / recall',1,null],['Review',0],['Break (5 min)',0,null,5]],
    breaks:[['Break','19:30',10]]},
  {id:'moderation', name:'Content moderation', desc:'Items per hour with wellness breaks',
    unit:['item','items'], cfg:{start:'09:00', end:'18:00', interval:30},
    tags:[['Queue review',1,60],['Escalations',1,10],['Wellness break (15 min)',0,null,15],['Lunch',0],['Training',0]],
    breaks:[['Wellness break','11:00',15],['Lunch','13:00',60],['Wellness break','15:30',15]]},
  {id:'blank', name:'Blank', desc:'Start from scratch: one productive tag, a break, idle',
    unit:['ticket','tickets'], cfg:{start:'09:00', end:'18:00', interval:30},
    tags:[['Work',1,null],['Break',0,null,15],['Idle',0]], breaks:[]}
];
function unitRow(){
  const u = U();
  return '<div class="sub_t">what you count</div>'+
    '<div class="row2"><span class="hint">one</span><input data-unit="one" list="unitList" value="'+esc(u.one)+'" style="width:110px">'+
    '<span class="hint">many</span><input data-unit="many" value="'+esc(u.many)+'" style="width:110px">'+
    '<datalist id="unitList">'+UNITS.map(x=>'<option value="'+x+'">').join('')+'</datalist></div>'+
    '<p class="hint">Labels, quotas, the sheet copy, csv and xlsx all follow this, and tally.mk reads it too. Type your own if the list does not have it.</p>';
}
function tplPanel(){
  return '<div class="panel mod"><div class="sub_t" style="border:0;padding:0">start from a preset</div>'+
    '<div class="row2">'+TEMPLATES.map(t=>'<button class="btn sm ghost" data-tpl="'+t.id+'" title="'+esc(t.desc)+'">'+esc(t.name)+'</button>').join('')+'</div>'+
    '<p class="hint">One click fills the unit, default shift times, tags, quotas and scheduled breaks. Everything stays editable below. Days you already logged keep their own shift times and intervals.</p>'+
    unitRow()+'</div>';
}
function applyTemplate(id){
  const t = TEMPLATES.find(x=>x.id===id); if(!t) return;
  const logged = Object.values(S.days).some(d => Object.values((d && d.slots) || {}).some(x => x && x.tag));
  const msg = 'Load the "'+t.name+'" preset? This replaces your unit, default shift times, tags and scheduled breaks.'+
    (logged ? ' Days you already logged keep their shift times. Tags with the same name keep their logged slots; slots on any other tag stop counting. Use data → copy to back up first if unsure.' : '');
  if(!confirm(msg)) return;
  pinDays();
  const old = S.tags.slice();
  S.cfg = Object.assign({}, S.cfg, t.cfg, {unit:{one:t.unit[0], many:t.unit[1]}});
  S.tags = t.tags.map(([name,prod,quota,mins]) => {
    const same = old.find(o => String(o.name).toLowerCase() === name.toLowerCase());
    return {id: same ? same.id : uid(), name, prod:!!prod, mins: mins ?? null, quota: prod ? (quota ?? null) : null};
  });
  S.breaks = t.breaks.map(([name,start,mins]) => ({id:uid(), name, start, mins}));
  save(); render();
}

function vSetup(){`);

add(SH,
  r`return '<div class="panel mod"><div class="sub_t" style="border:0;padding:0">defaults</div>'+`,
  r`return tplPanel()+'<div class="panel mod"><div class="sub_t" style="border:0;padding:0">defaults</div>'+`);

/* export tab preview + hint */
add(SH, r`<span style="flex:1">TICKETS / HR</span>`, r`<span style="flex:1">'+U().many.toUpperCase()+' / HR</span>`);
add(SH, r`text-align:center">TICKETS</span>`, r`text-align:center">'+U().many.toUpperCase()+'</span>`);
add(SH, r`">TICKETS / HR</span></div>`, r`">'+U().many.toUpperCase()+' / HR</span></div>`);
add(SH,
  r`type tickets and minutes, and hours, deductions, tickets per hour and`,
  r`type '+U().many+' and minutes, and hours, deductions, '+U().many+' per hour and`);

/* overview */
add(SH, r`quota \u2014 tickets still needed','`, r`quota \u2014 '+U().many+' still needed','`);
add(SH, r`tickets this slot: `, r`'+U().many+' this slot: `);
add(SH, r`</b> tickets</div>`, r`</b> '+U().many+'</div>`);
add(SH, r`<div class="hint">tickets / hr <b`, r`<div class="hint">'+U().many+' / hr <b`);
add(SH, r`+' tickets / hr for the open '`, r`+' '+U().many+' / hr for the open '`);

/* sheet view + copy for sheets */
add(SH, r`'DEDUCTED H','TICKETS','T / HR',`, r`'DEDUCTED H',U().many.toUpperCase(),'PER HR',`, 2);
add(SH, r`t.name+' tickets'`, r`t.name+' '+U().many`, 3);
add(SH,
  r`'TAG','TICKETS','MINS','HOURS','DEDUCTED','PROD HRS','T / HR','NOTE'`,
  r`'TAG',U().many.toUpperCase(),'MINS','HOURS','DEDUCTED','PROD HRS','PER HR','NOTE'`);
add(SH,
  r`'TAG','TICKETS','MINS','HOURS','DEDUCTED','PROD (1/0)','PROD HRS','T / HR','NOTE'`,
  r`'TAG',U().many.toUpperCase(),'MINS','HOURS','DEDUCTED','PROD (1/0)','PROD HRS','PER HR','NOTE'`);
add(SH, r`into tickets or mins`, r`into '+U().many+' or mins`);

/* csv */
add(SH,
  r`'counts_as_productive','tickets','minutes','hours','hours_deducted','tickets_per_hour','zone'`,
  r`'counts_as_productive',slug(U().many),'minutes','hours','hours_deducted',slug(U().many)+'_per_hour','zone'`);
add(SH,
  r`'productive_hours','deducted_hours','tickets','tickets_per_hour',`,
  r`'productive_hours','deducted_hours',slug(U().many),slug(U().many)+'_per_hour',`);

/* xlsx */
add(SH, r`'TICKETS PER HOUR`, r`U().many.toUpperCase()+' PER HOUR`);
add(SH,
  r`'tickets / hr = tickets ÷ productive hours, after deductions. Ranges sum`,
  r`U().many+' / hr = '+U().many+' ÷ productive hours, after deductions. Ranges sum`);
add(SH, r`['TICKETS',1]`, r`[U().many.toUpperCase(),1]`);
add(SH, r`['TICKETS',2],['T / HR',2]`, r`[U().many.toUpperCase(),2],['PER HR',2]`);
add(SH, r`['TASK','TICKETS','HOURS','T / HR',`, r`['TASK',U().many.toUpperCase(),'HOURS','PER HR',`);
add(SH, r`then type tickets and MINUTES WORKED.`, r`then type '+U().many+' and MINUTES WORKED.`);
add(SH, r`HOURS, DEDUCTED, PROD HRS, TICKETS and T/HR are formulas.`, r`HOURS, DEDUCTED, PROD HRS, '+U().many.toUpperCase()+' and PER HR are formulas.`);
add(SH, r`It counts toward tickets/hr`, r`It counts toward '+U().many+'/hr`);

/* events */
add(SH,
  r`else if(D.add){`,
  r`else if(D.tpl){ applyTemplate(D.tpl); }
  else if(D.add){`);
add(SH,
  r`if(D.cfg){ pinDays();`,
  r`if(D.unit){
    const old = U(), v = (t.value || '').trim().toLowerCase();
    const nx = {one: old.one, many: old.many};
    if(D.unit === 'one'){ if(v){ const auto = old.many === old.one + 's'; nx.one = v; if(auto) nx.many = v + 's'; } }
    else if(v) nx.many = v;
    S.cfg.unit = nx; save(); render(); return;
  }
  if(D.cfg){ pinDays();`);

/* ================= tally.html ================= */
const TA = "tally.html";

add(TA,
  r`function readShift() {`,
  r`const UNIT = () => {
        const sh = readShift();
        const u = (sh && sh.cfg && sh.cfg.unit) || {};
        return { one: u.one || "ticket", many: u.many || "tickets" };
      };
      function readShift() {`);
add(TA, r`h("div", { class: "sub_t" }, "tickets"),`, r`h("div", { class: "sub_t" }, UNIT().many),`);
add(TA, r`document.createTextNode(" tickets · "),`, r`document.createTextNode(" " + UNIT().many + " · "),`);
add(TA, r`h("span", { class: "hint" }, " tickets"),`, r`h("span", { class: "hint" }, " " + UNIT().many),`);
add(TA, r`"pick a tag, tickets don't count without one"`, r`"pick a tag, " + UNIT().many + " don't count without one"`);
add(TA, r`"not a productive tag, tickets don't count"`, r`"not a productive tag, " + UNIT().many + " don't count"`);
add(TA, r`t.tk + " tickets · "`, r`t.tk + " " + UNIT().many + " · "`);

/* ================= run ================= */
const files = {};
for (const f of [SH, TA]) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) { console.error("missing: " + p); process.exit(1); }
  files[f] = fs.readFileSync(p, "utf8");
}
const bad = [];
E.forEach(([f, old, neu, n], i) => {
  const parts = files[f].split(old);
  const got = parts.length - 1;
  if (got !== n) bad.push(`#${i + 1} ${f}: expected ${n}, found ${got}  ->  ${old.slice(0, 70).replace(/\n/g, "\\n")}`);
  else files[f] = parts.join(neu);
});
if (bad.length) {
  console.error("Nothing written. These edits did not match:\n" + bad.join("\n"));
  process.exit(1);
}
for (const f of [SH, TA]) {
  const p = path.join(dir, f);
  fs.copyFileSync(p, p + ".bak");
  fs.writeFileSync(p, files[f]);
}
console.log("Done. " + E.length + " edits applied. Backups: *.bak");
