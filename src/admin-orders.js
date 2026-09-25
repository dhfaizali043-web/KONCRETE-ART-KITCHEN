const STATUSES = ['new', 'confirmed', 'in production', 'shipped', 'delivered', 'cancelled']

let AUTH = null

function waitForAuth() {
  return new Promise((resolve) => {
    if (window.KAKAuth) return resolve(window.KAKAuth)
    let tries = 0
    const timer = setInterval(() => {
      tries += 1
      if (window.KAKAuth || tries > 60) {
        clearInterval(timer)
        resolve(window.KAKAuth || null)
      }
    }, 50)
  })
}

function box() {
  return document.getElementById('adminOrders')
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  })
}

async function start() {
  AUTH = await waitForAuth()
  const el = box()
  if (!el || !AUTH) return
  try {
    await AUTH.ready
  } catch {
    return
  }
  if (!AUTH.enabled) {
    el.innerHTML =
      '<p class="admin-help">Customer accounts abhi band hain. Section 6 me Firebase config bhar kar login enable karein — uske baad yahan saare orders dikhenge.</p>'
    return
  }
  AUTH.onAuthChange((user) => render(user))
  render(AUTH.currentUser())
}

function render(user) {
  const el = box()
  if (!el) return
  if (!user) {
    renderSignIn(el)
    return
  }
  renderOrders(el, user)
}

function renderSignIn(el) {
  el.innerHTML = `
    <div class="admin-grid orders-signin">
      <label>Owner email<input type="email" id="ownerEmail" autocomplete="email" /></label>
      <label>Password<input type="password" id="ownerPass" autocomplete="current-password" /></label>
      <div class="admin-actions admin-wide">
        <button class="btn btn-solid" id="ownerSignin" type="button">Sign in</button>
        <button class="btn btn-ghost" id="ownerGoogle" type="button">Continue with Google</button>
      </div>
      <p class="auth-msg admin-wide" id="ownerMsg" role="status" aria-live="polite"></p>
    </div>`
  const msg = document.getElementById('ownerMsg')
  const run = async (fn) => {
    msg.textContent = 'Please wait…'
    msg.className = 'auth-msg'
    try {
      await fn()
    } catch (error) {
      msg.textContent = error.message || 'Sign in nahi ho paya'
      msg.className = 'auth-msg is-error'
    }
  }
  document.getElementById('ownerSignin').addEventListener('click', () =>
    run(() =>
      AUTH.signIn(
        document.getElementById('ownerEmail').value.trim(),
        document.getElementById('ownerPass').value
      )
    )
  )
  document.getElementById('ownerGoogle').addEventListener('click', () => run(() => AUTH.signInWithGoogle()))
}

async function renderOrders(el, user) {
  el.innerHTML = `
    <div class="orders-head">
      <p class="admin-help">Signed in as <strong>${esc(user.email || '')}</strong></p>
      <div class="admin-actions">
        <button class="btn btn-ghost" id="ordersRefresh" type="button">Refresh</button>
        <button class="btn btn-ghost" id="ordersSignout" type="button">Sign out</button>
      </div>
    </div>
    <div id="ordersList"></div>`
  document.getElementById('ordersRefresh').addEventListener('click', loadOrders)
  document.getElementById('ordersSignout').addEventListener('click', () => AUTH.signOutUser())
  loadOrders()
}

async function loadOrders() {
  const list = document.getElementById('ordersList')
  if (!list) return
  list.innerHTML = '<p class="admin-help">Loading orders…</p>'
  try {
    const orders = await AUTH.getAllOrders()
    if (!orders.length) {
      list.innerHTML = '<p class="admin-help">Abhi koi order nahi aaya.</p>'
      return
    }
    list.innerHTML = orders.map(orderCard).join('')
    list.querySelectorAll('[data-save-status]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.saveStatus
        const select = list.querySelector(`[data-status="${id}"]`)
        btn.disabled = true
        btn.textContent = 'Saving…'
        try {
          await AUTH.updateOrderStatus(id, select.value)
          btn.textContent = 'Saved'
        } catch (error) {
          btn.textContent = 'Failed'
        }
        setTimeout(() => {
          btn.textContent = 'Save'
          btn.disabled = false
        }, 1500)
      })
    })
  } catch (error) {
    list.innerHTML = `<p class="auth-msg is-error">${esc(error.message || 'Orders load nahi ho paye')}</p>`
  }
}

function orderCard(order) {
  const id = esc(order.id)
  const items = (order.items || [])
    .map((item) => `${esc(item.name)} × ${item.qty || 1}`)
    .join('<br>')
  const status = String(order.status || 'new').toLowerCase()
  const options = STATUSES.map(
    (value) => `<option value="${value}"${value === status ? ' selected' : ''}>${value}</option>`
  ).join('')
  return `<div class="admin-order">
    <div class="admin-order-top">
      <strong>${esc(order.name || 'Customer')}</strong>
      <span>${esc(order.total || '')}</span>
    </div>
    <p class="admin-order-items">${items || '—'}</p>
    <p class="admin-order-meta">${esc(order.phone || '')} · ${esc(order.method || '')} · ${esc(formatDate(order.createdAt))}</p>
    <p class="admin-order-meta">${esc(order.address || '')}</p>
    ${order.note ? `<p class="admin-order-meta">Note: ${esc(order.note)}</p>` : ''}
    <div class="admin-order-foot">
      <label>Status
        <select data-status="${id}">${options}</select>
      </label>
      <button class="btn btn-ghost" data-save-status="${id}" type="button">Save</button>
    </div>
  </div>`
}

function timeOf(value) {
  if (!value) return 0
  if (typeof value.toDate === 'function') return value.toDate().getTime()
  if (typeof value.seconds === 'number') return value.seconds * 1000
  return new Date(value).getTime() || 0
}

function formatDate(value) {
  const time = timeOf(value)
  if (!time) return ''
  try {
    return new Date(time).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
}

start()
