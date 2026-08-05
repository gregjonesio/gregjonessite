/* terminal.js — client engine for gregjones.io
   Plain ES module. No dependencies. Reads the shared data layer from
   <script id="site-data">. Drives the boot screen, command terminal,
   status dashboard, and the curated "Ask Greg" interface. */

const DATA = JSON.parse(document.getElementById('site-data').textContent);
const { commands, sections, status, askGreg, identity, essays, links } = DATA;

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Touch devices: never auto-focus the input — focusing opens the on-screen
// keyboard and scrolls the page to the prompt. Users tap the input themselves.
const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

/* First-party, cookieless analytics beacon. Sends only an event name —
   no query text, no identifiers. Fire-and-forget; failures are ignored. */
function track(e) {
  try { navigator.sendBeacon('/api/beacon', JSON.stringify({ e })); } catch (_) {}
}
track('pv');

const el = {
  boot: document.getElementById('boot'),
  enter: document.getElementById('enterBtn'),
  bootTyped: document.getElementById('bootTyped'),
  system: document.getElementById('system'),
  read: document.getElementById('read'),
  output: document.getElementById('output'),
  announcer: document.getElementById('announcer'),
  form: document.getElementById('inputForm'),
  input: document.getElementById('cmd'),
  menu: document.getElementById('menu'),
  promptUser: document.getElementById('promptUser'),
};

let mode = 'shell';        // 'shell' | 'ask'
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
  el.enter.setAttribute('aria-expanded', 'true');
  el.boot.style.transition = 'opacity 420ms ease';
  el.boot.style.opacity = '0';
  setTimeout(() => {
    el.boot.hidden = true;
    el.boot.style.display = 'none';   // force out of layout (class display:grid overrides [hidden])
    // The read view is the same content in prose form. Hide it while the
    // terminal owns the screen so the two are never both present.
    if (el.read) { el.read.hidden = true; el.read.style.display = 'none'; }
    el.system.hidden = false;
    window.scrollTo(0, 0);
    if (!touch) { try { el.input.focus({ preventScroll: true }); } catch (_) {} }
    track('enter');
    enqueue(bootLog);
  }, reduce ? 0 : 420);
}
el.enter.addEventListener('click', enterSystem);
el.enter.addEventListener('touchend', (e) => { e.preventDefault(); enterSystem(); }, { passive: false });
// Pressing Enter on the boot screen also enters. Scoped to the case where no
// interactive element has focus, so activating a link in the read view below
// does not also trip the gate.
document.addEventListener('keydown', (e) => {
  if (el.boot.hidden || e.key !== 'Enter') return;
  const a = document.activeElement;
  if (a && a !== document.body && a !== el.enter) return;
  enterSystem();
});

/** `exit` used to say "already at root", which was a dead end for a command
    the footer advertises. It now returns to the read view. */
function exitSystem() {
  entered = false;
  owner = {};              // disown anything still drawing
  generation++;            // and drop anything queued behind this exit
  el.enter.setAttribute('aria-expanded', 'false');
  el.system.hidden = true;
  el.boot.hidden = false;
  el.boot.style.display = '';
  el.boot.style.opacity = '1';
  if (el.read) { el.read.hidden = false; el.read.style.display = ''; }
  clear();
  window.scrollTo(0, 0);
  try { el.enter.focus({ preventScroll: true }); } catch (_) {}
}

/* ---------------- output primitives ---------------- */

/**
 * RENDER QUEUE
 *
 * A terminal has one contract: output follows its command, in order. Lines are
 * staggered for texture, which means they land asynchronously, which used to
 * mean three fast commands produced three echoes followed by three bodies, and
 * `clear` could be refilled by timeouts that were still pending.
 *
 * So every command is a job, and jobs run strictly one after another. Each job
 * is handed an identity when it starts. Writers capture that identity and check
 * it before touching the DOM, so a job that has been cleared out or timed out
 * cannot append to a screen that now belongs to something else.
 *
 * Ownership is deliberately not a monotonic counter compared at enqueue time.
 * That version silently dropped any command typed just after `clear`, because
 * the counter had moved on by the time the job reached the front of the queue.
 */
