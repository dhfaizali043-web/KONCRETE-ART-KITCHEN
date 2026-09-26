/* Home page: renders catalog-driven sections. Uses window.KAKFront. */

const F = window.KAKFront

const ICON_CHECK =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.6 16.2l-4.2-4.2 1.4-1.4 2.8 2.8 6.6-6.6 1.4 1.4z"/></svg>'

function el(id) {
  return document.getElementById(id)
}

function resolveImg(src) {
  return F.resolveImg(src)
}

function categoryImage(category, products) {
  if (category.image) return resolveImg(category.image)
  const match = products.find(
    (p) => p.category === category.id && F.productImages(p).length
  )
  return match ? F.primaryImage(match) : ''
}

function renderCategories(store, products) {
  const target = el('homeCategories')
  if (!target) return
  const categories = Array.isArray(store.categories) ? store.categories : []
  if (!categories.length) {
    const section = target.closest('.sf-categories')
    if (section) section.hidden = true
    return
  }
  target.innerHTML = categories
    .map((cat) => {
      const image = categoryImage(cat, products)
      const media = image
        ? `<img src="${F.escapeHtml(image)}" alt="" loading="lazy" />`
        : `<span class="sf-cat-mono">${F.escapeHtml((cat.name || '?').charAt(0))}</span>`
      return `<a class="sf-cat" href="${F.categoryHref(cat.id)}">
        <span class="sf-cat-img">${media}</span>
        <span class="sf-cat-name">${F.escapeHtml(cat.name)}</span>
      </a>`
    })
    .join('')
}

function renderFeatured(products) {
  const target = el('homeProducts')
  if (!target) return
  const list = products.filter((p) => !F.isSoldOut(p)).slice(0, 8)
  if (!list.length) {
    target.parentElement.hidden = true
    return
  }
  target.innerHTML = list.map((p) => F.productCard(p, { bullets: false })).join('')
}

function renderFeatures(store) {
  const target = el('homeFeatures')
  if (!target) return
  const features = Array.isArray(store.features) ? store.features : []
  if (!features.length) {
    target.hidden = true
    return
  }
  target.innerHTML = features
    .map(
      (f) => `<div class="sf-feature">
        <span class="sf-feature-icon">${ICON_CHECK}</span>
        <div><strong>${F.escapeHtml(f.title)}</strong><span>${F.escapeHtml(f.text || '')}</span></div>
      </div>`
    )
    .join('')
}

function renderReviews(store) {
  const target = el('homeReviews')
  if (!target) return
  const reviews = Array.isArray(store.reviews) ? store.reviews : []
  if (!reviews.length) {
    const avgEl = el('reviewAvg')
    if (avgEl) avgEl.innerHTML = ''
    target.innerHTML =
      '<p class="rv-empty">No reviews yet — be the first to share your experience.</p>'
    return
  }
  const avg = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length
  const avgEl = el('reviewAvg')
  if (avgEl) {
    avgEl.innerHTML = `${F.starRow(avg)}<span>${avg.toFixed(1)} average</span>`
  }
  target.innerHTML = reviews
    .map((r) => {
      const photo = r.photo ? resolveImg(r.photo) : ''
      return `<article class="sf-review">
        <div class="sf-review-top">
          <span class="sf-avatar">${F.escapeHtml((r.name || '?').charAt(0))}</span>
          <div><strong>${F.escapeHtml(r.name || 'Customer')}</strong><em>${F.escapeHtml(r.location || '')}</em></div>
        </div>
        ${F.starRow(r.rating || 5)}
        <p>${F.escapeHtml(r.text || '')}</p>
        ${
          photo
            ? `<a class="sf-review-photo" href="${F.escapeHtml(photo)}" target="_blank" rel="noopener"><img src="${F.escapeHtml(photo)}" alt="Customer photo" loading="lazy" /></a>`
            : ''
        }
      </article>`
    })
    .join('')
}

let testimonialRating = 0

