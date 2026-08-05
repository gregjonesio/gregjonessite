/**
 * content.js — single source of truth for the site.
 *
 * Every surface reads from here: the client terminal, the statically rendered
 * page content, the per-route pages, and the JSON-LD entity graph. Copy is
 * edited in one place. Nothing here requires anything beyond a rebuild.
 *
 * Voice: understated, direct, specific. Confidence lives in the specificity,
 * never in adjectives. Competence is inferred, never asserted. No em dashes.
 *
 * Disclosure boundary: this file may name TailYield, the public skills repo,
 * the Substack, the public dashboard, and the automation fleet in numbers.
 * It must never carry entity counts, holdings, counterparties, financials,
 * portfolio detail, or any internal system beyond those. Working systems
 * appear as generalized patterns, never as internal tours.
 */

export const identity = {
  name: 'GREG JONES',
  displayName: 'Greg Jones',
  tagline: 'Building systems that compound.',
  pillars: ['Family Office', 'Venture Capital', 'Automation'],
  email: 'admin@gregjones.io',

  /**
   * The small line above the name. It used to read "secure session
   * established", which described a session that does not exist on a static
   * page. On a site whose argument is precision, the first line a visitor
   * reads should be true. This one is: the analytics layer sets no cookies at
   * all and stores a salted daily hash rather than an IP, so it is checkable
   * rather than decorative. Anything put here must stay checkable.
   */
  bootLine: '[ gregjones.io · cookieless by design ]',

  /** One sentence. This is the line a search engine or a model should repeat. */
  summary:
    'Greg Jones runs a single family office as an AI-native operating system, serves as President and CEO of SWS Venture Capital, and is the founder of TailYield.',

  /** Two to three sentences. The extractable version, used for meta and schema. */
  bio: [
    'Greg Jones runs a single family office as an AI-native operating system: a fleet of scheduled agents that prepare work, monitored by heartbeats and dead-man switches, with every consequential decision reserved for a person.',
    'He is President and CEO of SWS Venture Capital and the founder of TailYield. Before that he spent roughly a decade in financial services at Morgan Stanley, UBS, and in the RIA space, focused on asset management, portfolio construction, and risk analysis for high-net-worth individuals and institutions.',
    'He publishes the specification layer for that work publicly, and writes weekly about what small organizations can borrow from institutions.',
  ],

  jobTitle: 'President and CEO, SWS Venture Capital',
  worksFor: 'SWS Venture Capital',
  location: 'Pasadena, California',
  url: 'https://gregjones.io',

  /**
   * Headshot for search results, the about page, and the Person schema
   * `image` field. Drop the file at public/greg-jones.jpg.
   *
   * Build-time existence check: if the file is missing, the schema omits
   * `image` and the about page omits the portrait, rather than shipping a
   * broken reference. Nothing else needs changing when the file arrives.
   */
  image: '/greg-jones.jpg',
  imageAlt: 'Greg Jones',

  education: [
    { degree: 'MBA, Finance', school: 'BiMBA at Peking University and Vlerick Business School, Ghent' },
    { degree: 'MS, Global Finance', school: 'Fordham University, Gabelli School of Business' },
    { degree: 'BA', school: 'University of California, Los Angeles' },
  ],

  career: [
    'President and CEO, SWS Venture Capital. With the firm since its founding.',
    'Founder, TailYield.',
    'Roughly ten years in financial services across Morgan Stanley, UBS, and the RIA space.',
  ],
};

/**
 * OUTBOUND LINKS
 * --------------
 * These do double duty. For a reader they are how a stranger verifies that any
 * of this is real. For a machine they are the `sameAs` array in the Person
 * schema, which is what connects a common name to one specific person.
 * Order matters: this is also the render order on /about.
 */
export const links = [
  { label: 'Writing', href: 'https://gregjonesio.substack.com', note: 'Weekly essays', sameAs: true },
  { label: 'GitHub', href: 'https://github.com/gregjonesio/family-office-ai-skills', note: 'The public specification layer', sameAs: true },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/gregjonesmba', note: null, sameAs: true },
  { label: 'Dashboard', href: 'https://dashboard.gregjones.io', note: 'Live operating metrics', sameAs: true },
  { label: 'TailYield', href: 'https://tailyield.ai', note: 'Charter economics for aircraft owners', sameAs: true },
  { label: 'SWS Venture Capital', href: 'https://www.swsventurecap.com/greg-jones', note: 'Firm bio', sameAs: true },
  { label: 'Crunchbase', href: 'https://www.crunchbase.com/person/greg-jones-266e', note: null, sameAs: true },
];

