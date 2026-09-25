/* Shared storefront helpers: catalog, cart, wishlist, product cards, search.
   Exposed on window.KAKFront. Safe to load on any page. */

const CATALOG_URL = './data/catalog.json'
const CART_KEY = 'kak_cart_v1'
const WISH_KEY = 'kak_wishlist_v1'

const state = {
  catalog: { store: {}, products: [] },
  cart: readJSON(CART_KEY, []),
  wishlist: readJSON(WISH_KEY, []),
  ready: null
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore storage failures */
  }
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  })
}

function resolveImg(src) {
  const value = String(src || '')
  if (!value) return ''
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  return './' + value.replace(/^\.?\//, '')
}

function money(value) {
  const code = (state.catalog.store && state.catalog.store.currencyCode) || 'INR'
  const symbol = (state.catalog.store && state.catalog.store.currencySymbol) || '₹'
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0
    }).format(value)
  } catch {
    return `${symbol}${Number(value || 0).toLocaleString('en-IN')}`
  }
}

function productImages(product) {
  const list = Array.isArray(product.images) ? product.images.filter(Boolean) : []
  if (list.length) return list
  return product.image ? [product.image] : []
}

function primaryImage(product) {
  return resolveImg(productImages(product)[0])
}

function findProduct(id) {
  return state.catalog.products.find((p) => p.id === id)
}

function productRating(product) {
  const reviews = Array.isArray(product.reviews)
    ? product.reviews.filter((r) => r && Number(r.rating) > 0)
    : []
  if (reviews.length) {
    const sum = reviews.reduce((total, r) => total + Number(r.rating), 0)
    return { average: sum / reviews.length, count: reviews.length }
  }
  return { average: Number(product.rating) || 0, count: Number(product.ratingCount) || 0 }
}

function categoryName(id) {
  const found = (state.catalog.store.categories || []).find((c) => c.id === id)
  return found ? found.name : id
}

function subcategories(categoryId) {
  const found = (state.catalog.store.categories || []).find((c) => c.id === categoryId)
  return found && Array.isArray(found.subcategories) ? found.subcategories : []
}

function subcategoryName(categoryId, subId) {
  const found = subcategories(categoryId).find((s) => s.id === subId)
  return found ? found.name : subId
}

function categoryHref(categoryId) {
  return `./category.html?cat=${encodeURIComponent(categoryId)}`
}

function productHref(productId) {
  return `./product.html?id=${encodeURIComponent(productId)}`
}

function renderCatNav() {
  const nav = document.getElementById('catNav')
  if (!nav) return
  const categories = (state.catalog.store && state.catalog.store.categories) || []
  const links = ['<a href="./shop.html">All</a>']
  categories.forEach((cat) => {
    links.push(`<a href="${categoryHref(cat.id)}">${escapeHtml(cat.name)}</a>`)
  })
  nav.innerHTML = links.join('')
}

/* ---------- icons ---------- */
const ICON_STAR =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"/></svg>'
const ICON_HEART =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.7l-1.4-1.3C5.4 14.7 2 11.6 2 7.9 2 5 4.2 2.8 7.1 2.8c1.6 0 3.2.8 4.2 2 1-1.2 2.6-2 4.2-2C18.4 2.8 20.6 5 20.6 7.9c0 3.7-3.4 6.8-8.6 11.5z"/></svg>'
const ICON_PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>'
const ICON_SEARCH =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4a6 6 0 104.9 9.5l4.3 4.3 1.4-1.4-4.3-4.3A6 6 0 0010 4zm0 2a4 4 0 110 8 4 4 0 010-8z"/></svg>'

function starRow(rating) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0))
  let out = '<span class="sf-stars" aria-hidden="true">'
  for (let i = 1; i <= 5; i += 1) {
    out += `<span class="sf-star${i <= Math.round(value) ? ' on' : ''}">${ICON_STAR}</span>`
  }
  return out + '</span>'
}