let queue = Promise.resolve();
let owner = {};
let generation = 0;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Jobs are raced against a watchdog. Without it a single job that never settles
 * would block every later command forever and the terminal would look dead with
 * no error to explain it. The watchdog both releases the queue and disowns the
 * stalled job, so if it does finish late its writes are discarded rather than
 * landing in the middle of someone else's output.
 *
 * Cancellation here is cooperative: a released job keeps running, and it is
 * each continuation's job to re-check `live()` before drawing. Anything added
 * to this file that touches the DOM after an await must do the same.
 */
const JOB_TIMEOUT = 8000;

function enqueue(job) {
  // Captured at enqueue time, and only `exit` advances it. A command typed
  // behind `exit` belongs to a session that has ended and must not run in the
  // one that follows, or its output shows up above the next boot log.
  //
  // Deliberately NOT advanced by `clear`: clearing cancels writers already
  // drawing, not commands the user typed afterwards. Conflating the two is
  // what previously made a command typed just after `clear` vanish.
  const gen = generation;

  queue = queue
    .then(() => {
      if (gen !== generation) return;

      const token = (owner = {});
      let timer;
      const watchdog = new Promise((resolve) => {
        timer = setTimeout(() => {
          if (owner === token) owner = {};
          console.warn('[terminal] job exceeded', JOB_TIMEOUT, 'ms; releasing the queue');
          resolve();
        }, JOB_TIMEOUT);
      });

      // Caught here rather than on the race, so a rejection arriving after the
      // watchdog has already won is still reported instead of surfacing as an
      // unhandled rejection with no context.
      const running = Promise.resolve()
        .then(job)
        .catch((err) => { console.error('[terminal] job failed', err); });

      return Promise.race([running, watchdog]).finally(() => clearTimeout(timer));
    })
    .catch((err) => { console.error('[terminal]', err); });
  return queue;
}

/** The identity a writer must hold to be allowed to draw. */
const claim = () => owner;

/** True while the holder of `token` still owns the screen. */
const live = (token) => token === owner;

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

/**
 * Print a set of [html, cls] lines with a gentle stagger.
 * Resolves once the last line is on screen, so the caller can await a block.
 */
function printLines(items) {
  const mine = claim();
  const step = reduce ? 0 : 55;
  return new Promise((resolve) => {
    let i = 0;
    const tick = () => {
      if (!live(mine)) return resolve();
      if (i >= items.length) return resolve();
      const [html, cls] = items[i++];
      line(html, cls);
      scroll();
      setTimeout(tick, step);
    };
    tick();
  });
}

/**
 * Screen readers get one announcement per completed block rather than one per
 * staggered line. `#output` itself is not a live region for that reason; this
 * offscreen node is.
 */
