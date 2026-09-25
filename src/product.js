/* Product page: full detail view for a single product (?id=). */

const F = window.KAKFront

let qty = 1
let current = null

function byId(id) {
  return document.getElementById(id)
}

function setCrumb(product) {
  const crumb = byId('productCrumb')
  if (!crumb) return
  const parts = ['<a href="./index.html">Home</a>', '<a href="./shop.html">Shop</a>']
  if (product.category) {
    parts.push(
      `<a href="${F.categoryHref(product.category)}">${F.escapeHtml(F.categoryName(product.category))}</a>`
    )
  }
  parts.push(`<span>${F.escapeHtml(product.name)}</span>`)
  crumb.innerHTML = parts.join(' / ')
}

function renderNotFound() {
  const root = byId('productDetail')
  if (!root) return
  root.innerHTML = `
    <div class="pd-empty">
      <h1>Product not found</h1>
      <p>The item you are looking for is no longer available or the link is incorrect.</p>
      <a class="btn btn-solid" href="./shop.html">Back to shop</a>
    </div>`
}

function renderGallery(product) {
  const images = F.productImages(product)
  const main = F.resolveImg(images[0] || '')
  const thumbs = images.length > 1
    ? `<div class="pd-thumbs">${images
        .map(
          (src, index) =>
            `<button type="button" class="pd-thumb${index === 0 ? ' active' : ''}" data-psrc="${F.escapeHtml(
              F.resolveImg(src)
            )}" aria-label="View image ${index + 1}"><img src="${F.escapeHtml(
              F.resolveImg(src)
            )}" alt="" loading="lazy" /></button>`
        )
        .join('')}</div>`
    : ''
  return `
    <div class="pd-gallery" id="pdGallery">
      <div class="pd-main">
        <img id="pdMainImage" src="${F.escapeHtml(main)}" alt="${F.escapeHtml(product.name)}" />
      </div>
      ${thumbs}
    </div>`
}

function renderInfo(product) {
  const out = product.available === false
  const price = Number(product.price) > 0 ? F.money(product.price) : 'Price on request'
  const oldPrice =
    Number(product.oldPrice) > 0 && Number(product.oldPrice) > Number(product.price)
      ? `<s class="pd-old">${F.money(product.oldPrice)}</s>`
      : ''
  const rating = Number(product.rating) || 0
  const ratingCount = Number(product.ratingCount) || 0
  const ratingRow =
    rating > 0
      ? `<div class="pd-rating">${F.starRow(rating)}<span>${
          ratingCount > 0 ? `(${ratingCount} reviews)` : rating.toFixed(1)
        }</span></div>`
      : ''
  const bullets = Array.isArray(product.bullets) ? product.bullets.filter(Boolean) : []
  const bulletList = bullets.length
    ? `<ul class="pd-bullets">${bullets.map((b) => `<li>${F.escapeHtml(b)}</li>`).join('')}</ul>`
    : ''
  const description = product.description
    ? `<p class="pd-desc">${F.escapeHtml(product.description)}</p>`
    : ''
  const subLink = product.subcategory
    ? ` <a href="${F.categoryHref(product.category)}?sub=${encodeURIComponent(
        product.subcategory
      )}">${F.escapeHtml(F.subcategoryName(product.category, product.subcategory))}</a>`
    : ''
  const meta = product.category
    ? `<p class="pd-meta">Category: <a href="${F.categoryHref(product.category)}">${F.escapeHtml(
        F.categoryName(product.category)
      )}</a>${subLink}</p>`
    : ''

  return `
    <div class="pd-info">
      <h1 class="pd-title">${F.escapeHtml(product.name)}</h1>
      ${ratingRow}
      <div class="pd-price-row">
        <span class="pd-price">${price}</span>
        ${oldPrice}
      </div>
      ${description}
      ${bulletList}
      ${meta}
      <div class="pd-qty-row">
        <span class="pd-label">Quantity</span>
        <div class="pd-qty">
          <button type="button" data-pqty="-1" aria-label="Decrease quantity">-</button>
          <span id="pdQtyVal">1</span>
          <button type="button" data-pqty="1" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="pd-actions">
        <button type="button" class="btn btn-solid pd-add" id="pdAdd" ${
          out ? 'disabled' : ''
        }>${out ? 'Sold out' : 'Add to cart'}</button>
        <button type="button" class="btn pd-buy" id="pdBuy" ${
          out ? 'disabled' : ''
        }>Order on WhatsApp</button>
        <button type="button" class="pd-wish-btn${
          F.isWished(product.id) ? ' active' : ''
        }" data-wish="${F.escapeHtml(product.id)}" aria-label="Add to wishlist">Save to wishlist</button>
      </div>
      <ul class="pd-trust">
        <li>Made to order in-house</li>
        <li>Pan-India shipping</li>
        <li>Order support on WhatsApp</li>
      </ul>
    </div>`
}