/* ---------- catalog ---------- */
function loadCatalog() {
  if (!state.ready) {
    state.ready = fetch(CATALOG_URL + '?t=' + Date.now(), { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        state.catalog = {
          store: data.store || {},
          products: Array.isArray(data.products) ? data.products : []
        }
        return state.catalog
      })
      .catch(() => state.catalog)
  }
  return state.ready
}

/* ---------- cart ---------- */
function cartCount() {
  return state.cart.reduce((n, item) => n + item.qty, 0)
}

function cartTotal() {
  return state.cart.reduce((sum, item) => {
    const p = findProduct(item.id)
    return sum + (p ? Number(p.price) * item.qty : 0)
  }, 0)
}

function persistCart() {
  writeJSON(CART_KEY, state.cart)
  syncCounts()
  window.dispatchEvent(new CustomEvent('kak:cart'))
}

function addToCart(id, qty = 1) {
  const existing = state.cart.find((item) => item.id === id)
  if (existing) existing.qty += qty
  else state.cart.push({ id, qty })
  persistCart()
  toast('Added to cart')
}

function setQty(id, qty) {
  const item = state.cart.find((i) => i.id === id)
  if (!item) return
  item.qty = qty
  if (item.qty <= 0) state.cart = state.cart.filter((i) => i.id !== id)
  persistCart()
}

function removeFromCart(id) {
  state.cart = state.cart.filter((i) => i.id !== id)
  persistCart()
}

/* ---------- wishlist ---------- */
function wishCount() {
  return state.wishlist.length
}

function isWished(id) {
  return state.wishlist.includes(id)
}

function persistWish() {
  writeJSON(WISH_KEY, state.wishlist)
  syncCounts()
  window.dispatchEvent(new CustomEvent('kak:wishlist'))
}

function toggleWish(id) {
  if (isWished(id)) state.wishlist = state.wishlist.filter((w) => w !== id)
  else state.wishlist.push(id)
  persistWish()
  toast(isWished(id) ? 'Saved to wishlist' : 'Removed from wishlist')
}

/* ---------- header counts ---------- */
function syncCounts() {
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    const count = cartCount()
    el.textContent = String(count)
    el.hidden = count === 0
  })
  document.querySelectorAll('[data-wish-count]').forEach((el) => {
    const count = wishCount()
    el.textContent = String(count)
    el.hidden = count === 0
  })
}

/* ---------- toast ---------- */
function toast(message) {
  let el = document.getElementById('toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'toast'
    el.className = 'toast'
    el.setAttribute('role', 'status')
    el.setAttribute('aria-live', 'polite')
    document.body.appendChild(el)
  }
  el.textContent = message
  el.classList.add('show')
  clearTimeout(toast._t)
  toast._t = setTimeout(() => el.classList.remove('show'), 2200)
}

