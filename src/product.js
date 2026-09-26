/* Product page: full detail view for a single product (?id=). */

const F = window.KAKFront

let qty = 1
let current = null

function byId(id) {
  return document.getElementById(id)
}

function customValue() {
  const el = byId('pdCustom')
  return el ? el.value.trim() : ''
}

function customValid() {
  const custom = (current && current.custom) || {}
  if (!custom.enabled || !custom.required) return true
  return customValue().length > 0
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
  const out = F.isSoldOut(product)
  const price = Number(product.price) > 0 ? F.money(product.price) : 'Price on request'
  const oldPrice =
    Number(product.oldPrice) > 0 && Number(product.oldPrice) > Number(product.price)
      ? `<s class="pd-old">${F.money(product.oldPrice)}</s>`
      : ''
  const { average: rating, count: ratingCount } = F.productRating(product)
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
  const custom = product.custom || {}
  const customBlock =
    custom.enabled
      ? `<div class="pd-custom">
          <label class="pd-label" for="pdCustom">${F.escapeHtml(
            custom.label || 'Customisation'
          )}${custom.required ? ' *' : ''}</label>
          <input type="text" id="pdCustom" maxlength="${Number(custom.maxLength) || 60}" placeholder="${F.escapeHtml(
            custom.placeholder || 'Type your text here'
          )}" />
          ${custom.note ? `<p class="pd-custom-note">${F.escapeHtml(custom.note)}</p>` : ''}
        </div>`
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
      ${customBlock}
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
        !F.isSoldOut(p) &&
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
        F.isSoldOut(product)
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock'
    }
  }
  const { average, count } = F.productRating(product)
  if (count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: average.toFixed(1),
      reviewCount: count
    }
  }
  const tag = document.createElement('script')
  tag.type = 'application/ld+json'
  tag.textContent = JSON.stringify(schema)
  document.head.appendChild(tag)
}

let selectedRating = 0

function reviewDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  try {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return String(value)
  }
}

function reviewsOf(product) {
  return (Array.isArray(product.reviews) ? product.reviews : []).filter(
    (r) => r && (r.text || Number(r.rating) > 0)
  )
}

function renderReviews(product) {
  const reviews = reviewsOf(product)
  const { average, count } = F.productRating(product)
  const dist = [5, 4, 3, 2, 1]
    .map((star) => {
      const n = reviews.filter((r) => Math.round(Number(r.rating)) === star).length
      const pct = count ? Math.round((n / count) * 100) : 0
      return `<div class="rv-bar"><span>${star}</span><div class="rv-bar-track"><div class="rv-bar-fill" style="width:${pct}%"></div></div><em>${n}</em></div>`
    })
    .join('')

  const summary = count
    ? `<div class="rv-summary">
        <div class="rv-score">
          <strong>${average.toFixed(1)}</strong>
          ${F.starRow(average)}
          <span>${count} review${count > 1 ? 's' : ''}</span>
        </div>
        <div class="rv-bars">${dist}</div>
      </div>`
    : '<p class="rv-empty">No reviews yet. Be the first to write one.</p>'

  const list = reviews.length
    ? `<ul class="rv-list">${reviews
        .map((r) => {
          const photo = r.photo ? F.resolveImg(r.photo) : ''
          return `<li class="rv-item">
            <div class="rv-avatar">${F.escapeHtml(
              String(r.name || 'A').trim().charAt(0).toUpperCase() || 'A'
            )}</div>
            <div class="rv-body">
              <div class="rv-head">
                <strong>${F.escapeHtml(r.name || 'Anonymous')}</strong>
                ${r.date ? `<span class="rv-date">${F.escapeHtml(reviewDate(r.date))}</span>` : ''}
              </div>
              ${Number(r.rating) > 0 ? F.starRow(r.rating) : ''}
              ${r.text ? `<p>${F.escapeHtml(r.text)}</p>` : ''}
              ${
                photo
                  ? `<button type="button" class="rv-photo" data-rv-photo="${F.escapeHtml(
                      photo
                    )}" aria-label="View customer photo"><img src="${F.escapeHtml(
                      photo
                    )}" alt="Customer photo" loading="lazy" /></button>`
                  : ''
              }
            </div>
          </li>`
        })
        .join('')}</ul>`
    : ''

  return `
    <div class="rv-top">
      <h2>Ratings &amp; reviews</h2>
      <button type="button" class="btn pd-write" id="writeReviewBtn">Write a review</button>
    </div>
    ${summary}
    <form class="rv-form" id="reviewForm" hidden>
      <h3>Write a review</h3>
      <div class="rv-pick">
        <span>Your rating</span>
        <div class="rv-stars-input" id="rvStars" role="radiogroup" aria-label="Your rating">
          ${[1, 2, 3, 4, 5]
            .map(
              (n) =>
                `<button type="button" data-star="${n}" aria-label="${n} star" aria-pressed="false">★</button>`
            )
            .join('')}
        </div>
      </div>
      <label>Name<input type="text" id="rvName" maxlength="40" placeholder="Your name" /></label>
      <label>Review<textarea id="rvText" rows="3" maxlength="500" placeholder="How was the product?"></textarea></label>
      <label class="rv-file">Product / unboxing photo (optional)
        <input type="file" id="rvPhoto" accept="image/*" />
      </label>
      <p class="rv-note" id="rvNote">
        On submit, your review opens on WhatsApp — attach your photo there.
        The studio checks it and adds it to the site.
      </p>
      <div class="rv-actions">
        <button type="submit" class="btn btn-solid">Submit review</button>
        <button type="button" class="btn pd-buy" id="reviewCancel">Cancel</button>
      </div>
    </form>
    ${list}`
}

