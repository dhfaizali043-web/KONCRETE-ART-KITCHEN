const CART_KEY = 'kak_cart_v1'
const CATALOG_URL = './data/catalog.json'

let catalog = { store: {}, products: [] }
let opened = false
let greeted = false
let apiUrl = ''
let history = []
let busy = false

const STOP = new Set([
  'a', 'an', 'the', 'is', 'are', 'am', 'do', 'does', 'did', 'you', 'your', 'we', 'i',
  'me', 'my', 'to', 'of', 'for', 'and', 'or', 'on', 'in', 'at', 'it', 'this', 'that',
  'can', 'could', 'would', 'will', 'please', 'kya', 'ke', 'ka', 'ki', 'hai', 'hain',
  'ho', 'ko', 'se', 'me', 'mein', 'aur', 'ek', 'bhi', 'kar', 'karo', 'kaise', 'kitna',
  'kitne', 'mujhe', 'aap', 'ap', 'ka', 'h'
])

let panelEl = null
let logEl = null
let inputEl = null
let quickEl = null

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(str) {
  return normalize(str)
    .split(' ')
    .filter((w) => w.length > 1 && !STOP.has(w))
}

function money(value) {
  const code = catalog.store.currencyCode || 'INR'
  const symbol = catalog.store.currencySymbol || '₹'
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0
    }).format(value)
  } catch {
    return `${symbol}${Number(value).toLocaleString('en-IN')}`
  }
}

function whatsappHref(text) {
  const number = String(catalog.store.whatsapp || '').replace(/[^\d]/g, '')
  const base = number ? `https://wa.me/${number}` : '#'
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

function hasContact() {
  const number = String(catalog.store.whatsapp || '').replace(/[^\d]/g, '')
  return Boolean(number) && number !== '910000000000'
}

let GENIE_FULL = './brand/genie.webp'
let GENIE_AVATAR = './brand/genie-avatar.webp'

function assetPath(value) {
  const path = String(value || '')
  if (!path) return ''
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  return './' + path.replace(/^\.?\//, '')
}

function buildWidget() {
  const launcher = document.createElement('button')
  launcher.className = 'chat-launcher'
  launcher.type = 'button'
  launcher.setAttribute('aria-label', 'Open AI assistant')
  launcher.innerHTML = `<span class="chat-lamp-glow" aria-hidden="true"></span><img class="chat-launcher-img" src="${GENIE_AVATAR}" alt="" />`

  panelEl = document.createElement('section')
  panelEl.className = 'chat-panel'
  panelEl.setAttribute('aria-label', 'AI assistant')
  panelEl.hidden = true
  panelEl.innerHTML = `
    <header class="chat-head">
      <span class="chat-avatar" aria-hidden="true"><img src="${GENIE_AVATAR}" alt="" /></span>
      <div class="chat-head-info">
        <strong id="chatName">Studio Genie</strong>
        <span class="chat-status"><i class="chat-online" aria-hidden="true"></i><b id="chatStatus">Online</b></span>
      </div>
      <button type="button" class="chat-close" aria-label="Close chat">Close</button>
    </header>
    <div class="chat-log" id="chatLog" role="log" aria-live="polite"></div>
    <div class="chat-quick" id="chatQuick"></div>
    <form class="chat-input" id="chatForm">
      <input type="text" id="chatText" placeholder="Type your question..." autocomplete="off" />
      <button type="submit" aria-label="Send">Send</button>
    </form>
  `
  document.body.appendChild(launcher)
  document.body.appendChild(panelEl)

  logEl = panelEl.querySelector('#chatLog')
  quickEl = panelEl.querySelector('#chatQuick')
  inputEl = panelEl.querySelector('#chatText')

  launcher.addEventListener('click', toggle)
  panelEl.querySelector('.chat-close').addEventListener('click', close)
  panelEl.querySelector('#chatForm').addEventListener('submit', (event) => {
    event.preventDefault()
    const text = inputEl.value.trim()
    if (!text) return
    inputEl.value = ''
    handleUser(text)
  })
  quickEl.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-q]')
    if (btn) handleUser(btn.dataset.q)
  })
}

function toggle() {
  if (opened) close()
  else open()
}

