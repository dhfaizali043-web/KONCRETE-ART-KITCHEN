/* Order tracking: combines locally saved orders with account orders (if signed in). */

const F = window.KAKFront

const STEPS = ['New', 'Confirmed', 'In production', 'Shipped', 'Delivered']

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  })
}

function localOrders() {
  try {
    return JSON.parse(localStorage.getItem('kak_orders_local_v1')) || []
  } catch {
    return []
  }
}

async function accountOrders() {
  const auth = window.KAKAuth
  if (!auth || !auth.enabled) return []
  try {
    await auth.ready
  } catch {
    return []
  }
  if (!auth.currentUser()) return []
  try {
    const orders = await auth.getOrders()
    return orders.map((o) => ({
      ref: o.ref || o.id || '',
      status: o.status || 'new',
      createdAt: o.createdAt,
      total: o.total || '',
      items: o.items || []
    }))
  } catch {
    return []
  }
}

function normalizeStatus(status) {
  const value = String(status || 'new').toLowerCase()
  if (value.includes('cancel')) return 'Cancelled'
  if (value.includes('deliver')) return 'Delivered'
  if (value.includes('ship') || value.includes('dispatch')) return 'Shipped'
  if (value.includes('production') || value.includes('making') || value.includes('process')) {
    return 'In production'
  }
  if (value.includes('confirm') || value.includes('paid')) return 'Confirmed'
  return 'New'
}

function when(order) {
  const value = order.createdAt
  if (!value) return ''
  let time = 0
  if (typeof value === 'object' && typeof value.seconds === 'number') time = value.seconds * 1000
  else if (typeof value === 'object' && typeof value.toDate === 'function') time = value.toDate().getTime()
  else time = new Date(value).getTime()
  if (!time) return ''
  try {
    return new Date(time).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
}

function statusTimeline(status) {
  if (status === 'Cancelled') {
    return '<div class="track-cancel">This order was cancelled. For help, message us on WhatsApp.</div>'
  }
  const index = STEPS.indexOf(status)
  return `<ol class="track-steps">${STEPS.map(
    (step, i) => `
      <li class="${i <= index ? 'done' : ''}${i === index ? ' current' : ''}">
        <span class="track-dot"></span>${step}
      </li>`
  ).join('')}</ol>`
}

function orderCard(order) {
  const status = normalizeStatus(order.status)
  const items = Array.isArray(order.items) ? order.items : []
  return `
    <article class="track-card">
      <div class="track-card-head">
        <strong>${escapeHtml(order.ref || 'Order')}</strong>
        <span class="track-status">${escapeHtml(status)}</span>
      </div>
      ${when(order) ? `<p class="track-date">Placed ${escapeHtml(when(order))}</p>` : ''}
      ${statusTimeline(status)}
      <ul class="track-items">
        ${items
          .map(
            (item) =>
              `<li>${escapeHtml(item.name || item.id || 'Item')} × ${escapeHtml(item.qty || 1)}</li>`
          )
          .join('')}
      </ul>
      ${order.total ? `<p class="track-total">Total: <strong>${escapeHtml(order.total)}</strong></p>` : ''}
      <button type="button" class="btn btn-ghost track-invoice" data-invoice="${escapeHtml(
        JSON.stringify(order)
      )}">Invoice</button>
    </article>`
}

async function allOrders() {
  const map = new Map()
  localOrders().forEach((order) => {
    const key = String(order.ref || '').toUpperCase()
    if (key) map.set(key, order)
  })
  ;(await accountOrders()).forEach((order) => {
    const key = String(order.ref || '').toUpperCase()
    if (key && !map.has(key)) map.set(key, order)
  })
  return [...map.values()]
}

function renderResults(results, message) {
  const wrap = document.getElementById('trackResults')
  const msg = document.getElementById('trackMsg')
  if (msg) {
    msg.hidden = !message
    if (message) msg.textContent = message
  }
  if (!wrap) return
  wrap.innerHTML = results.map(orderCard).join('')
}

async function onSubmit(event) {
  event.preventDefault()
  const box = document.getElementById('trackRef')
  const query = String(box?.value || '').trim().toUpperCase()
  const orders = await allOrders()
  if (!orders.length) {
    renderResults(
      [],
      'No orders found on this device. If you ordered on another device, sign in to your account or message us on WhatsApp with your reference.'
    )
    return
  }
  if (!query) {
    renderResults(orders, '')
    return
  }
  const match = orders.filter((order) =>
    String(order.ref || '').toUpperCase().includes(query)
  )
  renderResults(match, match.length ? '' : 'No order matched that reference. Check and try again.')
}

async function init() {
  try {
    await F.ready()
  } catch {
    /* storage fallback only */
  }
  document.getElementById('trackForm')?.addEventListener('submit', onSubmit)
  document.getElementById('trackResults')?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-invoice]')
    if (!btn || !window.KAKInvoice) return
    let order = {}
    try {
      order = JSON.parse(btn.dataset.invoice || '{}')
    } catch {
      order = {}
    }
    const store = F.state.catalog && F.state.catalog.store
    window.KAKInvoice.print(order, store)
  })
  const orders = await allOrders()
  if (orders.length) renderResults(orders, '')
}

init()