/* ---------- product card ---------- */
function productCard(p, options = {}) {
  const id = escapeHtml(p.id)
  const out = p.available === false
  const images = productImages(p)
  const main = primaryImage(p)
  const price = Number(p.price) > 0 ? money(p.price) : 'Price on request'
  const oldPrice = Number(p.oldPrice) > 0 && Number(p.oldPrice) > Number(p.price) ? money(p.oldPrice) : ''
  const { average: rating, count: ratingCount } = productRating(p)
  const badge = out ? 'Sold out' : p.badge || ''
  const showThumbs = options.thumbs !== false && images.length > 1
  const thumbs = showThumbs
    ? `<div class="sf-thumbs">${images
        .map(
          (src, index) =>
            `<button type="button" class="sf-thumb${index === 0 ? ' active' : ''}" data-thumb="${escapeHtml(
              resolveImg(src)
            )}" aria-label="Image ${index + 1}"><img src="${escapeHtml(resolveImg(src))}" alt="" loading="lazy" /></button>`
        )
        .join('')}</div>`
    : ''
  const bullets = Array.isArray(p.bullets) ? p.bullets.filter(Boolean) : []
  const bulletList = bullets.length && options.bullets
    ? `<ul class="sf-bullets">${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
    : ''
  const ratingRow = rating > 0
    ? `<div class="sf-rating">${starRow(rating)}<span>${
        ratingCount > 0 ? `(${ratingCount})` : rating.toFixed(1)
      }</span></div>`
    : ''
  return `
    <article class="sf-card${out ? ' is-out' : ''}" data-id="${id}">
      <div class="sf-media">
        <img data-main-image src="${escapeHtml(main)}" alt="${escapeHtml(p.name)}" loading="lazy" />
        <a class="sf-media-link" href="${escapeHtml(productHref(p.id))}" aria-label="${escapeHtml(p.name)}"></a>
        ${badge ? `<span class="sf-badge">${escapeHtml(badge)}</span>` : ''}
        <button type="button" class="sf-wish${isWished(p.id) ? ' active' : ''}" data-wish="${id}" aria-label="Add to wishlist">${ICON_HEART}</button>
        ${thumbs}
      </div>
      <div class="sf-body">
        <h3 class="sf-title"><a href="${escapeHtml(productHref(p.id))}">${escapeHtml(p.name)}</a></h3>
        ${ratingRow}
        <p class="sf-desc">${escapeHtml(p.description || '')}</p>
        ${bulletList}
        <div class="sf-foot">
          <span class="sf-price">${price}${oldPrice ? `<s>${oldPrice}</s>` : ''}</span>
          <button type="button" class="sf-quick" data-add="${id}" ${
            out ? 'disabled' : ''
          } aria-label="Add to cart">${ICON_PLUS}</button>
        </div>
      </div>
    </article>`
}

/* ---------- search ---------- */
function searchProducts(query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return []
  return state.catalog.products.filter((p) => {
    const hay = [p.name, p.description, categoryName(p.category), subcategoryName(p.category, p.subcategory), ...(p.bullets || [])]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}

function openSearch() {
  let overlay = document.getElementById('sfSearch')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'sfSearch'
    overlay.className = 'sf-search'
    overlay.hidden = true
    overlay.innerHTML = `
      <div class="sf-search-panel">
        <div class="sf-search-bar">
          ${ICON_SEARCH}
          <input type="search" id="sfSearchInput" placeholder="Search products..." autocomplete="off" />
          <button type="button" class="sf-search-close" data-search-close aria-label="Close">Close</button>
        </div>
        <div class="sf-search-results" id="sfSearchResults"></div>
      </div>`
    document.body.appendChild(overlay)
    const input = overlay.querySelector('#sfSearchInput')
    const results = overlay.querySelector('#sfSearchResults')
    const render = () => {
      const list = searchProducts(input.value)
      if (!input.value.trim()) {
        results.innerHTML = '<p class="sf-search-hint">Type to search the collection.</p>'
        return
      }
      if (!list.length) {
        results.innerHTML = '<p class="sf-search-hint">No products matched.</p>'
        return
      }
      results.innerHTML = list
        .map(
          (p) => `<a class="sf-result" href="${escapeHtml(productHref(p.id))}">
            <img src="${escapeHtml(primaryImage(p))}" alt="" />
            <span><strong>${escapeHtml(p.name)}</strong><em>${escapeHtml(categoryName(p.category))}</em></span>
          </a>`
        )
        .join('')
    }
    input.addEventListener('input', render)
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.closest('[data-search-close]')) closeSearch()
    })
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeSearch()
    })
    render()
  }
  overlay.hidden = false
  document.body.classList.add('no-scroll')
  setTimeout(() => overlay.querySelector('#sfSearchInput')?.focus(), 30)
}

function closeSearch() {
  const overlay = document.getElementById('sfSearch')
  if (overlay) overlay.hidden = true
  document.body.classList.remove('no-scroll')
}