function open() {
  opened = true
  panelEl.hidden = false
  requestAnimationFrame(() => panelEl.classList.add('open'))
  if (!greeted) {
    greeted = true
    const chat = catalog.store.chat || {}
    addWelcome(chat)
    botSay(chat.greeting || 'Hello! How can I help you?')
    setQuickReplies(chat.quickReplies)
  }
  inputEl?.focus()
}

function close() {
  opened = false
  panelEl.classList.remove('open')
  setTimeout(() => {
    if (!opened) panelEl.hidden = true
  }, 220)
}

function scrollLog() {
  if (logEl) logEl.scrollTop = logEl.scrollHeight
}

function addBubble(role, html) {
  const isBot = role.includes('bot')
  const el = document.createElement('div')
  el.className = `chat-msg ${role}`
  el.innerHTML = isBot
    ? `<span class="chat-msg-avatar" aria-hidden="true"><img src="${GENIE_AVATAR}" alt="" /></span><div class="chat-msg-body">${html}</div>`
    : html
  logEl.appendChild(el)
  scrollLog()
  return el
}

function addWelcome(chat) {
  const wrap = document.createElement('div')
  wrap.className = 'chat-welcome'
  wrap.innerHTML = `
    <i class="chat-spark s1" aria-hidden="true"></i>
    <i class="chat-spark s2" aria-hidden="true"></i>
    <i class="chat-spark s3" aria-hidden="true"></i>
    <img src="${GENIE_FULL}" alt="" />
    <strong>${escapeHtml(chat.name || 'Studio Genie')}</strong>
    <em>Your AI assistant</em>
  `
  logEl.appendChild(wrap)
  scrollLog()
}

function setQuickReplies(list) {
  if (!quickEl) return
  quickEl.innerHTML = ''
  if (!list || !list.length) return
  list.slice(0, 5).forEach((text) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.dataset.q = text
    btn.textContent = text
    quickEl.appendChild(btn)
  })
}

function botSay(text, options = {}) {
  const typing = addBubble('bot typing', '<span></span><span></span><span></span>')
  setTimeout(() => {
    typing.remove()
    let html = escapeHtml(text).replace(/\n/g, '<br />')
    if (options.cta) {
      html += `<a class="chat-cta" href="${options.cta.href}"${
        options.cta.external ? ' target="_blank" rel="noopener"' : ''
      }>${escapeHtml(options.cta.label)}</a>`
    }
    addBubble('bot', html)
    if (options.quick) setQuickReplies(options.quick)
  }, 420)
}

function handleUser(text) {
  addBubble('user', escapeHtml(text))
  setQuickReplies([])
  if (apiUrl) {
    askAi(text)
  } else {
    setTimeout(() => respond(text), 180)
  }
}

function setBusy(value) {
  busy = value
  if (inputEl) inputEl.disabled = value
  const send = panelEl ? panelEl.querySelector('.chat-input button') : null
  if (send) send.disabled = value
}

