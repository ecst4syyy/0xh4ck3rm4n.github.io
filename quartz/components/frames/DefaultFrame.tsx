import { createHash } from "crypto"
import { JSX } from "preact"
import { PageFrame, PageFrameProps } from "./types"
import { QuartzPluginData } from "../../plugins/vfile"

/**
 * Site identity - edit these to match your own branding.
 */
const SITE = {
  github: "https://github.com/0xh4ck3rm4n/blog",
  email: "ecstasyy@v1olet.xyz",
  socials: [
    { name: "GitHub", url: "https://github.com/0xh4ck3rm4n/blog" },
    { name: "LinkedIn", url: "https://linkedin.com/in/ecstasyy" },
    { name: "X", url: "https://x.com/esctasyxo" },
    {
      name: "Discord",
      url: "https://discord.com/users/mcdonaldsandwich",
      username: "mcdonaldsandwich",
    },
  ],
  alias: "ecst4sy",
  currentlyLine: "currently: breaking things @ Softwarica College",
  aboutBio:
    "I like taking systems apart to see why they break. Digital forensics, reverse engineering, and binary exploitation get most of my attention: reconstructing an incident from a packet capture, tracing a corrupted artifact back to what actually happened, or finding the one bug in a binary that turns into a working exploit. Cybersecurity student, CNSP-certified, and competing with team v1olet across HTB, BrunnerCTF, and independent CTFs.",
  quote: "Giving up is not in the blood, sir. — Nims Dai Purja",
  ctfLog: [
    {
      event: "Netanix CTF",
      team: "solo",
      result: "Rank #5 · 46,959 pts",
      live: true,
    },
    {
      event: "BrunnerCTF 2026",
      team: "v1olet",
      result: "2nd / 1,103 teams",
      live: false,
    },
    { event: "0xV01D CTF", team: "v1olet", result: "2nd place", live: false },
    {
      event: "Cyber Apocalypse CTF 2026 (HTB)",
      team: "v1olet",
      result: "Team rank #105 · 136/136 solved",
      live: false,
    },
    {
      event: "Athena CTF 2026",
      team: "solo",
      result: "Rank #39 · 24-hour jeopardy",
      live: false,
    },
  ],
  techniques: [
    "OWASP Top 10",
    "Penetration Testing",
    "Network Security",
    "Web Application Security",
    "Red Teaming",
    "Binary Exploitation (PWN)",
    "Reverse Engineering",
    "Digital Forensics",
    "Cryptography",
    "Incident Response",
    "Solidity",
    "Foundry",
    "Python",
    "Machine Learning",
  ],
  bootLines: [
    "SIGNAL 98 (c) ecst4sy systems",
    "Verifying DMI pool data........ OK",
    "Loading profile: ESCT4SY.SYS",
    "Mounting ~/writeups as D:",
    "Starting SIGNAL 98...",
  ],
  todoItems: [
    { text: "Solve today's pwn warmup before lunch", done: false },
    { text: "Rotate HTB VPN + lab credentials", done: true },
    { text: "Review PR: auth middleware rate-limiting", done: false },
    { text: "Write up Fireflow (Langflow RCE) properly", done: false },
    { text: "Reply to v1olet re: BrunnerCTF finals prep", done: false },
  ],
  needOptions: ["Web penetration testing", "Mobile penetration testing", "Hire me as a CTF player"],
  budgetOptions: ["< $500", "$500 - $2,000", "$2,000 - $5,000", "Let's talk"],
}

/**
 * WHOIS Lookup app: URL of the Cloudflare Worker that proxies WhoisJSON.
 * The worker holds the API key as a private secret so it never ships in
 * this site's client-side JS. Deploy it first (see
 * cloudflare-worker/whois-proxy/README.md), then paste its URL here.
 * TODO: set after `wrangler deploy`
 */
const WHOIS_PROXY_URL = "https://whois-proxy.ecst4sy.workers.dev"

interface MusicTrack {
  title: string
  artist: string
  src: string
  /** Shown before the track loads, so the player needn't probe every mp3 on page load */
  duration: string
}

const MUSIC_TRACKS: MusicTrack[] = [
  {
    title: "All I Want is You",
    artist: "Miguel",
    src: "/static/music/01-all-i-want-is-you.mp3",
    duration: "4:27",
  },
  {
    title: "Weird Fishes / Arpeggi",
    artist: "Radiohead",
    src: "/static/music/02-weird-fishes-arpeggi.mp3",
    duration: "5:17",
  },
  {
    title: "The Less I Know The Better",
    artist: "Tame Impala",
    src: "/static/music/03-the-less-i-know-the-better.mp3",
    duration: "3:37",
  },
  {
    title: "Softcore",
    artist: "The Neighbourhood",
    src: "/static/music/04-softcore.mp3",
    duration: "3:30",
  },
  {
    title: "Sex, Drugs, Etc.",
    artist: "Beach Weather",
    src: "/static/music/05-sex-drugs-etc.mp3",
    duration: "3:28",
  },
]

/**
 * Hidden-flag hunt. Only SHA-256 hashes of the flags ship to Flags.exe; each
 * flag's plaintext lives solely in its hiding spot (see `hiddenIn`). Flags
 * that live inside the apps script are reversed + base64'd so a plain grep of
 * the bundle doesn't give them away. Reading the JS is still a fair solve.
 */
interface HiddenFlag {
  id: string
  title: string
  hint: string
  flag: string
  /** Where it's planted, for your own reference */
  hiddenIn: string
}

const FLAGS: HiddenFlag[] = [
  {
    id: "source",
    title: "View Source",
    hint: "Real hackers read the page source of this desktop.",
    flag: "ecst4sy{v13w_s0urc3_1s_4_sup3rp0w3r}",
    hiddenIn: "HTML comment in the desktop markup",
  },
  {
    id: "console",
    title: "Dev Notes",
    hint: "Developers leave notes for developers. Open DevTools.",
    flag: "ecst4sy{c0ns0l3_c0wb0y}",
    hiddenIn: "console.log, base64-encoded",
  },
  {
    id: "cookie",
    title: "Cookie Jar",
    hint: "Something sweet is stored in your browser. It's been rotated by 13.",
    flag: "ecst4sy{c00k13_m0nst3r}",
    hiddenIn: "secret_recipe cookie, ROT13",
  },
  {
    id: "sticky",
    title: "Invisible Ink",
    hint: "Not everything on today's to-do list is visible. Try selecting it.",
    flag: "ecst4sy{1nv1s1bl3_1nk}",
    hiddenIn: "yellow-on-yellow line on the sticky note",
  },
  {
    id: "recycle",
    title: "Trash Diving",
    hint: "Someone deleted their passwords file. Stored 'securely', in hex.",
    flag: "ecst4sy{tr4sh_d1v1ng_pr0}",
    hiddenIn: "Recycle Bin > passwords.txt, hex-encoded",
  },
  {
    id: "terminal",
    title: "Dotfiles",
    hint: "The Terminal hides files that start with a dot.",
    flag: "ecst4sy{l5_-l4_r3v34ls_4ll}",
    hiddenIn: "Terminal: cat ~/.secret",
  },
  {
    id: "mines",
    title: "Minesweeper",
    hint: "Clear the minefield. Every last safe square.",
    flag: "ecst4sy{sw33p_th3_m1n3s}",
    hiddenIn: "Minesweeper win message",
  },
  {
    id: "konami",
    title: "Cheat Code",
    hint: "↑ ↑ ↓ ↓ ← → ← → B A",
    flag: "ecst4sy{k0n4m1_cr4sh3d_th3_0s}",
    hiddenIn: "blue screen after the Konami code",
  },
]

function flagById(id: string): string {
  return FLAGS.find((f) => f.id === id)?.flag ?? ""
}
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex")
/** Inverse of decode() in webos-apps.inline.ts */
const encodePayload = (s: string) => Buffer.from(s.split("").reverse().join("")).toString("base64")

const RECYCLE_FILES = [
  {
    name: "passwords.txt",
    icon: "📄",
    content: [
      "# note to self: NEVER store passwords in plaintext",
      "# so I stored them in hex. totally secure.",
      "",
      "wifi:      hunter2",
      "htb vpn:   ********",
      "flag:      " + Buffer.from(flagById("recycle")).toString("hex"),
    ].join("\n"),
  },
  {
    name: "exploit_FINAL_v3.py",
    icon: "🐍",
    content: [
      "#!/usr/bin/env python3",
      "# v1: segfault",
      "# v2: segfault, but faster",
      "# v3: works locally. remote? segfault.",
      "from pwn import *",
      "",
      "payload = b'A' * 64 + p64(0xdeadbeef)  # TODO: find the real offset",
      "io = remote('challenge.ctf', 1337)",
      "io.sendline(payload)",
      "io.interactive()  # pray",
    ].join("\n"),
  },
  {
    name: "portfolio_v1.html",
    icon: "🌐",
    content: [
      "<html>",
      "<body bgcolor='black' text='lime'>",
      "<marquee>WELCOME 2 MY HOMEPAGE!!!</marquee>",
      "<img src='under_construction.gif'>",
      "<!-- TODO: make it look like windows 98 -->",
      "</body>",
      "</html>",
    ].join("\n"),
  },
  {
    name: "todo_2024.txt",
    icon: "📄",
    content: [
      "- learn assembly",
      "- learn assembly (for real this time)",
      "- stop opening 40 tabs of ghidra",
      "- write writeups instead of just solving stuff",
      "- touch grass",
    ].join("\n"),
  },
]

function wallpapers(basePath: string) {
  return [
    {
      id: "cats",
      name: "Lavender Cats",
      css: `url("${basePath}/static/wallpaper.png") center / cover no-repeat, #d9c4f5`,
    },
    { id: "teal", name: "Windows Teal", css: "#008080" },
    {
      id: "clouds",
      name: "Clouds",
      css:
        "radial-gradient(ellipse 22% 9% at 18% 22%, #fff 60%, transparent 62%)," +
        "radial-gradient(ellipse 16% 7% at 70% 30%, #fff 60%, transparent 62%)," +
        "radial-gradient(ellipse 26% 10% at 48% 70%, #fff 60%, transparent 62%)," +
        "linear-gradient(180deg, #3d7fd6, #a9cdf5)",
    },
    {
      id: "checker",
      name: "Lavender Checker",
      css: "repeating-conic-gradient(#e6d6fb 0 25%, #fbf7ff 0 50%) 0 0 / 56px 56px",
    },
    {
      id: "night",
      name: "Night Grid",
      css:
        "linear-gradient(rgba(143, 95, 232, 0.2) 1px, transparent 1px) 0 0 / 32px 32px," +
        "linear-gradient(90deg, rgba(143, 95, 232, 0.2) 1px, transparent 1px) 0 0 / 32px 32px," +
        "radial-gradient(circle at 50% 40%, #2a1650, #07060c 70%)",
    },
  ]
}

