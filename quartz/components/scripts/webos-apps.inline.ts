/**
 * SIGNAL 98 desktop apps: Terminal, Flags.exe (hidden-flag hunt), Minesweeper,
 * Recycle Bin, Display Properties (wallpaper + screensaver), desktop context
 * menu, tray balloons, shutdown screen and the Konami-code crash.
 *
 * Bundled into a string by the inline-script loader and loaded on every page
 * by the componentResources emitter, after DefaultFrame's inline window
 * manager has run. It talks to that window manager through `window.__webos`
 * and reads site content from the #webos-data JSON that DefaultFrame renders.
 *
 * Note: the inline loader strips the first occurrence of the e-x-p-o-r-t
 * keyword from this file, so that word must not appear anywhere in it.
 */

interface WebOSApi {
  open(id: string): void
  close(id: string): void
  isOpen(id: string): boolean
  resetLayout(): void
}
interface FlagInfo {
  id: string
  title: string
  hint: string
  hash: string
}
interface PostInfo {
  slug: string
  title: string
  category: string
  difficulty?: string
  event?: string
  date?: string
  description: string
  tags: string[]
}
interface WebOSData {
  alias: string
  name: string
  email: string
  tagline: string
  currently: string
  quote: string
  socials: { name: string; url: string }[]
  ctfLog: { event: string; team: string; result: string; live: boolean }[]
  techniques: string[]
  posts: PostInfo[]
  basePath: string
  flags: FlagInfo[]
  payloads: Record<string, string>
  recycle: { name: string; icon: string; content: string }[]
  wallpapers: { id: string; name: string; css: string }[]
}

const win = window as any

function api(): WebOSApi | undefined {
  return win.__webos
}

/** Listener that is removed on SPA navigation (re-bound by boot() on the next page). */
// `any` because Quartz's global Document typing isn't assignable to EventTarget
function on(el: any, evt: string, fn: (e: any) => void, opts?: AddEventListenerOptions) {
  el.addEventListener(evt, fn, opts)
  if (typeof win.addCleanup === "function")
    win.addCleanup(() => el.removeEventListener(evt, fn, opts))
}

function $(sel: string, root: any = document): HTMLElement | null {
  return root.querySelector(sel) as HTMLElement | null
}

function $$(sel: string, root: any = document): HTMLElement[] {
  return Array.prototype.slice.call(root.querySelectorAll(sel))
}

let cachedData: WebOSData | null = null
function readData(): WebOSData | null {
  if (cachedData) return cachedData
  const el = document.getElementById("webos-data")
  if (!el) return null
  try {
    cachedData = JSON.parse(el.textContent || "null")
  } catch {
    cachedData = null
  }
  return cachedData
}

function store<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

/** In-JS flags are stored reversed + base64'd so grepping the bundle isn't a one-step solve. */
function decode(payload: string): string {
  try {
    return atob(payload).split("").reverse().join("")
  } catch {
    return ""
  }
}

function rot13(s: string): string {
  return s.replace(/[a-z]/gi, (c) => {
    const base = c <= "Z" ? 65 : 97
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base)
  })
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* ============================================================
   Tray balloon
   ============================================================ */
let balloonTimer: number | undefined
function showBalloon(title: string, text: string, ms = 6000) {
  const el = $("[data-balloon]")
  if (!el) return
  const t = $("[data-balloon-title]", el)
  const b = $("[data-balloon-text]", el)
  if (t) t.textContent = title
  if (b) b.textContent = text
  el.hidden = false
  window.clearTimeout(balloonTimer)
  balloonTimer = window.setTimeout(() => (el.hidden = true), ms)
}

function initBalloon() {
  const el = $("[data-balloon]")
  if (!el || el.dataset.bound === "true") return
  el.dataset.bound = "true"
  const close = $("[data-balloon-close]", el)
  if (close) on(close, "click", () => (el.hidden = true))
  on(el, "click", (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-balloon-close]")) return
    el.hidden = true
    api()?.open("flags")
  })
  if (!$(".win98-desktop")) return
  if (store("webos-tip-seen", false)) return
  persist("webos-tip-seen", true)
  window.setTimeout(() => {
    const total = readData()?.flags.length ?? 8
    showBalloon(
      "Welcome to SIGNAL 98",
      `${total} flags are hidden around this desktop. Click here to open Flags.exe, or try the Terminal.`,
      14000,
    )
  }, 2600)
}

/* ============================================================
   Flag hunt
   ============================================================ */
const FOUND_KEY = "webos-flags-v1"
const foundIds = () => store<string[]>(FOUND_KEY, [])