function openPhoto(src) {
  let box = document.getElementById('rvLightbox')
  if (!box) {
    box = document.createElement('div')
    box.id = 'rvLightbox'
    box.className = 'rv-lightbox'
    box.innerHTML =
      '<button type="button" class="rv-lightbox-close" aria-label="Close">Close</button><img alt="Customer photo" />'
    document.body.appendChild(box)
    box.addEventListener('click', (event) => {
      if (event.target === box || event.target.closest('.rv-lightbox-close')) closePhoto()
    })
  }
  const img = box.querySelector('img')
  if (img) img.src = src
  box.hidden = false
  document.body.classList.add('no-scroll')
}

function closePhoto() {
  const box = document.getElementById('rvLightbox')
  if (box) box.hidden = true
  document.body.classList.remove('no-scroll')
}

function submitReview(product) {
  if (selectedRating < 1) {
    F.toast('Please choose a star rating first')
    return
  }
  const nameEl = byId('rvName')
  const textEl = byId('rvText')
  const name = nameEl ? nameEl.value.trim() : ''
  const text = textEl ? textEl.value.trim() : ''
  if (!text) {
    F.toast('Please write your review')
    return
  }
  const number = String((F.state.catalog.store || {}).whatsapp || '').replace(/[^\d]/g, '')
  const email = ((F.state.catalog.store || {}).orders || {}).alertEmail || ''
  const whatsappOk = Boolean(number) && number !== '910000000000'
  if (!whatsappOk && !email) {
    F.toast('Set your WhatsApp number or email in Admin first')
    return
  }
  const stars = '★'.repeat(selectedRating) + '☆'.repeat(5 - selectedRating)
  const message = [
    'New product review — Koncrete Art Kitchen',
    '',
    `Product: ${product.name}`,
    `Link: ${location.href}`,
    `Rating: ${stars} (${selectedRating}/5)`,
    `Name: ${name || 'Anonymous'}`,
    `Review: ${text}`,
    '',
    'I am sending my product/unboxing photo in this chat.'
  ].join('\n')
  if (whatsappOk) {
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const emailTask = email
    ? fetch('https://formsubmit.co/ajax/' + encodeURIComponent(email), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `New product review — ${product.name}`,
          Product: product.name,
          Link: location.href,
          Rating: `${selectedRating}/5`,
          Name: name || 'Anonymous',
          Review: text
        })
      })
        .then(() => true)
        .catch(() => false)
    : null

  if (whatsappOk && email) {
    F.toast('Thank you! Send the review on WhatsApp — we got your email too.')
    emailTask.then((ok) => {
      if (!ok) F.toast('Review opened on WhatsApp, but email failed.')
    })
  } else if (whatsappOk) {
    F.toast('Thank you! Send the review on WhatsApp.')
  } else {
    F.toast('Sending your review…')
    emailTask.then((ok) => {
      F.toast(ok ? 'Thank you! Your review has been sent.' : 'Could not send right now. Please try again later.')
    })
  }

  const form = byId('reviewForm')
  if (form) form.hidden = true
  if (nameEl) nameEl.value = ''
  if (textEl) textEl.value = ''
  const file = byId('rvPhoto')
  if (file) file.value = ''
  selectedRating = 0
  const starsEl = byId('rvStars')
  if (starsEl) {
    starsEl.querySelectorAll('[data-star]').forEach((b) => {
      b.classList.remove('active')
      b.setAttribute('aria-pressed', 'false')
    })
  }
}

