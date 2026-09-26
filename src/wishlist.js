/* Wishlist page: shows saved products and lets the customer act on them. */

const F = window.KAKFront

const grid = document.getElementById('wishGrid')
const emptyEl = document.getElementById('wishEmpty')
const addAllBtn = document.getElementById('wishAddAll')
const clearBtn = document.getElementById('wishClear')

function items() {
  return (F.state.wishlist || []).map((id) => F.findProduct(id)).filter(Boolean)
}

function render() {
  const list = items()
  if (grid) {
    grid.innerHTML = list.map((p) => F.productCard(p, { bullets: true })).join('')
  }
  if (emptyEl) emptyEl.hidden = list.length > 0
  const has = list.length > 0
  if (addAllBtn) addAllBtn.hidden = !has
  if (clearBtn) clearBtn.hidden = !has
}

function addAll() {
  const list = items()
  if (!list.length) return
  let added = 0
  list.forEach((product) => {
    if (product.available !== false) {
      F.addToCart(product.id, 1)
      added += 1
    }
  })
  if (added) F.toast(`Added ${added} item${added > 1 ? 's' : ''} to cart`)
  else F.toast('These items are currently unavailable')
}

function clearAll() {
  if (!(F.state.wishlist || []).length) return
  F.clearWishlist()
}

function bind() {
  const menuBtn = document.getElementById('menuBtn')
  const nav = document.getElementById('nav')
  menuBtn?.addEventListener('click', () => {
    const open = nav.classList.toggle('open')
    menuBtn.setAttribute('aria-expanded', String(open))
  })
  addAllBtn?.addEventListener('click', addAll)
  clearBtn?.addEventListener('click', clearAll)
  window.addEventListener('kak:wishlist', render)
}

async function init() {
  await F.ready()
  F.renderCatNav()
  render()
  bind()
  F.syncCounts()
}

init()
