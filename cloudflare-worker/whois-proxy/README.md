# whois-proxy

A tiny Cloudflare Worker with two jobs:

1. **WHOIS** (`GET /?domain=…`): proxies lookups to
   [WhoisJSON](https://whoisjson.com/documentation), keeping the API key
   server-side instead of shipping it in the static site's client-side JS.
2. **Contact** (`POST /contact`): receives the desktop's Hire Me form and
   posts it to a private Discord channel via webhook, so messages arrive even
   when the visitor has no mail app set up.

The site's WHOIS app calls `GET <this worker's URL>/?domain=example.com`
with no key attached; the worker attaches the key (from a Cloudflare
secret, never committed) and forwards the request to WhoisJSON.

## One-time setup

```bash
cd cloudflare-worker/whois-proxy
npx wrangler login          # opens a browser to log into your (free) Cloudflare account
npx wrangler secret put WHOIS_API_KEY
# paste your WhoisJSON API key when prompted — it is stored encrypted on
# Cloudflare and is never written to any file in this repo
npx wrangler secret put DISCORD_WEBHOOK_URL
# paste a webhook URL from Discord: Server Settings → Integrations →
# Webhooks → New Webhook (pick a private channel) → Copy Webhook URL
npx wrangler deploy
```

`wrangler deploy` prints the worker's URL, something like:

```
https://whois-proxy.<your-subdomain>.workers.dev
```

Copy that URL — you'll need it for the site side (see below).

## Wiring it into the site

Open `quartz/components/frames/DefaultFrame.tsx` and set:

```ts
const WHOIS_PROXY_URL = "https://whois-proxy.<your-subdomain>.workers.dev"
```

(There's a `// TODO: set after `wrangler deploy`` marker on that line —
search for `WHOIS_PROXY_URL`.) The Hire Me form posts to
`WHOIS_PROXY_URL + "/contact"` automatically. Until the worker is deployed
with `DISCORD_WEBHOOK_URL` set, the form falls back to opening the visitor's
mail app, so nothing breaks in the meantime.

The contact route validates length and email format, ignores bots that fill
the hidden honeypot field, and strips Discord mentions/markdown from user
input. If you start getting spam, add a
[rate limiting rule](https://developers.cloudflare.com/waf/rate-limiting-rules/)
for `/contact` in the Cloudflare dashboard.

## Local testing

```bash
npx wrangler dev
```

This runs the worker locally (defaults to `http://localhost:8787`). Point
`WHOIS_PROXY_URL` at that during development, and add
`"http://localhost:8123"` (or whatever port you serve Quartz on) to
`ALLOWED_ORIGINS` in `wrangler.toml` so the browser's CORS check passes.

## Updating allowed origins

`ALLOWED_ORIGINS` in `wrangler.toml` is a comma-separated allowlist of
origins permitted to call this worker from browser JS. It already includes
the site's custom domain and its GitHub Pages fallback. Redeploy
(`npx wrangler deploy`) after changing it.

## Rotating the key

If the key ever leaks (e.g. pasted somewhere public), rotate it in your
WhoisJSON dashboard and update it here with the same `secret put` command
— nothing else needs to change.