async function sha256hex(text: string): Promise<string | null> {
  if (!window.crypto || !crypto.subtle) return null
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

type SubmitResult =
  | { status: "ok" | "dupe"; flag: FlagInfo; found: number; total: number }
  | { status: "wrong" | "unsupported" }

async function submitFlag(raw: string): Promise<SubmitResult> {
  const data = readData()
  const hash = await sha256hex(raw.trim())
  if (!hash || !data) return { status: "unsupported" }
  const flag = data.flags.find((f) => f.hash === hash)
  if (!flag) return { status: "wrong" }
  const found = foundIds()
  const total = data.flags.length
  if (found.includes(flag.id)) return { status: "dupe", flag, found: found.length, total }
  found.push(flag.id)
  persist(FOUND_KEY, found)
  document.dispatchEvent(new CustomEvent("webos:flag") as any)
  showBalloon(
    `🚩 Flag captured! (${found.length}/${total})`,
    found.length === total ? "You found every flag. GG!" : `"${flag.title}" solved.`,
  )
  return { status: "ok", flag, found: found.length, total }
}

function initFlags() {
  const root = $('[data-window="flags"]')
  const data = readData()
  if (!root || !data || root.dataset.bound === "true") return
  root.dataset.bound = "true"
  const list = $("[data-flags-list]", root)!
  const bar = $("[data-flags-bar]", root)!
  const count = $("[data-flags-count]", root)!
  const input = $("[data-flags-input]", root) as HTMLInputElement
  const status = $("[data-flags-status]", root)!
  const done = $("[data-flags-done]", root)!

  function render() {
    const found = foundIds()
    list.textContent = ""
    data!.flags.forEach((f, i) => {
      const got = found.includes(f.id)
      const li = document.createElement("li")
      li.className = "win98-flags-row" + (got ? " is-found" : "")
      const box = document.createElement("span")
      box.className = "win98-flags-row__box"
      box.textContent = got ? "✔" : String(i + 1)
      const body = document.createElement("div")
      const title = document.createElement("strong")
      title.textContent = got ? f.title : "???"
      const hint = document.createElement("p")
      hint.textContent = f.hint
      body.append(title, hint)
      li.append(box, body)
      list.append(li)
    })
    const pct = Math.round((found.length / data!.flags.length) * 100)
    bar.style.width = pct + "%"
    count.textContent = `${found.length} / ${data!.flags.length}`
    done.hidden = found.length < data!.flags.length
  }

  async function submit() {
    const value = input.value
    if (!value.trim()) return
    status.className = "win98-flags-status"
    const res = await submitFlag(value)
    if (res.status === "ok") {
      status.textContent = `Correct! "${res.flag.title}" captured.`
      status.classList.add("is-ok")
      input.value = ""
    } else if (res.status === "dupe") {
      status.textContent = "You already captured that one."
    } else if (res.status === "unsupported") {
      status.textContent = "Flag checking needs a secure (https) connection."
      status.classList.add("is-bad")
    } else {
      status.textContent = "Nope. That's not one of my flags."
      status.classList.add("is-bad")
    }
  }

  on($("[data-flags-submit]", root)!, "click", submit)
  on(input, "keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") submit()
  })
  on($("[data-flags-reset]", root)!, "click", () => {
    persist(FOUND_KEY, [])
    status.textContent = "Progress reset. Happy hunting."
    render()
  })
  on(document, "webos:flag", render)
  render()
}

/** Flags that live outside any window: the console and a cookie. */
function plantFlags() {
  const data = readData()
  if (!data || win.__webosFlagsPlanted) return
  win.__webosFlagsPlanted = true
  const consoleFlag = decode(data.payloads.console || "")
  const cookieFlag = decode(data.payloads.cookie || "")
  if (consoleFlag) {
    console.log(
      "%c SIGNAL 98 ",
      "background:#8f5fe8;color:#fff;font:bold 14px monospace;padding:4px 8px;border-radius:3px",
    )
    console.log(
      "%cHey, you opened DevTools. Respect. Here's something for your trouble (it's base64):\n%c" +
        btoa(consoleFlag),
      "color:#8f5fe8;font:12px monospace",
      "color:#ef9a5c;font:bold 13px monospace",
    )
  }
  if (cookieFlag) {
    document.cookie =
      "secret_recipe=" + rot13(cookieFlag) + "; path=/; max-age=31536000; SameSite=Lax"
  }
}

/* ============================================================
   Konami code → blue screen
   ============================================================ */
const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
]

function showBSOD() {
  if ($(".win98-bsod")) return
  const flag = decode(readData()?.payloads.konami || "")
  const el = document.createElement("div")
  el.className = "win98-bsod"
  el.setAttribute("role", "alertdialog")
  el.setAttribute("aria-label", "Fatal exception")
  el.innerHTML =
    '<div class="win98-bsod__inner"><p class="win98-bsod__title">SIGNAL 98</p>' +
    "<p>A fatal exception 0E has occurred at 0028:C0FFEE42 in VXD KONAMI(01) + 00010E36. " +
    "The current application will be terminated.</p>" +
    "<p>*  Someone entered a cheat code. Cheaters get flags here, apparently:</p>" +
    '<p class="win98-bsod__flag"></p>' +
    "<p>*  Press any key to return to the desktop. You will lose any unsaved " +
    "information in all applications.</p>" +
    '<p class="win98-bsod__continue">Press any key to continue <span>_</span></p></div>'
  ;($(".win98-bsod__flag", el) as HTMLElement).textContent = flag
  document.body.append(el)
  const dismiss = () => {
    el.remove()
    document.removeEventListener("keydown", dismiss)
  }
  window.setTimeout(() => {
    document.addEventListener("keydown", dismiss)
    el.addEventListener("click", dismiss)
  }, 400)
}

