const CART_KEY = 'kak_cart_v1'
const CATALOG_URL = './data/catalog.json'

let catalog = { store: {}, products: [] }
let cart = loadCart()

const grid = document.getElementById('productGrid')
const drawer = document.getElementById('cartDrawer')
const overlay = document.getElementById('cartOverlay')
const cartItemsEl = document.getElementById('cartItems')
const cartTotalEl = document.getElementById('cartTotal')
const cartCountEl = document.getElementById('cartCount')
const checkoutBtn = document.getElementById('checkoutBtn')
const openCartBtn = document.getElementById('openCart')
const closeCartBtn = document.getElementById('closeCart')
const cartEmptyEl = document.getElementById('cartEmpty')
const toastEl = document.getElementById('toast')

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || []
  } catch {
    return []
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
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

function imgSrc(product) {
  const src = product.image || ''
  if (/^https?:/i.test(src)) return src
  return './' + src.replace(/^\.?\//, '')
}

function findProduct(id) {
  return catalog.products.find((p) => p.id === id)
}

async function init() {
  try {
    const res = await fetch(CATALOG_URL, { cache: 'no-store' })
    catalog = await res.json()
  } catch {
    catalog = { store: {}, products: [] }
  }
  renderProducts()
  renderCart()
  bindEvents()
}

function renderProducts() {
  if (!grid) return
  if (!catalog.products.length) {
    grid.innerHTML = '<p class="shop-empty">No products yet. Add them from the Admin page.</p>'
    return
  }
  grid.innerHTML = catalog.products
    .map((p) => {
      const price = Number(p.price) > 0 ? money(p.price) : 'Price on request'
      const out = p.available === false
      return `
        <article class="product ${out ? 'is-out' : ''}">
          <div class="product-media">
            <img src="${imgSrc(p)}" alt="${escapeHtml(p.name)}" loading="lazy" />
            ${out ? '<span class="badge">Sold out</span>' : ''}
          </div>
          <div class="product-body">
            <h3>${escapeHtml(p.name)}</h3>
            <p class="product-desc">${escapeHtml(p.description || '')}</p>
            <div class="product-foot">
              <span class="price">${price}</span>
              <button class="btn btn-solid add-btn" data-id="${escapeHtml(p.id)}" ${
                out ? 'disabled' : ''
              }>Add to cart</button>
            </div>
          </div>
        </article>`
    })
    .join('')
}

function renderCart() {
  if (!cartItemsEl) return
  if (!cart.length) {
    cartItemsEl.innerHTML = ''
    if (cartEmptyEl) cartEmptyEl.hidden = false
  } else {
    if (cartEmptyEl) cartEmptyEl.hidden = true
    cartItemsEl.innerHTML = cart
      .map((item) => {
        const p = findProduct(item.id)
        const name = p ? p.name : item.id
        const image = p ? imgSrc(p) : ''
        const price = p ? Number(p.price) : 0
        return `
          <li class="cart-line">
            <img src="${image}" alt="${escapeHtml(name)}" />
            <div class="cart-line-info">
              <strong>${escapeHtml(name)}</strong>
              <span>${price > 0 ? money(price) : 'Price on request'}</span>
              <div class="qty">
                <button data-act="dec" data-id="${escapeHtml(item.id)}" aria-label="Decrease">−</button>
                <span>${item.qty}</span>
                <button data-act="inc" data-id="${escapeHtml(item.id)}" aria-label="Increase">+</button>
              </div>
            </div>
            <button class="cart-remove" data-act="remove" data-id="${escapeHtml(item.id)}" aria-label="Remove">×</button>
          </li>`
      })
      .join('')
  }
  const total = cart.reduce((sum, item) => {
    const p = findProduct(item.id)
    return sum + (p ? Number(p.price) * item.qty : 0)
  }, 0)
  if (cartTotalEl) cartTotalEl.textContent = money(total)
  const count = cart.reduce((n, item) => n + item.qty, 0)
  if (cartCountEl) {
    cartCountEl.textContent = String(count)
    cartCountEl.hidden = count === 0
  }
}

function addToCart(id) {
  const existing = cart.find((item) => item.id === id)
  if (existing) existing.qty += 1
  else cart.push({ id, qty: 1 })
  saveCart()
  renderCart()
  showToast('Added to cart')
}

function changeQty(id, delta) {
  const item = cart.find((i) => i.id === id)
  if (!item) return
  item.qty += delta
  if (item.qty <= 0) cart = cart.filter((i) => i.id !== id)
  saveCart()
  renderCart()
}

function removeItem(id) {
  cart = cart.filter((i) => i.id !== id)
  saveCart()
  renderCart()
}

function openCart() {
  drawer?.classList.add('open')
  overlay?.classList.add('show')
}

function closeCart() {
  drawer?.classList.remove('open')
  overlay?.classList.remove('show')
}

function checkout() {
  if (!cart.length) return
  const number = String(catalog.store.whatsapp || '').replace(/[^\d]/g, '')
  const lines = cart.map((item) => {
    const p = findProduct(item.id)
    const name = p ? p.name : item.id
    const price = p ? Number(p.price) : 0
    return `• ${name} × ${item.qty}${price > 0 ? ' — ' + money(price * item.qty) : ''}`
  })
  const total = cart.reduce((sum, item) => {
    const p = findProduct(item.id)
    return sum + (p ? Number(p.price) * item.qty : 0)
  }, 0)
  const text = [
    'New order — Koncrete Art Kitchen',
    '',
    ...lines,
    '',
    `Total: ${money(total)}`,
    '',
    'Please confirm availability and delivery.'
  ].join('\n')
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
  showToast._t = setTimeout(() => toastEl.classList.remove('show'), 2000)
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  })
}

function bindEvents() {
  const menuBtn = document.getElementById('menuBtn')
  const nav = document.getElementById('nav')
  menuBtn?.addEventListener('click', () => {
    const open = nav.classList.toggle('open')
    menuBtn.setAttribute('aria-expanded', String(open))
  })

  grid?.addEventListener('click', (event) => {
    const btn = event.target.closest('.add-btn')
    if (btn) addToCart(btn.dataset.id)
  })
  cartItemsEl?.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-act]')
    if (!btn) return
    const { act, id } = btn.dataset
    if (act === 'inc') changeQty(id, 1)
    else if (act === 'dec') changeQty(id, -1)
    else if (act === 'remove') removeItem(id)
  })
  openCartBtn?.addEventListener('click', openCart)
  closeCartBtn?.addEventListener('click', closeCart)
  overlay?.addEventListener('click', closeCart)
  checkoutBtn?.addEventListener('click', checkout)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCart()
  })
}

init()