/** Primary navigation across the crawlable pages. Order is render order. */
export const nav = [
  { label: 'About', href: '/about' },
  { label: 'Automation', href: '/automation' },
  { label: 'Building', href: '/building' },
  { label: 'Writing', href: '/writing' },
];

/** Order matters: this drives the command menu and tab order. */
export const commands = [
  { cmd: 'about',      label: '/about',      desc: 'Operator profile' },
  { cmd: 'automation', label: '/automation', desc: 'How the operation runs' },
  { cmd: 'capital',    label: '/capital',    desc: 'Capital as a system' },
  { cmd: 'building',   label: '/building',   desc: 'TailYield' },
  { cmd: 'writing',    label: '/writing',    desc: 'Published essays' },
  { cmd: 'principles', label: '/principles', desc: 'Operating principles' },
  { cmd: 'status',     label: '/status',     desc: 'Live system dashboard' },
  { cmd: 'contact',    label: '/contact',    desc: 'Subscribe or reach out' },
  { cmd: 'ask',        label: '/ask',        desc: 'Query the operator' },
];

export const sections = {
  about: {
    title: 'ABOUT',
    route: '/about',
    body: [
      'Greg Jones runs a single family office as an AI-native operating system. Machines prepare, organize, and surface. People verify, decide, and own. The dividing line is the nature of the act, not the difficulty of the task.',
      'In practice that means a fleet of scheduled agents doing the preparation that used to require headcount, each one watched by a heartbeat so that silence is observable, and each one holding a written list of things it is not allowed to do.',
      'He is President and CEO of SWS Venture Capital, where he has served since the firm was founded, and the founder of TailYield.',
      'Before that he spent roughly ten years in financial services at Morgan Stanley, UBS, and in the RIA space, focused on asset management, portfolio construction, and risk analysis for high-net-worth individuals and institutions. He holds an MBA from the BiMBA program at Peking University and Vlerick Business School in Ghent, an MS in Global Finance from Fordham, and a BA from UCLA.',
    ],
    meta: 'Operator. Allocator. Systems builder.',
  },

  automation: {
    title: 'AUTOMATION',
    route: '/automation',
    body: [
      'Automation is not a feature of the operation. It is the operation.',
      'The unit of design is the system, not the task. A workflow saves time. An operating system changes what the organization can attempt at all. Ten disconnected automations are a collection. Three composed systems are capacity.',
      'The most important property of anything acting on the operation’s behalf is what it is not allowed to do. That list is written in advance by the accountable person, not negotiated with the machine in the moment.',
      'The failure mode of automation is not error. It is silence. Every scheduled process here emits a heartbeat that something else watches, so a job that quietly stops running is a fact rather than a discovery made six weeks later.',
      'Current counts run live on the public dashboard. They are directional operating figures, not audited results, and they are labeled that way on purpose.',
    ],
    lines: [
      'Manual work is technical debt.',
      'The best systems disappear.',
      'Leverage is built before it is needed.',
      'An instruction is a request. A control is architecture.',
    ],
  },

  capital: {
    title: 'CAPITAL',
    route: '/capital',
    body: [
      'Capital is not the asset. Judgment is.',
      'Systems exist to preserve, deploy, and compound both. Allocation is a sequence of reversible and irreversible decisions, and the discipline is knowing which is which.',
      'The same division applies here as everywhere else in the operation. Machines assemble the file, check it against a written standard, and surface what is missing. They do not score, rank, or recommend, because an output that functions as a verdict is a decision wearing a costume.',
    ],
  },

  building: {
    title: 'BUILDING',
    route: '/building',
    body: [
      'TailYield is a decision tool for private aircraft owners. It answers one question with real numbers: what a specific charter trip is actually worth to the owner of the aircraft, before they say yes.',
      'Charter decisions are usually made on a quoted revenue figure that ignores what the flight costs the owner in maintenance exposure, positioning, and schedule. TailYield models the owner side of that trade.',
      'It is live, in production, and used on real aircraft.',
    ],
    cta: { label: 'tailyield.ai', href: 'https://tailyield.ai' },
  },

  writing: {
    title: 'WRITING',
    route: '/writing',
    body: [
      'A body of work on how small, high-trust organizations achieve institutional excellence: the discipline, continuity, and leverage of an institution without its headcount, bureaucracy, or pace.',
      'AI is the enabling technology that makes the economics work today. It is the instrument, not the argument.',
      'New essays weekly.',
    ],
    cta: { label: 'Subscribe at gregjonesio.substack.com', href: 'https://gregjonesio.substack.com' },
  },

  principles: {
    title: 'OPERATING PRINCIPLES',
    route: '/',
    items: [
      'Build leverage before scale.',
      'Automate the repeatable.',
      'Preserve optionality.',
      'Compound quietly.',
      'Measure what matters.',
      'Remove friction relentlessly.',
    ],
  },

  contact: {
    title: 'CONTACT',
    route: '/',
    body: [
      'The best way to follow the work is the essays. They go out weekly and cover what is actually running, including what failed.',
      'Direct email is open. If you are writing about something you are building, three sentences on what it does and what is hard about it is plenty. Replies are not guaranteed and are never fast.',
    ],
    email: 'admin@gregjones.io',
    cta: { label: 'Subscribe to the writing', href: 'https://gregjonesio.substack.com' },
  },
};