function renderRelated(product) {
  const wrap = byId('pdRelatedWrap')
  const grid = byId('pdRelated')
  if (!wrap || !grid) return
  const list = (F.state.catalog.products || [])
    .filter(
      (p) =>
        p.id !== product.id &&
        p.available !== false &&
        p.category &&
        p.category === product.category
    )
    .slice(0, 4)
  if (!list.length) {
    wrap.hidden = true
    return
  }
  grid.innerHTML = list.map((p) => F.productCard(p)).join('')
  wrap.hidden = false
}

function injectSchema(product) {
  const images = F.productImages(product).map((src) => F.resolveImg(src))
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: images,
    description: product.description || product.name
  }
  if (Number(product.price) > 0) {
    schema.offers = {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: Number(product.price),
      availability:
        product.available === false
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock'
    }
  }
  const tag = document.createElement('script')
  tag.type = 'application/ld+json'
  tag.textContent = JSON.stringify(schema)
  document.head.appendChild(tag)
}

function whatsappBuy() {
  const number = String((F.state.catalog.store || {}).whatsapp || '').replace(/[^\d]/g, '')
  if (!number || number === '910000000000') {
    F.toast('Set your WhatsApp number in Admin first')
    return
  }
  const price = Number(current.price) > 0 ? ` — ${F.money(Number(current.price) * qty)}` : ''
  const text = [
    'Hi Koncrete Art Kitchen, I would like to order:',
    `• ${current.name} × ${qty}${price}`,
    '',
    `Product: ${location.href}`
  ].join('\n')
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank')
}

function bind(product) {
  const gallery = byId('pdGallery')
  gallery?.addEventListener('click', (event) => {
    const thumb = event.target.closest('[data-psrc]')
    if (!thumb) return
    const main = byId('pdMainImage')
    if (main) main.src = thumb.dataset.psrc
    gallery.querySelectorAll('.pd-thumb').forEach((t) => t.classList.toggle('active', t === thumb))
  })

  const info = byId('productDetail')
  info?.addEventListener('click', (event) => {
    const step = event.target.closest('[data-pqty]')
    if (step) {
      qty = Math.max(1, Math.min(99, qty + Number(step.dataset.pqty)))
      const val = byId('pdQtyVal')
      if (val) val.textContent = String(qty)
      return
    }
    if (event.target.closest('#pdAdd')) {
      F.addToCart(product.id, qty)
    }
    if (event.target.closest('#pdBuy')) {
      whatsappBuy()
    }
  })
}

async function init() {
  await F.ready()
  const id = new URLSearchParams(location.search).get('id') || ''
  current = F.findProduct(id)
  if (!current) {
    renderNotFound()
    return
  }
  document.title = `${current.name} — Koncrete Art Kitchen`
  setCrumb(current)
  const root = byId('productDetail')
  if (root) root.innerHTML = renderGallery(current) + renderInfo(current)
  renderRelated(current)
  bind(current)
  injectSchema(current)
}

init()