function initKonamiOnce() {
  if (win.__webosKonami) return
  win.__webosKonami = true
  let pos = 0
  document.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
    pos = key === KONAMI[pos] ? pos + 1 : key === KONAMI[0] ? 1 : 0
    if (pos === KONAMI.length) {
      pos = 0
      showBSOD()
    }
  })
}

/* ============================================================
   Shutdown
   ============================================================ */
function showShutdown() {
  if ($(".win98-shutdown")) return
  const el = document.createElement("div")
  el.className = "win98-shutdown"
  el.innerHTML = '<p class="win98-shutdown__msg">SIGNAL 98 is shutting down…</p>'
  document.body.append(el)
  window.setTimeout(
    () => {
      el.classList.add("is-safe")
      el.innerHTML =
        '<p class="win98-shutdown__msg">It\'s now safe to turn off<br />your computer.</p>' +
        '<p class="win98-shutdown__hint">Click anywhere to restart</p>'
      el.addEventListener("click", () => {
        try {
          sessionStorage.removeItem("signal-booted")
        } catch {}
        window.location.reload()
      })
    },
    reducedMotion() ? 0 : 1400,
  )
}

/* ============================================================
   Display Properties: wallpaper + screensaver
   ============================================================ */
interface DisplaySettings {
  wallpaper: string
  saver: "starfield" | "none"
  wait: number
}
const DISPLAY_KEY = "webos-display-v1"
const defaultDisplay: DisplaySettings = { wallpaper: "cats", saver: "starfield", wait: 2 }
const displaySettings = (): DisplaySettings => ({
  ...defaultDisplay,
  ...store<Partial<DisplaySettings>>(DISPLAY_KEY, {}),
})

function wallpaperCss(id: string): string | undefined {
  return readData()?.wallpapers.find((w) => w.id === id)?.css
}

function applyWallpaper(id: string) {
  const desktop = $(".win98-desktop")
  const css = wallpaperCss(id)
  if (desktop && css) desktop.style.background = css
}

function setWallpaper(id: string): boolean {
  if (!wallpaperCss(id)) return false
  persist(DISPLAY_KEY, { ...displaySettings(), wallpaper: id })
  applyWallpaper(id)
  return true
}

function initDisplay() {
  applyWallpaper(displaySettings().wallpaper)
  const root = $('[data-window="display"]')
  const data = readData()
  if (!root || !data || root.dataset.bound === "true") return
  root.dataset.bound = "true"
  const list = $("[data-display-wallpapers]", root)!
  const preview = $("[data-display-preview]", root)!
  const saver = $("[data-display-saver]", root) as HTMLSelectElement
  const wait = $("[data-display-wait]", root) as HTMLSelectElement
  let pending = displaySettings()

  function load() {
    pending = displaySettings()
    list.textContent = ""
    data!.wallpapers.forEach((w) => {
      const label = document.createElement("label")
      label.className = "win98-display-option"
      const radio = document.createElement("input")
      radio.type = "radio"
      radio.name = "wallpaper"
      radio.value = w.id
      radio.checked = w.id === pending.wallpaper
      on(radio, "change", () => {
        pending.wallpaper = w.id
        preview.style.background = w.css
      })
      label.append(radio, document.createTextNode(" " + w.name))
      list.append(label)
    })
    preview.style.background = wallpaperCss(pending.wallpaper) || ""
    saver.value = pending.saver
    wait.value = String(pending.wait)
  }
  function apply() {
    pending.saver = saver.value === "none" ? "none" : "starfield"
    pending.wait = parseInt(wait.value, 10) || 2
    persist(DISPLAY_KEY, pending)
    applyWallpaper(pending.wallpaper)
  }
  on($("[data-display-apply]", root)!, "click", apply)
  on($("[data-display-ok]", root)!, "click", () => {
    apply()
    api()?.close("display")
  })
  on($("[data-display-cancel]", root)!, "click", () => {
    load()
    api()?.close("display")
  })
  on($("[data-display-saver-preview]", root)!, "click", () => startScreensaver(true))
  load()
}

/* ============================================================
   Screensaver: classic Starfield after a few idle minutes
   ============================================================ */
