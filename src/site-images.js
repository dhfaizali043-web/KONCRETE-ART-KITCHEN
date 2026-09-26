const CATALOG_URL = './data/catalog.json'

const SOCIAL_ICONS = {
  instagram:
    '<path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.3-1-.4-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.3 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-.9 0-1.4.2-1.7.3-.4.2-.7.4-1 .7-.3.3-.5.6-.7 1-.1.3-.3.8-.3 1.7-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c0 .9.2 1.4.3 1.7.2.4.4.7.7 1 .3.3.6.5 1 .7.3.1.8.3 1.7.3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c.9 0 1.4-.2 1.7-.3.4-.2.7-.4 1-.7.3-.3.5-.6.7-1 .1-.3.3-.8.3-1.7.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c0-.9-.2-1.4-.3-1.7-.2-.4-.4-.7-.7-1-.3-.3-.6-.5-1-.7-.3-.1-.8-.3-1.7-.3-1.2-.1-1.6-.1-4.7-.1zm0 3.1a5 5 0 110 10 5 5 0 010-10zm0 1.8a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zm5.2-2.9a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/>',
  pinterest:
    '<path d="M12 2C6.6 2 4 5.3 4 8.9c0 1.6.9 3.6 2.3 4.2.2.1.3 0 .4-.2l.4-1.5c0-.2 0-.3-.1-.5-.5-.6-.8-1.4-.8-2.4 0-2.9 2.2-5.5 5.7-5.5 3.1 0 4.8 1.9 4.8 4.4 0 3.3-1.5 5.6-3.6 5.6-1.2 0-2-.9-1.8-2.1.3-1.4.9-2.9.9-3.9 0-.9-.5-1.6-1.5-1.6-1.2 0-2.1 1.2-2.1 2.8 0 1 .3 1.7.3 1.7l-1.4 5.8c-.4 1.7-.1 3.8 0 4 0 .1.2.2.3.1.1-.1 1.6-2 2.1-3.8l.8-3.1c.4.8 1.5 1.4 2.7 1.4 3.5 0 5.9-3.2 5.9-7.5C20.5 5.1 17.3 2 12 2z"/>',
  youtube:
    '<path d="M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z"/>',
  x: '<path d="M17.5 3h3.2l-7 8 8.2 10.9h-6.4l-5-6.5-5.7 6.5H1.6l7.5-8.6L1.2 3h6.6l4.5 6zM16.3 19.9h1.8L7.8 4.9H5.9z"/>',
  whatsapp:
    '<path d="M12 2a10 10 0 00-8.6 15L2 22l5.1-1.3A10 10 0 1012 2zm0 1.8a8.2 8.2 0 016.4 13.3l-.3.4.8 2.9-3-.8-.4.2A8.2 8.2 0 1112 3.8zm-3 4c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.9 4.5 4 .6.3 1.1.4 1.5.5.6.1 1.2.1 1.6 0 .5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3l-2-1c-.3-.1-.5-.1-.7.1l-.9 1.1c-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.3-1.6-1.5-1.8-.1-.3 0-.4.1-.6l.5-.6c.1-.2.2-.3.3-.5s0-.4 0-.5l-.9-2.1c-.2-.5-.4-.5-.6-.5z"/>'
}

const SOCIAL_ORDER = ['instagram', 'pinterest', 'youtube', 'x']

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

function socialHref(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return 'https://' + raw.replace(/^\/+/, '')
}

function escapeAttr(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  })
}