interface DesktopApp {
  id: string
  icon: string
  label: string
}

/** Apps with a desktop icon, in icon order. Also drives the Start menu and taskbar. */
const APPS: DesktopApp[] = [
  { id: "about", icon: "📝", label: "About Me.txt" },
  { id: "ctfwriteups", icon: "🗂️", label: "CTF Writeups" },
  { id: "hireme", icon: "📇", label: "Hire Me" },
  { id: "resume", icon: "📄", label: "Resume / CV" },
  { id: "terminal", icon: "💻", label: "Terminal" },
  { id: "flags", icon: "🚩", label: "Flags.exe" },
  { id: "minesweeper", icon: "💣", label: "Minesweeper" },
  { id: "whois", icon: "🔎", label: "WHOIS" },
  { id: "paint", icon: "🎨", label: "Paint" },
  { id: "music", icon: "🎵", label: "Music Player" },
  { id: "wikipedia", icon: "📖", label: "Wikipedia" },
  { id: "recycle", icon: "🗑️", label: "Recycle Bin" },
]

/** Windows without a desktop icon that still get a taskbar button. */
const OTHER_WINDOWS: DesktopApp[] = [
  { id: "todo", icon: "🗒️", label: "Things to do today" },
  { id: "display", icon: "🖥️", label: "Display Properties" },
  { id: "viewer", icon: "📝", label: "Notepad" },
]

/** Site content the desktop apps script reads (terminal filesystem, flags, wallpapers). */
function WebOSData({ posts, basePath }: { posts: Post[]; basePath: string }) {
  const data = {
    alias: SITE.alias,
    name: "Gaurav Poudel",
    email: SITE.email,
    tagline: "cybersecurity student, CTF player (team v1olet), and builder",
    currently: SITE.currentlyLine,
    quote: SITE.quote,
    socials: SITE.socials.map((s) => ({ name: s.name, url: s.url })),
    ctfLog: SITE.ctfLog,
    techniques: SITE.techniques,
    basePath,
    posts: posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      difficulty: p.difficulty,
      event: p.event,
      date: p.date ? p.date.toISOString().slice(0, 10) : undefined,
      description: p.description,
      tags: p.tags.filter((t) => t !== "writeup"),
    })),
    flags: FLAGS.map((f) => ({ id: f.id, title: f.title, hint: f.hint, hash: sha256(f.flag) })),
    payloads: {
      console: encodePayload(flagById("console")),
      cookie: encodePayload(flagById("cookie")),
      terminal: encodePayload(flagById("terminal")),
      mines: encodePayload(flagById("mines")),
      konami: encodePayload(flagById("konami")),
    },
    recycle: RECYCLE_FILES,
    wallpapers: wallpapers(basePath),
  }
  // Escape "<" so content can never close the script tag early
  const json = JSON.stringify(data).replace(/</g, "\\u003c")
  return (
    <script type="application/json" id="webos-data" dangerouslySetInnerHTML={{ __html: json }} />
  )
}

function buildAboutText(): string {
  const ctfLines = SITE.ctfLog
    .map((row) => `- ${row.event} (${row.team}) - ${row.result}${row.live ? "  [LIVE]" : ""}`)
    .join("\n")
  return [
    "ABOUT ME",
    "========",
    "",
    `Hi, I'm Gaurav (${SITE.alias}) - cybersecurity student, CTF player, and builder.`,
    "",
    SITE.aboutBio,
    "",
    SITE.currentlyLine,
    "",
    "--------------------------------",
    "RECENT CTF RESULTS",
    "--------------------------------",
    ctfLines,
    "",
    "--------------------------------",
    "SKILLS",
    "--------------------------------",
    SITE.techniques.join(", "),
    "",
    `"${SITE.quote}"`,
  ].join("\n")
}

function resolveHref(basePath: string, href: string): string {
  if (href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return href
  return `${basePath}${href}`
}

function getDate(data: QuartzPluginData): Date | undefined {
  const type = data.defaultDateType as string | undefined
  if (!type) return undefined
  const dates = data.dates as Record<string, Date> | undefined
  return dates?.[type]
}

function fmtDate(d: Date | undefined): string {
  if (!d) return ""
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })
}

interface Post {
  slug: string
  title: string
  date?: Date
  description: string
  category: string
  difficulty?: string
  tags: string[]
  image?: string
  event?: string
}

function buildPosts(allFiles: QuartzPluginData[]): Post[] {
  return allFiles
    .filter((f) => {
      if (f.slug === "index" || f.slug === "404") return false
      const fm = (f.frontmatter ?? {}) as Record<string, unknown>
      const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : []
      return tags.includes("writeup")
    })
    .map((f) => {
      const fm = (f.frontmatter ?? {}) as Record<string, unknown>
      const slug = String(f.slug ?? "")
      const title = String(fm.title ?? f.title ?? slug.split("/").pop() ?? slug)
      const description = String(fm.description ?? f.description ?? "")
      const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : []
      const category = String(fm.category ?? slug.split("/")[0] ?? "notes")
      const difficulty = typeof fm.difficulty === "string" ? fm.difficulty : undefined
      const image = typeof fm.image === "string" ? fm.image : undefined
      const event = typeof fm.event === "string" ? fm.event : undefined
      return {
        slug,
        title,
        date: getDate(f),
        description,
        category: category.charAt(0).toUpperCase() + category.slice(1),
        difficulty,
        tags,
        image,
        event,
      }
    })
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
}

function filenameFor(post: Post): string {
  const year = post.date ? post.date.getFullYear() : new Date().getFullYear()
  const slug = (post.slug.split("/").pop() || post.slug).replace(/[^a-z0-9]+/gi, "_")
  const ext = post.category.toLowerCase().startsWith("writeup")
    ? "writeup"
    : post.category.toLowerCase()
  return `${year}_${slug}.${ext}`
}

const SearchIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
)

const FunnelIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
)

const UpIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <line x1="12" y1="19" x2="12" y2="6"></line>
    <polyline points="6 12 12 6 18 12"></polyline>
  </svg>
)

const CategoryIcons: Record<string, JSX.Element> = {
  web: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
    </svg>
  ),
  forensics: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="20" y1="20" x2="15.5" y2="15.5" />
    </svg>
  ),
  reversing: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </svg>
  ),
  network: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <circle cx="5" cy="6" r="2.2" />
      <circle cx="19" cy="6" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="M6.9 7.4 10.5 16M17.1 7.4 13.5 16M7.2 6h9.6" />
    </svg>
  ),
  malware: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2.2 2.2M16.8 16.8 19 19M5 19l2.2-2.2M16.8 7.2 19 5" />
    </svg>
  ),
  misc: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
  writeup: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <path d="M5 3h9l5 5v13H5z" />
      <path d="M14 3v5h5M8 13h8M8 17h8" />
    </svg>
  ),
}

function categoryIconFor(tags: string[]): JSX.Element {
  for (const t of tags) {
    const key = t.toLowerCase()
    if (key === "writeup") continue
    const icon = CategoryIcons[key]
    if (icon) return icon
  }
  return CategoryIcons.writeup
}

function SectionHeader({
  n,
  label,
  hint,
}: {
  n?: string
  label: string
  hint: JSX.Element | string
}) {
  return (
    <div class="section-header">
      {n ? <span class="section-header__n">{n}</span> : null}
      <span class="section-header__label">{label}</span>
      <span class="section-header__rule" aria-hidden="true"></span>
      <span class="section-header__hint">{hint}</span>
    </div>
  )
}