/**
 * PUBLISHED ESSAYS
 * ----------------
 * Each carries its own summary so /writing is substantive on its own rather
 * than a list of links. Add new entries at the top as they publish.
 */
export const essays = [
  {
    title: 'A Collection of Automations Is Not a System',
    date: '2026-07-29',
    href: 'https://gregjonesio.substack.com/p/a-collection-of-automations-is-not',
    summary:
      'Leverage comes from composed operating systems, not from accumulating individual automations. A workflow saves time. An operating system changes what the organization can attempt.',
  },
  {
    title: 'What a Lean Organization Remembers',
    date: '2026-07-22',
    href: 'https://gregjonesio.substack.com/p/what-a-lean-organization-remembers',
    summary:
      'An organization learns by converting experience into architecture rather than into individual memory. A lean team has no redundancy of people, so what is not written into the system is not learned, only remembered, and memory leaves with its owner.',
  },
  {
    title: 'Guardrails Are Instructions, Not Controls',
    date: '2026-07-15',
    href: 'https://gregjonesio.substack.com/p/guardrails-are-instructions-not-controls',
    summary:
      'Prompts and do-not lists state intent. Evaluations measure adherence. Architecture enforces. Confusing those three layers is the characteristic governance failure of delegated work, and cheap machine labor has made it universal.',
  },
];

/**
 * STATUS METRICS
 * --------------
 * Live values come from the public endpoint below and match
 * dashboard.gregjones.io. The `base` values are the fallback rendered when the
 * fetch fails or times out, so they must be refreshed whenever they drift far
 * from live. Last reconciled against the live endpoint 2026-08-05.
 *
 * These are directional operating figures, not audited results.
 */
export const status = {
  source: 'https://wsyfqadzlizhkauyfpbr.supabase.co/functions/v1/public-metrics',
  systemStatus: 'OPERATIONAL',
  /** Shown under the grid when values came from `base` instead of the feed. */
  staleNotice: 'Live feed unavailable. Showing last reconciled values.',
  metrics: [
    { key: 'active_automations',    label: 'Active automations',    base: 19,  format: 'int' },
    { key: 'active_agents',         label: 'Active agents',         base: 27,  format: 'int' },
    { key: 'executions_this_month', label: 'Executions this month', base: 244, format: 'int' },
    { key: 'connected_systems',     label: 'Connected systems',     base: 23,  format: 'int' },
    { key: 'hours_saved_month',     label: 'Hours saved (30d)',     base: 34,  format: 'dec' },
    { key: 'success_rate',          label: 'Success rate',          base: 99.8, format: 'pct' },
  ],
};

/**
 * ASK GREG — curated knowledge base.
 * -------------------------------------------------------------------------
 * Constrained by design. A private interview system, not a chatbot.
 *   · No external model. No API. No keys. No tokens. No free-form generation.
 *   · Typed input is matched ONLY to the approved answers below.
 *   · Anything unmatched hands off rather than refusing.
 *
 * Each entry:
 *   q        — the canonical question
 *   match    — strong triggers. Multi-word triggers match as a phrase; single
 *              word triggers match as a whole word. Scored by the matcher in
 *              terminal.js, so a phrase always beats a lone keyword and a tie
 *              never silently picks the first entry.
 *   requires — optional. At least one of these words must also be present for
 *              the entry to score at all. This is how ambiguous single words
 *              like "capital" stop hijacking unrelated questions.
 *   a        — the curated answer, as an array of lines.
 *
 * To add a topic: append an entry. To revise voice: edit `a`. Rebuild.
 */