function bindReviews(product) {
  const wrap = byId('productReviews')
  if (!wrap) return
  wrap.addEventListener('click', (event) => {
    if (event.target.closest('#writeReviewBtn')) {
      const form = byId('reviewForm')
      if (form) {
        form.hidden = false
        const name = byId('rvName')
        if (name) name.focus()
      }
      return
    }
    if (event.target.closest('#reviewCancel')) {
      const form = byId('reviewForm')
      if (form) form.hidden = true
      return
    }
    const star = event.target.closest('[data-star]')
    if (star) {
      selectedRating = Number(star.dataset.star)
      const starsEl = byId('rvStars')
      if (starsEl) {
        starsEl.querySelectorAll('[data-star]').forEach((b) => {
          const on = Number(b.dataset.star) <= selectedRating
          b.classList.toggle('active', on)
          b.setAttribute('aria-pressed', String(on))
        })
      }
      return
    }
    const photo = event.target.closest('[data-rv-photo]')
    if (photo) openPhoto(photo.dataset.rvPhoto)
  })

  const form = byId('reviewForm')
  form?.addEventListener('submit', (event) => {
    event.preventDefault()
    submitReview(product)
  })

  const file = byId('rvPhoto')
  file?.addEventListener('change', () => {
    const note = byId('rvNote')
    if (!note) return
    const chosen = file.files && file.files[0]
    note.textContent = chosen
      ? `Photo selected: ${chosen.name} — after submitting, attach this photo in the WhatsApp chat.`
      : 'On submit, your review opens on WhatsApp — attach your photo there. The studio checks it and adds it to the site.'
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePhoto()
  })
}

function whatsappBuy() {
  const number = String((F.state.catalog.store || {}).whatsapp || '').replace(/[^\d]/g, '')
  if (!number || number === '910000000000') {
    F.toast('Set your WhatsApp number in Admin first')
    return
  }
  if (!customValid()) {
    F.toast('Please fill the customisation field first')
    return
  }
  const price = Number(current.price) > 0 ? ` — ${F.money(Number(current.price) * qty)}` : ''
  const custom = customValue()
  const text = [
    'Hi Koncrete Art Kitchen, I would like to order:',
    `• ${current.name} × ${qty}${price}`,
    custom ? `Customisation: ${custom}` : '',
    '',
    `Product: ${location.href}`
  ]
    .filter(Boolean)
    .join('\n')
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank')
}

