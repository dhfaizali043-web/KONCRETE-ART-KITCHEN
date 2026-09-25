const CATALOG_URL = './data/catalog.json'

function resolvePath(path) {
  const value = String(path || '')
  if (!value) return ''
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  return './' + value.replace(/^\.?\//, '')
}

function applyImage(el, path) {
  const next = resolvePath(path)
  if (el && next) el.src = next
}

async function init() {
  let images
  try {
    const res = await fetch(CATALOG_URL + '?t=' + Date.now(), { cache: 'no-store' })
    images = (await res.json()).store?.images
  } catch {
    return
  }
  if (!images) return

  if (images.logoWhite) {
    document.querySelectorAll('.brand img, .footer-mark').forEach((el) => applyImage(el, images.logoWhite))
  }
  if (images.logoBlack) {
    document
      .querySelectorAll('link[rel="apple-touch-icon"]')
      .forEach((el) => el.setAttribute('href', resolvePath(images.logoBlack)))
  }

  applyImage(document.querySelector('.seal'), images.seal)
  applyImage(document.querySelector('.hero-plate img'), images.hero)

  document.querySelectorAll('.gallery .tile img').forEach((el, index) => {
    const path = images['gallery' + (index + 1)]
    if (!path) return
    applyImage(el, path)
    const tile = el.closest('.tile')
    if (tile) tile.dataset.src = resolvePath(path)
  })
}

init()
