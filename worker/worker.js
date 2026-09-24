export default {
  async fetch(request, env) {
    const cors = corsHeaders(env, request)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    const url = new URL(request.url)

    if (url.pathname === '/' || url.pathname === '/health') {
      return json({ ok: true, provider: providerOf(env), model: modelOf(env, providerOf(env)) }, 200, cors)
    }

    if (url.pathname !== '/api/chat') {
      return json({ error: 'Not found' }, 404, cors)
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, cors)
    }

    const length = Number(request.headers.get('Content-Length') || 0)
    if (length > 40000) {
      return json({ error: 'Request too large' }, 413, cors)
    }

    if (isRateLimited(request)) {
      return json({ error: 'Too many requests. Please wait a moment.' }, 429, cors)
    }

    let body
    try {
      body = await request.json()
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, cors)
    }

    const messages = sanitizeMessages(body.messages)
    const system = typeof body.system === 'string' ? body.system.slice(0, 6000) : ''

    if (!messages.length) {
      return json({ error: 'No valid messages provided' }, 400, cors)
    }

    const apiKey = env.USER_LLM_API_KEY
    if (!apiKey) {
      return json({ error: 'Server is not configured with an API key.' }, 500, cors)
    }

    try {
      const reply = await callProvider(env, apiKey, system, messages)
      return json({ reply }, 200, cors)
    } catch (error) {
      return json({ error: String((error && error.message) || error) }, 502, cors)
    }
  }
}

function corsHeaders(env, request) {
  const configured = (env.ALLOWED_ORIGIN || 'https://dhfaizali043-web.github.io').split(',')
  const allowed = configured.map((item) => item.trim()).filter(Boolean)
  const origin = request.headers.get('Origin') || ''
  let allow = allowed[0] || '*'
  if (allowed.includes('*')) allow = '*'
  else if (origin && allowed.includes(origin)) allow = origin
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  }
}

function json(data, status, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(extraHeaders || {})
    }
  })
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return []
  return messages
    .filter(
      (message) =>
        message &&
        typeof message.content === 'string' &&
        (message.role === 'user' || message.role === 'assistant')
    )
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 4000)
    }))
}

const rateBuckets = new Map()
const RATE_WINDOW_MS = 60 * 1000
const RATE_MAX = 20

function isRateLimited(request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
  const now = Date.now()
  const bucket = rateBuckets.get(ip)
  if (!bucket || now - bucket.start > RATE_WINDOW_MS) {
    rateBuckets.set(ip, { start: now, count: 1 })
    return false
  }
  bucket.count += 1
  if (rateBuckets.size > 5000) {
    for (const [key, value] of rateBuckets) {
      if (now - value.start > RATE_WINDOW_MS) rateBuckets.delete(key)
    }
  }
  return bucket.count > RATE_MAX
}

function providerOf(env) {
  const value = String(env.USER_LLM_PROVIDER || 'gemini').toLowerCase()
  if (value === 'gpt' || value === 'openai') return 'openai'
  if (value === 'deepseek') return 'deepseek'
  return 'gemini'
}

function modelOf(env, provider) {
  if (env.USER_LLM_MODEL) return env.USER_LLM_MODEL
  if (provider === 'openai') return 'gpt-4o-mini'
  if (provider === 'deepseek') return 'deepseek-chat'
  return 'gemini-2.0-flash'
}

async function callProvider(env, apiKey, system, messages) {
  const provider = providerOf(env)
  const model = modelOf(env, provider)
  if (provider === 'openai') {
    return callOpenAICompatible(env, apiKey, system, messages, model, 'https://api.openai.com/v1')
  }
  if (provider === 'deepseek') {
    return callOpenAICompatible(env, apiKey, system, messages, model, 'https://api.deepseek.com/v1')
  }
  return callGemini(env, apiKey, system, messages, model)
}

async function callGemini(env, apiKey, system, messages, model) {
  const contents = messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }]
  }))

  const payload = {
    contents,
    generationConfig: { temperature: 0.6, maxOutputTokens: 700 }
  }
  if (system) payload.systemInstruction = { parts: [{ text: system }] }

  const endpoint =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(model) +
    ':generateContent?key=' +
    encodeURIComponent(apiKey)

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data.error && data.error.message) || 'Gemini HTTP ' + res.status)
  }

  const candidate = data.candidates && data.candidates[0]
  const parts = (candidate && candidate.content && candidate.content.parts) || []
  const text = parts.map((part) => part.text || '').join('').trim()
  if (!text) throw new Error('Empty response from Gemini')
  return text
}

async function callOpenAICompatible(env, apiKey, system, messages, model, defaultBase) {
  const base = String(env.USER_LLM_BASE_URL || defaultBase).replace(/\/+$/, '')
  const payload = {
    model,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...messages.map((message) => ({ role: message.role, content: message.content }))
    ],
    temperature: 0.6,
    max_tokens: 700
  }

  const res = await fetch(base + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey
    },
    body: JSON.stringify(payload)
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      (data.error && data.error.message) || (data.message || 'Provider HTTP ' + res.status)
    )
  }

  const choice = data.choices && data.choices[0]
  const text = (choice && choice.message && choice.message.content) || ''
  if (!text) throw new Error('Empty response from provider')
  return String(text).trim()
}
