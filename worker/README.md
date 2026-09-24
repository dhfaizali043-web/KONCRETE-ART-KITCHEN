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

## 6. Connect the website

Open the website Admin page, go to section 4 (Chat assistant), and paste the
Worker URL into the "AI API endpoint" field. Save and publish. The chat will now
use the AI model. If the endpoint is empty or the AI fails, the chat falls back to
the built-in local assistant automatically.

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
- Requests are limited to the last 12 messages, 4000 characters each.