export const askGreg = {
  intro: 'A private interview system. Curated responses, in Greg’s words.',
  suggestions: [
    'Who are you?',
    'What is your background?',
    'What are you building?',
    'Why automation?',
    'How do you evaluate founders?',
    'How do you think about AI?',
    'What do most operators miss?',
    'How do I get in touch?',
  ],
  qa: [
    {
      q: 'Who are you?',
      match: ['who are you', 'who is greg', 'about you', 'tell me about yourself', 'introduce yourself', 'whoami'],
      a: [
        'Greg Jones. I run a single family office as an AI-native operating system, I am President and CEO of SWS Venture Capital, and I founded TailYield.',
        'The short version: machines prepare, people decide. I build the systems that make that division hold, and I write about what small organizations can borrow from institutions without inheriting the bureaucracy.',
      ],
    },
    {
      q: 'What is your background?',
      match: ['background', 'your career', 'career', 'resume', 'cv', 'experience', 'history', 'where did you work', 'worked before', 'education', 'where did you study', 'school', 'degree', 'mba', 'ucla'],
      a: [
        'Roughly ten years in financial services before this, at Morgan Stanley, UBS, and in the RIA space. Asset management, portfolio construction, and risk analysis for high-net-worth individuals and institutions.',
        'MBA from the BiMBA program at Peking University and Vlerick Business School in Ghent. MS in Global Finance from Fordham. BA from UCLA.',
        'Since then: SWS Venture Capital, from the firm’s founding to now, and building the operating systems the family office runs on.',
      ],
    },
    {
      q: 'What are you building?',
      match: ['what are you building', 'building', 'working on', 'what do you build', 'what are you working', 'tailyield', 'your product', 'your company', 'startup'],
      a: [
        'TailYield, most directly. It tells a private aircraft owner what a specific charter trip is actually worth to them before they say yes, which is a number the quoted revenue figure never answers. It is live and running on real aircraft.',
        'Underneath that, the operating system the family office runs on: composed systems that preserve optionality, remove friction, and let judgment scale without headcount. The specification layer for that work is public on GitHub.',
      ],
    },
    {
      q: 'How do I get in touch?',
      match: ['get in touch', 'contact you', 'contact', 'reach you', 'reach out', 'your email', 'email', 'how do i contact', 'talk to you', 'connect', 'meet', 'subscribe', 'newsletter'],
      a: [
        'The essays are the best way to follow the work. They go out weekly at gregjonesio.substack.com and cover what is actually running, including what failed.',
        'Direct email is admin@gregjones.io. If you are writing about something you are building, three sentences on what it does and what is hard about it is plenty. Replies are not guaranteed and are never fast.',
      ],
    },
    {
      q: 'Where can I verify any of this?',
      match: ['verify', 'proof', 'prove it', 'sources', 'credentials', 'linkedin', 'github', 'substack', 'where can i read', 'your writing', 'essays', 'blog', 'dashboard', 'track record'],
      a: [
        'Essays at gregjonesio.substack.com. The public specification layer at github.com/gregjonesio/family-office-ai-skills. Live operating metrics at dashboard.gregjones.io. Firm bio at swsventurecap.com.',
        'The dashboard numbers are directional operating figures rather than audited results, and they are labeled that way there too.',
      ],
    },
    {
      q: 'Why automation?',
      match: ['why automation', 'automation', 'automate', 'automated', 'why automate'],
      a: [
        'Because manual work is technical debt that compounds against you.',
        'Every repeatable task done by hand is leverage left uncollected. The best systems disappear. You stop noticing them, and the time they return does not come back.',
      ],
    },
    {
      q: 'What does leverage mean to you?',
      match: ['leverage', 'what is leverage'],
      a: [
        'Leverage is the gap between output and effort. Capital is one form. Code, systems, and reputation are stronger ones.',
        'It is built before it is needed. By the time the need is obvious, the cost to build it has already risen.',
      ],
    },
    {
      q: 'How do you evaluate founders?',
      match: ['evaluate founders', 'evaluate a founder', 'assess founders', 'judge founders', 'back founders', 'founder', 'founders'],
      requires: ['evaluate', 'assess', 'judge', 'look for', 'back', 'invest', 'pick', 'choose', 'founder', 'founders'],
      a: [
        'Rate of learning over resume. The founders worth backing compound their own judgment faster than the market compounds capital.',
        'I look for taste in problems, intolerance for friction, and the discipline to build leverage before they need it. Charisma is noise. Velocity of good decisions is signal.',
      ],
    },
    {
      q: 'How do you think about capital allocation?',
      match: ['capital allocation', 'allocate capital', 'allocation', 'deploy capital', 'how do you allocate'],
      a: [
        'Capital is not the asset. Judgment is.',
        'Allocation is a sequence of reversible and irreversible decisions, and the discipline is knowing which is which. The edge is not access. It is patience, and the willingness to do nothing until the asymmetry is real.',
      ],
    },
    {
      q: 'What does compounding mean to you?',
      match: ['compounding', 'compound', 'compounds', 'long term', 'long-term', 'horizon'],
      a: [
        'Compounding is what happens when you refuse to interrupt it.',
        'It rewards consistency and punishes ego. Most of the result arrives late, which is precisely why most people quit before it does. Compound quietly.',
      ],
    },
    {
      q: 'How do you think about family office operations?',
      match: ['family office', 'family-office', 'office operations', 'run the office', 'manage the family'],
      a: [
        'Like an operating system, not a ledger. Quiet, instrumented, and built to run without me in the loop.',
        'Preservation first, then compounding. The objective is not activity. It is a small number of correct decisions, protected from noise and executed without drama.',
      ],
    },
    {
      q: 'What are your operating principles?',
      match: ['operating principles', 'principles', 'principle', 'how do you operate', 'philosophy', 'your values'],
      a: [
        'Six. Build leverage before scale. Automate the repeatable. Preserve optionality. Compound quietly. Measure what matters. Remove friction relentlessly.',
        'They are not slogans. They are filters. Each one removes a class of bad decisions before it reaches the table.',
      ],
    },
    {
      q: 'What do most operators miss?',
      match: ['operators miss', 'most operators', 'what do operators', 'operators get wrong', 'what do people miss', 'commonly missed', 'overlook'],
      a: [
        'They optimize the visible and ignore the structural. Friction is treated as a cost of doing business rather than a defect to be removed.',
        'And they scale before they have leverage, so they scale their problems. Quiet compounding beats loud growth almost every time.',
      ],
    },
    {
      q: 'Why do systems matter?',
      match: ['why systems', 'systems matter', 'why do systems', 'systems design', 'why build systems', 'systems'],
      a: [
        'Because willpower does not scale and memory is not a strategy.',
        'A system is a decision made once and enforced forever. It turns judgment into infrastructure, so the standard holds whether or not anyone is watching.',
      ],
    },
    {
      q: 'How do you think about AI?',
      match: ['ai', 'a.i', 'artificial intelligence', 'about ai', 'use ai', 'llm', 'llms', 'machine learning', 'agents', 'chatgpt', 'claude'],
      a: [
        'As leverage, not magic. It is the most powerful automation layer ever built, and it rewards those who already think in systems.',
        'The advantage will not go to those who talk about it. It goes to those who quietly wire it into how decisions get made, and keep judgment in the loop where it matters.',
      ],
    },
    {
      q: 'What should AI not be allowed to do?',
      match: ['guardrails', 'controls', 'boundaries', 'refuse', 'refusal', 'not allowed', 'governance', 'safety', 'oversight', 'risk of ai', 'trust ai'],
      a: [
        'The most important property of any system acting on your behalf is what it is not allowed to do. That list is written in advance by the accountable person, not negotiated with the machine in the moment.',
        'And an instruction is not a control. Prompts state intent, tests measure adherence, and architecture enforces: restricted access, draft-only outputs, human review gates. Confusing those three layers is the way delegated work has always gone wrong. Cheap machine labor just made it universal.',
      ],
    },
    {
      q: 'How do you know your systems are working?',
      match: ['how do you measure', 'measurement', 'metrics', 'roi', 'results', 'how do you know', 'prove the value', 'hours saved'],
      a: [
        'Measure honestly or not at all. Directional estimates labeled directional, one record per real event, no synthetic data, and activity never converted into claimed outcomes.',
        'A measurement system that flatters its owner is a liability wearing a dashboard. The numbers on mine are public at dashboard.gregjones.io, and they are labeled directional rather than audited, because that is what they are.',
      ],
    },
    {
      q: 'What kind of founders should reach out?',
      match: ['should i reach out', 'work with you', 'who should reach', 'pitch you', 'send you a deck', 'raise', 'fundraising', 'investment'],
      a: [
        'The writing is the front door, not the inbox. If you are early, technical, and obsessed with systems that compound, the door is open at admin@gregjones.io.',
        'Three sentences on what you are building and what is hard about it is plenty. Replies are not guaranteed and are never fast.',
      ],
    },
  ],

  /**
   * Returned when nothing scores. This is a handoff, not a refusal: the
   * matcher re-renders the suggestion chips underneath it so the visitor
   * always has a next move.
   */
  fallback: [
    'I have not written an answer for that one.',
    'I can cover my background, how the operation runs, automation and AI, capital allocation, operating principles, and what I am building. Anything else is better answered directly: admin@gregjones.io.',
  ],
};
