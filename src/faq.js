/* FAQ page: renders the store FAQ as an accordion and adds FAQ schema. */

const F = window.KAKFront

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  })
}

function renderFaq(list) {
  const wrap = document.getElementById('faqList')
  const empty = document.getElementById('faqEmpty')
  if (!wrap) return
  const faq = Array.isArray(list) ? list.filter((item) => item && item.q && item.a) : []
  if (!faq.length) {
    if (empty) empty.hidden = false
    return
  }
  wrap.innerHTML = faq
    .map(
      (item, index) => `
      <details class="faq-item"${index === 0 ? ' open' : ''}>
        <summary><span>${escapeHtml(item.q)}</span><i aria-hidden="true"></i></summary>
        <div class="faq-answer"><p>${escapeHtml(item.a)}</p></div>
      </details>`
    )
    .join('')
  injectSchema(faq)
}

function injectSchema(faq) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a }
    }))
  }
  const tag = document.createElement('script')
  tag.type = 'application/ld+json'
  tag.textContent = JSON.stringify(schema)
  document.head.appendChild(tag)
}

async function init() {
  try {
    await F.ready()
  } catch {
    /* fall through to static content */
  }
  const store = (F.state.catalog && F.state.catalog.store) || {}
  renderFaq(store.faq)
}

init()