function ArchiveGrid({
  componentData,
  basePath,
}: {
  componentData: PageFrameProps["componentData"]
  basePath: string
}) {
  const posts = buildPosts(componentData.allFiles)
  // Every post here is tagged "writeup", so that tag can't narrow anything down
  const shownTags = (tags: string[]) => tags.filter((t) => t !== "writeup")
  const allTags = Array.from(new Set(posts.flatMap((p) => shownTags(p.tags)))).sort()
  const year = new Date().getFullYear()

  return (
    <section class="post-grid" id="field-notes">
      <div class="post-grid-head">
        <p class="post-grid-prompt">
          <span class="post-grid-prompt__sigil">$</span> ls ~/writeups
          <span class="post-grid-prompt__cursor" aria-hidden="true"></span>
        </p>
        <SectionHeader
          label="CTF Writeups"
          hint={
            <>
              <strong data-result-count="true">{posts.length}</strong> items
            </>
          }
        />
      </div>

      <div class="post-grid-tools">
        <label class="post-grid-search">
          <span class="post-grid-search__icon">{SearchIcon}</span>
          <span class="sr-only">Search</span>
          <input
            type="search"
            placeholder="Search writeups, blogs, notes…"
            autocomplete="off"
            data-filter-search="true"
          />
          <button
            type="button"
            class="post-grid-search__clear"
            data-clear-search="true"
            aria-label="Clear search"
            hidden
          >
            ×
          </button>
          <kbd>/</kbd>
        </label>
        <div class="post-grid-actions">
          <button type="button" class="tag-filter clear filter-clear" data-clear-all="true" hidden>
            Clear all filters
          </button>
          <button
            type="button"
            class="filter-toggle"
            data-toggle-tags="true"
            aria-expanded="false"
            aria-label="Toggle tags"
          >
            {FunnelIcon}
          </button>
        </div>
      </div>

      <div class="post-grid-filters">
        <div class="filter-tags" data-filter-tags="true">
          {allTags.map((tag) => (
            <button type="button" class="tag-filter" data-tag={tag} aria-pressed="false">
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <ul class="post-grid-list">
        {posts.map((post, i) => {
          const searchText = [
            post.title,
            post.category,
            post.description,
            post.slug,
            post.tags.join(" "),
            post.event ?? "",
          ]
            .join(" ")
            .toLowerCase()
          const sev = post.difficulty ? post.difficulty.toLowerCase() : ""
          const diff = sev ? ` post-card-diff--${sev}` : ""
          const caseId = String(i + 1).padStart(3, "0")
          return (
            <li
              class={`post-card${sev ? ` post-card--${sev}` : ""}`}
              data-tags={JSON.stringify(post.tags)}
              data-search={searchText}
              data-title={post.title}
              data-reveal-index={String(i % 6)}
            >
              <a class="post-card-link internal" href={`${basePath}/${post.slug}`}>
                <div class="post-card-media">
                  <span class="post-card-glyph" aria-hidden="true">
                    {categoryIconFor(post.tags)}
                  </span>
                  <span class="post-card-case-id">#{caseId}</span>
                  {post.difficulty ? (
                    <span class={`post-card-diff${diff}`}>{post.difficulty}</span>
                  ) : null}
                  {post.event ? <span class="post-card-event">{post.event}</span> : null}
                </div>
                <div class="post-card-body">
                  <p class="post-card-filename">{filenameFor(post)}</p>
                  <p class="post-card-meta">
                    <time datetime={post.date?.toISOString()}>{fmtDate(post.date)}</time>
                  </p>
                  <h3>
                    <span class="post-card-title__text" data-decrypt-hover={post.title}>
                      {post.title}
                    </span>
                  </h3>
                  <p class="post-card-sub">{post.category}</p>
                  {post.description ? (
                    <p class="post-card-description">{post.description}</p>
                  ) : null}
                  {shownTags(post.tags).length > 0 ? (
                    <ul class="post-card-tags">
                      {shownTags(post.tags).map((t) => (
                        <li>#{t}</li>
                      ))}
                    </ul>
                  ) : null}
                  <p class="post-card-cta">
                    Open <span class="post-card-cta__arrow">→</span>
                  </p>
                </div>
              </a>
            </li>
          )
        })}
      </ul>

      <p class="post-grid-empty" data-empty-state="true" role="status" hidden>
        No signal found. Try a broader search or clear the active tags.
      </p>

      <div class="post-grid-status">
        <span>{posts.length} objects</span>
        <span>(c) ecst4sy {year}</span>
      </div>
    </section>
  )
}

/**
 * Every window's titlebar: icon + title + collapse, maximize and close controls.
 * closeHref makes close a real link (used on content pages); omit it for desktop apps,
 * which close via the window manager's data-win-close handler instead. Content pages
 * are already full-size, so they get no maximize control.
 */
function WinTitlebar({
  icon,
  title,
  closeHref,
  collapsible = true,
  maximizable = !closeHref,
}: {
  icon?: string
  title: string
  closeHref?: string
  collapsible?: boolean
  maximizable?: boolean
}) {
  return (
    <div class="win98-titlebar" data-drag-handle="true">
      {icon ? (
        <span class="win98-titlebar__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span class="win98-titlebar__title" data-win-title="true">
        {title}
      </span>
      <div class="win98-titlebar__controls">
        {collapsible ? (
          <button type="button" class="win98-btn" data-win-collapse="true" aria-label="Collapse">
            ▾
          </button>
        ) : null}
        {maximizable ? (
          <button type="button" class="win98-btn" data-win-maximize="true" aria-label="Maximize">
            □
          </button>
        ) : null}
        {closeHref ? (
          <a
            class="win98-btn win98-btn--close"
            href={closeHref}
            aria-label="Close"
            title="Back to desktop"
          >
            ×
          </a>
        ) : (
          <button
            type="button"
            class="win98-btn win98-btn--close"
            data-win-close="true"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

const PortalScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `(function () {
  var on = function (el, evt, fn, opts) {
    el.addEventListener(evt, fn, opts);
    if (typeof window.addCleanup === "function")
      window.addCleanup(function () { el.removeEventListener(evt, fn, opts); });
  };

  var SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890!<>-_\\/[]{}=+*^?#$%&";
  function scramble(el, final, frameMs) {
    if (el.__scrambleTimer) clearInterval(el.__scrambleTimer);
    var frame = 0;
    var totalFrames = Math.max(10, final.length * 2.4);
    el.__scrambleTimer = setInterval(function () {
      var revealCount = Math.floor((frame / totalFrames) * final.length);
      var out = "";
      for (var i = 0; i < final.length; i++) {
        if (final[i] === " ") { out += " "; continue; }
        out += i < revealCount ? final[i] : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
      }
      el.textContent = out;
      frame++;
      if (revealCount >= final.length) {
        clearInterval(el.__scrambleTimer);
        el.__scrambleTimer = null;
        el.textContent = final;
      }
    }, frameMs || 32);
  }

  function initGrid() {
    var o = document.getElementById("field-notes");
    if (!o || o.dataset.enhanced === "true") return;
    o.dataset.enhanced = "true";
    var cards = Array.prototype.slice.call(o.querySelectorAll("[data-tags]"));
    var tagBtns = Array.prototype.slice.call(o.querySelectorAll("[data-tag]"));
    var searchInput = o.querySelector("[data-filter-search]");
    var clearSearch = o.querySelector("[data-clear-search]");
    var clearAll = o.querySelector("[data-clear-all]");
    var resultCount = o.querySelector("[data-result-count]");
    var emptyState = o.querySelector("[data-empty-state]");
    var toggleTags = o.querySelector("[data-toggle-tags]");
    var tagWrap = o.querySelector("[data-filter-tags]");
    var active = new Set();
    var q = "";
    function tagsOf(el) {
      try { var p = JSON.parse(el.getAttribute("data-tags")); return Array.isArray(p) ? p : []; }
      catch (e) { return []; }
    }
    function matches(el) {
      var tags = tagsOf(el);
      var okTags = active.size === 0 || Array.prototype.every.call(active, function (t) { return tags.indexOf(t) !== -1; });
      var t = q.trim().toLowerCase();
      var okQ = !t ||
        (el.getAttribute("data-search") || "").toLowerCase().indexOf(t) !== -1 ||
        (el.getAttribute("data-title") || "").toLowerCase().indexOf(t) !== -1;
      return okTags && okQ;
    }
    function apply() {
      var n = 0;
      cards.forEach(function (el) {
        var m = matches(el);
        if (m) n++;
        el.classList.toggle("is-hidden", !m);
      });
      if (resultCount) resultCount.textContent = String(n);
      if (emptyState) emptyState.hidden = n !== 0;
      if (clearAll) clearAll.hidden = active.size === 0 && !q.trim();
      tagBtns.forEach(function (b) {
        var t = b.getAttribute("data-tag");
        var isOn = active.has(t);
        b.setAttribute("aria-pressed", isOn ? "true" : "false");
        b.classList.toggle("active", isOn);
      });
    }
    if (searchInput) {
      on(searchInput, "input", function () {
        q = searchInput.value;
        if (clearSearch) clearSearch.hidden = !searchInput.value;
        apply();
      });
      if (clearSearch) on(clearSearch, "click", function () {
        searchInput.value = ""; q = ""; clearSearch.hidden = true; apply(); searchInput.focus();
      });
      // "/" focuses search whenever the writeups grid is visible, as the <kbd> hint promises
      on(document, "keydown", function (e) {
        if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
        var t = e.target;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        if (!o.offsetParent) return;
        e.preventDefault();
        searchInput.focus();
      });
    }
    tagBtns.forEach(function (b) {
      var t = b.getAttribute("data-tag");
      on(b, "click", function (e) {
        e.preventDefault();
        if (active.has(t)) active.delete(t); else active.add(t);
        apply();
      });
    });
    if (clearAll) on(clearAll, "click", function () {
      active.clear(); q = ""; if (searchInput) searchInput.value = ""; apply();
    });
    if (toggleTags && tagWrap) {
      var collapsed = false;
      on(toggleTags, "click", function () {
        collapsed = !collapsed;
        tagWrap.classList.toggle("is-collapsed", collapsed);
        toggleTags.setAttribute("aria-expanded", String(!collapsed));
        toggleTags.classList.toggle("active", !collapsed);
      });
    }
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) {
      Array.prototype.forEach.call(o.querySelectorAll("[data-decrypt-hover]"), function (el) {
        on(el, "mouseenter", function () {
          scramble(el, el.getAttribute("data-decrypt-hover") || el.textContent, 26);
        });
      });
    }
    apply();
  }

  function initProgress() {
    var bar = document.querySelector("[data-reading-bar]");
    var top = document.querySelector("[data-back-to-top]");
    if (!bar && !top) return;
    function onScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (h.scrollTop / max) * 100 : 0;
      if (bar) bar.style.width = p + "%";
      if (top) top.hidden = h.scrollTop < 400;
    }
    on(window, "scroll", onScroll, { passive: true });
    onScroll();
    if (top) on(top, "click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  function initBoot() {
    var el = document.querySelector("[data-boot]");
    if (!el) return;
    if (window.__signalBooted) { el.remove(); return; }
    window.__signalBooted = true;
    var already = false;
    try { already = sessionStorage.getItem("signal-booted") === "1"; } catch (e) {}
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (already || reduced) { el.remove(); return; }
    try { sessionStorage.setItem("signal-booted", "1"); } catch (e) {}
    el.classList.add("is-active");
    var lines = Array.prototype.slice.call(el.querySelectorAll("[data-boot-line]"));
    var i = 0;
    function finish() {
      document.removeEventListener("keydown", skip);
      document.removeEventListener("click", skip);
      el.classList.add("is-done");
      setTimeout(function () { el.remove(); }, 420);
    }
    function skip() { finish(); }
    function showNext() {
      if (i >= lines.length) { setTimeout(finish, 420); return; }
      lines[i].classList.add("is-visible");
      i++;
      setTimeout(showNext, 240);
    }
    document.addEventListener("keydown", skip, { once: true });
    document.addEventListener("click", skip, { once: true });
    setTimeout(showNext, 260);
  }

  function initClock() {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-hud-clock]"));
    if (!els.length || window.__signalClockBound) return;
    window.__signalClockBound = true;
    var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    function tick() {
      var d = new Date();
      var time24 = pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds());
      var h12 = d.getHours() % 12; if (h12 === 0) h12 = 12;
      var ampm = d.getHours() >= 12 ? "PM" : "AM";
      var timeLocal = h12 + ":" + pad(d.getMinutes()) + " " + ampm;
      els.forEach(function (el) {
        var mode = el.getAttribute("data-hud-clock");
        if (mode === "full") {
          el.textContent = DAYS[d.getUTCDay()] + ", " + MONTHS[d.getUTCMonth()] + " " + d.getUTCDate() + " · " + time24 + " UTC";
        } else if (mode === "ampm") {
          el.textContent = timeLocal;
        } else {
          el.textContent = time24;
        }
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- WebOS window manager ---------- */
  function initWebOS() {
    var desktop = document.querySelector(".win98-desktop");
    if (!desktop || desktop.dataset.webosBound === "true") return;
    desktop.dataset.webosBound = "true";

    var taskbarApps = document.querySelector("[data-taskbar-apps]");
    var zTop = 100;
    var activeWin = null;
    var winRegistry = {};

    function clamp(n, min, max) { return Math.min(Math.max(n, min), max); }
    function isMobile() { return window.matchMedia("(max-width: 640px)").matches; }
    function taskbarHeight() {
      var tb = document.querySelector(".win98-taskbar");
      return tb ? tb.offsetHeight : 34;
    }

    // Window positions are authored for a ~1440x900 screen. Pull any window
    // that would spill past the viewport (or under the taskbar) back on-screen,
    // shrinking it if the viewport is smaller than the window itself.
    function fitWindow(el) {
      if (isMobile() || el.classList.contains("is-maximized")) return;
      var dRect = desktop.getBoundingClientRect();
      var maxW = dRect.width - 16, maxH = dRect.height - taskbarHeight() - 16;
      var w = Math.min(el.offsetWidth, maxW), h = Math.min(el.offsetHeight, maxH);
      var r = el.getBoundingClientRect();
      var left = clamp(r.left - dRect.left, 8, Math.max(8, dRect.width - w - 8));
      var top = clamp(r.top - dRect.top, 8, Math.max(8, maxH + 8 - h));
      if (w !== el.offsetWidth) el.style.width = w + "px";
      if (h !== el.offsetHeight && !el.classList.contains("is-collapsed")) el.style.height = h + "px";
      el.style.right = "auto";
      el.style.left = left + "px";
      el.style.top = top + "px";
    }
    function fitAllWindows() {
      Object.keys(winRegistry).forEach(function (id) {
        if (!winRegistry[id].el.hidden) fitWindow(winRegistry[id].el);
      });
    }

    function toggleMaximize(el) {
      var maxing = !el.classList.contains("is-maximized");
      if (maxing) {
        el.dataset.prevGeom = JSON.stringify({ left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height });
        el.classList.remove("is-collapsed");
      } else if (el.dataset.prevGeom) {
        var g = JSON.parse(el.dataset.prevGeom);
        el.style.left = g.left; el.style.top = g.top; el.style.width = g.width; el.style.height = g.height;
      }
      el.classList.toggle("is-maximized", maxing);
      var btn = el.querySelector("[data-win-maximize]");
      if (btn) {
        btn.textContent = maxing ? "❐" : "□";
        btn.setAttribute("aria-label", maxing ? "Restore" : "Maximize");
      }
      saveState();
    }

    function updateTaskbarPressed() {
      Object.keys(winRegistry).forEach(function (id) {
        var rec = winRegistry[id];
        if (rec.taskbarBtn) rec.taskbarBtn.classList.toggle("is-pressed", id === activeWin);
      });
    }

    function focusWindow(id) {
      var rec = winRegistry[id];
      if (!rec || rec.el.hidden) return;
      zTop += 1;
      rec.el.style.zIndex = String(zTop);
      Array.prototype.forEach.call(desktop.querySelectorAll(".win98-window"), function (w) {
        w.classList.toggle("is-active", w === rec.el);
      });
      activeWin = id;
      updateTaskbarPressed();
    }

    function openWindow(id) {
      var rec = winRegistry[id];
      if (!rec) return;
      rec.el.hidden = false;
      rec.el.classList.remove("is-collapsed");
      if (rec.taskbarBtn) rec.taskbarBtn.hidden = false;
      fitWindow(rec.el);
      focusWindow(id);
      saveState();
    }

    function focusTopmostVisible() {
      var bestId = null, bestZ = -1;
      Object.keys(winRegistry).forEach(function (id) {
        var rec = winRegistry[id];
        if (rec.el.hidden) return;
        var z = parseInt(rec.el.style.zIndex, 10) || 0;
        if (z > bestZ) { bestZ = z; bestId = id; }
      });
      if (bestId) focusWindow(bestId);
    }

    function closeWindow(id) {
      var rec = winRegistry[id];
      if (!rec) return;
      rec.el.hidden = true;
      if (rec.taskbarBtn) rec.taskbarBtn.hidden = true;
      if (activeWin === id) { activeWin = null; focusTopmostVisible(); }
      updateTaskbarPressed();
      saveState();
    }

    // Remember which windows were open and where, so a returning visitor
    // finds the desktop the way they left it. Phones always start fresh.
    var STATE_KEY = "webos-state-v1";
    var restoring = false;
    function saveState() {
      if (restoring || isMobile()) return;
      var state = { open: [], geom: {} };
      Object.keys(winRegistry).forEach(function (id) {
        var el = winRegistry[id].el;
        if (!el.hidden) state.open.push(id);
        state.geom[id] = {
          left: el.style.left, top: el.style.top, right: el.style.right,
          width: el.style.width, height: el.style.height,
          max: el.classList.contains("is-maximized"),
        };
      });
      try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) {}
    }
    function restoreState() {
      if (isMobile()) return false;
      var state = null;
      try { state = JSON.parse(localStorage.getItem(STATE_KEY) || "null"); } catch (e) {}
      if (!state || !Array.isArray(state.open)) return false;
      restoring = true;
      Object.keys(winRegistry).forEach(function (id) {
        var el = winRegistry[id].el;
        var g = state.geom && state.geom[id];
        if (g) {
          ["left", "top", "right", "width", "height"].forEach(function (k) { if (g[k]) el.style[k] = g[k]; });
        }
        if (state.open.indexOf(id) !== -1) {
          el.hidden = false;
          if (g && g.max && !el.classList.contains("is-maximized")) toggleMaximize(el);
        } else {
          el.hidden = true;
        }
        if (winRegistry[id].taskbarBtn) winRegistry[id].taskbarBtn.hidden = el.hidden;
      });
      restoring = false;
      return true;
    }

    function makeDraggable(rec) {
      var handle = rec.el.querySelector("[data-drag-handle]");
      if (!handle) return;
      var dragging = false, offX = 0, offY = 0;
      on(handle, "pointerdown", function (e) {
        if (e.target.closest && e.target.closest("button")) return;
        focusWindow(rec.id);
        if (rec.el.classList.contains("is-maximized") || isMobile()) return;
        dragging = true;
        var r = rec.el.getBoundingClientRect();
        offX = e.clientX - r.left;
        offY = e.clientY - r.top;
        try { handle.setPointerCapture(e.pointerId); } catch (err) {}
        e.preventDefault();
      });
      on(handle, "pointermove", function (e) {
        if (!dragging) return;
        var dRect = desktop.getBoundingClientRect();
        var usableH = dRect.height - taskbarHeight();
        var w = rec.el.offsetWidth, h = rec.el.offsetHeight;
        var newLeft = clamp(e.clientX - dRect.left - offX, -w + 80, dRect.width - 80);
        var newTop = clamp(e.clientY - dRect.top - offY, 0, usableH - 26);
        var SNAP = 14;
        if (Math.abs(newLeft) < SNAP) newLeft = 0;
        if (Math.abs(newTop) < SNAP) newTop = 0;
        if (Math.abs(dRect.width - (newLeft + w)) < SNAP) newLeft = dRect.width - w;
        if (Math.abs(usableH - (newTop + h)) < SNAP) newTop = usableH - h;
        rec.el.style.right = "auto";
        rec.el.style.left = newLeft + "px";
        rec.el.style.top = newTop + "px";
      });
      function stop(e) {
        if (dragging) saveState();
        dragging = false;
        try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      on(handle, "pointerup", stop);
      on(handle, "pointercancel", stop);
    }

    function makeResizable(rec) {
      var handle = rec.el.querySelector("[data-resize-handle]");
      if (!handle) return;
      var resizing = false, startW = 0, startH = 0, startX = 0, startY = 0;
      on(handle, "pointerdown", function (e) {
        focusWindow(rec.id);
        if (rec.el.classList.contains("is-maximized")) return;
        resizing = true;
        startW = rec.el.offsetWidth; startH = rec.el.offsetHeight;
        startX = e.clientX; startY = e.clientY;
        try { handle.setPointerCapture(e.pointerId); } catch (err) {}
        e.preventDefault();
        e.stopPropagation();
      });
      on(handle, "pointermove", function (e) {
        if (!resizing) return;
        var w = Math.max(260, startW + (e.clientX - startX));
        var h = Math.max(180, startH + (e.clientY - startY));
        rec.el.style.width = w + "px";
        rec.el.style.height = h + "px";
      });
      function stop(e) {
        if (resizing) saveState();
        resizing = false;
        try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      on(handle, "pointerup", stop);
      on(handle, "pointercancel", stop);
    }

    function registerWindow(el) {
      var id = el.getAttribute("data-window");
      var rec = { id: id, el: el, taskbarBtn: null };
      winRegistry[id] = rec;

      var closeBtn = el.querySelector("[data-win-close]");
      if (closeBtn) on(closeBtn, "click", function (e) { e.stopPropagation(); closeWindow(id); });
      on(el, "pointerdown", function () { if (!rec.el.hidden) focusWindow(id); });

      var maxBtn = el.querySelector("[data-win-maximize]");
      if (maxBtn) {
        on(maxBtn, "click", function (e) { e.stopPropagation(); toggleMaximize(el); });
        var titlebar = el.querySelector("[data-drag-handle]");
        if (titlebar) on(titlebar, "dblclick", function (e) {
          if (e.target.closest && e.target.closest("button")) return;
          toggleMaximize(el);
        });
      }

      makeDraggable(rec);
      makeResizable(rec);

      var taskbarBtn = taskbarApps ? taskbarApps.querySelector('[data-taskbar-btn="' + id + '"]') : null;
      if (taskbarBtn) {
        rec.taskbarBtn = taskbarBtn;
        taskbarBtn.hidden = el.hidden;
        on(taskbarBtn, "click", function () {
          if (rec.el.hidden) { openWindow(id); return; }
          if (activeWin === id) { rec.el.classList.toggle("is-collapsed"); return; }
          rec.el.classList.remove("is-collapsed");
          focusWindow(id);
        });
      }
      return rec;
    }

    Array.prototype.forEach.call(desktop.querySelectorAll(".win98-window[data-window]"), function (el) {
      registerWindow(el);
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-win-close-target]"), function (btn) {
      on(btn, "click", function (e) {
        e.preventDefault();
        closeWindow(btn.getAttribute("data-win-close-target"));
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-win-collapse]"), function (btn) {
      on(btn, "click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var win = btn.closest(".win98-window");
        if (!win) return;
        var collapsing = !win.classList.contains("is-collapsed");
        win.classList.toggle("is-collapsed", collapsing);
        if (collapsing) {
          win.dataset.prevHeight = win.style.height || "";
          win.style.height = "";
        } else if (win.dataset.prevHeight) {
          win.style.height = win.dataset.prevHeight;
        }
        saveState();
      });
    });

    var defaultOpenId = desktop.getAttribute("data-default-open");
    var restored = restoreState();
    // On a phone every window is full-screen, so opening several at once just
    // stacks them. Start with only the default window there.
    if (isMobile()) {
      Object.keys(winRegistry).forEach(function (id) {
        if (id !== defaultOpenId) closeWindow(id);
      });
    }
    fitAllWindows();
    if (restored) focusTopmostVisible();
    else if (defaultOpenId && winRegistry[defaultOpenId]) focusWindow(defaultOpenId);

    // Small API for the desktop apps script (terminal, context menu, etc.)
    window.__webos = {
      open: openWindow,
      close: closeWindow,
      isOpen: function (id) { return !!winRegistry[id] && !winRegistry[id].el.hidden; },
      resetLayout: function () {
        try { localStorage.removeItem(STATE_KEY); } catch (e) {}
        window.location.reload();
      },
    };

    var resizeTimer = null;
    on(window, "resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fitAllWindows, 120);
    }, { passive: true });

    // Desktop icon select / open. Mouse users double-click like the real
    // thing; touch and keyboard (Enter/Space, which fire click with detail 0)
    // open on a single activation since double-tap is unreliable on phones.
    var coarse = window.matchMedia("(pointer: coarse)").matches;
    var iconSelected = null;
    Array.prototype.forEach.call(desktop.querySelectorAll("[data-icon]"), function (icon) {
      on(icon, "click", function (e) {
        e.stopPropagation();
        if (iconSelected) iconSelected.classList.remove("is-selected");
        icon.classList.add("is-selected");
        iconSelected = icon;
        if (coarse || e.detail === 0) {
          var id = icon.getAttribute("data-open-window");
          if (id) openWindow(id);
        }
      });
      on(icon, "dblclick", function (e) {
        e.preventDefault();
        var id = icon.getAttribute("data-open-window");
        if (id) openWindow(id);
      });
    });
    on(desktop, "click", function (e) {
      if (e.target === desktop || e.target.classList.contains("win98-icons")) {
        if (iconSelected) { iconSelected.classList.remove("is-selected"); iconSelected = null; }
      }
    });

    // Start menu
    var startBtn = document.querySelector("[data-start-toggle]");
    var startMenu = document.querySelector("[data-start-menu]");
    if (startBtn && startMenu) {
      on(startBtn, "click", function (e) {
        e.stopPropagation();
        var willOpen = startMenu.hidden;
        startMenu.hidden = !willOpen;
        startBtn.classList.toggle("is-pressed", willOpen);
      });
      Array.prototype.forEach.call(startMenu.querySelectorAll(".win98-startmenu__item"), function (item) {
        on(item, "click", function () {
          var target = item.getAttribute("data-open-window");
          if (target) openWindow(target);
          startMenu.hidden = true;
          startBtn.classList.remove("is-pressed");
        });
      });
      on(document, "click", function (e) {
        if (!startMenu.hidden && !startMenu.contains(e.target) && e.target !== startBtn) {
          startMenu.hidden = true;
          startBtn.classList.remove("is-pressed");
        }
      });
      on(document, "keydown", function (e) {
        if (e.key === "Escape" && !startMenu.hidden) {
          startMenu.hidden = true;
          startBtn.classList.remove("is-pressed");
          startBtn.focus();
        }
      });
    }

    // Any element (e.g. a file icon inside a folder window) that should just
    // open/focus an already-registered window on click.
    Array.prototype.forEach.call(document.querySelectorAll("[data-quick-open]"), function (btn) {
      on(btn, "click", function () {
        openWindow(btn.getAttribute("data-quick-open"));
      });
    });
  }

  /* ---------- Resume / CV: pulls the real /about page content, no iframe ---------- */
  function initResumeViewer() {
    var mount = document.querySelector("[data-resume-mount]");
    if (!mount || mount.dataset.loaded === "true") return;
    mount.dataset.loaded = "true";
    var url = mount.getAttribute("data-resume-mount");
    fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var src = doc.querySelector(".win98-window--page .win98-body");
        if (src) {
          mount.innerHTML = src.innerHTML;
        } else {
          mount.textContent = "Couldn't load résumé content.";
        }
      })
      .catch(function () {
        mount.textContent = "Couldn't load résumé content.";
      });
  }

  /* ---------- Music Player ---------- */
  function initMusicPlayer() {
    var list = document.querySelector("[data-music-list]");
    var audio = document.querySelector("[data-music-audio]");
    if (!list || !audio || list.dataset.bound === "true") return;
    list.dataset.bound = "true";
    var rows = Array.prototype.slice.call(list.querySelectorAll("[data-music-row]"));
    var nowTrack = document.querySelector("[data-music-now-track]");
    var status = document.querySelector("[data-music-status]");
    var progress = document.querySelector("[data-music-progress]");
    var glyph = document.querySelector("[data-music-glyph]");
    var timeEl = document.querySelector("[data-music-time]");
    var seek = document.querySelector("[data-music-seek]");
    var toggleBtn = document.querySelector("[data-music-toggle]");
    var prevBtn = document.querySelector("[data-music-prev]");
    var nextBtn = document.querySelector("[data-music-next]");
    var current = -1;

    function pad(n) { return n < 10 ? "0" + n : String(n); }
    function fmtTime(sec) {
      if (!isFinite(sec) || sec < 0) return "--:--";
      var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
      return m + ":" + pad(s);
    }
    function setRowPlaying(idx, playing) {
      rows.forEach(function (r, i) {
        r.classList.toggle("is-current", i === idx);
        var playEl = r.querySelector("[data-music-play]");
        if (!playEl) return;
        playEl.textContent = i === idx && playing ? "❚❚" : "▶";
      });
      if (toggleBtn) {
        toggleBtn.textContent = playing ? "❚❚" : "▶";
        toggleBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
      }
    }
    function playRow(idx) {
      var row = rows[idx];
      if (!row) return;
      var src = row.getAttribute("data-music-src");
      if (current === idx && !audio.paused) {
        audio.pause();
        setRowPlaying(idx, false);
        if (status) status.textContent = "Paused";
        return;
      }
      if (current !== idx) {
        audio.src = src;
        current = idx;
      }
      var playPromise = audio.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {
          if (status) status.textContent = "Couldn't load audio — add the track to /static/music/";
        });
      }
      setRowPlaying(idx, true);
      if (nowTrack) nowTrack.textContent = row.querySelector(".win98-music-row__title").textContent + " — " + row.querySelector(".win98-music-row__artist").textContent;
      if (status) status.textContent = "Playing…";
      if (glyph) glyph.classList.add("is-spinning");
    }
    rows.forEach(function (row, idx) {
      on(row, "click", function () { playRow(idx); });
    });
    on(audio, "timeupdate", function () {
      var pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      if (progress) progress.style.width = pct + "%";
      if (seek) seek.setAttribute("aria-valuenow", String(Math.round(pct)));
      if (timeEl) timeEl.textContent = fmtTime(audio.currentTime) + " / " + fmtTime(audio.duration);
    });
    if (toggleBtn) on(toggleBtn, "click", function () { playRow(current < 0 ? 0 : current); });
    if (prevBtn) on(prevBtn, "click", function () {
      // Like most players: restart the track if we're a few seconds in, else go back one
      if (current >= 0 && audio.currentTime > 3) { audio.currentTime = 0; return; }
      playRow(current <= 0 ? rows.length - 1 : current - 1);
    });
    if (nextBtn) on(nextBtn, "click", function () {
      playRow(current + 1 < rows.length ? current + 1 : 0);
    });
    if (seek) {
      on(seek, "click", function (e) {
        if (!audio.duration) return;
        var r = seek.getBoundingClientRect();
        audio.currentTime = clampPct((e.clientX - r.left) / r.width) * audio.duration;
      });
      on(seek, "keydown", function (e) {
        if (!audio.duration) return;
        if (e.key === "ArrowRight") audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
        else if (e.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 5);
        else return;
        e.preventDefault();
      });
    }
    function clampPct(p) { return Math.min(Math.max(p, 0), 1); }
    on(audio, "ended", function () {
      setRowPlaying(current, false);
      if (progress) progress.style.width = "0%";
      var next = current + 1 < rows.length ? current + 1 : 0;
      playRow(next);
    });
    on(audio, "error", function () {
      if (status) status.textContent = "Audio file not found — drop your mp3s in /static/music/";
      if (glyph) glyph.classList.remove("is-spinning");
      setRowPlaying(current, false);
    });
    on(audio, "pause", function () {
      if (glyph) glyph.classList.remove("is-spinning");
    });
    on(audio, "play", function () {
      if (glyph) glyph.classList.add("is-spinning");
    });
  }

  /* ---------- Paint ---------- */
  function initPaint() {
    var canvas = document.querySelector("[data-paint-canvas]");
    if (!canvas || canvas.dataset.bound === "true") return;
    canvas.dataset.bound = "true";
    var ctx = canvas.getContext("2d");
    var win = canvas.closest(".win98-window");
    var color = "#000000";
    var size = 4;
    var tool = "brush";
    var drawing = false;
    var last = null;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var img = null;
      if (canvas.width > 0 && canvas.height > 0) {
        try { img = ctx.getImageData(0, 0, canvas.width, canvas.height); } catch (e) {}
      }
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, rect.height);
      if (img) { try { ctx.putImageData(img, 0, 0); } catch (e) {} }
    }
    resize();
    on(window, "resize", resize, { passive: true });
    if (win) {
      var ro = new ResizeObserver(function () { resize(); });
      ro.observe(canvas);
    }

    function pos(e) {
      var rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function startDraw(e) {
      drawing = true;
      last = pos(e);
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    }
    function draw(e) {
      if (!drawing) return;
      var p = pos(e);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = size;
      ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
    }
    function endDraw(e) {
      drawing = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    on(canvas, "pointerdown", startDraw);
    on(canvas, "pointermove", draw);
    on(canvas, "pointerup", endDraw);
    on(canvas, "pointercancel", endDraw);

    var paintRoot = canvas.closest(".win98-window");
    if (!paintRoot) return;
    Array.prototype.forEach.call(paintRoot.querySelectorAll("[data-paint-color]"), function (btn) {
      on(btn, "click", function () {
        color = btn.getAttribute("data-paint-color");
        tool = "brush";
        Array.prototype.forEach.call(paintRoot.querySelectorAll("[data-paint-color]"), function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        Array.prototype.forEach.call(paintRoot.querySelectorAll("[data-paint-tool]"), function (b) { b.classList.toggle("is-active", b.getAttribute("data-paint-tool") === "brush"); });
      });
    });
    Array.prototype.forEach.call(paintRoot.querySelectorAll("[data-paint-size]"), function (btn) {
      on(btn, "click", function () {
        size = parseInt(btn.getAttribute("data-paint-size"), 10) || 4;
        Array.prototype.forEach.call(paintRoot.querySelectorAll("[data-paint-size]"), function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
      });
    });
    Array.prototype.forEach.call(paintRoot.querySelectorAll("[data-paint-tool]"), function (btn) {
      on(btn, "click", function () {
        tool = btn.getAttribute("data-paint-tool");
        Array.prototype.forEach.call(paintRoot.querySelectorAll("[data-paint-tool]"), function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
      });
    });
    var clearBtn = paintRoot.querySelector("[data-paint-clear]");
    if (clearBtn) on(clearBtn, "click", function () {
      var rect = canvas.getBoundingClientRect();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, rect.height);
    });
  }

  /* ---------- Hire Me form (mailto fallback, no backend) ---------- */
  /* ---------- Hire Me form: sends through the Cloudflare Worker's /contact
     route, falling back to the visitor's mail app if that isn't reachable ---------- */
  function initHireMe() {
    var form = document.querySelector("[data-hireme-form]");
    if (!form || form.dataset.bound === "true") return;
    form.dataset.bound = "true";
    var hint = document.querySelector("[data-hireme-hint]");
    var sendBtn = form.querySelector('button[type="submit"]');
    function setHint(text, isError) {
      if (!hint) return;
      hint.textContent = text;
      hint.classList.toggle("is-error", !!isError);
    }
    on(form, "submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var payload = {
        name: (data.get("name") || "").toString().trim(),
        email: (data.get("email") || "").toString().trim(),
        need: (data.get("need") || "").toString(),
        budget: (data.get("budget") || "").toString(),
        message: (data.get("message") || "").toString().trim(),
        website: (data.get("website") || "").toString(), // honeypot
      };
      function mailtoFallback(reason) {
        var to = form.getAttribute("data-mailto") || "";
        var subject = encodeURIComponent("Project inquiry: " + (payload.need || "general"));
        var body = encodeURIComponent(
          "From: " + payload.name + " (" + payload.email + ")\\n" +
          "Need: " + payload.need + "\\n" +
          "Budget: " + payload.budget + "\\n\\n" +
          payload.message
        );
        setHint(reason + " Opening your mail app instead…", true);
        window.location.href = "mailto:" + to + "?subject=" + subject + "&body=" + body;
      }
      var url = form.getAttribute("data-contact-url");
      if (!url) { mailtoFallback(""); return; }
      if (sendBtn) sendBtn.disabled = true;
      setHint("Sending…");
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, data: d }; });
        })
        .then(function (res) {
          if (sendBtn) sendBtn.disabled = false;
          if (res.ok) {
            form.reset();
            setHint("Message sent! I'll get back to you at " + payload.email + ".");
          } else if (res.data && res.data.error && res.data.field) {
            setHint(res.data.error, true);
          } else {
            mailtoFallback("Couldn't send right now.");
          }
        })
        .catch(function () {
          if (sendBtn) sendBtn.disabled = false;
          mailtoFallback("Couldn't reach the server.");
        });
    });
  }


  /* ---------- WHOIS Lookup (proxied through a Cloudflare Worker) ---------- */
  function initWhois() {
    var root = document.querySelector('[data-window="whois"]');
    if (!root || root.dataset.whoisBound === "true") return;
    var input = root.querySelector("[data-whois-input]");
    var goBtn = root.querySelector("[data-whois-lookup]");
    var status = root.querySelector("[data-whois-status]");
    var result = root.querySelector("[data-whois-result]");
    if (!input || !goBtn || !status || !result) return;
    root.dataset.whoisBound = "true";

    var proxyUrl = root.getAttribute("data-whois-proxy") || "";

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }
    function row(label, value) {
      if (value === null || value === undefined || value === "") return "";
      return (
        '<div class="win98-whois-row"><span class="win98-whois-row__label">' +
        escapeHtml(label) +
        '</span><span class="win98-whois-row__value">' +
        escapeHtml(value) +
        "</span></div>"
      );
    }
    function isRedacted(s) {
      return typeof s === "string" && /redacted/i.test(s);
    }

    function renderResult(data) {
      var html = "";
      html += row("Domain", data.name);
      html += row("Registered", data.registered === false ? "No" : "Yes");
      if (data.registrar && data.registrar.name) html += row("Registrar", data.registrar.name);
      html += row("Created", data.created);
      html += row("Last Changed", data.changed);
      html += row("Expires", data.expires);
      if (data.age && typeof data.age.years === "number") {
        html += row("Domain Age", data.age.years + " years (" + data.age.days + " days)");
      }
      if (data.expiration) {
        if (data.expiration.isExpired) html += row("Expiry Status", "Expired");
        else if (typeof data.expiration.daysLeft === "number") {
          html += row(
            "Expiry Status",
            data.expiration.daysLeft + " days left" + (data.expiration.isExpiringSoon ? " (soon!)" : "")
          );
        }
      }
      if (Array.isArray(data.status) && data.status.length) html += row("Status", data.status.join(", "));
      if (Array.isArray(data.nameserver) && data.nameserver.length) {
        html += row("Name Servers", data.nameserver.join(", "));
      }
      if (data.dnssec) html += row("DNSSEC", data.dnssec);
      if (data.ips) html += row("IP Address", data.ips);
      var owner =
        data.contacts && Array.isArray(data.contacts.owner) ? data.contacts.owner[0] : null;
      if (owner) {
        if (owner.organization && !isRedacted(owner.organization)) {
          html += row("Registrant Org", owner.organization);
        }
        if (owner.country && !isRedacted(owner.country)) html += row("Registrant Country", owner.country);
      }
      if (!html) html = '<p class="win98-whois-status">No data returned for this domain.</p>';
      result.innerHTML = html;
    }

    function lookup() {
      var domain = (input.value || "").trim().toLowerCase();
      if (!domain) {
        status.hidden = false;
        status.textContent = "Enter a domain first.";
        result.hidden = true;
        return;
      }
      if (!proxyUrl) {
        status.hidden = false;
        status.textContent = "WHOIS proxy isn't configured yet — see cloudflare-worker/whois-proxy/README.md.";
        result.hidden = true;
        return;
      }
      status.hidden = false;
      status.textContent = "Looking up " + domain + "…";
      result.hidden = true;
      goBtn.disabled = true;
      fetch(proxyUrl + "?domain=" + encodeURIComponent(domain))
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, data: data };
          });
        })
        .then(function (res) {
          goBtn.disabled = false;
          if (!res.ok) {
            status.hidden = false;
            status.textContent = (res.data && res.data.error) || "Lookup failed.";
            result.hidden = true;
            return;
          }
          status.hidden = true;
          result.hidden = false;
          renderResult(res.data);
        })
        .catch(function () {
          goBtn.disabled = false;
          status.hidden = false;
          status.textContent = "Network error — couldn't reach the WHOIS proxy.";
          result.hidden = true;
        });
    }

    on(goBtn, "click", lookup);
    on(input, "keydown", function (e) {
      if (e.key === "Enter") lookup();
    });
  }

  function boot() {
    initGrid(); initProgress(); initBoot(); initClock(); initWebOS();
    initMusicPlayer(); initPaint(); initHireMe(); initResumeViewer(); initWhois();
  }
  boot();
  document.addEventListener("nav", boot);
})();`,
    }}
  />
)

const DefaultFrame: PageFrame = {
  name: "default",
  render({ componentData, beforeBody, pageBody: Content, afterBody }: PageFrameProps): JSX.Element {
    const cfg = componentData.cfg
    const basePath =
      componentData.ctx.argv.serve || !cfg.baseUrl
        ? ""
        : new URL(`https://${cfg.baseUrl}`).pathname.replace(/\/$/, "")
    const isHome = componentData.fileData.slug === "index"
    const wordmark = SITE.alias || "dojo"
    const posts = buildPosts(componentData.allFiles)

    const bootScreen = (
      <div class="boot-sequence" data-boot="true" aria-hidden="true">
        <div class="boot-sequence__inner">
          {SITE.bootLines.map((line, i) => (
            <p
              class={`boot-sequence__line${i === SITE.bootLines.length - 1 ? " boot-sequence__line--ok" : ""}`}
              data-boot-line="true"
            >
              &gt; {line}
            </p>
          ))}
        </div>
        <p class="boot-sequence__skip">press any key to skip</p>
      </div>
    )

    if (!isHome) {
      const title = (componentData.fileData.frontmatter?.title as string) ?? wordmark
      return (
        <>
          {bootScreen}
          <div class="win98-page-shell">
            <div class="win98-window win98-window--page is-active">
              <WinTitlebar icon="📝" title={`${title} - Notepad`} closeHref={`${basePath}/`} />
              <div class="win98-body">
                <div class="page-lead popover-hint">
                  {beforeBody.map((BodyComponent) => (
                    <BodyComponent {...componentData} />
                  ))}
                </div>
                {/* "center" is the hook Quartz plugins (e.g. Mermaid) query for the article */}
                <div class="page-content center">
                  <Content {...componentData} />
                </div>
                <div class="page-tail">
                  {afterBody.map((BodyComponent) => (
                    <BodyComponent {...componentData} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div class="win98-taskbar">
            <a class="win98-start" href={`${basePath}/`}>
              <span aria-hidden="true">🗔</span> Start
            </a>
            <div class="win98-taskbar__divider" aria-hidden="true"></div>
            <div class="win98-taskbar__apps">
              <button type="button" class="win98-taskbar__app is-pressed" disabled>
                📝 {title}
              </button>
            </div>
            <div class="win98-tray">
              <span data-hud-clock="ampm">--:-- --</span>
            </div>
          </div>

          <div class="reading-progress" aria-hidden="true">
            <span class="reading-progress__bar" data-reading-bar="true"></span>
          </div>
          <button
            type="button"
            class="back-to-top"
            data-back-to-top="true"
            aria-label="Back to top"
            title="Back to top"
            hidden
          >
            {UpIcon}
          </button>

          <WebOSData posts={posts} basePath={basePath} />
          <PortalScript />
        </>
      )
    }

    return (
      <>
        {bootScreen}

        {/* Quartz plugins (e.g. Mermaid) expect a ".center" article container on every page */}
        <div class="center" hidden></div>
        <div class="win98-desktop" data-default-open="about">
          {/* Flag hunt: the "source" flag, as an HTML comment for view-source hunters */}
          <div
            hidden
            dangerouslySetInnerHTML={{
              __html: `<!-- 🚩 nice, you read the source: ${flagById("source")} -->`,
            }}
          />
          <ul class="win98-icons" aria-label="Desktop icons">
            {APPS.map((app) => (
              <li>
                <button type="button" class="win98-icon" data-icon="true" data-open-window={app.id}>
                  <span class="win98-icon__glyph" aria-hidden="true">
                    {app.icon}
                  </span>
                  <span class="win98-icon__label">{app.label}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* About Me.txt — Notepad */}
          <div
            class="win98-window"
            data-window="about"
            style="right:60px;top:40px;width:460px;height:400px;"
          >
            <WinTitlebar icon="📝" title="About Me.txt - Notepad" />
            <div class="win98-menuline" aria-hidden="true">
              <span>File</span>
              <span>Edit</span>
              <span>Search</span>
              <span>Help</span>
            </div>
            <div class="win98-body">
              <pre>{buildAboutText()}</pre>
            </div>
            <div class="win98-resize-handle" data-resize-handle="true"></div>
          </div>

          {/* CTF Writeups — folder (real content) */}
          <div
            class="win98-window"
            data-window="ctfwriteups"
            hidden
            style="left:170px;top:50px;width:820px;height:560px;"
          >
            <WinTitlebar icon="🗂️" title="CTF Writeups" />
            <div class="win98-body win98-folder-body">
              <ArchiveGrid componentData={componentData} basePath={basePath} />
            </div>
            <div class="win98-resize-handle" data-resize-handle="true"></div>
          </div>

          {/* Hire Me — contact form */}
          <div
            class="win98-window win98-window--hireme"
            data-window="hireme"
            hidden
            style="left:540px;top:56px;width:420px;height:520px;"
          >
            <WinTitlebar icon="📇" title="Hire Me" />
            <div class="win98-body win98-hireme-body">
              <form
                class="hireme-form"
                data-hireme-form="true"
                data-mailto={SITE.email}
                data-contact-url={WHOIS_PROXY_URL ? `${WHOIS_PROXY_URL}/contact` : ""}
              >
                <div class="hireme-form__row hireme-form__row--send">
                  <div>
                    <span class="hireme-form__label">Email to</span>
                    <span class="hireme-form__static">{SITE.email}</span>
                  </div>
                  <button type="submit" class="hireme-send">
                    Send
                  </button>
                </div>
                <label class="hireme-field">
                  <span>
                    Your Name<em>*</em>
                  </span>
                  <input type="text" name="name" placeholder="Fill in your name" required />
                </label>
                <label class="hireme-field">
                  <span>
                    Your Email<em>*</em>
                  </span>
                  <input type="email" name="email" placeholder="Fill in your email" required />
                </label>
                <label class="hireme-field">
                  <span>
                    What do you need<em>*</em>
                  </span>
                  <select name="need" required>
                    <option value="" disabled selected>
                      Select…
                    </option>
                    {SITE.needOptions.map((opt) => (
                      <option value={opt}>{opt}</option>
                    ))}
                  </select>
                </label>
                <label class="hireme-field">
                  <span>
                    Budget<em>*</em>
                  </span>
                  <select name="budget" required>
                    <option value="" disabled selected>
                      Select…
                    </option>
                    {SITE.budgetOptions.map((opt) => (
                      <option value={opt}>{opt}</option>
                    ))}
                  </select>
                </label>
                {/* Honeypot: hidden from people, irresistible to bots */}
                <label class="hireme-honeypot" aria-hidden="true">
                  Website
                  <input type="text" name="website" tabindex={-1} autocomplete="off" />
                </label>
                <label class="hireme-field hireme-field--message">
                  <span>Message</span>
                  <textarea name="message" placeholder="Tell me about your project"></textarea>
                </label>
                <p class="hireme-form__hint" data-hireme-hint="true"></p>
              </form>
              <div class="hireme-socials">
                {SITE.socials.map((s) => (
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.name}
                  </a>
                ))}
              </div>
            </div>
            <div class="win98-resize-handle" data-resize-handle="true"></div>
          </div>

          {/* Things to do today — sticky note, open by default */}
          <div
            class="win98-window win98-window--sticky"
            data-window="todo"
            style="right:600px;top:70px;width:250px;height:280px;"
          >
            <WinTitlebar title="Things to do today" maximizable={false} />
            <div class="win98-sticky-body">
              <ul>
                {SITE.todoItems.map((item) => (
                  <li class={item.done ? "is-done" : ""}>- {item.text}</li>
                ))}
                <li class="is-invisible-ink">- {flagById("sticky")}</li>
              </ul>
            </div>
          </div>

          {/* Resume / CV — pulls the real /about content in directly, no iframe */}
          <div
            class="win98-window"
            data-window="resume"
            hidden
            style="left:230px;top:60px;width:640px;height:520px;"
          >
            <WinTitlebar icon="📄" title="Resume.pdf" />
            <div
              class="win98-body win98-resume-body"
              data-resume-mount={resolveHref(basePath, "/about")}
            >
              <p class="win98-loading">Loading résumé…</p>
            </div>
            <div class="win98-resize-handle" data-resize-handle="true"></div>
          </div>

          {/* Wikipedia */}
          <div
            class="win98-window"
            data-window="wikipedia"
            hidden
            style="left:280px;top:60px;width:680px;height:500px;"
          >
            <WinTitlebar icon="📖" title="Internet Explorer - Wikipedia" />
            <div class="win98-toolbar">
              <span class="win98-toolbar__address-label">Address</span>
              <div class="win98-toolbar__address">https://www.wikipedia.org/</div>
              <span class="win98-toolbar__go" aria-hidden="true">
                ➜ Go
              </span>
            </div>
            <div class="win98-body win98-ie-body">
              <iframe src="https://www.wikipedia.org/" title="Wikipedia" loading="lazy"></iframe>
            </div>
            <div class="win98-resize-handle" data-resize-handle="true"></div>
          </div>

          {/* WHOIS Lookup — proxied through a Cloudflare Worker so the API key never ships client-side */}
          <div
            class="win98-window"
            data-window="whois"
            data-whois-proxy={WHOIS_PROXY_URL}
            hidden
            style="right:120px;top:110px;width:440px;height:480px;"
          >
            <WinTitlebar icon="🔎" title="WHOIS Lookup" />
            <div class="win98-toolbar">
              <span class="win98-toolbar__address-label">Domain</span>
              <div class="win98-toolbar__address">
                <input
                  type="text"
                  class="win98-whois-input"
                  data-whois-input="true"
                  placeholder="example.com"
                  autocomplete="off"
                  spellcheck={false}
                />
              </div>
              <button type="button" class="win98-toolbar__go" data-whois-lookup="true">
                🔎 Lookup
              </button>
            </div>
            <div class="win98-body win98-whois-body">
              <p class="win98-whois-status" data-whois-status="true">
                Enter a domain and hit Lookup.
              </p>
              <div class="win98-whois-result" data-whois-result="true" hidden></div>
            </div>
            <div class="win98-resize-handle" data-resize-handle="true"></div>
          </div>

          {/* Paint */}
          <div
            class="win98-window"
            data-window="paint"
            hidden
            style="left:310px;top:90px;width:560px;height:440px;"
          >
            <WinTitlebar icon="🎨" title="untitled - Paint" />
            <div class="win98-paint-toolbar">
              <div class="win98-paint-tools">
                <button
                  type="button"
                  class="win98-paint-tool is-active"
                  data-paint-tool="brush"
                  title="Brush"
                >
                  🖌️
                </button>
                <button
                  type="button"
                  class="win98-paint-tool"
                  data-paint-tool="eraser"
                  title="Eraser"
                >
                  🧽
                </button>
                <button type="button" class="win98-paint-clear" data-paint-clear="true">
                  Clear
                </button>
              </div>
              <div class="win98-paint-sizes">
                {[2, 4, 8, 14].map((size) => (
                  <button
                    type="button"
                    class={`win98-paint-size${size === 4 ? " is-active" : ""}`}
                    data-paint-size={size}
                    aria-label={`Brush size ${size}`}
                  >
                    <span style={`width:${size}px;height:${size}px;`}></span>
                  </button>
                ))}
              </div>
            </div>
            <div class="win98-paint-body">
              <div class="win98-paint-palette">
                {[
                  "#000000",
                  "#808080",
                  "#800000",
                  "#808000",
                  "#008000",
                  "#008080",
                  "#000080",
                  "#800080",
                  "#ffffff",
                  "#c0c0c0",
                  "#ff0000",
                  "#ffff00",
                  "#00ff00",
                  "#00ffff",
                  "#0000ff",
                  "#ff00ff",
                ].map((color, i) => (
                  <button
                    type="button"
                    class={`win98-paint-color${i === 0 ? " is-active" : ""}`}
                    data-paint-color={color}
                    style={`background:${color};`}
                    aria-label={`Color ${color}`}
                  ></button>
                ))}
              </div>
              <canvas class="win98-paint-canvas" data-paint-canvas="true"></canvas>
            </div>
            <div class="win98-resize-handle" data-resize-handle="true"></div>
          </div>

          {/* Music Player — open by default */}
          <div
            class="win98-window win98-window--music"
            data-window="music"
            style="right:80px;top:470px;width:540px;height:320px;"
          >
            <WinTitlebar icon="🎵" title="Music Player" />
            <div class="win98-music-body">
              <ul class="win98-music-list" data-music-list="true">
                {MUSIC_TRACKS.map((t, i) => (
                  <li
                    class="win98-music-row"
                    data-music-row={i}
                    data-music-src={resolveHref(basePath, t.src)}
                  >
                    <span class="win98-music-row__play" data-music-play="true" aria-hidden="true">
                      ▶
                    </span>
                    <span class="win98-music-row__duration">{t.duration}</span>
                    <span class="win98-music-row__title">{t.title}</span>
                    <span class="win98-music-row__artist">{t.artist}</span>
                  </li>
                ))}
              </ul>
              <div class="win98-music-now">
                <span class="win98-music-now__glyph" aria-hidden="true" data-music-glyph="true">
                  ♪
                </span>
                <p class="win98-music-now__track" data-music-now-track="true">
                  Select a track
                </p>
                <div
                  class="win98-music-progress"
                  data-music-seek="true"
                  role="slider"
                  aria-label="Seek"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={0}
                  tabindex={0}
                >
                  <div class="win98-music-progress__bar" data-music-progress="true"></div>
                </div>
                <p class="win98-music-now__time" data-music-time="true">
                  0:00 / --:--
                </p>
                <div class="win98-music-controls">
                  <button
                    type="button"
                    class="win98-music-ctrl"
                    data-music-prev="true"
                    aria-label="Previous track"
                  >
                    ⏮
                  </button>
                  <button
                    type="button"
                    class="win98-music-ctrl win98-music-ctrl--main"
                    data-music-toggle="true"
                    aria-label="Play"
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    class="win98-music-ctrl"
                    data-music-next="true"
                    aria-label="Next track"
                  >
                    ⏭
                  </button>
                </div>
                <p class="win98-music-now__status" data-music-status="true"></p>
              </div>
            </div>
          </div>

          {/* Terminal */}
          <div
            class="win98-window win98-window--terminal"
            data-window="terminal"
            hidden
            style="left:250px;top:80px;width:620px;height:420px;"
          >
            <WinTitlebar icon="💻" title="Terminal - bash" />
            <div class="win98-term" data-term-screen="true">
              <div data-term-out="true"></div>
              <label class="win98-term__input-line">
                <span class="win98-term__prompt" data-term-prompt="true"></span>
                <input
                  type="text"
                  class="win98-term__input"
                  data-term-input="true"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck={false}
                  aria-label="Terminal command"
                />
              </label>
            </div>
            <div class="win98-resize-handle" data-resize-handle="true"></div>
          </div>

          {/* Flags.exe: the hidden-flag hunt scoreboard */}
          <div
            class="win98-window"
            data-window="flags"
            hidden
            style="left:380px;top:60px;width:460px;height:540px;"
          >
            <WinTitlebar icon="🚩" title="Flags.exe - Scoreboard" />
            <div class="win98-body win98-flags-body">
              <p class="win98-flags-intro">
                {FLAGS.length} flags are hidden around this site, in the format{" "}
                <code>ecst4sy{"{...}"}</code>. Find them and submit them here (or with{" "}
                <code>submit</code> in the Terminal).
              </p>
              <div class="win98-flags-progress" aria-hidden="true">
                <div class="win98-flags-progress__bar" data-flags-bar="true"></div>
              </div>
              <p class="win98-flags-count" data-flags-count="true">
                0 / {FLAGS.length}
              </p>
              <div class="win98-flags-submit">
                <input
                  type="text"
                  data-flags-input="true"
                  placeholder="ecst4sy{...}"
                  autocomplete="off"
                  spellcheck={false}
                  aria-label="Flag"
                />
                <button type="button" class="win98-button" data-flags-submit="true">
                  Submit
                </button>
              </div>
              <p class="win98-flags-status" data-flags-status="true" role="status"></p>
              <ol class="win98-flags-list" data-flags-list="true"></ol>
              <p class="win98-flags-done" data-flags-done="true" hidden>
                🏆 All flags captured! Screenshot this and tag me, I'd love to know.
              </p>
              <button type="button" class="win98-button win98-flags-reset" data-flags-reset="true">
                Reset progress
              </button>
            </div>
            <div class="win98-resize-handle" data-resize-handle="true"></div>
          </div>

          {/* Minesweeper */}
          <div
            class="win98-window win98-window--mines"
            data-window="minesweeper"
            hidden
            style="left:460px;top:100px;width:262px;height:400px;"
          >
            <WinTitlebar icon="💣" title="Minesweeper" maximizable={false} />
            <div class="win98-ms">
              <div class="win98-ms__head">
                <span class="win98-ms__lcd" data-ms-count="true" aria-label="Mines left">
                  010
                </span>
                <button
                  type="button"
                  class="win98-ms__face"
                  data-ms-face="true"
                  aria-label="New game"
                >
                  🙂
                </button>
                <span class="win98-ms__lcd" data-ms-time="true" aria-label="Seconds">
                  000
                </span>
              </div>
              <div class="win98-ms__board" data-ms-board="true" aria-label="Minefield"></div>
              <div class="win98-ms__foot">
                <button
                  type="button"
                  class="win98-button win98-ms__flagmode"
                  data-ms-flagmode="true"
                  aria-pressed="false"
                >
                  🚩 Flag mode
                </button>
                <span>or right-click</span>
              </div>
              <p class="win98-ms__msg" data-ms-msg="true" role="status" hidden></p>
            </div>
          </div>

          {/* Recycle Bin */}
          <div
            class="win98-window"
            data-window="recycle"
            hidden
            style="left:300px;top:130px;width:470px;height:320px;"
          >
            <WinTitlebar icon="🗑️" title="Recycle Bin" />
            <div class="win98-toolbar">
              <button type="button" class="win98-toolbar__go" data-recycle-empty="true">
                🗑️ Empty Recycle Bin
              </button>
            </div>
            <div class="win98-body win98-recycle-body">
              <ul class="win98-files">
                {RECYCLE_FILES.map((file, i) => (
                  <li>
                    <button type="button" class="win98-file" data-recycle-file={i}>
                      <span class="win98-file__icon" aria-hidden="true">
                        {file.icon}
                      </span>
                      <span class="win98-file__name">{file.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <p class="win98-statusbar" data-recycle-status="true" role="status">
              {RECYCLE_FILES.length} object(s). Double-click to open.
            </p>
            <div class="win98-resize-handle" data-resize-handle="true"></div>
          </div>

          {/* Notepad viewer for Recycle Bin files */}
          <div
            class="win98-window"
            data-window="viewer"
            hidden
            style="left:360px;top:160px;width:480px;height:330px;"
          >
            <WinTitlebar icon="📝" title="Notepad" />
            <div class="win98-menuline" aria-hidden="true">
              <span>File</span>
              <span>Edit</span>
              <span>Search</span>
              <span>Help</span>
            </div>
            <div class="win98-body">
              <pre data-viewer-body="true"></pre>
            </div>
            <div class="win98-resize-handle" data-resize-handle="true"></div>
          </div>

          {/* Display Properties: wallpaper + screensaver */}
          <div
            class="win98-window"
            data-window="display"
            hidden
            style="left:400px;top:60px;width:400px;height:560px;"
          >
            <WinTitlebar icon="🖥️" title="Display Properties" maximizable={false} />
            <div class="win98-dialog-body">
              <div class="win98-display-monitor" aria-hidden="true">
                <div class="win98-display-screen" data-display-preview="true"></div>
              </div>
              <fieldset class="win98-fieldset">
                <legend>Wallpaper</legend>
                <div class="win98-display-list" data-display-wallpapers="true"></div>
              </fieldset>
              <fieldset class="win98-fieldset">
                <legend>Screen Saver</legend>
                <div class="win98-display-row">
                  <select data-display-saver="true" aria-label="Screen saver">
                    <option value="starfield">Starfield</option>
                    <option value="none">(None)</option>
                  </select>
                  <button type="button" class="win98-button" data-display-saver-preview="true">
                    Preview
                  </button>
                </div>
                <label class="win98-display-row">
                  Wait:
                  <select data-display-wait="true">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                  </select>
                  minutes
                </label>
              </fieldset>
              <div class="win98-dialog-actions">
                <button type="button" class="win98-button" data-display-ok="true">
                  OK
                </button>
                <button type="button" class="win98-button" data-display-cancel="true">
                  Cancel
                </button>
                <button type="button" class="win98-button" data-display-apply="true">
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>

        <audio data-music-audio="true" preload="none"></audio>

        <div class="win98-taskbar">
          <button type="button" class="win98-start" data-start-toggle="true">
            <span aria-hidden="true">🗔</span> Start
          </button>
          <div class="win98-taskbar__divider" aria-hidden="true"></div>
          <div class="win98-taskbar__apps" data-taskbar-apps="true">
            {[...APPS, ...OTHER_WINDOWS].map((app) => (
              <button type="button" class="win98-taskbar__app" data-taskbar-btn={app.id} hidden>
                {app.icon} {app.label}
              </button>
            ))}
          </div>
          <div class="win98-tray">
            <button
              type="button"
              class="win98-tray__icon"
              data-quick-open="flags"
              aria-label="Open Flags.exe"
              title="Flag hunt"
            >
              🚩
            </button>
            <span data-hud-clock="ampm">--:-- --</span>
            <div class="win98-balloon" data-balloon="true" role="status" hidden>
              <button
                type="button"
                class="win98-balloon__close"
                data-balloon-close="true"
                aria-label="Dismiss"
              >
                ×
              </button>
              <p class="win98-balloon__title" data-balloon-title="true"></p>
              <p class="win98-balloon__text" data-balloon-text="true"></p>
            </div>
          </div>
        </div>

        <div class="win98-startmenu" data-start-menu="true" hidden>
          <div class="win98-startmenu__rail" aria-hidden="true">
            {wordmark.toUpperCase()} 98
          </div>
          <div class="win98-startmenu__items">
            {[...APPS.filter((app) => app.id !== "recycle"), OTHER_WINDOWS[0]].map((app) => (
              <button type="button" class="win98-startmenu__item" data-open-window={app.id}>
                <span aria-hidden="true">{app.icon}</span> {app.label}
              </button>
            ))}
            <div class="win98-startmenu__sep" aria-hidden="true"></div>
            <p class="win98-startmenu__heading">Recent writeups</p>
            {posts.slice(0, 4).map((post) => (
              <a class="win98-startmenu__item" href={`${basePath}/${post.slug}`}>
                <span aria-hidden="true">📄</span> {post.title}
              </a>
            ))}
            <div class="win98-startmenu__sep" aria-hidden="true"></div>
            <button type="button" class="win98-startmenu__item" data-open-window="display">
              <span aria-hidden="true">🖥️</span> Display Properties
            </button>
            <a class="win98-startmenu__item" href={SITE.github} target="_blank" rel="noreferrer">
              <span aria-hidden="true">🔧</span> View source on GitHub
            </a>
            <div class="win98-startmenu__sep" aria-hidden="true"></div>
            <button type="button" class="win98-startmenu__item" data-shutdown="true">
              <span aria-hidden="true">⏻</span> Shut Down…
            </button>
          </div>
        </div>

        <div class="win98-ctxmenu" data-ctx-menu="true" role="menu" hidden>
          <button type="button" role="menuitem" data-ctx-action="terminal">
            💻 Open Terminal
          </button>
          <button type="button" role="menuitem" data-ctx-action="display">
            🖼️ Change Wallpaper…
          </button>
          <button type="button" role="menuitem" data-ctx-action="reset">
            🗔 Reset Window Layout
          </button>
          <button type="button" role="menuitem" data-ctx-action="refresh">
            🔄 Refresh
          </button>
          <div class="win98-startmenu__sep" aria-hidden="true"></div>
          <button type="button" role="menuitem" data-ctx-action="display">
            Properties
          </button>
        </div>

        <WebOSData posts={posts} basePath={basePath} />
        <PortalScript />
      </>
    )
  },
}

export { DefaultFrame }