function setupTestimonials(store) {
  const btn = el('writeTestimonialBtn')
  const form = el('testimonialForm')
  if (!btn || !form) return
  const starsWrap = el('tstStars')

  btn.addEventListener('click', () => {
    form.hidden = false
    const name = el('tstName')
    if (name) name.focus()
  })

  const cancel = el('testimonialCancel')
  if (cancel) cancel.addEventListener('click', () => (form.hidden = true))

  if (starsWrap) {
    starsWrap.addEventListener('click', (event) => {
      const b = event.target.closest('[data-star]')
      if (!b) return
      testimonialRating = Number(b.dataset.star) || 0
      starsWrap.querySelectorAll('[data-star]').forEach((s) => {
        const on = Number(s.dataset.star) <= testimonialRating
        s.classList.toggle('active', on)
        s.setAttribute('aria-pressed', on ? 'true' : 'false')
      })
    })
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    if (testimonialRating < 1) {
      F.toast('Please choose a star rating first')
      return
    }
    const name = (el('tstName')?.value || '').trim()
    const location = (el('tstLocation')?.value || '').trim()
    const text = (el('tstText')?.value || '').trim()
    if (!text) {
      F.toast('Please write your review')
      return
    }
    const stars = '★'.repeat(testimonialRating) + '☆'.repeat(5 - testimonialRating)
    const message = [
      'New customer review — Koncrete Art Kitchen',
      '',
      `Rating: ${stars} (${testimonialRating}/5)`,
      `Name: ${name || 'Anonymous'}`,
      location ? `City: ${location}` : '',
      `Review: ${text}`,
      '',
      'I am sending my photo in this chat.'
    ]
      .filter(Boolean)
      .join('\n')

    const whatsapp = String(store.whatsapp || '').replace(/[^\d]/g, '')
    const email = (store.orders && store.orders.alertEmail) || ''
    const whatsappOk = whatsapp.length >= 10 && whatsapp !== '910000000000'

    if (!whatsappOk && !email) {
      F.toast('Reviews are not set up yet — add WhatsApp or email in Admin.')
      return
    }

    if (whatsappOk) {
      window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`, '_blank')
    }

    const emailTask = email
      ? fetch('https://formsubmit.co/ajax/' + encodeURIComponent(email), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            _subject: 'New customer review — Koncrete Art Kitchen',
            Name: name || 'Anonymous',
            City: location,
            Rating: `${testimonialRating}/5`,
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

    form.reset()
    testimonialRating = 0
    if (starsWrap) {
      starsWrap.querySelectorAll('[data-star]').forEach((s) => {
        s.classList.remove('active')
        s.setAttribute('aria-pressed', 'false')
      })
    }
    form.hidden = true
  })
}

function renderAnnouncements(store) {
  const text = el('announceText')
  const bar = el('announceBar')
  if (!text || !bar) return
  const list = Array.isArray(store.announcements) ? store.announcements.filter(Boolean) : []
  if (!list.length) {
    bar.hidden = true
    return
  }
  let index = 0
  text.textContent = list[0]
  if (list.length > 1) {
    setInterval(() => {
      index = (index + 1) % list.length
      text.classList.add('is-fading')
      setTimeout(() => {
        text.textContent = list[index]
        text.classList.remove('is-fading')
      }, 250)
    }, 4200)
  }
}

function renderCatNav() {
  F.renderCatNav()
}

function renderHero(store) {
  const badge = el('heroBadge')
  if (!badge) return
  const label = store.heroBadge && store.heroBadge.label
  if (label) {
    badge.textContent = label
    badge.hidden = false
  } else {
    badge.hidden = true
  }
}

function setupNewsletter(store) {
  const form = el('newsletterForm')
  const input = el('newsletterInput')
  const status = el('newsletterStatus')
  const news = store.newsletter || {}
  const title = el('newsTitle')
  const text = el('newsText')
  if (title && news.title) title.textContent = news.title
  if (text && news.text) text.textContent = news.text
  if (!form) return
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const email = (input.value || '').trim()
    if (!email) return
    const to = String(news.email || (store.orders && store.orders.alertEmail) || '').trim()
    if (!to) {
      if (status) {
        status.hidden = false
        status.textContent = 'Newsletter email not set in Admin yet.'
      }
      return
    }
    if (status) {
      status.hidden = false
      status.textContent = 'Subscribing...'
    }
    saveSubscriber(email)
    fetch('https://formsubmit.co/ajax/' + encodeURIComponent(to), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: 'Newsletter signup — Koncrete Art Kitchen',
        email,
        message: `New newsletter subscriber: ${email}`
      })
    })
      .then(() => {
        if (status) status.textContent = 'Thank you — you are on the list.'
        form.reset()
      })
      .catch(() => {
        if (status) status.textContent = 'Could not subscribe right now. Please try again later.'
      })
  })
}

function saveSubscriber(email) {
  const value = String(email || '').trim().toLowerCase()
  if (!value) return
  try {
    const list = JSON.parse(localStorage.getItem('kak_subscribers_v1')) || []
    if (!list.includes(value)) list.unshift(value)
    localStorage.setItem('kak_subscribers_v1', JSON.stringify(list.slice(0, 500)))
  } catch {
    /* storage optional */
  }
}

function setupAccount() {
  const btn = el('accountBtn')
  if (!btn) return
  btn.addEventListener('click', () => {
    const auth = window.KAKAuth
    if (auth && typeof auth.open === 'function') auth.open()
    else window.location.href = './shop.html'
  })
}

async function init() {
  const catalog = await F.ready()
  const store = (catalog && catalog.store) || {}
  const products = (catalog && catalog.products) || []

  renderAnnouncements(store)
  renderCatNav(store)
  renderHero(store)
  renderCategories(store, products)
  renderFeatured(products)
  renderFeatures(store)
  renderReviews(store)
  setupTestimonials(store)
  setupNewsletter(store)
  setupAccount()
  F.syncCounts()
}

init()
