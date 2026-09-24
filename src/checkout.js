const CART_KEY = 'kak_cart_v1'
const CATALOG_URL = './data/catalog.json'

let catalog = { store: {}, products: [] }
let cart = loadCart()
let currentMethod = 'upi'

const summaryItemsEl = document.getElementById('summaryItems')
const summaryTotalEl = document.getElementById('summaryTotal')
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
  const src = product.image || ''
  if (/^https?:/i.test(src)) return src
  return './' + src.replace(/^\.?\//, '')
}

function total() {
  return cart.reduce((sum, item) => {
    const p = findProduct(item.id)
    return sum + (p ? Number(p.price) * item.qty : 0)
  }, 0)
}

async function init() {
  try {
    const res = await fetch(CATALOG_URL, { cache: 'no-store' })
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
            <span>Qty ${item.qty}</span>
          </div>
          <span>${line > 0 ? money(line) : '—'}</span>
        </li>`
    })
    .join('')
  summaryTotalEl.textContent = money(total())
}

function upiLink() {
  const pay = catalog.store.payments || {}
  const params = new URLSearchParams({
    pa: pay.upiId || '',
    pn: pay.upiName || 'Koncrete Art Kitchen',
    am: String(total()),
    cu: 'INR',
    tn: 'Koncrete Art Kitchen order'
  })
  return `upi://pay?${params.toString()}`
}

function renderPayments() {
  const pay = catalog.store.payments || {}
  const amount = money(total())

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
    return `• ${label} × ${item.qty}`
  })
  const text = [
    'New order — Koncrete Art Kitchen',
    '',
    ...lines,
    '',
    `Total: ${money(total())}`,
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