/* ---------- wishlist drawer ---------- */
function openWishlist() {
  let drawer = document.getElementById('sfWish')
  const items = state.wishlist.map((id) => findProduct(id)).filter(Boolean)
  const body = items.length
    ? items
        .map(
          (p) => `<li class="sf-wish-line">
            <a href="${escapeHtml(productHref(p.id))}"><img src="${escapeHtml(primaryImage(p))}" alt="" /></a>
            <div>
              <strong><a href="${escapeHtml(productHref(p.id))}">${escapeHtml(p.name)}</a></strong>
              <span>${Number(p.price) > 0 ? money(p.price) : 'Price on request'}</span>
            </div>
            <button type="button" class="sf-quick" data-add="${escapeHtml(p.id)}" aria-label="Add to cart">${ICON_PLUS}</button>
            <button type="button" class="sf-wish-remove" data-wish="${escapeHtml(p.id)}" aria-label="Remove">Close</button>
          </li>`
        )
        .join('')
    : '<li class="sf-wish-empty">Your wishlist is empty. Tap the heart on a product to save it.</li>'
  if (!drawer) {
    drawer = document.createElement('div')
    drawer.id = 'sfWish'
    drawer.className = 'sf-wish-drawer'
    document.body.appendChild(drawer)
    drawer.addEventListener('click', (event) => {
      if (event.target === drawer) closeWishlist()
    })
  }
  drawer.innerHTML = `
    <div class="sf-wish-panel">
      <div class="sf-wish-head">
        <h2>Wishlist</h2>
        <button type="button" class="sf-search-close" data-wish-close aria-label="Close">Close</button>
      </div>
      <ul class="sf-wish-list">${body}</ul>
      <a class="btn btn-solid sf-wish-shop" href="./shop.html">Go to shop</a>
    </div>`
  drawer.classList.add('open')
  drawer.hidden = false
  document.body.classList.add('no-scroll')
}

function closeWishlist() {
  const drawer = document.getElementById('sfWish')
  if (!drawer) return
  drawer.classList.remove('open')
  drawer.hidden = true
  document.body.classList.remove('no-scroll')
}

/* ---------- global bindings ---------- */
function bindGlobal() {
  document.addEventListener('click', (event) => {
    const add = event.target.closest('[data-add]')
    if (add) {
      addToCart(add.dataset.add)
      return
    }
    const wish = event.target.closest('[data-wish]')
    if (wish) {
      toggleWish(wish.dataset.wish)
      wish.classList.toggle('active')
      return
    }
    const thumb = event.target.closest('[data-thumb]')
    if (thumb) {
      const card = thumb.closest('.sf-card')
      const main = card?.querySelector('[data-main-image]')
      if (main) main.src = thumb.dataset.thumb
      card?.querySelectorAll('.sf-thumb').forEach((t) => t.classList.toggle('active', t === thumb))
      return
    }
    if (event.target.closest('[data-search-open]')) {
      event.preventDefault()
      openSearch()
      return
    }
    if (event.target.closest('[data-wish-open]')) {
      event.preventDefault()
      openWishlist()
      return
    }
    if (event.target.closest('[data-wish-close]')) {
      closeWishlist()
    }
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeWishlist()
  })
  window.addEventListener('kak:cart', syncCounts)
  window.addEventListener('kak:wishlist', syncCounts)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncCounts)
  } else {
    syncCounts()
  }
}

bindGlobal()
loadCatalog()

window.KAKFront = {
  state,
  ready: () => loadCatalog(),
  loadCatalog,
  productCard,
  productImages,
  primaryImage,
  resolveImg,
  escapeHtml,
  money,
  findProduct,
  productRating,
  categoryName,
  subcategories,
  subcategoryName,
  categoryHref,
  productHref,
  renderCatNav,
  starRow,
  searchProducts,
  addToCart,
  setQty,
  removeFromCart,
  cartCount,
  cartTotal,
  toggleWish,
  isWished,
  wishCount,
  openSearch,
  closeSearch,
  openWishlist,
  closeWishlist,
  toast,
  syncCounts,
  ICON_PLUS,
  ICON_HEART
}
