# Koncrete Art Kitchen - AI Chat Proxy (Cloudflare Worker)

This Worker is a small, safe proxy that connects the website chat to an AI model
(Google Gemini, OpenAI GPT, or DeepSeek). The API key lives here as a Cloudflare
secret and is never exposed in the website code or browser.

The website calls `POST /api/chat` on this Worker. The Worker calls the AI
provider and returns `{ "reply": "..." }`.

## 1. Prerequisites

- A free Cloudflare account
- Node.js installed
- An API key from one provider:
  - Gemini: https://aistudio.google.com/apikey (free tier available)
  - OpenAI: https://platform.openai.com/api-keys
  - DeepSeek: https://platform.deepseek.com/api_keys

## 2. Install and log in

```bash
npm install -g wrangler
```

```bash
wrangler login
```

## 3. Configure the provider

Edit `wrangler.toml` and set `USER_LLM_PROVIDER` to one of `gemini`, `openai`, or
`deepseek`, and `USER_LLM_MODEL` to the model you want.

Examples:

- Gemini: provider `gemini`, model `gemini-2.0-flash`
- OpenAI: provider `openai`, model `gpt-4o-mini`
- DeepSeek: provider `deepseek`, model `deepseek-chat`

## 4. Add your API key as a secret

Run this from inside the `worker` folder and paste your key when prompted. The key
is stored encrypted by Cloudflare and never appears in this repository.

```bash
wrangler secret put USER_LLM_API_KEY
```

## 5. Deploy

```bash
wrangler deploy
```

Wrangler prints a URL such as:

```
https://kak-ai-proxy.YOUR-SUBDOMAIN.workers.dev
```

Open that URL in a browser to check the health endpoint. It should return
`{"ok":true,...}`.

### Alternative: deploy from GitHub (no local setup)

If you do not want to install anything on your computer, you can deploy from
GitHub instead:

1. Create a Cloudflare API token (My Profile, API Tokens, "Edit Cloudflare
   Workers" template) and note your Account ID.
2. In your GitHub repository open Settings, Secrets and variables, Actions, and
   add these repository secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `USER_LLM_API_KEY` (your Gemini, OpenAI or DeepSeek key)
3. Open the Actions tab, choose "Deploy AI worker (Cloudflare)", and press
   "Run workflow".

The Worker URL is shown in the workflow log when it finishes.

## 6. Connect the website

Open the website Admin page, go to section 4 (Chat assistant), and paste the
Worker URL into the "AI API endpoint" field. Save and publish. The chat will now
use the AI model. If the endpoint is empty or the AI fails, the chat falls back to
the built-in local assistant automatically.

## 7. Social auto-post (Instagram + Pinterest)

The same Worker also publishes products to Instagram and Pinterest at
`POST /api/social/publish`. The website admin calls it with the header
`X-Social-Key` after you click Save & publish (or the "Post pending products now"
button). Secrets:

- `SOCIAL_PUBLISH_KEY` - a long random string you invent; paste the same value in
  the admin "Social publish key" field.
- `IG_USER_ID` - your Instagram **Business/Creator** account id (numeric).
- `IG_ACCESS_TOKEN` - a long-lived Facebook/Instagram access token with
  `instagram_content_publish`.
- `PINTEREST_TOKEN` - a Pinterest API v5 access token with `pins:write`.
- `PINTEREST_BOARD_ID` - the board where new pins go.

Set them with:

```bash
wrangler secret put SOCIAL_PUBLISH_KEY
```

```bash
wrangler secret put IG_USER_ID
```

```bash
wrangler secret put IG_ACCESS_TOKEN
```

```bash
wrangler secret put PINTEREST_TOKEN
```

```bash
wrangler secret put PINTEREST_BOARD_ID
```

### Instagram setup (outline)

1. Convert the Instagram account to **Business/Creator** and link a Facebook Page.
2. Create a Facebook app (developers.facebook.com) and add the Instagram Graph API.
3. In Graph API Explorer request `instagram_basic` and `instagram_content_publish`.
4. Get your Page id, then `GET /{page-id}?fields=instagram_business_account` to get
   `IG_USER_ID`.
5. Exchange the short-lived token for a long-lived token (60 days) and set
   `IG_ACCESS_TOKEN`. Refresh before it expires.
6. Product images must be public HTTPS URLs. The admin sends GitHub raw URLs
   (`raw.githubusercontent.com/...`) automatically.

### Pinterest setup (outline)

1. Create an app at developers.pinterest.com (standard access is enough).
2. Generate an access token with `pins:write` and `boards:read`.
3. Find the target board id (Pinterest API `GET /v5/boards`, or from the board URL).
4. Set `PINTEREST_TOKEN` and `PINTEREST_BOARD_ID`.

### Admin fields (Social auto-post section)

- **Worker publish URL** - leave blank to reuse the chat URL with
  `/api/social/publish` appended.
- **Social publish key** - the `SOCIAL_PUBLISH_KEY` value (kept only in your browser).
- **Pinterest board id**, **Site URL** (for product links), **Caption template**
  (`{name} {price} {link} {description}`) and **Hashtags**.
- Tick **Auto-post new products on publish** and enable Instagram and/or Pinterest.

Products with "Post to Instagram & Pinterest" unchecked, or already marked
"Posted", are skipped so nothing is posted twice. Instagram allows 25 posts per
24 hours; Pinterest has its own limits.

## Providers

| Provider | USER_LLM_PROVIDER | Default model |
|----------|-------------------|---------------|
| Google Gemini | `gemini` | `gemini-2.0-flash` |
| OpenAI | `openai` | `gpt-4o-mini` |
| DeepSeek | `deepseek` | `deepseek-chat` |

## Security notes

- Never put the API key in the website, `catalog.json`, or any committed file.
- `ALLOWED_ORIGIN` in `wrangler.toml` restricts which site may call the Worker.
  Update it if your website domain changes.
- Requests are limited to the last 12 messages, 4000 characters each, and 40 KB
  per request.
- A best-effort rate limit of 20 requests per minute per IP protects against
  accidental runaway costs. For stronger limits, enable Cloudflare Rate Limiting
  rules on the Worker route.
- Set a spending limit on your AI provider account as an extra safety net.