function systemPrompt() {
  const store = catalog.store || {}
  const chat = store.chat || {}
  const pay = store.payments || {}
  const ship = store.shipping || {}
  const products = catalog.products || []
  const categories = store.categories || []
  const addresses = store.addresses || []

  const productLines = products.map(
    (p) => `- ${p.name}: ${Number(p.price) > 0 ? money(p.price) : 'price on request'}`
  )

  const categoryLines = categories
    .map((c) => {
      const subs = (c.subcategories || []).map((s) => s.name).filter(Boolean)
      return `- ${c.name}${subs.length ? ' (' + subs.join(', ') + ')' : ''}`
    })
    .filter(Boolean)

  const methods = []
  if (pay.upiId && pay.upiId !== 'yourname@upi') methods.push('UPI')
  if (pay.razorpayLink) methods.push('card and netbanking via Razorpay')
  if (pay.bank && (pay.bank.accountNumber || pay.bank.ifsc)) methods.push('bank transfer')

  const shippingLine = ship.enabled
    ? `Shipping: flat ₹${Number(ship.flatRate) || 0} per order${
        Number(ship.freeThreshold) > 0 ? `, free above ₹${Number(ship.freeThreshold)}` : ''
      }.`
    : ''

  const addressLines = addresses
    .map((a) => {
      const parts = [a.label, ...(Array.isArray(a.lines) ? a.lines : [])]
        .map((x) => String(x || '').trim())
        .filter(Boolean)
      return parts.length ? `- ${parts.join(', ')}${a.phone ? ' | ' + a.phone : ''}` : ''
    })
    .filter(Boolean)

  const knowledgeLines = (Array.isArray(chat.knowledge) ? chat.knowledge : [])
    .map((entry) => {
      const q = String(entry.q || entry.question || '').trim()
      const a = String(entry.a || entry.answer || '').trim()
      return q && a ? `Q: ${q}\nA: ${a}` : ''
    })
    .filter(Boolean)

  return [
    'You are the customer support assistant for Koncrete Art Kitchen, a design-led studio (Est. 2024) that makes custom LED-backlit name plates.',
    'Reply in the same language the customer uses (Hindi, Roman Hindi/Urdu, or English). Keep replies short, warm and helpful (2 to 4 sentences).',
    'Use ONLY the business information provided below. Never invent prices, delivery times, warranties, discounts, materials or specifications. If you are unsure, ask the customer to contact the studio on WhatsApp.',
    'Do not mention product materials or technical specifications.',
    'Only answer questions about Koncrete Art Kitchen, its products, ordering, payments, delivery and custom work. Politely decline anything unrelated, and never produce harmful, political or off-topic content.',
    'To order: choose a product on the shop page, add to cart, open checkout, choose a payment method, then confirm the order on WhatsApp.',
    'Shop page: ./shop.html. Checkout page: ./checkout.html.',
    chat.greeting ? 'Brand greeting style: ' + chat.greeting : '',
    String(chat.about || '').trim() ? 'About the studio (from the owner):\n' + String(chat.about).trim() : '',
    products.length ? 'Products and prices:\n' + productLines.join('\n') : '',
    categoryLines.length ? 'Categories:\n' + categoryLines.join('\n') : '',
    methods.length
      ? 'Accepted payment methods: ' + methods.join(', ') + '. Direct customers to the checkout page for details.'
      : 'Do not state payment methods; direct customers to the checkout page.',
    shippingLine,
    addressLines.length ? 'Studio address(es):\n' + addressLines.join('\n') : '',
    knowledgeLines.length ? 'Owner knowledge base:\n' + knowledgeLines.join('\n') : ''
  ]
    .filter(Boolean)
    .join('\n')
}

async function askAi(text) {
  if (busy) return
  setBusy(true)
  history.push({ role: 'user', content: text })
  const typing = addBubble('bot typing', '<span></span><span></span><span></span>')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25000)
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: systemPrompt(), messages: history.slice(-12) }),
      signal: controller.signal
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.reply) throw new Error(data.error || `HTTP ${res.status}`)
    typing.remove()
    history.push({ role: 'assistant', content: data.reply })
    addBubble('bot', escapeHtml(data.reply).replace(/\n/g, '<br />'))
    scrollLog()
  } catch {
    typing.remove()
    respond(text)
  } finally {
    clearTimeout(timer)
    setBusy(false)
  }
}

function respond(text) {
  const chat = catalog.store.chat || {}
  const knowledge = Array.isArray(chat.knowledge) ? chat.knowledge : []
  const normalized = normalize(text)
  const tokens = tokenize(text)

  const best = bestKnowledge(knowledge, normalized, tokens)
  if (best && best.score >= 0.5) {
    botSay(best.answer)
    return
  }

  const intent = detectIntent(normalized, tokens)
  const reply = answers[intent] ? answers[intent]() : null
  if (reply) {
    botSay(reply.text, { cta: reply.cta, quick: reply.quick })
    return
  }

  botSay(
    'I do not have an answer for that yet. Please send it to us on WhatsApp and we will reply shortly.',
    {
      cta: hasContact()
        ? { label: 'Ask on WhatsApp', href: whatsappHref('Hello, I have a question: ' + text), external: true }
        : { label: 'Go to shop', href: './shop.html' },
      quick: ['Products', 'Price', 'How to order', 'Payment options']
    }
  )
}

function bestKnowledge(entries, normalized, tokens) {
  let best = null
  entries.forEach((entry) => {
    const q = entry.q || entry.question || ''
    const a = entry.a || entry.answer || ''
    if (!q || !a) return
    const score = matchScore(q, normalized, tokens)
    if (!best || score > best.score) best = { answer: a, score }
  })
  return best
}