let saverActive = false
function startScreensaver(force = false) {
  if (saverActive || (!force && reducedMotion())) return
  if (!$(".win98-desktop")) return
  saverActive = true
  const canvas = document.createElement("canvas")
  canvas.className = "win98-screensaver"
  document.body.append(canvas)
  const ctx = canvas.getContext("2d")!
  const stars = Array.from({ length: 360 }, () => ({
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 2,
    z: Math.random(),
  }))
  let raf = 0
  function frame() {
    const w = (canvas.width = window.innerWidth)
    const h = (canvas.height = window.innerHeight)
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, w, h)
    for (const s of stars) {
      s.z -= 0.006
      if (s.z <= 0.01) {
        s.x = (Math.random() - 0.5) * 2
        s.y = (Math.random() - 0.5) * 2
        s.z = 1
      }
      const px = w / 2 + (s.x / s.z) * (w / 2)
      const py = h / 2 + (s.y / s.z) * (h / 2)
      const size = (1 - s.z) * 3
      const shade = Math.floor((1 - s.z) * 255)
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`
      ctx.fillRect(px, py, size, size)
    }
    raf = requestAnimationFrame(frame)
  }
  frame()
  const stop = () => {
    cancelAnimationFrame(raf)
    canvas.remove()
    saverActive = false
    ;["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach((evt) =>
      window.removeEventListener(evt, stop, true),
    )
  }
  // Grace period so the click/mouse jitter that started a preview doesn't end it
  window.setTimeout(() => {
    ;["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach((evt) =>
      window.addEventListener(evt, stop, true),
    )
  }, 600)
}

function initScreensaverOnce() {
  if (win.__webosSaver) return
  win.__webosSaver = true
  let last = Date.now()
  const bump = () => (last = Date.now())
  ;["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"].forEach((evt) =>
    window.addEventListener(evt, bump, { passive: true, capture: true }),
  )
  window.setInterval(() => {
    const s = displaySettings()
    if (s.saver === "none" || saverActive || document.hidden) return
    if (Date.now() - last >= s.wait * 60_000) startScreensaver()
  }, 5000)
}

/* ============================================================
   Desktop context menu
   ============================================================ */
function initContextMenu() {
  const desktop = $(".win98-desktop")
  const menu = $("[data-ctx-menu]")
  if (!desktop || !menu || desktop.dataset.ctxBound === "true") return
  desktop.dataset.ctxBound = "true"
  const hide = () => (menu.hidden = true)
  on(desktop, "contextmenu", (e: MouseEvent) => {
    const t = e.target as HTMLElement
    if (t.closest(".win98-window") || t.closest(".win98-icon")) return
    e.preventDefault()
    menu.hidden = false
    const x = Math.min(e.clientX, window.innerWidth - menu.offsetWidth - 4)
    const y = Math.min(e.clientY, window.innerHeight - menu.offsetHeight - 40)
    menu.style.left = x + "px"
    menu.style.top = y + "px"
    ;($("button", menu) as HTMLElement | null)?.focus()
  })
  on(document, "click", (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) hide()
  })
  on(document, "keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape") hide()
  })
  $$("[data-ctx-action]", menu).forEach((btn) =>
    on(btn, "click", () => {
      hide()
      const action = btn.getAttribute("data-ctx-action")
      if (action === "terminal") api()?.open("terminal")
      else if (action === "display") api()?.open("display")
      else if (action === "reset") api()?.resetLayout()
      else if (action === "refresh") window.location.reload()
    }),
  )
}

/* ============================================================
   Recycle Bin + file viewer
   ============================================================ */
function initRecycleBin() {
  const root = $('[data-window="recycle"]')
  const data = readData()
  if (!root || !data || root.dataset.bound === "true") return
  root.dataset.bound = "true"
  const coarse = window.matchMedia("(pointer: coarse)").matches
  function openFile(i: number) {
    const file = data!.recycle[i]
    const title = $('[data-window="viewer"] [data-win-title]')
    const body = $('[data-window="viewer"] [data-viewer-body]')
    if (!file || !body) return
    if (title) title.textContent = file.name + " - Notepad"
    body.textContent = file.content
    api()?.open("viewer")
  }
  $$("[data-recycle-file]", root).forEach((btn) => {
    const i = parseInt(btn.getAttribute("data-recycle-file") || "-1", 10)
    on(btn, "dblclick", () => openFile(i))
    on(btn, "click", (e: MouseEvent) => {
      $$("[data-recycle-file]", root).forEach((b) => b.classList.remove("is-selected"))
      btn.classList.add("is-selected")
      if (coarse || e.detail === 0) openFile(i)
    })
  })
  const status = $("[data-recycle-status]", root)
  const empty = $("[data-recycle-empty]", root)
  if (empty && status)
    on(empty, "click", () => {
      status.textContent = "Access denied. These files are evidence."
    })
}

/* ============================================================
   Minesweeper (Beginner: 9×9, 10 mines)
   ============================================================ */
function initMinesweeper() {
  const root = $('[data-window="minesweeper"]')
  if (!root || root.dataset.bound === "true") return
  root.dataset.bound = "true"
  const SIZE = 9
  const MINES = 10
  const board = $("[data-ms-board]", root)!
  const face = $("[data-ms-face]", root)!
  const counter = $("[data-ms-count]", root)!
  const timerEl = $("[data-ms-time]", root)!
  const msg = $("[data-ms-msg]", root)!
  const flagMode = $("[data-ms-flagmode]", root)!

  type Cell = { mine: boolean; open: boolean; flag: boolean; n: number; el: HTMLButtonElement }
  let cells: Cell[] = []
  let started = false
  let over = false
  let flagging = false
  let seconds = 0
  let timer: number | undefined

  const idx = (r: number, c: number) => r * SIZE + c
  function neighbors(i: number): number[] {
    const r = Math.floor(i / SIZE)
    const c = i % SIZE
    const out: number[] = []
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue
        const rr = r + dr
        const cc = c + dc
        if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) out.push(idx(rr, cc))
      }
    return out
  }
  const pad3 = (n: number) => String(Math.max(-99, Math.min(999, n))).padStart(3, "0")
  function updateCounter() {
    counter.textContent = pad3(MINES - cells.filter((c) => c.flag).length)
  }
  function stopTimer() {
    window.clearInterval(timer)
    timer = undefined
  }

  function reset() {
    stopTimer()
    started = false
    over = false
    seconds = 0
    timerEl.textContent = "000"
    face.textContent = "🙂"
    msg.textContent = ""
    msg.hidden = true
    board.textContent = ""
    cells = []
    for (let i = 0; i < SIZE * SIZE; i++) {
      const el = document.createElement("button")
      el.type = "button"
      el.className = "win98-ms-cell"
      el.setAttribute("aria-label", `Row ${Math.floor(i / SIZE) + 1}, column ${(i % SIZE) + 1}`)
      const cell: Cell = { mine: false, open: false, flag: false, n: 0, el }
      cells.push(cell)
      el.addEventListener("click", () => (flagging ? toggleFlag(i) : reveal(i)))
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault()
        toggleFlag(i)
      })
      board.append(el)
    }
    updateCounter()
  }

  // Mines are laid after the first click, never on or next to it, so the opening move is always safe
  function layMines(safe: number) {
    const banned = new Set([safe, ...neighbors(safe)])
    let placed = 0
    while (placed < MINES) {
      const i = Math.floor(Math.random() * cells.length)
      if (cells[i].mine || banned.has(i)) continue
      cells[i].mine = true
      placed++
    }
    cells.forEach((c, i) => (c.n = neighbors(i).filter((j) => cells[j].mine).length))
  }

  function toggleFlag(i: number) {
    const c = cells[i]
    if (over || c.open) return
    c.flag = !c.flag
    c.el.textContent = c.flag ? "🚩" : ""
    c.el.classList.toggle("is-flagged", c.flag)
    updateCounter()
  }

  function reveal(i: number) {
    const first = cells[i]
    if (over || first.open || first.flag) return
    if (!started) {
      started = true
      layMines(i)
      timer = window.setInterval(() => {
        seconds++
        timerEl.textContent = pad3(seconds)
      }, 1000)
    }
    if (first.mine) return lose(i)
    const stack = [i]
    while (stack.length) {
      const j = stack.pop()!
      const c = cells[j]
      if (c.open || c.flag) continue
      c.open = true
      c.el.classList.add("is-open")
      c.el.disabled = true
      if (c.n) {
        c.el.textContent = String(c.n)
        c.el.classList.add("n" + c.n)
      } else {
        neighbors(j).forEach((k) => stack.push(k))
      }
    }
    if (cells.filter((c) => c.open).length === SIZE * SIZE - MINES) victory()
  }

  function lose(i: number) {
    over = true
    stopTimer()
    face.textContent = "😵"
    cells.forEach((c, j) => {
      if (c.mine) {
        c.el.textContent = "💣"
        c.el.classList.add("is-open")
      }
      if (j === i) c.el.classList.add("is-boom")
    })
    msg.textContent = "Boom. Click the face to try again."
    msg.hidden = false
  }

  function victory() {
    over = true
    stopTimer()
    face.textContent = "😎"
    cells.forEach((c) => {
      if (c.mine && !c.flag) c.el.textContent = "🚩"
    })
    counter.textContent = "000"
    const flag = decode(readData()?.payloads.mines || "")
    msg.textContent = `Cleared in ${seconds}s! Your reward: ${flag}`
    msg.hidden = false
  }

  on(face, "click", reset)
  on(flagMode, "click", () => {
    flagging = !flagging
    flagMode.classList.toggle("is-pressed", flagging)
    flagMode.setAttribute("aria-pressed", String(flagging))
  })
  reset()
}

/* ============================================================
   Terminal
   ============================================================ */
function initTerminal() {
  const root = $('[data-window="terminal"]')
  const data = readData()
  if (!root || !data || root.dataset.bound === "true") return
  root.dataset.bound = "true"
  const out = $("[data-term-out]", root)!
  const input = $("[data-term-input]", root) as HTMLInputElement
  const promptEl = $("[data-term-prompt]", root)!
  const screen = $("[data-term-screen]", root)!
  const user = data.alias
  const bootedAt = Date.now()
  let cwd = "~"
  const history: string[] = []
  let hIdx = 0
  let busy = false
  let inVim = false

  const APPS: Record<string, string> = {
    about: "about",
    writeups: "ctfwriteups",
    hireme: "hireme",
    resume: "resume",
    terminal: "terminal",
    flags: "flags",
    minesweeper: "minesweeper",
    whois: "whois",
    paint: "paint",
    music: "music",
    wikipedia: "wikipedia",
    recycle: "recycle",
    display: "display",
  }

  const BASH_HISTORY = [
    "nmap -sC -sV 10.10.11.42",
    "gdb ./vuln",
    "python3 exploit.py",
    "python3 exploit.py  # segfault",
    "python3 exploit.py  # segfault again",
    "vim exploit.py",
    ":q",
    ":q!",
    "how do i exit vim",
    "strings mystery.bin | grep -i flag",
    "cat .secret",
    "history -c  # oops, forgot to run this",
  ].join("\n")

  const files: Record<string, () => string> = {
    "~/about.txt": () =>
      `${data.name} (${data.alias})\n${data.tagline}\n\n${data.currently}\n\n"${data.quote}"`,
    "~/skills.txt": () => data.techniques.map((t) => "- " + t).join("\n"),
    "~/ctf-results.txt": () =>
      data.ctfLog
        .map((r) => `${r.live ? "[LIVE] " : ""}${r.event} (${r.team}): ${r.result}`)
        .join("\n"),
    "~/contact.txt": () =>
      [
        `email: ${data.email}`,
        ...data.socials.map((s) => `${s.name.toLowerCase()}: ${s.url}`),
      ].join("\n"),
    "~/.bash_history": () => BASH_HISTORY,
    "~/.secret": () => decode(data.payloads.terminal || ""),
  }
  data.posts.forEach((p) => {
    files[`~/writeups/${p.slug.split("/").pop()}.md`] = () =>
      [
        `# ${p.title}`,
        [p.event, p.difficulty, p.date].filter(Boolean).join(" · "),
        "",
        p.description || "(no summary)",
        "",
        p.tags.length ? p.tags.map((t) => "#" + t).join(" ") : "",
        "",
        `→ run: open writeups/${p.slug.split("/").pop()}.md`,
      ].join("\n")
  })
  const dirs = ["~", "~/writeups"]

  function resolve(path: string): string {
    if (!path || path === "~") return "~"
    let parts = path.startsWith("~") ? path.split("/") : (cwd + "/" + path).split("/")
    const stack: string[] = []
    for (const part of parts) {
      if (!part || part === ".") continue
      if (part === "..") {
        if (stack.length > 1) stack.pop()
      } else stack.push(part)
    }
    return stack.join("/") || "~"
  }
  function listDir(dir: string, all: boolean): string[] {
    const prefix = dir + "/"
    const names = new Set<string>()
    Object.keys(files).forEach((f) => {
      if (!f.startsWith(prefix)) return
      const rest = f.slice(prefix.length)
      names.add(rest.includes("/") ? rest.split("/")[0] + "/" : rest)
    })
    dirs.forEach((d) => {
      if (d.startsWith(prefix) && !d.slice(prefix.length).includes("/"))
        names.add(d.slice(prefix.length) + "/")
    })
    return Array.from(names)
      .filter((n) => all || !n.startsWith("."))
      .sort()
  }

  function print(text = "", cls?: string) {
    const line = document.createElement("div")
    line.className = "win98-term__line" + (cls ? " " + cls : "")
    line.textContent = text
    out.append(line)
    screen.scrollTop = screen.scrollHeight
    return line
  }
  function promptText() {
    return `${user}@signal98:${cwd}$`
  }
  function updatePrompt() {
    promptEl.textContent = promptText()
  }

  const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms))

  type Cmd = { desc?: string; run: (args: string[]) => unknown }
  const commands: Record<string, Cmd> = {
    help: {
      desc: "list commands",
      run: () => {
        print("Available commands:")
        Object.keys(commands)
          .filter((k) => commands[k].desc)
          .forEach((k) => print(`  ${k.padEnd(12)} ${commands[k].desc}`))
        print("")
        print("Tip: Tab completes, ↑/↓ walks history. Some commands aren't listed…", "is-dim")
      },
    },
    whoami: {
      desc: "who is this",
      run: () => print(`${data.name} (${data.alias}): ${data.tagline}`),
    },
    neofetch: {
      desc: "system info",
      run: () => {
        const uptime = Math.floor((Date.now() - bootedAt) / 1000)
        const logo = [
          "  ▄▄▄▄▄▄ ▄▄▄▄▄▄ ",
          "  █▓▓▓▓█ █░░░░█ ",
          "  █▓▓▓▓█ █░░░░█ ",
          "  ▀▀▀▀▀▀ ▀▀▀▀▀▀ ",
          "  ▄▄▄▄▄▄ ▄▄▄▄▄▄ ",
          "  █▒▒▒▒█ █████ █",
          "  █▒▒▒▒█ █████ █",
          "  ▀▀▀▀▀▀ ▀▀▀▀▀▀ ",
        ]
        const info = [
          `${user}@signal98`,
          "-----------------",
          "OS: SIGNAL 98 (WebOS edition)",
          `Host: ${location.host}`,
          `Uptime: ${Math.floor(uptime / 60)}m ${uptime % 60}s`,
          "Shell: bash 98",
          "Team: v1olet",
          `Writeups: ${data.posts.length}`,
          `Flags found: ${foundIds().length}/${data.flags.length}`,
        ]
        for (let i = 0; i < Math.max(logo.length, info.length); i++) {
          print(`${(logo[i] || "").padEnd(18)}${info[i] || ""}`, i === 0 ? "is-accent" : undefined)
        }
      },
    },
    ls: {
      desc: "list files (try -a)",
      run: (args) => {
        const all = args.some((a) => a.startsWith("-") && a.includes("a"))
        const target = resolve(args.find((a) => !a.startsWith("-")) || ".")
        if (files[target]) return void print(target.split("/").pop())
        if (!dirs.includes(target))
          return void print(
            `ls: cannot access '${args.join(" ")}': No such file or directory`,
            "is-err",
          )
        const names = listDir(target, all)
        print((all ? [".", "..", ...names] : names).join("  "))
      },
    },
    cd: {
      desc: "change directory",
      run: (args) => {
        const target = resolve(args[0] || "~")
        if (!dirs.includes(target))
          return void print(`cd: ${args[0]}: No such file or directory`, "is-err")
        cwd = target
        updatePrompt()
      },
    },
    pwd: { desc: "print working directory", run: () => print(cwd.replace("~", `/home/${user}`)) },
    cat: {
      desc: "print a file",
      run: (args) => {
        if (!args[0]) return void print("usage: cat <file>", "is-err")
        const path = resolve(args[0])
        if (dirs.includes(path)) return void print(`cat: ${args[0]}: Is a directory`, "is-err")
        const f = files[path]
        if (!f) return void print(`cat: ${args[0]}: No such file or directory`, "is-err")
        f()
          .split("\n")
          .forEach((l) => print(l))
      },
    },
    open: {
      desc: "open an app or writeup",
      run: (args) => {
        const name = (args[0] || "").toLowerCase()
        if (!name)
          return void print("usage: open <app|writeup>. apps: " + Object.keys(APPS).join(", "))
        if (APPS[name]) {
          api()?.open(APPS[name])
          return void print(`Opening ${name}…`, "is-dim")
        }
        const slug = resolve(name).split("/").pop()!.replace(/\.md$/, "")
        const post = data.posts.find((p) => p.slug.split("/").pop() === slug)
        if (!post) return void print(`open: ${args[0]}: no such app or writeup`, "is-err")
        print(`Opening ${post.title}…`, "is-dim")
        window.location.href = `${data.basePath}/${post.slug}`
      },
    },
    ctf: {
      desc: "recent CTF results",
      run: () => commands.cat.run(["~/ctf-results.txt"]),
    },
    skills: { desc: "what I work on", run: () => commands.cat.run(["~/skills.txt"]) },
    contact: { desc: "how to reach me", run: () => commands.cat.run(["~/contact.txt"]) },
    whois: {
      desc: "WHOIS lookup a domain",
      run: (args) => {
        if (!args[0]) return void print("usage: whois <domain>", "is-err")
        api()?.open("whois")
        const box = $('[data-window="whois"] [data-whois-input]') as HTMLInputElement | null
        const go = $('[data-window="whois"] [data-whois-lookup]')
        if (box && go) {
          box.value = args[0]
          go.click()
          print(`Looking up ${args[0]} in the WHOIS app…`, "is-dim")
        }
      },
    },
    music: {
      desc: "music play|pause|next|prev",
      run: (args) => {
        const sub = (args[0] || "").toLowerCase()
        const audio = $("[data-music-audio]") as HTMLAudioElement | null
        const click = (sel: string) => ($(sel) as HTMLElement | null)?.click()
        if (sub === "play" && audio?.paused) click("[data-music-toggle]")
        else if (sub === "pause" && audio && !audio.paused) click("[data-music-toggle]")
        else if (sub === "next") click("[data-music-next]")
        else if (sub === "prev") click("[data-music-prev]")
        else if (!sub) {
          $$(".win98-music-row").forEach((r, i) =>
            print(
              `${i + 1}. ${$(".win98-music-row__title", r)?.textContent} by ${$(".win98-music-row__artist", r)?.textContent}`,
            ),
          )
          return
        }
        const now = $("[data-music-now-track]")?.textContent
        if (now) print(`♪ ${now}`, "is-dim")
      },
    },
    wallpaper: {
      desc: "list or set wallpaper",
      run: (args) => {
        if (!args[0]) {
          const current = displaySettings().wallpaper
          data.wallpapers.forEach((w) =>
            print(`${w.id === current ? "*" : " "} ${w.id.padEnd(10)} ${w.name}`),
          )
          return void print("usage: wallpaper <id>", "is-dim")
        }
        if (!setWallpaper(args[0])) print(`wallpaper: unknown wallpaper '${args[0]}'`, "is-err")
      },
    },
    submit: {
      desc: "submit a flag",
      run: async (args) => {
        if (!args[0]) return void print("usage: submit ecst4sy{...}", "is-err")
        const res = await submitFlag(args.join(" "))
        if (res.status === "ok")
          print(`✔ Correct! ${res.flag.title} (${res.found}/${res.total})`, "is-ok")
        else if (res.status === "dupe") print("Already captured that one.")
        else if (res.status === "unsupported") print("Flag checking needs https.", "is-err")
        else print("✘ Wrong flag.", "is-err")
      },
    },
    flags: {
      desc: "flag hunt progress",
      run: () => {
        const found = foundIds()
        data.flags.forEach((f, i) =>
          print(
            `[${found.includes(f.id) ? "x" : " "}] ${i + 1}. ${found.includes(f.id) ? f.title : "???"}: ${f.hint}`,
          ),
        )
      },
    },
    history: {
      desc: "command history",
      run: () => history.forEach((h, i) => print(`${String(i + 1).padStart(4)}  ${h}`)),
    },
    date: { desc: "current date", run: () => print(new Date().toString()) },
    echo: { desc: "print text", run: (args) => print(args.join(" ")) },
    clear: { desc: "clear the screen", run: () => (out.textContent = "") },
    shutdown: { desc: "turn it off", run: () => showShutdown() },
    exit: { desc: "close terminal", run: () => api()?.close("terminal") },
    // Not listed in help. Finding them is half the fun.
    sudo: {
      run: (args) =>
        void print(
          args.length
            ? `${user} is not in the sudoers file. This incident will be reported.`
            : "usage: sudo <command>",
          "is-err",
        ),
    },
    rm: {
      run: (args) =>
        void print(
          args.includes("-rf")
            ? "Nice try. This is a read-only portfolio. 😄"
            : "rm: permission denied",
          "is-err",
        ),
    },
    vim: {
      run: () => {
        inVim = true
        print("You are now in vim. There is no escape. (hint: :q)", "is-dim")
      },
    },
    hack: {
      run: async () => {
        const steps = [
          "[*] Bypassing mainframe firewall…",
          "[*] Reticulating splines…",
          "[*] Downloading more RAM… 100%",
          "[*] Hacking the Gibson…",
          "[+] ACCESS GRANTED",
        ]
        for (const s of steps) {
          print(s, s.startsWith("[+]") ? "is-ok" : "is-dim")
          await wait(450)
        }
        print("…just kidding. Real hackers find flags. Try `flags`.")
      },
    },
  }
  commands.nano = commands.vim
  commands.emacs = { run: () => void print("This is a vim household.", "is-err") }
  commands.dir = commands.ls
  commands.cls = commands.clear

  async function execute(line: string) {
    print(`${promptText()} ${line}`, "is-cmd")
    const trimmed = line.trim()
    if (!trimmed) return
    history.push(trimmed)
    hIdx = history.length
    if (inVim) {
      if (/^:(q|wq|x|q!)$/.test(trimmed)) {
        inVim = false
        print("Phew. You escaped vim. Most people never do.", "is-ok")
      } else print("E37: No write since last change (add ! to override)", "is-err")
      return
    }
    const [name, ...args] = trimmed.split(/\s+/)
    const cmd = commands[name.toLowerCase()]
    if (!cmd) return void print(`bash: ${name}: command not found. Type 'help'.`, "is-err")
    busy = true
    try {
      await cmd.run(args)
    } finally {
      busy = false
    }
  }

  function complete() {
    const value = input.value
    const parts = value.split(/\s+/)
    let options: string[]
    const last = parts[parts.length - 1]
    if (parts.length === 1) options = Object.keys(commands).filter((c) => c.startsWith(last))
    else if (parts[0] === "open" && !last.includes("/"))
      options = [...Object.keys(APPS), ...listDir(cwd, false)].filter((o) => o.startsWith(last))
    else {
      const slash = last.lastIndexOf("/")
      const dirPart = slash >= 0 ? last.slice(0, slash + 1) : ""
      const base = resolve(dirPart || ".")
      options = listDir(base, last.slice(slash + 1).startsWith("."))
        .filter((n) => n.startsWith(last.slice(slash + 1)))
        .map((n) => dirPart + n)
    }
    if (options.length === 1) {
      parts[parts.length - 1] = options[0]
      input.value = parts.join(" ") + (options[0].endsWith("/") ? "" : " ")
    } else if (options.length > 1) {
      print(`${promptText()} ${value}`, "is-cmd")
      print(options.join("  "))
    }
  }

  on(input, "keydown", async (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (busy) return
      const line = input.value
      input.value = ""
      await execute(line)
    } else if (e.key === "Tab") {
      e.preventDefault()
      complete()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (hIdx > 0) input.value = history[--hIdx]
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      hIdx = Math.min(history.length, hIdx + 1)
      input.value = history[hIdx] || ""
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault()
      out.textContent = ""
    }
  })
  on(screen, "click", () => {
    if (!window.getSelection()?.toString()) input.focus()
  })

  updatePrompt()
  print("SIGNAL 98 bash, version 5.98 (i386-pc-signal98)")
  print("Type 'help' to see commands, or 'neofetch' to say hi.", "is-dim")
  print("")
}

