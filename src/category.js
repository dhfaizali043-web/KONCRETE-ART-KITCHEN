/* Category page: fills the dynamic hero from the ?cat= and ?sub= URL params. */

const F = window.KAKFront

function currentParams() {
  return new URLSearchParams(window.location.search)
}

function findCategory(id) {
  const categories = (F.state.catalog.store && F.state.catalog.store.categories) || []
  return categories.find((cat) => cat.id === id) || null
}

function update() {
  const params = currentParams()
  const cat = findCategory(params.get('cat') || '')
  const name = cat ? cat.name : 'All products'
  const titleEl = document.getElementById('categoryTitle')
  const crumbEl = document.getElementById('categoryCrumb')
  const ledeEl = document.getElementById('categoryLede')

  if (titleEl) titleEl.textContent = name
  if (crumbEl) {
    crumbEl.innerHTML = `<a href="./index.html">Home</a> / <a href="./shop.html">Shop</a> / <span>${F.escapeHtml(
      name
    )}</span>`
  }
  if (ledeEl) {
    ledeEl.textContent = cat
      ? `Pieces in ${cat.name} — designed and made to order in our studio.`
      : 'Browse the full collection, made to order in our studio.'
  }
  const artWrap = document.getElementById('categoryArt')
  const artImg = document.getElementById('categoryImage')
  if (artWrap && artImg) {
    if (cat && cat.image) {
      artImg.src = F.resolveImg(cat.image)
      artImg.alt = cat.name
      artWrap.hidden = false
    } else {
      artWrap.hidden = true
    }
  }
  document.title = `${name} — Koncrete Art Kitchen`
}

async function init() {
  await F.ready()
  F.renderCatNav()
  update()
  window.addEventListener('kak:filter', update)
}

init()