function matchScore(question, normalized, tokens) {
  const qNorm = normalize(question)
  if (!qNorm || !normalized) return 0
  if (normalized.includes(qNorm) || qNorm.includes(normalized)) return 1
  const qTokens = tokenize(question)
  if (!qTokens.length) return 0
  const set = new Set(tokens)
  let hits = 0
  qTokens.forEach((w) => {
    if (set.has(w)) hits += 1
  })
  return hits / qTokens.length
}

const INTENTS = {
  greeting: ['hi', 'hii', 'hello', 'hey', 'namaste', 'namaskar', 'salaam', 'assalam', 'good', 'morning', 'evening'],
  products: ['product', 'products', 'catalog', 'catalogue', 'collection', 'design', 'designs', 'nameplate', 'nameplate', 'plates', 'plate', 'item', 'items', 'kya', 'banate', 'milta', 'options'],
  price: ['price', 'prices', 'pricing', 'cost', 'rate', 'rates', 'how much', 'kitna', 'kitne', 'paisa', 'budget', 'charge', 'charges'],
  order: ['order', 'buy', 'purchase', 'book', 'cart', 'kharid', 'khareed', 'order karna', 'kaise order', 'checkout'],
  payment: ['payment', 'pay', 'upi', 'gpay', 'phonepe', 'paytm', 'card', 'bank', 'transfer', 'razorpay', 'netbanking', 'paisa'],
  delivery: ['delivery', 'deliver', 'shipping', 'ship', 'courier', 'dispatch', 'pahunch', 'bhej', 'kitne din', 'time', 'kab'],
  custom: ['custom', 'customise', 'customize', 'personalise', 'personalize', 'personalised', 'naam', 'name', 'logo', 'size', 'apna', 'design'],
  contact: ['contact', 'whatsapp', 'call', 'phone', 'number', 'email', 'reach', 'baat', 'sampark'],
  hours: ['time', 'timing', 'timings', 'open', 'hours', 'kab', 'kholte', 'available'],
  about: ['about', 'who', 'studio', 'company', 'koncrete', 'kitchen', 'kahan', 'location', 'address'],
  warranty: ['warranty', 'guarantee', 'return', 'refund', 'damage', 'quality', 'material', 'materials', 'made', 'banaya']
}

function detectIntent(normalized, tokens) {
  let bestIntent = null
  let bestScore = 0
  const set = new Set(tokens)
  Object.entries(INTENTS).forEach(([intent, words]) => {
    let hits = 0
    words.forEach((w) => {
      if (w.includes(' ')) {
        if (normalized.includes(w)) hits += 1
      } else if (set.has(w)) {
        hits += 1
      }
    })
    if (hits > bestScore) {
      bestScore = hits
      bestIntent = intent
    }
  })
  return bestIntent
}

function productList() {
  const available = catalog.products.filter((p) => p.available !== false)
  return available.length ? available : catalog.products
}

