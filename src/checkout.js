const CART_KEY = 'kak_cart_v1'
const CATALOG_URL = './data/catalog.json'

let catalog = { store: {}, products: [] }
let cart = loadCart()
let currentMethod = 'upi'

const summaryItemsEl = document.getElementById('summaryItems')
const summaryTotalEl = document.getElementById('summaryTotal')
const summarySubtotalEl = document.getElementById('summarySubtotal')
const summaryShipEl = document.getElementById('summaryShip')
const summaryShipRowEl = document.getElementById('summaryShipRow')
const upiIdEl = document.getElementById('upiId')
const upiAmountEl = document.getElementById('upiAmount')
const upiPayBtn = document.getElementById('upiPayBtn')
const upiQrEl = document.getElementById('upiQr')
const copyUpiBtn = document.getElementById('copyUpi')
const bankDetailsEl = document.getElementById('bankDetails')
const razorpayBtn = document.getElementById('razorpayBtn')
const cardHintEl = document.getElementById('cardHint')
const confirmBtn = document.getElementById('confirmBtn')
const payTabs = document.getElementById('payTabs')
const toastEl = document.getElementById('toast')

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || []
  } catch {
    return []
  }
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

function findProduct(id) {
  return catalog.products.find((p) => p.id === id)
}

function imgSrc(product) {
  const list = Array.isArray(product.images) ? product.images.filter(Boolean) : []
  const src = list[0] || product.image || ''
  if (!src) return ''
  if (/^https?:/i.test(src)) return src
  return './' + src.replace(/^\.?\//, '')
}

function total() {
  return cart.reduce((sum, item) => {
    const p = findProduct(item.id)
    return sum + (p ? Number(p.price) * item.qty : 0)
  }, 0)
}

function shippingQuote() {
  const ship = catalog.store.shipping || {}
  const subtotal = total()
  if (!ship.enabled) return { amount: 0, label: 'Free' }
  const flat = Number(ship.flatRate) || 0
  const freeAbove = Number(ship.freeThreshold) || 0
  if (freeAbove > 0 && subtotal >= freeAbove) return { amount: 0, label: 'Free' }
  return { amount: flat, label: flat > 0 ? money(flat) : 'Free' }
}

function grandTotal() {
  return total() + shippingQuote().amount
}

async function init() {
  try {
    const res = await fetch(CATALOG_URL + '?t=' + Date.now(), { cache: 'no-store' })
    catalog = await res.json()
  } catch {
    catalog = { store: {}, products: [] }
  }
  if (!cart.length) {
    renderEmpty()
    return
  }
  renderSummary()
  renderPayments()
  bindEvents()
  setupAccount()
}

async function setupAccount() {
  const auth = await authApi()
  const hint = document.getElementById('accountHint')
  if (!auth) return
  try {
    await auth.ready
  } catch {
    return
  }
  if (!auth.enabled) return
  const user = auth.currentUser()
  if (user) {
    if (hint) {
      hint.hidden = false
      hint.textContent = `Signed in as ${user.email}. This order will be saved to your account.`
    }
    try {
      const profile = await auth.getProfile()
      if (profile) fillProfile(profile)
    } catch {
      /* profile optional */
    }
  } else if (hint) {
    hint.hidden = false
    hint.innerHTML = 'Want to track your orders? <a href="#" id="accountLoginLink">Login</a> or create an account (optional).'
    const link = document.getElementById('accountLoginLink')
    link?.addEventListener('click', (event) => {
      event.preventDefault()
      auth.open()
    })
  }
}

function authApi() {
  return new Promise((resolve) => {
    if (window.KAKAuth) return resolve(window.KAKAuth)
    let tries = 0
    const timer = setInterval(() => {
      tries += 1
      if (window.KAKAuth || tries > 60) {
        clearInterval(timer)
        resolve(window.KAKAuth || null)
      }
    }, 50)
  })
}

function fillProfile(profile) {
  setIfEmpty('custName', profile.name)
  setIfEmpty('custPhone', profile.phone)
  setIfEmpty('custAddress', profile.address)
}

function setIfEmpty(id, value) {
  const el = document.getElementById(id)
  if (el && !el.value && value) el.value = value
}

function renderEmpty() {
  if (summaryItemsEl) {
    summaryItemsEl.innerHTML =
      '<li class="pay-muted">Your cart is empty. <a href="./shop.html">Back to shop</a></li>'
  }
  confirmBtn?.setAttribute('disabled', 'disabled')
}

function renderSummary() {
  if (!summaryItemsEl) return
  summaryItemsEl.innerHTML = cart
    .map((item) => {
      const p = findProduct(item.id)
      const name = p ? p.name : item.id
      const image = p ? imgSrc(p) : ''
      const line = p ? Number(p.price) * item.qty : 0
      return `
        <li class="summary-line">
          <img src="${image}" alt="${escapeHtml(name)}" />
          <div>
            <strong>${escapeHtml(name)}</strong>
            ${
              item.custom
                ? `<em class="summary-custom">Customisation: ${escapeHtml(item.custom)}</em>`
                : ''
            }
            <span>Qty ${item.qty}</span>
          </div>
          <span>${line > 0 ? money(line) : '—'}</span>
        </li>`
    })
    .join('')
  const quote = shippingQuote()
  if (summarySubtotalEl) summarySubtotalEl.textContent = money(total())
  if (summaryShipEl) summaryShipEl.textContent = quote.label
  if (summaryShipRowEl) summaryShipRowEl.hidden = !(catalog.store.shipping || {}).enabled
  summaryTotalEl.textContent = money(grandTotal())
}

function upiLink() {
  const pay = catalog.store.payments || {}
  const params = new URLSearchParams({
    pa: pay.upiId || '',
    pn: pay.upiName || 'Koncrete Art Kitchen',
    am: String(grandTotal()),
    cu: 'INR',
    tn: 'Koncrete Art Kitchen order'
  })
  return `upi://pay?${params.toString()}`
}

function renderPayments() {
  const pay = catalog.store.payments || {}
  const amount = money(grandTotal())

  upiIdEl.textContent = pay.upiId || 'Not set'
  upiAmountEl.textContent = amount
  const link = upiLink()
  if (pay.upiId && pay.upiId !== 'yourname@upi') {
    upiPayBtn.href = link
  } else {
    upiPayBtn.href = '#'
    upiPayBtn.addEventListener('click', (e) => {
      e.preventDefault()
      showToast('Set your UPI ID in Admin first')
    })
  }
  if (upiQrEl) {
    upiQrEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
      link
    )}`
  }

  const bank = pay.bank || {}
  const rows = [
    ['Account name', bank.accountName],
    ['Account number', bank.accountNumber],
    ['IFSC', bank.ifsc],
    ['Bank', bank.bankName]
  ]
  if (rows.some(([, v]) => v)) {
    bankDetailsEl.innerHTML = rows
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(v || '—')}</dd></div>`)
      .join('')
  } else {
    bankDetailsEl.innerHTML =
      '<p class="pay-muted">Bank details not set. Add them from the Admin page.</p>'
  }

  if (pay.razorpayLink) {
    razorpayBtn.href = pay.razorpayLink
    cardHintEl.textContent = ''
  } else {
    razorpayBtn.href = '#'
    razorpayBtn.addEventListener('click', (e) => {
      e.preventDefault()
      showToast('Set your Razorpay payment link in Admin first')
    })
    cardHintEl.textContent = 'Not configured yet — add a Razorpay payment link in Admin.'
  }
}