function announce() {
  if (!el.announcer) return;
  const text = el.output.innerText.trim();
  if (!text) return;   // `clear` sets its own message; do not overwrite it with nothing
  el.announcer.textContent = text.split('\n').slice(-14).join('. ');
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------------- boot log on entry ---------------- */
function bootLog() {
  return printLines([
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
  line(`<span class="ln--mute">${esc(promptTxt)}</span> <b>${esc(clamp(raw, 160))}</b>`, 'ln--cmd');
}

/**
 * The public entry point. One command is one queued job, so its echo and its
 * body can never be separated by another command's output.
 */
function run(raw) {
  const input = raw.trim();
  if (!input) return;
  return enqueue(async () => {
    const mine = claim();
    echo(input);
    await dispatch(input);
    // The announcement is a DOM write like any other, so it has to prove it
    // still owns the screen. A job released by the watchdog used to be able to
    // overwrite the live region while a newer command was on screen.
    if (live(mine)) announce();
  });
}

async function dispatch(input) {
  if (mode === 'ask') return runAsk(input);

  const cmd = input.replace(/^\//, '').toLowerCase().split(/\s+/)[0];
  const rest = input.replace(/^\S+\s*/, '');
  track('cmd:' + cmd); // server keeps a whitelist; unknown commands are dropped

  switch (cmd) {
    case 'help':    return cmdHelp();
    case 'ls':
    case 'menu':    return cmdLs();
    case 'about':       return printSection('about');
    case 'automation':  return printAutomation();
    case 'capital':     return printSection('capital');
    case 'building':    return printBuilding();
    case 'writing':     return printWriting();
    case 'principles':  return printPrinciples();
    case 'contact':     return printContact();
    case 'links':       return printLinks();
    case 'status':      return printStatus();
    case 'whoami':      return printLines([
      [`<span class="ln--body">${esc(identity.name.toLowerCase())} · operator, allocator, systems builder.</span>`, ''],
      ['', 'ln--gap'],
    ]);
    case 'ask':
      if (rest) { enterAsk(false); return runAsk(rest); }
      return enterAsk(true);
    case 'clear':   return clear();
    case 'exit':    return exitSystem();
    default:
      // The unknown token is echoed back, so it is clamped. A 300-character
      // paste should not become a 300-character error line.
      return printLines([
        [`<span class="ln--mute">command not found: <b>${esc(clamp(cmd, 32))}</b></span>`, ''],
        ['<span class="ln--mute">type <b class="accent">help</b> for available commands.</span>', ''],
        ['', 'ln--gap'],
      ]);
  }
}

/** Trim to `n` characters with an ellipsis, for anything echoed back. */
const clamp = (s, n) => (s.length > n ? `${s.slice(0, n)}…` : s);

function cmdHelp() {
  return printLines([
    ['<span class="ln--head">AVAILABLE COMMANDS</span>', ''],
    ...commands.map((c) => [
      `<b class="accent">${esc(c.label)}</b><span class="ln--mute">  ·  ${esc(c.desc)}</span>`, 'ln--li',
    ]),
    ['<b class="accent">help</b><span class="ln--mute">  ·  this list · also: links, clear, ls, whoami, exit</span>', 'ln--li'],
    ['', 'ln--gap'],
  ]);
}

function cmdLs() {
  return printLines([[commands.map((c) => `<b class="accent">${esc(c.label)}</b>`).join('   '), 'ln--body'], ['', 'ln--gap']]);
}

/* ---------------- section renderers ---------------- */
function printSection(key) {
  const s = sections[key];
  const items = [[`<span class="ln--head">${esc(s.title)}</span>`, '']];
  s.body.forEach((p) => items.push([esc(p), 'ln--body']));
  if (s.meta) items.push([`<span class="ln--mute">${esc(s.meta)}</span>`, '']);
  items.push(['', 'ln--gap']);
  return printLines(items);
}

function printAutomation() {
  const s = sections.automation;
  const items = [[`<span class="ln--head">${esc(s.title)}</span>`, '']];
  s.body.forEach((p) => items.push([esc(p), 'ln--body']));
  items.push(['', 'ln--gap']);
  s.lines.forEach((l) => items.push([esc(l), 'ln--quote']));
  items.push(['', 'ln--gap']);
  return printLines(items);
}

function printPrinciples() {
  const s = sections.principles;
  const items = [[`<span class="ln--head">${esc(s.title)}</span>`, '']];
  s.items.forEach((p, i) => items.push([`<i>${String(i + 1).padStart(2, '0')}</i>${esc(p)}`, 'ln--li']));
  items.push(['', 'ln--gap']);
  return printLines(items);
}

function printContact() {
  const s = sections.contact;
  const items = [[`<span class="ln--head">${esc(s.title)}</span>`, '']];
  s.body.forEach((p) => items.push([esc(p), 'ln--body']));
  items.push([link(s.cta.href, s.cta.label), 'ln--body']);
  items.push([`<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`, 'ln--body']);
  items.push(['', 'ln--gap']);
  return printLines(items);
}

/** External anchor. rel is set because every one of these leaves the site. */
function link(href, label) {
  return `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`;
}

function printBuilding() {
  const s = sections.building;
  const items = [[`<span class="ln--head">${esc(s.title)}</span>`, '']];
  s.body.forEach((p) => items.push([esc(p), 'ln--body']));
  items.push([link(s.cta.href, s.cta.label), 'ln--body']);
  items.push(['', 'ln--gap']);
  return printLines(items);
}

function printWriting() {
  const s = sections.writing;
  const items = [[`<span class="ln--head">${esc(s.title)}</span>`, '']];
  s.body.forEach((p) => items.push([esc(p), 'ln--body']));
  items.push(['', 'ln--gap']);
  essays.forEach((e) => {
    items.push([`${link(e.href, e.title)} <span class="ln--mute">${esc(e.date)}</span>`, 'ln--body']);
    items.push([`<span class="ln--mute">${esc(e.summary)}</span>`, 'ln--quote']);
  });
  items.push(['', 'ln--gap']);
  items.push([link(s.cta.href, s.cta.label), 'ln--body']);
  items.push(['', 'ln--gap']);
  return printLines(items);
}

function printLinks() {
  const items = [['<span class="ln--head">ELSEWHERE</span>', '']];
  links.forEach((l) => {
    const note = l.note ? ` <span class="ln--mute">${esc(l.note)}</span>` : '';
    items.push([`${link(l.href, l.label)}${note}`, 'ln--li']);
  });
  items.push(['', 'ln--gap']);
  return printLines(items);
}

/* ---------------- status dashboard ---------------- */
function fmt(v, format) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 'n/a';
  if (format === 'pct') return n.toFixed(2) + '%';
  if (format === 'dec') return n.toFixed(1);
  return Math.round(n).toLocaleString('en-US');
}

/**
 * The metrics feed is third party. Spreading its payload in unchecked meant a
 * string, null, or a changed shape reached `.toFixed()` and threw in the middle
 * of rendering, after the loading line had already been removed.
 *
 * Only finite numbers for keys we already know are accepted. Anything else
 * keeps its reconciled baseline, so a bad response degrades to stale-but-
 * correct rather than a half-drawn dashboard.
 */
function mergeMetrics(base, incoming) {
  if (!incoming || typeof incoming !== 'object') return { values: base, applied: 0 };
  const values = { ...base };
  let applied = 0;
  status.metrics.forEach((m) => {
    const n = toMetric(incoming[m.key]);
    if (n !== null) { values[m.key] = n; applied += 1; }
  });
  return { values, applied };
}

/**
 * Numbers and numeric strings only. Deliberately not `Number(v)`: that coerces
 * null, '', [], and false to 0, which would publish a real figure as zero.
 */
function toMetric(raw) {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
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

/** Last reconciled values from content.js, used when the feed fails. */
function baseValues() {
  const v = {};
  status.metrics.forEach((m) => { v[m.key] = m.base; });
  return v;
}

async function printStatus() {
  const mine = claim();

  // Header and a loading line go up first. The fetch used to be awaited before
  // anything was printed, which meant a silent ~425ms gap on the one command
  // named `status`, and an indefinite one if the endpoint hung.
  line('<span class="ln--head">STATUS</span>');
  const pending = line('<span class="ln--mute">querying live feed…</span>');
  scroll();

  let values = baseValues();
  let isLive = false;

  if (status.source) {
    try {
      const r = await fetch(status.source, {
        headers: { accept: 'application/json' },
        // Bounded wait. Past this the reconciled values are shown instead.
        signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const j = await r.json();
        const merged = mergeMetrics(values, j && (j.metrics || j));
        values = merged.values;
        // Only claim the feed is live when every metric actually arrived as a
        // number. A partial or malformed response shows the notice instead.
        isLive = merged.applied === status.metrics.length;
      }
    } catch (_) { /* fall through to the reconciled values */ }
  }

  if (!live(mine)) return;   // cleared while the request was in flight

  pending.remove();
  line(renderMetricsHTML(values), 'ln--body');
  // Never let the OPERATIONAL indicator imply live data it did not get.
  if (!isLive) line(`<span class="ln--mute">${esc(status.staleNotice)}</span>`);
  gap();
  scroll();
}

/* ---------------- ASK GREG ---------------- */
function enterAsk(showIntro) {
  mode = 'ask';
  el.promptUser.textContent = 'ask greg';
  el.input.placeholder = 'ask a question, or `exit`';
  if (!showIntro) return;
  // Rendered synchronously so the heading lands above its own suggestions.
  // printLines defers every line, which would put the header last.
  line('<span class="ln--head">ASK GREG</span>');
  line(`<span class="ln--mute">${esc(askGreg.intro)}</span>`);
  gap();
  renderSuggestions();
  gap();
  scroll();
}

/** Restore the shell prompt. Was duplicated in three places, one of which
    forgot to reset the placeholder. */
function leaveAskMode() {
  mode = 'shell';
  el.promptUser.textContent = 'greg@system';
  el.input.placeholder = 'type a command, or `help`';
}

/** The suggestion chips. Buttons, so they are reachable by keyboard. */
function renderSuggestions() {
  const wrap = line('', 'ln--body');
  askGreg.suggestions.forEach((q) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sg';
    b.textContent = q;
    b.addEventListener('click', () => { el.input.value = ''; echo(q); runAsk(q); });
    wrap.appendChild(b);
  });
  return wrap;
}

/**
 * Score one curated entry against the question.
 *
 * A multi-word trigger matches as a phrase and scores far higher than a lone
 * keyword, so "capital allocation" always beats a stray "capital". A single
 * word matches only as a whole word, so short keys never fire inside another
 * word. `requires` gates ambiguous entries: at least one of those terms must
 * also be present, which is what stops "founder" from hijacking every
 * question that happens to mention one.
 *
 * Returning 0 is a real answer. An honest handoff beats a confident miss.
 */
/** One whole-word hit. Below this we have effectively matched nothing. */
const MIN_MATCH_SCORE = 2;
/** A winner must clear the runner-up by more than a single stray keyword. */
const MATCH_MARGIN = 2;

function scoreEntry(entry, text, words) {
  const present = (k) => (k.includes(' ') || k.includes('.')) ? text.includes(k) : words.includes(k);
  if (entry.requires && !entry.requires.some(present)) return 0;
  let score = 0;
  entry.match.forEach((k) => {
    if (!present(k)) return;
    score += k.includes(' ') ? 10 + k.split(/\s+/).length * 2 : 2;
  });
  return score;
}

async function runAsk(text) {
  const t = text.trim().toLowerCase();
  if (t === 'exit' || t === 'back' || t === '/exit') {
    leaveAskMode();
    return printLines([['<span class="ln--mute">← back to system.</span>', ''], ['', 'ln--gap']]);
  }

  // A slash command escapes ask mode and runs immediately.
  //
  // This must call dispatch, not run. `run` enqueues a new job, and we are
  // already inside one, so the current job would wait on a job that cannot
  // start until the current job finishes. That deadlocked until the watchdog
  // broke it eight seconds later.
  if (text.trim().startsWith('/')) {
    leaveAskMode();
    return dispatch(text);
  }

  track('ask:question'); // count only that a question was asked, never its content

  // Match curated entries only, and take the best score rather than the first
  // entry that happens to contain a matching word.
  //
  // Punctuation is flattened first so a phrase trigger still matches across
  // "background?" or "background,". Periods survive for keys like "a.i".
  const norm = t.replace(/[^a-z0-9.]+/g, ' ').replace(/\s+/g, ' ').trim();
  const words = t.split(/[^a-z0-9]+/).filter(Boolean);
  let best = null;
  let bestScore = 0;
  let runnerUp = 0;
  askGreg.qa.forEach((e) => {
    const s = scoreEntry(e, norm, words);
    if (s > bestScore) { runnerUp = bestScore; bestScore = s; best = e; }
    else if (s > runnerUp) { runnerUp = s; }
  });

  // Two guards against a confident miss, which is the failure this matcher
  // exists to prevent. A lone keyword is not enough on its own, and a result
  // that barely edges out another entry means we are guessing between them.
  // Handing off is always a safe answer; a wrong one is not.
  if (bestScore < MIN_MATCH_SCORE || bestScore - runnerUp < MATCH_MARGIN) best = null;

  const answer = best ? best.a : askGreg.fallback;
  const items = answer.map((a) => [esc(a), 'ln--body']);
  items.push(['', 'ln--gap']);

  // brief "thinking" beat for texture, then the answer, then a way forward
  const mine = claim();
  await wait(reduce ? 0 : 260);
  if (!live(mine)) return;
  await printLines(items);
  // A miss is a handoff, never a dead end: re-offer the suggestions so the
  // visitor always has a next move.
  if (!best && live(mine)) { renderSuggestions(); gap(); scroll(); }
}

/* ---------------- misc ---------------- */
/**
 * Disowning the screen is what makes this real. Wiping innerHTML alone left
 * every pending stagger timeout alive, so the screen refilled with what was
 * cleared. Note this cancels writers already in flight, not commands the user
 * typed afterwards: those are separate jobs and still run.
 */
function clear() {
  owner = {};
  el.output.innerHTML = '';
  if (el.announcer) el.announcer.textContent = 'Screen cleared.';
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
  if (mode === 'ask') leaveAskMode();
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
