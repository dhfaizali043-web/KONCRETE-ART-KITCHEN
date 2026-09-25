/* Customer order history page. Depends on window.KAKAuth and window.KAKFront. */

function esc(value) {
  if (window.KAKFront) return window.KAKFront.escapeHtml(value)
  return String(value ?? '')
}

function waitAuth() {
  return new Promise((resolve) => {
    if (window.KAKAuth) return resolve(window.KAKAuth)
    let tries = 0
    const timer = setInterval(() => {
      tries += 1
      if (window.KAKAuth || tries > 80) {
        clearInterval(timer)
        resolve(window.KAKAuth || null)
      }
    }, 50)
  })
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
    return new Date(time).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return ''
  }
}

function slug(value) {
  return String(value || 'new')
    .toLowerCase()
    .replace(/\s+/g, '-')
}

function orderCard(order) {
  const items = Array.isArray(order.items) ? order.items : []
  const status = order.status || 'new'
  const payload = esc(
    JSON.stringify(
      items
        .filter((item) => item && item.id)
        .map((item) => ({ id: item.id, qty: Number(item.qty) || 1 }))
    )
  )
  return `
    <article class="order-card">
      <div class="order-card-head">
        <span class="order-ref">#${esc(String(order.id || '').slice(-8).toUpperCase())}</span>
        <span class="order-status is-${esc(slug(status))}">${esc(status)}</span>
      </div>
      <ul class="order-items">
        ${items
          .map(
            (item) =>
              `<li><span>${esc(item.name || 'Item')} × ${Number(item.qty) || 1}</span></li>`
          )
          .join('')}
      </ul>
      <div class="order-card-foot">
        <span>${esc(order.method || '')}</span>
        <span>${esc(formatDate(order.createdAt))}</span>
        <strong>${esc(order.total || '')}</strong>
      </div>
      <button type="button" class="btn btn-ghost order-reorder" data-reorder="${payload}">
        Add these items again
      </button>
    </article>`
}

function renderOrders(orders) {
  const box = document.getElementById('ordersBody')
  if (!box) return
  if (!orders.length) {
    box.innerHTML = `
      <div class="orders-empty">
        <p>Abhi koi order nahi hai.</p>
        <a class="btn btn-solid" href="./shop.html">Start shopping</a>
      </div>`
    return
  }
  box.innerHTML = orders.map(orderCard).join('')
}

function renderSignIn(auth) {
  const box = document.getElementById('ordersBody')
  if (!box) return
  box.innerHTML = `
    <div class="orders-empty">
      <p>Apne orders dekhne ke liye login karein.</p>
      <button type="button" class="btn btn-solid" id="ordersLogin">Login or create account</button>
    </div>`
  const btn = document.getElementById('ordersLogin')
  btn?.addEventListener('click', () => auth.open())
}

function bindReorder() {
  const box = document.getElementById('ordersBody')
  if (!box || box.dataset.bound) return
  box.dataset.bound = '1'
  box.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-reorder]')
    if (!btn) return
    let items = []
    try {
      items = JSON.parse(btn.dataset.reorder || '[]')
    } catch {
      items = []
    }
    if (!window.KAKFront) return
    let added = 0
    items.forEach((item) => {
      if (window.KAKFront.findProduct(item.id)) {
        window.KAKFront.addToCart(item.id, item.qty)
        added += 1
      }
    })
    if (!added) {
      window.KAKFront.toast('Ye products ab available nahi hain')
      return
    }
    window.location.href = './checkout.html'
  })
}

async function init() {
  const box = document.getElementById('ordersBody')
  const auth = await waitAuth()
  if (!auth) {
    if (box) box.innerHTML = '<p class="orders-msg">Account service load nahi hui.</p>'
    return
  }
  try {
    await auth.ready
  } catch {
    /* ignore */
  }
  if (!auth.enabled) {
    if (box) {
      box.innerHTML = `
        <div class="orders-empty">
          <p>Login abhi enable nahi hai. Admin panel &gt; Customer accounts me Firebase config daalein.</p>
          <a class="btn btn-ghost" href="./admin.html">Open admin</a>
        </div>`
    }
    return
  }
  bindReorder()
  auth.onAuthChange(async (user) => {
    if (!user) {
      renderSignIn(auth)
      return
    }
    if (box) box.innerHTML = '<p class="orders-msg">Orders load ho rahe hain…</p>'
    try {
      const orders = await auth.getOrders()
      renderOrders(orders)
    } catch (error) {
      if (box) box.innerHTML = `<p class="orders-msg">${esc(error && error.message)}</p>`
    }
  })
}

init()