function bindEvents() {
  const menuBtn = document.getElementById('menuBtn')
  const nav = document.getElementById('nav')
  menuBtn?.addEventListener('click', () => {
    const open = nav.classList.toggle('open')
    menuBtn.setAttribute('aria-expanded', String(open))
  })

  payTabs?.addEventListener('click', (event) => {
    const tab = event.target.closest('.pay-tab')
    if (!tab) return
    currentMethod = tab.dataset.pay
    document.querySelectorAll('.pay-tab').forEach((t) => t.classList.toggle('active', t === tab))
    document.querySelectorAll('.pay-panel').forEach((panel) => {
      panel.hidden = panel.dataset.panel !== currentMethod
    })
  })

  copyUpiBtn?.addEventListener('click', async () => {
    const value = (catalog.store.payments || {}).upiId || ''
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      showToast('UPI ID copied')
    } catch {
      showToast('Copy failed — long-press to copy')
    }
  })

  confirmBtn?.addEventListener('click', confirmOrder)
}

function methodLabel() {
  return { upi: 'UPI', bank: 'Bank transfer', card: 'Card / Netbanking' }[currentMethod]
}

function confirmOrder() {
  if (!cart.length) return
  const name = document.getElementById('custName').value.trim()
  const phone = document.getElementById('custPhone').value.trim()
  const address = document.getElementById('custAddress').value.trim()
  const note = document.getElementById('custNote').value.trim()

  const lines = cart.map((item) => {
    const p = findProduct(item.id)
    const label = p ? p.name : item.id
    const custom = item.custom ? ` (Customisation: ${item.custom})` : ''
    return `• ${label} × ${item.qty}${custom}`
  })
  const text = [
    'New order — Koncrete Art Kitchen',
    '',
    ...lines,
    '',
    `Total: ${money(grandTotal())}`,
    (catalog.store.shipping || {}).enabled ? `Shipping: ${shippingQuote().label}` : '',
    `Payment: ${methodLabel()}`,
    '',
    `Name: ${name || '—'}`,
    `Phone: ${phone || '—'}`,
    `Address: ${address || '—'}`,
    note ? `Note: ${note}` : '',
    '',
    'Please confirm availability and share payment confirmation.'
  ]
    .filter(Boolean)
    .join('\n')

  const number = String(catalog.store.whatsapp || '').replace(/[^\d]/g, '')
  if (!number || number === '910000000000') {
    showToast('Set your WhatsApp number in Admin first')
    return
  }
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank')
  const order = buildOrder({ name, phone, address, note })
  saveOrderToAccount(order)
  sendOrderAlert(order)
}