/* ============================================================
   Wiring
   ============================================================ */
function initShutdownButtons() {
  $$("[data-shutdown]").forEach((btn) => {
    if (btn.dataset.bound === "true") return
    btn.dataset.bound = "true"
    on(btn, "click", showShutdown)
  })
}

/** Focus the terminal prompt whenever its window opens or gets clicked. */
function initTerminalFocus() {
  const term = $('[data-window="terminal"]')
  if (!term || term.dataset.focusBound === "true") return
  term.dataset.focusBound = "true"
  const focus = () =>
    window.setTimeout(() => ($("[data-term-input]", term) as HTMLInputElement | null)?.focus(), 0)
  new MutationObserver(() => {
    if (!term.hidden) focus()
  }).observe(term, { attributes: true, attributeFilter: ["hidden"] })
}

function boot() {
  plantFlags()
  initKonamiOnce()
  initScreensaverOnce()
  initBalloon()
  initFlags()
  initDisplay()
  initContextMenu()
  initRecycleBin()
  initMinesweeper()
  initTerminal()
  initTerminalFocus()
  initShutdownButtons()
}

if (!win.__webosAppsLoaded) {
  win.__webosAppsLoaded = true
  boot()
  document.addEventListener("nav", () => {
    cachedData = null
    boot()
  })
}
