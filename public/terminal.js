/* terminal.js — client engine for gregjones.io
   Plain ES module. No dependencies. Reads the shared data layer from
   <script id="site-data">. Drives the boot screen, command terminal,
   status dashboard, and the curated "Ask Greg" interface. */

const DATA = JSON.parse(document.getElementById('site-data').textContent);
const { commands, sections, status, askGreg, identity } = DATA;

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Touch devices: never auto-focus the input — focusing opens the on-screen
// keyboard and scrolls the page to the prompt. Users tap the input themselves.
const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

const el = {
  boot: document.getElementById('boot'),
  enter: document.getElementById('enterBtn'),
  bootTyped: document.getElementById('bootTyped'),
  system: document.getElementById('system'),
  output: document.getElementById('output'),
  form: document.getElementById('inputForm'),
  input: document.getElementById('cmd'),
  menu: document.getElementById('menu'),
  promptUser: document.getElementById('promptUser'),
};

let mode = 'shell';        // 'shell' | 'ask'
let statusTimer = null;    // interval handle for live metrics
const history = [];        // command history
let hIdx = -1;

/* ---------------- boot screen typing ---------------- */
(function bootType() {
  const text = 'initialize';
  if (reduce) { el.bootTyped.textContent = text; return; }
  let i = 0;
  const tick = () => {
    el.bootTyped.textContent = text.slice(0, i++);
    if (i <= text.length) setTimeout(tick, 70);
  };
  setTimeout(tick, 1400);
})();

/* ---------------- enter the system ---------------- */
let entered = false;
function enterSystem() {
  if (entered) return;
  entered = true;
  el.boot.style.transition = 'opacity 420ms ease';
  el.boot.style.opacity = '0';
  setTimeout(() => {
    el.boot.hidden = true;
    el.boot.style.display = 'none';   // force out of layout (class display:grid overrides [hidden])
    el.system.hidden = false;
    window.scrollTo(0, 0);
    if (!touch) { try { el.input.focus({ preventScroll: true }); } catch (_) {} }
    bootLog();
  }, reduce ? 0 : 420);
}
el.enter.addEventListener('click', enterSystem);
el.enter.addEventListener('touchend', (e) => { e.preventDefault(); enterSystem(); }, { passive: false });
// Pressing Enter on the boot screen also enters.
document.addEventListener('keydown', (e) => {
  if (!el.boot.hidden && e.key === 'Enter') enterSystem();
});

/* ---------------- output primitives ---------------- */
function line(html, cls = '') {
  const div = document.createElement('div');
  div.className = `ln ${cls}`.trim();
  div.innerHTML = html;
  if (reduce) div.style.animation = 'none', div.style.opacity = '1', div.style.transform = 'none';
  el.output.appendChild(div);
  return div;
}
function gap() { line('', 'ln--gap'); }
function scroll() { el.output.scrollTop = el.output.scrollHeight; }

