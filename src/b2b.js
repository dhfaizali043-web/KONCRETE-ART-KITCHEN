/* B2B / wholesale page. Renders catalog-driven content and handles the enquiry form.
   Depends on window.KAKFront (src/storefront.js). */

const F = window.KAKFront

const DEFAULTS = {
  eyebrow: 'For business',
  title: 'Wholesale, corporate gifting & private label',
  intro:
    'We design and manufacture custom name plates and decor in-house. Partner with us for bulk orders, corporate gifting, private label and contract manufacturing — pan-India and export ready.',
  audiences: [
    'Retailers & resellers',
    'Interior designers & architects',
    'Corporate gifting & bulk orders',
    'Cafes, hotels & offices',
    'Exporters & importers',
    'Event & gifting agencies'
  ],
  offerings: [
    {
      title: 'Wholesale & bulk pricing',
      text: 'Tiered pricing for trade partners on repeat and volume orders, with dedicated support.'
    },
    {
      title: 'Corporate gifting',
      text: 'Branded name plates and decor for employees, clients and occasions — packed and ready to gift.'
    },
    {
      title: 'Private label (OEM)',
      text: 'Made under your brand with your packaging, labelling and design direction.'
    },
    {
      title: 'Contract manufacturing',
      text: 'We take your design from sample to bulk production in our in-house studio.'
    },
    {
      title: 'Custom branding',
      text: 'Logo, names, colours and layouts tailored to your brand guidelines.'
    },
    {
      title: 'Pan-India & export shipping',
      text: 'Careful packing with courier and freight options for domestic and export orders.'
    }
  ],
  process: [
    'Share your requirement, quantity and timeline.',
    'We propose options, pricing and a sample.',
    'Sample approval and order confirmation.',
    'Bulk production in our studio.',
    'Quality check, packing and dispatch.'
  ],
  terms: [
    'Minimum order quantity (MOQ): shared on enquiry, based on the product.',
    'Lead time: depends on quantity and customisation — confirmed with your quote.',
    'Payment terms: advance with order; balance before dispatch (discussed per order).',
    'Custom branding and packaging: available on request.',
    'Samples: available, charges depend on the design.'
  ],
  note: 'Share your requirement and we will get back with pricing, lead time and samples.'
}

function el(id) {
  return document.getElementById(id)
}

function list(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function applyContent(b2b) {
  const eyebrow = el('b2bEyebrow')
  const title = el('b2bTitle')
  const intro = el('b2bIntro')
  const note = el('b2bNote')
  if (eyebrow && b2b.eyebrow) eyebrow.textContent = b2b.eyebrow
  if (title && b2b.title) title.textContent = b2b.title
  if (intro && b2b.intro) intro.textContent = b2b.intro
  if (note && b2b.note) note.textContent = b2b.note

  const audiences = el('b2bAudience')
  if (audiences) {
    audiences.innerHTML = list(b2b.audiences)
      .map((item) => `<li>${F.escapeHtml(item)}</li>`)
      .join('')
  }

  const offerings = el('b2bOfferings')
  if (offerings) {
    offerings.innerHTML = list(b2b.offerings)
      .map(
        (item) => `<article class="b2b-card">
          <h3>${F.escapeHtml(item.title || '')}</h3>
          <p>${F.escapeHtml(item.text || '')}</p>
        </article>`
      )
      .join('')
  }

  const process = el('b2bProcess')
  if (process) {
    process.innerHTML = list(b2b.process)
      .map((step) => `<li>${F.escapeHtml(step)}</li>`)
      .join('')
  }

  const terms = el('b2bTerms')
  if (terms) {
    terms.innerHTML = list(b2b.terms)
      .map((item) => `<li>${F.escapeHtml(item)}</li>`)
      .join('')
  }
}

function setupWhatsApp(store) {
  const link = el('b2bWhatsApp')
  if (!link) return
  const number = String(store.whatsapp || '').replace(/[^\d]/g, '')
  if (number.length >= 10) {
    link.href = `https://wa.me/${number}?text=${encodeURIComponent(
      'Hello, I have a B2B / wholesale enquiry.'
    )}`
    link.target = '_blank'
    link.rel = 'noopener'
  }
}

function bindForm(store) {
  const form = el('b2bForm')
  const status = el('b2bStatus')
  if (!form) return

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const data = new FormData(form)
    const get = (key) => String(data.get(key) || '').trim()
    const summary = [
      `Name: ${get('name')}`,
      get('company') ? `Company: ${get('company')}` : '',
      `Phone: ${get('phone')}`,
      get('email') ? `Email: ${get('email')}` : '',
      get('city') ? `City: ${get('city')}` : '',
      get('quantity') ? `Quantity: ${get('quantity')}` : '',
      `Requirement: ${get('interest')}`,
      '',
      `Details: ${get('message')}`
    ]
      .filter(Boolean)
      .join('\n')

    const number = String(store.whatsapp || '').replace(/[^\d]/g, '')
    const email = (store.orders && store.orders.alertEmail) || ''
    const whatsappOk = number.length >= 10 && number !== '910000000000'

    if (whatsappOk) {
      window.open(
        `https://wa.me/${number}?text=${encodeURIComponent(
          `New B2B enquiry — Koncrete Art Kitchen\n\n${summary}`
        )}`,
        '_blank',
        'noopener'
      )
      showStatus(status, 'Opening WhatsApp — send the enquiry.')
      form.reset()
    } else if (email) {
      fetch('https://formsubmit.co/ajax/' + encodeURIComponent(email), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: 'New B2B enquiry — Koncrete Art Kitchen',
          'Type of requirement': get('interest'),
          Name: get('name'),
          Company: get('company'),
          Phone: get('phone'),
          Email: get('email'),
          City: get('city'),
          Quantity: get('quantity'),
          Details: get('message')
        })
      })
        .then(() => {
          showStatus(status, 'Thank you — your enquiry has been sent.')
          form.reset()
        })
        .catch(() => showStatus(status, 'Could not send right now. Please try again later.', true))
    } else {
      showStatus(status, 'Contact details are not set yet. Add them in the admin panel.', true)
    }
  })
}

function showStatus(node, text, isError) {
  if (!node) return
  node.hidden = false
  node.textContent = text
  node.className = 'form-status' + (isError ? ' is-error' : '')
}

async function init() {
  if (!F) return
  await F.ready()
  const store = (F.state.catalog && F.state.catalog.store) || {}
  const b2b = { ...DEFAULTS, ...(store.b2b || {}) }
  if (!list(b2b.audiences).length) b2b.audiences = DEFAULTS.audiences
  if (!list(b2b.offerings).length) b2b.offerings = DEFAULTS.offerings
  if (!list(b2b.process).length) b2b.process = DEFAULTS.process
  if (!list(b2b.terms).length) b2b.terms = DEFAULTS.terms

  applyContent(b2b)
  setupWhatsApp(store)
  bindForm(store)
}

init()
