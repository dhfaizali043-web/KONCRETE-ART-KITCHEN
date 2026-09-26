/* Contact page: studio details, map and WhatsApp message form.
   Depends on window.KAKFront (src/storefront.js). */

const escapeHtml = (value) =>
  window.KAKFront ? window.KAKFront.escapeHtml(value) : String(value ?? '')

function digitsOnly(value) {
  return String(value || '').replace(/[^0-9]/g, '')
}

function linesOf(address) {
  return String((address && address.lines) || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function mapEmbed(query) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
}

function mapLink(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function renderContact(store) {
  const box = document.getElementById('contactInfo')
  if (!box) return

  const addresses = (Array.isArray(store.addresses) ? store.addresses : []).filter(
    (address) => address && (address.lines || address.phone || address.label)
  )
  const sorted = [...addresses].sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0))
  const whatsapp = digitsOnly(store.whatsapp)
  const whatsappOk = whatsapp.length >= 10
  const email = (store.orders && store.orders.alertEmail) || ''

  const blocks = []

  if (sorted.length) {
    blocks.push(
      sorted
        .map((address) => {
          const lines = linesOf(address)
          const phone = digitsOnly(address.phone)
          return `<div class="contact-block">
            ${address.label ? `<h2>${escapeHtml(address.label)}</h2>` : '<h2>Studio</h2>'}
            ${lines.length ? `<p class="contact-lines">${lines.map(escapeHtml).join('<br>')}</p>` : ''}
            <p class="contact-links">
              ${phone ? `<a href="tel:${escapeHtml(phone)}">${escapeHtml(address.phone)}</a>` : ''}
              ${
                lines.length
                  ? `<a href="${escapeHtml(mapLink(lines.join(', ')))}" target="_blank" rel="noopener">Get directions</a>`
                  : ''
              }
            </p>
          </div>`
        })
        .join('')
    )
  } else {
    blocks.push(
      '<div class="contact-block"><h2>Studio</h2><p class="contact-lines">Add the studio address from the admin panel.</p></div>'
    )
  }

  const actions = []
  if (whatsappOk) {
    actions.push(
      `<a class="btn btn-solid" href="https://wa.me/${escapeHtml(whatsapp)}" target="_blank" rel="noopener">Chat on WhatsApp</a>`
    )
  }
  if (email) {
    actions.push(
      `<a class="btn btn-ghost" href="mailto:${escapeHtml(email)}">Email us</a>`
    )
  }
  if (actions.length) {
    blocks.push(`<div class="contact-actions">${actions.join('')}</div>`)
  }

  box.innerHTML = blocks.join('')

  const primary = sorted[0]
  const query = primary ? linesOf(primary).join(', ') : ''
  const map = document.getElementById('contactMap')
  const frame = document.getElementById('contactMapFrame')
  if (map && frame && query) {
    frame.src = mapEmbed(query)
    map.hidden = false
  }
}

function bindForm(store) {
  const form = document.getElementById('contactForm')
  const status = document.getElementById('contactStatus')
  if (!form) return
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const data = new FormData(form)
    const name = String(data.get('name') || '').trim()
    const phone = String(data.get('phone') || '').trim()
    const message = String(data.get('message') || '').trim()
    const body = [
      `Name: ${name}`,
      phone ? `Phone: ${phone}` : '',
      '',
      message
    ]
      .filter(Boolean)
      .join('\n')

    const whatsapp = digitsOnly(store.whatsapp)
    const email = (store.orders && store.orders.alertEmail) || ''
    const whatsappOk = whatsapp.length >= 10

    if (!whatsappOk && !email) {
      showStatus(
        status,
        'Contact details are not set yet. Add them in the admin panel.',
        true
      )
      return
    }

    if (whatsappOk) {
      window.open(
        `https://wa.me/${whatsapp}?text=${encodeURIComponent(body)}`,
        '_blank',
        'noopener'
      )
    }

    const emailTask = email
      ? fetch('https://formsubmit.co/ajax/' + encodeURIComponent(email), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            _subject: `Website enquiry — ${name}`,
            Name: name,
            Phone: phone,
            Message: message
          })
        })
          .then(() => true)
          .catch(() => false)
      : null

    form.reset()

    if (whatsappOk && email) {
      showStatus(status, 'Opening WhatsApp and emailing your message…')
      emailTask.then((ok) =>
        showStatus(
          status,
          ok
            ? 'Thank you — your message has been sent on WhatsApp and email.'
            : 'WhatsApp opened, but email could not be sent. Please complete the message on WhatsApp.',
          !ok
        )
      )
    } else if (whatsappOk) {
      showStatus(status, 'Opening WhatsApp — send the message.')
    } else {
      showStatus(status, 'Sending your message…')
      emailTask.then((ok) =>
        showStatus(
          status,
          ok
            ? 'Thank you — your message has been sent by email.'
            : 'Could not send right now. Please try again later.',
          !ok
        )
      )
    }
  })
}

function showStatus(el, text, isError) {
  if (!el) return
  el.hidden = false
  el.textContent = text
  el.className = 'form-status' + (isError ? ' is-error' : '')
}

async function init() {
  if (!window.KAKFront) return
  await window.KAKFront.ready()
  const store = (window.KAKFront.state.catalog && window.KAKFront.state.catalog.store) || {}
  renderContact(store)
  bindForm(store)
}

init()