function bind(product) {
  const gallery = byId('pdGallery')
  gallery?.addEventListener('click', (event) => {
    const thumb = event.target.closest('[data-psrc]')
    if (thumb) {
      const main = byId('pdMainImage')
      if (main) main.src = thumb.dataset.psrc
      gallery.querySelectorAll('.pd-thumb').forEach((t) => t.classList.toggle('active', t === thumb))
      return
    }
    if (event.target.closest('#pdMainImage') || event.target.closest('.pd-main')) {
      const thumbs = [...gallery.querySelectorAll('.pd-thumb')]
      const index = thumbs.findIndex((t) => t.classList.contains('active'))
      openLightbox(index < 0 ? 0 : index)
    }
  })

  const info = byId('productDetail')
  info?.addEventListener('click', (event) => {
    const step = event.target.closest('[data-pqty]')
    if (step) {
      const limit = F.stockLimit(product) ?? 99
      qty = Math.max(1, Math.min(Math.max(1, limit), qty + Number(step.dataset.pqty)))
      const val = byId('pdQtyVal')
      if (val) val.textContent = String(qty)
      return
    }
    if (event.target.closest('#pdAdd')) {
      if (!customValid()) {
        F.toast('Please fill the customisation field first')
        return
      }
      F.addToCart(product.id, qty, customValue())
    }
    if (event.target.closest('#pdBuy')) {
      whatsappBuy()
    }
  })
}

/* ---------- image lightbox ---------- */
let lightboxImages = []
let lightboxIndex = 0

function openLightbox(index) {
  lightboxImages = F.productImages(current || {}).map((src) => F.resolveImg(src)).filter(Boolean)
  if (!lightboxImages.length) return
  lightboxIndex = Math.max(0, Math.min(index || 0, lightboxImages.length - 1))
  let box = byId('pdLightbox')
  if (!box) {
    box = document.createElement('div')
    box.id = 'pdLightbox'
    box.className = 'pd-lightbox'
    box.innerHTML = `
      <button type="button" class="pd-lb-close" aria-label="Close">Close</button>
      <button type="button" class="pd-lb-nav prev" data-lb="-1" aria-label="Previous image">&#8249;</button>
      <img id="pdLbImage" alt="" />
      <button type="button" class="pd-lb-nav next" data-lb="1" aria-label="Next image">&#8250;</button>
      <div class="pd-lb-hint">Tap the image to zoom</div>`
    document.body.appendChild(box)
    box.addEventListener('click', (event) => {
      if (event.target.closest('.pd-lb-close')) return closeLightbox()
      const nav = event.target.closest('[data-lb]')
      if (nav) return stepLightbox(Number(nav.dataset.lb))
      if (event.target.closest('#pdLbImage')) return event.target.closest('#pdLbImage').classList.toggle('zoomed')
      if (event.target === box) closeLightbox()
    })
    document.addEventListener('keydown', (event) => {
      const el = byId('pdLightbox')
      if (!el || el.hidden) return
      if (event.key === 'Escape') closeLightbox()
      else if (event.key === 'ArrowLeft') stepLightbox(-1)
      else if (event.key === 'ArrowRight') stepLightbox(1)
    })
  }
  updateLightbox()
  box.hidden = false
  document.body.classList.add('no-scroll')
}

function updateLightbox() {
  const img = byId('pdLbImage')
  if (!img) return
  img.src = lightboxImages[lightboxIndex] || ''
  img.classList.remove('zoomed')
  const multi = lightboxImages.length > 1
  document.querySelectorAll('.pd-lb-nav').forEach((btn) => {
    btn.hidden = !multi
  })
}

function stepLightbox(delta) {
  if (lightboxImages.length < 2) return
  lightboxIndex = (lightboxIndex + delta + lightboxImages.length) % lightboxImages.length
  updateLightbox()
}

function closeLightbox() {
  const box = byId('pdLightbox')
  if (box) box.hidden = true
  document.body.classList.remove('no-scroll')
}

/* ---------- recently viewed ---------- */
function renderRecent(product) {
  const wrap = byId('pdRecentWrap')
  const grid = byId('pdRecent')
  if (!wrap || !grid) return
  const list = F.recentProducts(4, product.id)
  if (!list.length) {
    wrap.hidden = true
    return
  }
  grid.innerHTML = list.map((p) => F.productCard(p)).join('')
  wrap.hidden = false
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
  const reviewsWrap = byId('productReviews')
  if (reviewsWrap) {
    reviewsWrap.innerHTML = renderReviews(current)
    reviewsWrap.hidden = false
    bindReviews(current)
  }
  renderRelated(current)
  bind(current)
  injectSchema(current)
  F.recordRecent(current.id)
  renderRecent(current)
}

init()
