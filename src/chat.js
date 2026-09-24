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

const GENIE_FULL = './brand/genie.webp'
const GENIE_AVATAR = './brand/genie-avatar.webp'

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
    botSay(chat.greeting || 'Namaste! Kaise madad kar sakta hoon?')
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
    <em>Aapki AI assistant</em>
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
  const products = catalog.products || []

  const productLines = products.map(
    (p) => `- ${p.name}: ${Number(p.price) > 0 ? money(p.price) : 'price on request'}`
  )

  const methods = []
  if (pay.upiId && pay.upiId !== 'yourname@upi') methods.push('UPI')
  if (pay.razorpayLink) methods.push('card and netbanking via Razorpay')
  if (pay.bank && (pay.bank.accountNumber || pay.bank.ifsc)) methods.push('bank transfer')

  return [
    'You are the customer support assistant for Koncrete Art Kitchen, a design-led studio (Est. 2024) that makes custom LED-backlit name plates.',
    'Reply in the same language the customer uses (Hindi, Roman Hindi/Urdu, or English). Keep replies short, warm and helpful (2 to 4 sentences).',
    'Never invent prices, delivery times, warranties, discounts, or product materials. If you are unsure, ask the customer to contact the studio on WhatsApp.',
    'Do not mention product materials or technical specifications.',
    'Only answer questions about Koncrete Art Kitchen, its products, ordering, payments, delivery and custom work. Politely decline anything unrelated, and never produce harmful, political or off-topic content.',
    'To order: choose a product on the shop page, add to cart, open checkout, choose a payment method, then confirm the order on WhatsApp.',
    'Shop page: ./shop.html. Checkout page: ./checkout.html.',
    chat.greeting ? 'Brand greeting style: ' + chat.greeting : '',
    products.length ? 'Products and prices:\n' + productLines.join('\n') : '',
    methods.length
      ? 'Accepted payment methods: ' + methods.join(', ') + '. Direct customers to the checkout page for details.'
      : 'Do not state payment methods; direct customers to the checkout page.'
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
    'Yeh sawaal mere paas filhal nahi hai. Aap seedha humein WhatsApp par bhej dein, hum jaldi jawab denge.',
    {
      cta: hasContact()
        ? { label: 'WhatsApp par poochein', href: whatsappHref('Namaste, mujhe ek sawaal hai: ' + text), external: true }
        : { label: 'Shop dekhein', href: './shop.html' },
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
      text: 'Namaste! Main aapko products, price, order aur payment ke baare me bata sakta hoon. Aap kya jaanna chahenge?',
      quick: ['Products', 'Price', 'How to order', 'Payment options', 'Delivery']
    }
  },
  products() {
    const list = productList()
    if (!list.length) return { text: 'Abhi products add nahi hue. Thodi der me dobara dekh lein.', cta: { label: 'Shop kholein', href: './shop.html' } }
    const names = list.slice(0, 6).map((p) => p.name).join(', ')
    return {
      text: `Hum custom LED-backlit name plates banate hain. Kuch designs: ${names}${list.length > 6 ? ', aur zyada' : ''}.\nPoora collection shop page par dekh sakte hain.`,
      cta: { label: 'Shop dekhein', href: './shop.html' },
      quick: ['Price', 'How to order', 'Custom design']
    }
  },
  price() {
    const list = productList()
    if (!list.length) return { text: 'Price list filhal available nahi hai. WhatsApp par poochein.' }
    const lines = list.slice(0, 5).map((p) => `• ${p.name} — ${Number(p.price) > 0 ? money(p.price) : 'price on request'}`)
    return {
      text: `Hamari starting prices:\n${lines.join('\n')}\nCustom size aur design ke hisaab se rate thoda alag ho sakta hai.`,
      cta: { label: 'Shop dekhein', href: './shop.html' },
      quick: ['How to order', 'Custom design', 'Payment options']
    }
  },
  order() {
    return {
      text: 'Order karna aasan hai:\n1. Shop page par product chunein\n2. "Add to cart" karein\n3. Cart se "Checkout" kholein\n4. Details aur payment method chunein\n5. "Confirm order on WhatsApp" par click karein.\nHum WhatsApp par confirm karke aage badhate hain.',
      cta: { label: 'Shop par jayein', href: './shop.html' },
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
      ? `Hum yeh payment options lete hain: ${methods.join(', ')}. Checkout page par poori details milengi.`
      : 'Payment options checkout page par milenge. Order karne par hum WhatsApp par details bhej dete hain.'
    return {
      text,
      cta: { label: 'Checkout kholein', href: './checkout.html' },
      quick: ['How to order', 'Delivery']
    }
  },
  delivery() {
    return {
      text: 'Har piece hum in-house banate hain, isliye thoda time lagta hai. Exact delivery time aur shipping charges WhatsApp par aapke pincode ke hisaab se bata dete hain. Pan-India courier available hai.',
      cta: hasContact() ? { label: 'WhatsApp par poochein', href: whatsappHref('Delivery time aur shipping charges?'), external: true } : null,
      quick: ['How to order', 'Custom design']
    }
  },
  custom() {
    return {
      text: 'Ji haan, hum custom design banate hain — apna naam, size, theme ya layout bhej dein. Hum design develop karke aapko preview dikhate hain, phir banate hain.',
      cta: hasContact() ? { label: 'Custom design bhejein', href: whatsappHref('Namaste, mujhe custom design chahiye'), external: true } : { label: 'Shop dekhein', href: './shop.html' },
      quick: ['Price', 'How to order']
    }
  },
  contact() {
    if (!hasContact()) {
      return { text: 'WhatsApp number jald hi add hoga. Filhal aap shop page se order kar sakte hain.', cta: { label: 'Shop dekhein', href: './shop.html' } }
    }
    return {
      text: 'Aap humein WhatsApp par message kar sakte hain. Hum jaldi reply karte hain.',
      cta: { label: 'WhatsApp kholein', href: whatsappHref('Namaste!'), external: true }
    }
  },
  hours() {
    return {
      text: 'Hum online orders 24x7 lete hain. WhatsApp par message chhod dein, hum working hours me reply karte hain.',
      cta: hasContact() ? { label: 'WhatsApp par message', href: whatsappHref('Namaste!'), external: true } : null
    }
  },
  about() {
    return {
      text: 'Koncrete Art Kitchen ek design-led studio hai (Est. 2024). Hum custom LED-backlit name plates design karte hain aur poori banavat — design, 3D printing, finishing, mould making aur casting — apne in-house studio me karte hain.',
      quick: ['Products', 'How to order', 'Price']
    }
  },
  warranty() {
    return {
      text: 'Har piece shipment se pehle hum khud check karte hain. Agar item damaged, defective ya galat mile to delivery ke 48 ghante ke andar photos ke saath WhatsApp par batayein — hum repair, replacement ya refund kar dete hain. Made-to-order/personalised pieces change of mind ke liye return nahi hote.',
      cta: { label: 'Return policy dekhein', href: './returns.html' },
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
    const res = await fetch(CATALOG_URL, { cache: 'no-store' })
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
}

init()
