/* Shop page: catalog grid with search, category filter, wishlist and cart. */

const F = window.KAKFront

const grid = document.getElementById('productGrid')
const emptyEl = document.getElementById('shopEmpty')
const chipsEl = document.getElementById('shopChips')
const subChipsEl = document.getElementById('shopSubChips')
const searchEl = document.getElementById('shopSearch')
const drawer = document.getElementById('cartDrawer')
const overlay = document.getElementById('cartOverlay')
const cartItemsEl = document.getElementById('cartItems')
const cartTotalEl = document.getElementById('cartTotal')
const cartEmptyEl = document.getElementById('cartEmpty')
const openCartBtn = document.getElementById('openCart')
const bottomCartBtn = document.getElementById('bottomCart')
const closeCartBtn = document.getElementById('closeCart')

const filter = { cat: 'all', sub: 'all', q: '' }

function renderChips() {
  if (!chipsEl) return
  const categories = F.state.catalog.store.categories || []
  const items = [{ id: 'all', name: 'All' }, ...categories]
  chipsEl.innerHTML = items
    .map(
      (c) =>
        `<button type="button" class="sf-chip${filter.cat === c.id ? ' active' : ''}" data-cat="${F.escapeHtml(
          c.id
        )}">${F.escapeHtml(c.name)}</button>`
    )
    .join('')
  renderSubChips()
}

function renderSubChips() {
  if (!subChipsEl) return
  const subs = filter.cat === 'all' ? [] : F.subcategories(filter.cat)
  if (!subs.length) {
    subChipsEl.hidden = true
    subChipsEl.innerHTML = ''
    return
  }
  const items = [{ id: 'all', name: 'All' }, ...subs]
  subChipsEl.hidden = false
  subChipsEl.innerHTML = items
    .map(
      (s) =>
        `<button type="button" class="sf-chip sf-chip-sub${filter.sub === s.id ? ' active' : ''}" data-sub="${F.escapeHtml(
          s.id
        )}">${F.escapeHtml(s.name)}</button>`
    )
    .join('')
}

function haystack(p) {
  const bullets = Array.isArray(p.bullets) ? p.bullets : []
  return [
    p.name,
    p.description,
    F.categoryName(p.category),
    F.subcategoryName(p.category, p.subcategory),
    ...bullets
  ]
    .join(' ')
    .toLowerCase()
}

function matches(p) {
  if (filter.cat !== 'all' && p.category !== filter.cat) return false
  if (filter.sub !== 'all' && p.subcategory !== filter.sub) return false
  if (filter.q && !haystack(p).includes(filter.q.toLowerCase())) return false
  return true
}

function renderProducts() {
  if (!grid) return
  const list = (F.state.catalog.products || []).filter(matches)
  grid.innerHTML = list.map((p) => F.productCard(p, { bullets: true })).join('')
  if (emptyEl) emptyEl.hidden = list.length > 0
}

function updateUrl() {
  const params = new URLSearchParams()
  if (filter.cat !== 'all') params.set('cat', filter.cat)
  if (filter.sub !== 'all') params.set('sub', filter.sub)
  if (filter.q) params.set('q', filter.q)
  const query = params.toString()
  history.replaceState(null, '', query ? `?${query}` : location.pathname)
}

/* ---------- cart drawer ---------- */
function renderCart() {
  if (!cartItemsEl) return
  const cart = F.state.cart
  if (!cart.length) {
    cartItemsEl.innerHTML = ''
    if (cartEmptyEl) cartEmptyEl.hidden = false
  } else {
    if (cartEmptyEl) cartEmptyEl.hidden = true
    cartItemsEl.innerHTML = cart
      .map((item) => {
        const p = F.findProduct(item.id)
        const name = p ? p.name : item.id
        const image = p ? F.primaryImage(p) : ''
        const price = p ? Number(p.price) : 0
        return `
          <li class="cart-line">
            <img src="${F.escapeHtml(image)}" alt="${F.escapeHtml(name)}" />
            <div class="cart-line-info">
              <strong>${F.escapeHtml(name)}</strong>
              <span>${price > 0 ? F.money(price) : 'Price on request'}</span>
              <div class="qty">
                <button type="button" data-line-dec="${F.escapeHtml(item.id)}" aria-label="Decrease">-</button>
                <span>${item.qty}</span>
                <button type="button" data-line-inc="${F.escapeHtml(item.id)}" aria-label="Increase">+</button>
              </div>
            </div>
            <button type="button" class="cart-remove" data-line-remove="${F.escapeHtml(item.id)}" aria-label="Remove">x</button>
          </li>`
      })
      .join('')
  }
  if (cartTotalEl) cartTotalEl.textContent = F.money(F.cartTotal())
}

function openCart() {
  drawer?.classList.add('open')
  overlay?.classList.add('show')
  document.body.classList.add('no-scroll')
}

function closeCart() {
  drawer?.classList.remove('open')
  overlay?.classList.remove('show')
  document.body.classList.remove('no-scroll')
}

/* ---------- events ---------- */
function bind() {
  const menuBtn = document.getElementById('menuBtn')
  const nav = document.getElementById('nav')
  menuBtn?.addEventListener('click', () => {
    const open = nav.classList.toggle('open')
    menuBtn.setAttribute('aria-expanded', String(open))
  })

  chipsEl?.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-cat]')
    if (!chip) return
    filter.cat = chip.dataset.cat
    filter.sub = 'all'
    renderChips()
    renderProducts()
    updateUrl()
  })

  subChipsEl?.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-sub]')
    if (!chip) return
    filter.sub = chip.dataset.sub
    renderSubChips()
    renderProducts()
    updateUrl()
  })

  searchEl?.addEventListener('input', () => {
    filter.q = searchEl.value.trim()
    renderProducts()
    updateUrl()
  })

  cartItemsEl?.addEventListener('click', (event) => {
    const inc = event.target.closest('[data-line-inc]')
    const dec = event.target.closest('[data-line-dec]')
    const rem = event.target.closest('[data-line-remove]')
    if (inc) {
      const item = F.state.cart.find((i) => i.id === inc.dataset.lineInc)
      if (item) F.setQty(item.id, item.qty + 1)
    } else if (dec) {
      const item = F.state.cart.find((i) => i.id === dec.dataset.lineDec)
      if (item) F.setQty(item.id, item.qty - 1)
    } else if (rem) {
      F.removeFromCart(rem.dataset.lineRemove)
    }
  })

  openCartBtn?.addEventListener('click', openCart)
  bottomCartBtn?.addEventListener('click', openCart)
  closeCartBtn?.addEventListener('click', closeCart)
  overlay?.addEventListener('click', closeCart)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCart()
  })

  const accountBtn = document.getElementById('accountBtn')
  accountBtn?.addEventListener('click', () => {
    const auth = window.KAKAuth
    if (auth && typeof auth.open === 'function') auth.open()
  })

  window.addEventListener('kak:cart', renderCart)
}

function readParams() {
  const params = new URLSearchParams(location.search)
  filter.cat = params.get('cat') || 'all'
  filter.sub = params.get('sub') || 'all'
  filter.q = params.get('q') || ''
  if (searchEl && filter.q) searchEl.value = filter.q
}

async function init() {
  await F.ready()
  readParams()
  renderChips()
  renderProducts()
  renderCart()
  bind()
}

init()
