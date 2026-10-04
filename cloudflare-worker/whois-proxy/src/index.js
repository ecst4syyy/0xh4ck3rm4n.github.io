/**
 * WHOIS lookup proxy + contact form relay for ecst4sy.is-a.dev
 *
 * Routes:
 *   GET  /?domain=example.com  WHOIS lookup (proxied to WhoisJSON)
 *   POST /contact              Hire Me form, forwarded to a Discord webhook
 *
 * Keeps the WhoisJSON API key server-side (as a Cloudflare secret) instead
 * of shipping it in the static site's client-side JS. The site calls this
 * worker with a domain name; this worker calls WhoisJSON with the key
 * attached and forwards the JSON response back.
 *
 * Set the secrets with:
 *   wrangler secret put WHOIS_API_KEY
 *   wrangler secret put DISCORD_WEBHOOK_URL
 * Never put either in wrangler.toml or commit them anywhere.
 */

const DOMAIN_PATTERN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/i

function corsHeaders(env, request) {
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const origin = request.headers.get("Origin") || ""
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || "null"
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  }
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  })
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LIMITS = { name: 100, email: 200, need: 100, budget: 50, message: 3000 }

async function handleContact(request, env, cors) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, cors)
  }
  if (!env.DISCORD_WEBHOOK_URL) {
    return json({ error: "Server misconfigured: missing webhook" }, 500, cors)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: "Invalid JSON" }, 400, cors)
  }

  // Honeypot: the form has a visually hidden "website" field humans never fill.
  // Pretend success so bots don't learn to skip it.
  if (body.website) return json({ ok: true }, 200, cors)

  const fields = {}
  for (const [key, max] of Object.entries(LIMITS)) {
    const value = typeof body[key] === "string" ? body[key].trim() : ""
    if (value.length > max) {
      return json({ error: `${key} is too long (max ${max} characters)`, field: key }, 400, cors)
    }
    fields[key] = value
  }
  if (!fields.name) return json({ error: "Please enter your name", field: "name" }, 400, cors)
  if (!EMAIL_PATTERN.test(fields.email)) {
    return json({ error: "Please enter a valid email", field: "email" }, 400, cors)
  }

  // Discord renders markdown and pings on @everyone; neutralise both in user input
  const clean = (s) => s.replace(/@/g, "@\u200b").replace(/[`*_~|>]/g, "\\$&")
  const discordPayload = {
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: `New inquiry: ${clean(fields.need || "general")}`,
        color: 0x8f5fe8,
        fields: [
          { name: "Name", value: clean(fields.name), inline: true },
          { name: "Email", value: clean(fields.email), inline: true },
          { name: "Budget", value: clean(fields.budget || "n/a"), inline: true },
          { name: "Message", value: clean(fields.message || "(no message)").slice(0, 1024) },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  }

  let upstream
  try {
    upstream = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    })
  } catch {
    return json({ error: "Couldn't deliver message" }, 502, cors)
  }
  if (!upstream.ok) return json({ error: "Couldn't deliver message" }, 502, cors)
  return json({ ok: true }, 200, cors)
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env, request)

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors })
    }

    const { pathname } = new URL(request.url)
    if (pathname === "/contact") return handleContact(request, env, cors)

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405, cors)
    }

    const url = new URL(request.url)
    const domain = (url.searchParams.get("domain") || "").trim().toLowerCase()

    if (!domain) {
      return json({ error: "Missing 'domain' query parameter" }, 400, cors)
    }
    if (!DOMAIN_PATTERN.test(domain)) {
      return json({ error: "Invalid domain format" }, 400, cors)
    }
    if (!env.WHOIS_API_KEY) {
      return json({ error: "Server misconfigured: missing API key" }, 500, cors)
    }

    let upstream
    try {
      upstream = await fetch(
        `https://whoisjson.com/api/v1/whois?domain=${encodeURIComponent(domain)}`,
        { headers: { Authorization: `TOKEN=${env.WHOIS_API_KEY}` } },
      )
    } catch {
      return json({ error: "Upstream WHOIS request failed" }, 502, cors)
    }

    const bodyText = await upstream.text()
    return new Response(bodyText, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", ...cors },
    })
  },
}