/** print a set of [html, cls] lines with a gentle stagger */
function printLines(items) {
  let d = 0;
  const step = reduce ? 0 : 55;
  items.forEach(([html, cls]) => {
    setTimeout(() => { line(html, cls); scroll(); }, d);
    d += step;
  });
  return d;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------------- boot log on entry ---------------- */
function bootLog() {
  printLines([
    ['<span class="ln--mute">booting operator interface…</span>', ''],
    [`<span class="ln--mute">modules: capital · automation · signals · ok</span>`, ''],
    [`<span class="ln--mute">access: <span class="accent">granted</span></span>`, ''],
    ['', 'ln--gap'],
    [`Welcome. This is the operating interface of <b class="accent">${esc(identity.name)}</b>.`, 'ln--body'],
    [`Type a command or select one above. <span class="ln--mute">Try</span> <b class="accent">help</b>.`, 'ln--mute'],
    ['', 'ln--gap'],
  ]);
}

/* ---------------- command router ---------------- */
function echo(raw) {
  const promptTxt = mode === 'ask' ? 'ask greg ›' : 'greg@system:~$';
  line(`<span class="ln--mute">${esc(promptTxt)}</span> <b>${esc(raw)}</b>`, 'ln--cmd');
}

function run(raw) {
  const input = raw.trim();
  if (!input) return;
  echo(input);

  if (mode === 'ask') return runAsk(input);

  const cmd = input.replace(/^\//, '').toLowerCase().split(/\s+/)[0];
  const rest = input.replace(/^\S+\s*/, '');

  switch (cmd) {
    case 'help':    return cmdHelp();
    case 'ls':
    case 'menu':    return cmdLs();
    case 'about':       return printSection('about');
    case 'automation':  return printAutomation();
    case 'capital':     return printSection('capital');
    case 'principles':  return printPrinciples();
    case 'contact':     return printContact();
    case 'status':      return printStatus();
    case 'whoami':      return printLines([[`<span class="ln--body">${esc(identity.name.toLowerCase())} — operator, allocator, systems builder.</span>`, '']]) && gap();
    case 'ask':
      if (rest) { enterAsk(false); return runAsk(rest); }
      return enterAsk(true);
    case 'clear':   return clear();
    case 'exit':    return printLines([['<span class="ln--mute">already at root.</span>', '']]);
    default:
      return printLines([
        [`<span class="ln--mute">command not found: <b>${esc(cmd)}</b></span>`, ''],
        ['<span class="ln--mute">type <b class="accent">help</b> for available commands.</span>', ''],
        ['', 'ln--gap'],
      ]);
  }
}

function cmdHelp() {
  printLines([
    ['<span class="ln--head">AVAILABLE COMMANDS</span>', ''],
    ...commands.map((c) => [
      `<b class="accent">${esc(c.label)}</b><span class="ln--mute">  —  ${esc(c.desc)}</span>`, 'ln--li',
    ]),
    ['<b class="accent">help</b><span class="ln--mute">  —  this list · also: clear, ls, whoami, exit</span>', 'ln--li'],
    ['', 'ln--gap'],
  ]);
}

function cmdLs() {
  printLines([[commands.map((c) => `<b class="accent">${esc(c.label)}</b>`).join('   '), 'ln--body'], ['', 'ln--gap']]);
}

/* ---------------- section renderers ---------------- */
function printSection(key) {
  const s = sections[key];
  const items = [[`<span class="ln--head">${esc(s.title)}</span>`, '']];
  s.body.forEach((p) => items.push([esc(p), 'ln--body']));
  if (s.meta) items.push([`<span class="ln--mute">${esc(s.meta)}</span>`, '']);
  items.push(['', 'ln--gap']);
  printLines(items);
}

function printAutomation() {
  const s = sections.automation;
  const items = [[`<span class="ln--head">${esc(s.title)}</span>`, '']];
  s.body.forEach((p) => items.push([esc(p), 'ln--body']));
  items.push(['', 'ln--gap']);
  s.lines.forEach((l) => items.push([esc(l), 'ln--quote']));
  items.push(['', 'ln--gap']);
  printLines(items);
}

function printPrinciples() {
  const s = sections.principles;
  const items = [[`<span class="ln--head">${esc(s.title)}</span>`, '']];
  s.items.forEach((p, i) => items.push([`<i>${String(i + 1).padStart(2, '0')}</i>${esc(p)}`, 'ln--li']));
  items.push(['', 'ln--gap']);
  printLines(items);
}

function printContact() {
  const s = sections.contact;
  const items = [[`<span class="ln--head">${esc(s.title)}</span>`, '']];
  s.body.forEach((p) => items.push([esc(p), 'ln--body']));
  items.push([`<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`, 'ln--body']);
  items.push(['', 'ln--gap']);
  printLines(items);
}

/* ---------------- status dashboard ---------------- */
function fmt(v, format) {
  if (format === 'pct') return v.toFixed(2) + '%';
  if (format === 'dec') return v.toFixed(1);
  return Math.round(v).toLocaleString('en-US');
}

function renderMetricsHTML(values) {
  const cards = status.metrics.map((m) => `
    <div class="metric">
      <div class="metric__label">${esc(m.label)}</div>
      <div class="metric__val" data-key="${m.key}"><b>${fmt(values[m.key], m.format)}</b></div>
    </div>`).join('');
  return `<div class="grid">${cards}</div>
    <div class="statusbar"><span class="dot"></span><span>SYSTEM STATUS: ${esc(status.systemStatus)}</span></div>`;
}

// Phase 1: deterministic baseline + gentle live drift.
// Phase 2: if status.source is set, fetch real values, fall back on error.
function baseValues() {
  const v = {};
  status.metrics.forEach((m) => { v[m.key] = m.base; });
  return v;
}
function driftValues(v) {
  status.metrics.forEach((m) => {
    const delta = (Math.random() - 0.45) * m.drift;
    v[m.key] = Math.max(0, v[m.key] + delta);
    if (m.format === 'pct') v[m.key] = Math.min(100, v[m.key]);
  });
  return v;
}

async function printStatus() {
  if (statusTimer) { clearInterval(statusTimer); statusTimer = null; }
  let values = baseValues();

  if (status.source) {
    try {
      const r = await fetch(status.source, { headers: { accept: 'application/json' } });
      if (r.ok) { const j = await r.json(); values = { ...values, ...(j.metrics || j) }; }
    } catch (_) { /* fall back to simulated */ }
  }

  printLines([[`<span class="ln--head">${esc(sections.about ? 'STATUS' : 'STATUS')}</span>`, '']]);
  const host = line(renderMetricsHTML(values), 'ln--body');
  gap();
  scroll();

  // live tick (only when not reduced-motion and no real source)
  if (!reduce && !status.source) {
    statusTimer = setInterval(() => {
      if (!document.body.contains(host)) { clearInterval(statusTimer); statusTimer = null; return; }
      values = driftValues(values);
      status.metrics.forEach((m) => {
        const node = host.querySelector(`[data-key="${m.key}"] b`);
        if (node) node.textContent = fmt(values[m.key], m.format);
      });
    }, 2200);
  }
}

/* ---------------- ASK GREG ---------------- */
function enterAsk(showIntro) {
  mode = 'ask';
  el.promptUser.textContent = 'ask greg';
  el.input.placeholder = 'ask a question, or `exit`';
  if (!showIntro) return;
  const items = [
    [`<span class="ln--head">ASK GREG</span>`, ''],
    [`<span class="ln--mute">${esc(askGreg.intro)}</span>`, ''],
    ['', 'ln--gap'],
  ];
  printLines(items);
  const wrap = line('', 'ln--body');
  askGreg.suggestions.forEach((q) => {
    const b = document.createElement('span');
    b.className = 'sg';
    b.textContent = q;
    b.addEventListener('click', () => { el.input.value = ''; echo(q); runAsk(q); });
    wrap.appendChild(b);
  });
  gap();
  scroll();
}

function runAsk(text) {
  const t = text.trim().toLowerCase();
  if (t === 'exit' || t === 'back' || t === '/exit') {
    mode = 'shell';
    el.promptUser.textContent = 'greg@system';
    el.input.placeholder = 'type a command, or `help`';
    printLines([['<span class="ln--mute">← back to system.</span>', ''], ['', 'ln--gap']]);
    return;
  }
  // allow slash-commands to escape ask mode
  if (text.trim().startsWith('/')) { mode = 'shell'; el.promptUser.textContent = 'greg@system'; return run(text); }

  // Match curated entries only. Multi-word keys match as a phrase;
  // single-word keys match as a whole word so short keys (e.g. "ai")
  // never fire inside another word ("email").
  const words = t.split(/[^a-z0-9]+/).filter(Boolean);
  const matches = (k) => (k.includes(' ') || k.includes('.')) ? t.includes(k) : words.includes(k);
  const hit = askGreg.qa.find((e) => e.match.some(matches));
  const answer = hit ? hit.a : askGreg.fallback;
  const items = [];
  answer.forEach((a) => items.push([esc(a), 'ln--body']));
  items.push(['', 'ln--gap']);
  // brief "thinking" beat for texture
  setTimeout(() => printLines(items), reduce ? 0 : 260);
}

/* ---------------- misc ---------------- */
function clear() {
  if (statusTimer) { clearInterval(statusTimer); statusTimer = null; }
  el.output.innerHTML = '';
}

/* ---------------- wiring ---------------- */
el.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const raw = el.input.value;
  if (raw.trim()) { history.push(raw); hIdx = history.length; }
  el.input.value = '';
  run(raw);
});

el.menu.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-cmd]');
  if (!btn) return;
  if (mode === 'ask') { mode = 'shell'; el.promptUser.textContent = 'greg@system'; el.input.placeholder = 'type a command, or `help`'; }
  run('/' + btn.dataset.cmd);
  if (!touch) el.input.focus();
});

// command history with arrow keys
el.input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') { if (hIdx > 0) { hIdx--; el.input.value = history[hIdx]; e.preventDefault(); } }
  else if (e.key === 'ArrowDown') { if (hIdx < history.length - 1) { hIdx++; el.input.value = history[hIdx]; } else { hIdx = history.length; el.input.value = ''; } }
});

// keep focus on the input when clicking anywhere in the terminal output
el.output.addEventListener('click', (e) => { if (!touch && !e.target.closest('a, .sg')) el.input.focus(); });