function buildOrder({ name, phone, address, note }) {
  return {
    items: cart.map((item) => {
      const p = findProduct(item.id)
      return {
        id: item.id,
        name: p ? p.name : item.id,
        qty: item.qty,
        price: p ? Number(p.price) : 0,
        custom: item.custom || ''
      }
    }),
    total: money(grandTotal()),
    method: methodLabel(),
    name,
    phone,
    address,
    note
  }
}

function saveOrderToAccount(order) {
  const auth = window.KAKAuth
  if (!auth || !auth.enabled || !auth.currentUser()) return
  auth.saveOrder(order).catch(() => {})
  auth.saveProfile({ name: order.name, phone: order.phone, address: order.address }).catch(() => {})
}

function sendOrderAlert(order) {
  const email = ((catalog.store.orders || {}).alertEmail || '').trim()
  if (!email) return
  const lines = (order.items || [])
    .map((item) => `- ${item.name} x ${item.qty} = ${money(item.price * item.qty)}`)
    .join('\n')
  const message = [
    'New order — Koncrete Art Kitchen',
    '',
    lines,
    '',
    `Total: ${order.total}`,
    `Payment: ${order.method}`,
    '',
    `Name: ${order.name || '-'}`,
    `Phone: ${order.phone || '-'}`,
    `Address: ${order.address || '-'}`,
    order.note ? `Note: ${order.note}` : ''
  ]
    .filter(Boolean)
    .join('\n')
  fetch('https://formsubmit.co/ajax/' + encodeURIComponent(email), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      _subject: 'New order — Koncrete Art Kitchen',
      name: order.name || 'Customer',
      message
    })
  }).catch(() => {})
}

function showToast(message) {
  if (!toastEl) return
  toastEl.textContent = message
  toastEl.classList.add('show')
  clearTimeout(showToast._t)
  showToast._t = setTimeout(() => toastEl.classList.remove('show'), 2200)
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  })
}

init()