const answers = {
  greeting() {
    return {
      text: 'Hello! I can help you with products, prices, ordering and payments. What would you like to know?',
      quick: ['Products', 'Price', 'How to order', 'Payment options', 'Delivery']
    }
  },
  products() {
    const list = productList()
    if (!list.length) return { text: 'No products have been added yet. Please check back soon.', cta: { label: 'Open shop', href: './shop.html' } }
    const names = list.slice(0, 6).map((p) => p.name).join(', ')
    return {
      text: `We make custom LED-backlit name plates. A few designs: ${names}${list.length > 6 ? ', and more' : ''}.\nYou can see the full collection on the shop page.`,
      cta: { label: 'Open shop', href: './shop.html' },
      quick: ['Price', 'How to order', 'Custom design']
    }
  },
  price() {
    const list = productList()
    if (!list.length) return { text: 'The price list is not available yet. Please ask us on WhatsApp.' }
    const lines = list.slice(0, 5).map((p) => `• ${p.name} — ${Number(p.price) > 0 ? money(p.price) : 'price on request'}`)
    return {
      text: `Our starting prices:\n${lines.join('\n')}\nThe rate may vary slightly with custom size and design.`,
      cta: { label: 'Open shop', href: './shop.html' },
      quick: ['How to order', 'Custom design', 'Payment options']
    }
  },
  order() {
    return {
      text: 'Ordering is easy:\n1. Choose a product on the shop page\n2. Click "Add to cart"\n3. Open "Checkout" from the cart\n4. Enter your details and choose a payment method\n5. Click "Confirm order on WhatsApp".\nWe confirm on WhatsApp and take it forward.',
      cta: { label: 'Go to shop', href: './shop.html' },
      quick: ['Payment options', 'Delivery', 'Custom design']
    }
  },
  payment() {
    const pay = catalog.store.payments || {}
    const methods = []
    if (pay.upiId && pay.upiId !== 'yourname@upi') methods.push('UPI')
    if (pay.razorpayLink) methods.push('Card / Netbanking (Razorpay)')
    if (pay.bank && (pay.bank.accountNumber || pay.bank.ifsc)) methods.push('Bank transfer')
    const text = methods.length
      ? `We accept these payment options: ${methods.join(', ')}. Full details are on the checkout page.`
      : 'Payment options are shown on the checkout page. When you place an order, we send the details on WhatsApp.'
    return {
      text,
      cta: { label: 'Open checkout', href: './checkout.html' },
      quick: ['How to order', 'Delivery']
    }
  },
  delivery() {
    return {
      text: 'Every piece is made in-house, so it takes a little time. We share the exact delivery time and shipping charges on WhatsApp based on your PIN code. Pan-India courier is available.',
      cta: hasContact() ? { label: 'Ask on WhatsApp', href: whatsappHref('What is the delivery time and shipping charge?'), external: true } : null,
      quick: ['How to order', 'Custom design']
    }
  },
  custom() {
    return {
      text: 'Yes, we make custom designs — send us your name, size, theme or layout. We develop the design, share a preview with you, and then make it.',
      cta: hasContact() ? { label: 'Send custom design', href: whatsappHref('Hello, I would like a custom design'), external: true } : { label: 'Open shop', href: './shop.html' },
      quick: ['Price', 'How to order']
    }
  },
  contact() {
    if (!hasContact()) {
      return { text: 'The WhatsApp number will be added soon. For now you can order from the shop page.', cta: { label: 'Open shop', href: './shop.html' } }
    }
    return {
      text: 'You can message us on WhatsApp. We reply quickly.',
      cta: { label: 'Open WhatsApp', href: whatsappHref('Hello!'), external: true }
    }
  },
  hours() {
    return {
      text: 'We accept online orders 24x7. Leave a message on WhatsApp and we will reply during working hours.',
      cta: hasContact() ? { label: 'Message on WhatsApp', href: whatsappHref('Hello!'), external: true } : null
    }
  },
  about() {
    return {
      text: 'Koncrete Art Kitchen is a design-led studio (Est. 2024). We design custom LED-backlit name plates and do all the making — design, 3D printing, finishing, mould making and casting — in our in-house studio.',
      quick: ['Products', 'How to order', 'Price']
    }
  },
  warranty() {
    return {
      text: 'We check every piece ourselves before shipping. If an item arrives damaged, defective or wrong, tell us on WhatsApp with photos within 48 hours of delivery — we will repair, replace or refund. Made-to-order/personalised pieces are not returnable for change of mind.',
      cta: { label: 'Read return policy', href: './returns.html' },
      quick: ['How to order', 'Payment options']
    }
  }
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  })
}

async function init() {
  buildWidget()
  try {
    const res = await fetch(CATALOG_URL + '?t=' + Date.now(), { cache: 'no-store' })
    catalog = await res.json()
  } catch {
    catalog = { store: {}, products: [] }
  }
  const nameEl = document.getElementById('chatName')
  if (nameEl && catalog.store.chat && catalog.store.chat.name) {
    nameEl.textContent = catalog.store.chat.name
  }
  apiUrl = String((catalog.store.chat && catalog.store.chat.apiUrl) || '')
    .trim()
    .replace(/\/+$/, '')
  const statusEl = document.getElementById('chatStatus')
  if (statusEl) statusEl.textContent = apiUrl ? 'AI online' : 'Assistant online'

  const imgs = (catalog.store && catalog.store.images) || {}
  if (imgs.genieAvatar) {
    GENIE_AVATAR = assetPath(imgs.genieAvatar)
    document
      .querySelectorAll('.chat-launcher-img, .chat-avatar img, .chat-msg-avatar img')
      .forEach((el) => (el.src = GENIE_AVATAR))
  }
  if (imgs.genie) {
    GENIE_FULL = assetPath(imgs.genie)
    document.querySelectorAll('.chat-welcome img').forEach((el) => (el.src = GENIE_FULL))
  }
}

init()