function renderSocial(store) {
  const social = store.social || {}
  const links = SOCIAL_ORDER.map((key) => ({
    key,
    label: key === 'x' ? 'X' : key.charAt(0).toUpperCase() + key.slice(1),
    href: socialHref(social[key])
  })).filter((link) => link.href)

  const wa = String(store.whatsapp || '').replace(/[^0-9]/g, '')
  if (wa) {
    links.push({ key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/${wa}` })
  }

  const footer = document.querySelector('.site-footer')
  if (!footer || !links.length) return

  let box = footer.querySelector('.footer-social')
  if (!box) {
    box = document.createElement('div')
    box.className = 'footer-social'
    const row = footer.querySelector('.footer-row')
    footer.insertBefore(box, row || null)
  }
  box.innerHTML =
    '<span class="footer-social-label">Follow us</span>' +
    links
      .map(
        (link) =>
          `<a href="${escapeAttr(link.href)}" target="_blank" rel="noopener" aria-label="${escapeAttr(
            link.label
          )}" title="${escapeAttr(link.label)}"><svg viewBox="0 0 24 24" aria-hidden="true">${
            SOCIAL_ICONS[link.key]
          }</svg></a>`
      )
      .join('')
}

function renderAddresses(store) {
  const addresses = (Array.isArray(store.addresses) ? store.addresses : []).filter(
    (address) => address && (address.lines || address.phone || address.label)
  )
  if (!addresses.length) return
  const sorted = [...addresses].sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0))

  const brand = document.querySelector('.footer-brand')
  if (brand && !brand.querySelector('.footer-address')) {
    const box = document.createElement('div')
    box.className = 'footer-address'
    box.innerHTML =
      '<h3>Studio</h3>' +
      sorted
        .map((address) => {
          const lines = String(address.lines || '')
            .split(/\n+/)
            .map((line) => line.trim())
            .filter(Boolean)
          const phoneDigits = String(address.phone || '').replace(/[^+\d]/g, '')
          return `<div class="footer-addr">
            ${address.label ? `<strong>${escapeAttr(address.label)}</strong>` : ''}
            ${lines.length ? `<p>${lines.map(escapeAttr).join('<br>')}</p>` : ''}
            ${
              address.phone
                ? `<a href="tel:${escapeAttr(phoneDigits)}">${escapeAttr(address.phone)}</a>`
                : ''
            }
            ${
              address.mapsUrl
                ? `<a href="${escapeAttr(socialHref(address.mapsUrl))}" target="_blank" rel="noopener">Directions</a>`
                : ''
            }
          </div>`
        })
        .join('')
    brand.appendChild(box)
  }

  const contact = document.getElementById('studioContact')
  if (contact && !contact.innerHTML) {
    const primary = sorted[0]
    const lines = String(primary.lines || '')
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
    const parts = []
    if (primary.label) parts.push(`<strong>${escapeAttr(primary.label)}</strong>`)
    if (lines.length) parts.push(lines.map(escapeAttr).join(', '))
    if (primary.phone) {
      const digits = String(primary.phone).replace(/[^+\d]/g, '')
      parts.push(`<a href="tel:${escapeAttr(digits)}">${escapeAttr(primary.phone)}</a>`)
    }
    if (primary.mapsUrl) {
      parts.push(
        `<a href="${escapeAttr(socialHref(primary.mapsUrl))}" target="_blank" rel="noopener">Get directions</a>`
      )
    }
    if (parts.length) {
      contact.innerHTML = parts.join(' · ')
      contact.hidden = false
    }
  }
}

async function init() {
  let store
  try {
    const res = await fetch(CATALOG_URL + '?t=' + Date.now(), { cache: 'no-store' })
    store = (await res.json()).store || {}
  } catch {
    return
  }
  const images = store.images || {}

  if (images.logoWhite) {
    document
      .querySelectorAll('.footer-mark, .site-header:not(.is-light) .brand img')
      .forEach((el) => applyImage(el, images.logoWhite))
  }
  if (images.logoBlack) {
    document
      .querySelectorAll('.site-header.is-light .brand img')
      .forEach((el) => applyImage(el, images.logoBlack))
  }
  if (images.logoBlack) {
    document
      .querySelectorAll('link[rel="apple-touch-icon"]')
      .forEach((el) => el.setAttribute('href', resolvePath(images.logoBlack)))
  }

  document.querySelectorAll('.seal').forEach((el) => applyImage(el, images.seal))
  document
    .querySelectorAll('.hero-plate img, .sf-hero-plate img')
    .forEach((el) => applyImage(el, images.hero))

  document.querySelectorAll('.gallery .tile img').forEach((el, index) => {
    const path = images['gallery' + (index + 1)]
    if (!path) return
    applyImage(el, path)
    const tile = el.closest('.tile')
    if (tile) tile.dataset.src = resolvePath(path)
  })

  renderSocial(store)
  renderAddresses(store)
  addFooterLinks()
  ensureManifest()
  loadAnalytics(store.analytics || {})
  registerServiceWorker()
}

function addFooterLinks() {
  const row = document.querySelector('.site-footer .footer-row p:last-child')
  if (!row || row.dataset.linksAdded) return
  row.dataset.linksAdded = '1'
  const extras = [
    { label: 'FAQ', href: './faq.html' },
    { label: 'Journal', href: './blog.html' },
    { label: 'Track order', href: './track.html' },
    { label: 'Wishlist', href: './wishlist.html' }
  ]
  extras.forEach((link) => {
    if (row.querySelector(`a[href="${link.href}"]`)) return
    row.insertAdjacentHTML('beforeend', ` · <a href="${link.href}">${link.label}</a>`)
  })
}

function ensureManifest() {
  if (document.querySelector('link[rel="manifest"]')) return
  const link = document.createElement('link')
  link.rel = 'manifest'
  link.href = './manifest.webmanifest'
  document.head.appendChild(link)
}

function loadAnalytics(analytics) {
  const ga = String(analytics.gaId || '').trim()
  if (/^G-[A-Z0-9]+$/i.test(ga)) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`
    document.head.appendChild(script)
    window.dataLayer = window.dataLayer || []
    window.gtag =
      window.gtag ||
      function () {
        window.dataLayer.push(arguments)
      }
    window.gtag('js', new Date())
    window.gtag('config', ga)
  }

  const pixel = String(analytics.metaPixel || '').trim()
  if (/^\d{6,20}$/.test(pixel)) {
    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      }
      if (!f._fbq) f._fbq = n
      n.push = n
      n.loaded = !0
      n.version = '2.0'
      n.queue = []
      t = b.createElement(e)
      t.async = !0
      t.src = v
      s = b.getElementsByTagName(e)[0]
      s.parentNode.insertBefore(t, s)
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
    /* eslint-enable */
    window.fbq('init', pixel)
    window.fbq('track', 'PageView')
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  const secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  if (!secure) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}

init()
