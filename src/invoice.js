/* Printable order invoice. Exposes window.KAKInvoice.print(order, store). */

;(function () {
  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
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

  function money(value, store) {
    const code = (store && store.currencyCode) || 'INR'
    const symbol = (store && store.currencySymbol) || '₹'
    const amount = Number(value) || 0
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 0
      }).format(amount)
    } catch {
      return `${symbol}${amount.toLocaleString('en-IN')}`
    }
  }

  function print(order, store) {
    const s = store || {}
    const items = Array.isArray(order.items) ? order.items : []
    const primary = (Array.isArray(s.addresses) && s.addresses[0]) || {}
    const addressParts = [
      primary.line1 || primary.address || '',
      primary.city || '',
      primary.pincode || primary.state || ''
    ]
      .filter(Boolean)
      .join(', ')
    const rows = items
      .map((item) => {
        const qty = Number(item.qty) || 1
        const price = Number(item.price) || 0
        return `<tr>
          <td>${esc(item.name || item.id || 'Item')}${
            item.custom ? `<br><small>Customisation: ${esc(item.custom)}</small>` : ''
          }</td>
          <td class="num">${qty}</td>
          <td class="num">${price > 0 ? money(price, s) : '—'}</td>
          <td class="num">${price > 0 ? money(price * qty, s) : '—'}</td>
        </tr>`
      })
      .join('')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${esc(order.ref || '')} — Koncrete Art Kitchen</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Outfit', Arial, sans-serif; color: #201c18; margin: 0; padding: 2.4rem; }
  .inv-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; border-bottom: 2px solid #201c18; padding-bottom: 1.2rem; }
  .inv-head h1 { font-size: 1.5rem; margin: 0 0 0.3rem; letter-spacing: 0.06em; }
  .inv-head .muted { color: #6b645c; font-size: 0.85rem; margin: 0; }
  .inv-title { text-align: right; }
  .inv-title strong { display: block; font-size: 1.1rem; letter-spacing: 0.1em; }
  .inv-meta { display: flex; justify-content: space-between; gap: 2rem; margin: 1.6rem 0; flex-wrap: wrap; }
  .inv-meta div { font-size: 0.88rem; line-height: 1.6; }
  .inv-meta h3 { font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: #6b645c; margin: 0 0 0.4rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
  th, td { text-align: left; padding: 0.6rem 0.4rem; border-bottom: 1px solid #ddd5c8; font-size: 0.9rem; }
  th { font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: #6b645c; }
  .num { text-align: right; }
  .inv-total { margin-top: 1.4rem; margin-left: auto; width: 100%; max-width: 320px; }
  .inv-total .row { display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.9rem; }
  .inv-total .row.grand { border-top: 2px solid #201c18; margin-top: 0.4rem; padding-top: 0.6rem; font-weight: 700; font-size: 1.05rem; }
  .inv-foot { margin-top: 2.4rem; font-size: 0.8rem; color: #6b645c; line-height: 1.6; }
  @media print { body { padding: 1rem; } }
</style>
</head>
<body>
  <div class="inv-head">
    <div>
      <h1>KONCRETE ART KITCHEN</h1>
      <p class="muted">Design-led studio · Est. 2024</p>
      <p class="muted">${esc(addressParts)}</p>
      <p class="muted">${esc(s.whatsapp ? 'WhatsApp: ' + s.whatsapp : '')}</p>
    </div>
    <div class="inv-title">
      <strong>INVOICE</strong>
      <p class="muted">${esc(order.ref || '')}</p>
      <p class="muted">${esc(formatDate(order.createdAt) || '')}</p>
    </div>
  </div>

  <div class="inv-meta">
    <div>
      <h3>Billed to</h3>
      ${esc(order.name || '—')}<br>
      ${esc(order.phone || '')}<br>
      ${esc(order.address || '')}${order.pin ? '<br>PIN: ' + esc(order.pin) : ''}
    </div>
    <div>
      <h3>Payment</h3>
      ${esc(order.method || '—')}<br>
      Status: Confirmed on WhatsApp
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Amount</th></tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="4">No items</td></tr>'}</tbody>
  </table>

  <div class="inv-total">
    ${order.subtotal ? `<div class="row"><span>Subtotal</span><span>${esc(order.subtotal)}</span></div>` : ''}
    ${
      order.discount
        ? `<div class="row"><span>Discount${order.coupon ? ' (' + esc(order.coupon) + ')' : ''}</span><span>-${esc(order.discount)}</span></div>`
        : ''
    }
    ${order.shipping ? `<div class="row"><span>Shipping</span><span>${esc(order.shipping)}</span></div>` : ''}
    <div class="row grand"><span>Total</span><span>${esc(order.total || '')}</span></div>
  </div>

  <div class="inv-foot">
    This is a computer-generated invoice. Made-to-order and personalised pieces follow our
    Return &amp; Refund Policy. For any query, message us on WhatsApp.
  </div>

  <script>window.onload = function () { setTimeout(function () { window.print(); }, 250); }<\/script>
</body>
</html>`

    const win = window.open('', '_blank')
    if (!win) return false
    win.document.open()
    win.document.write(html)
    win.document.close()
    return true
  }

  window.KAKInvoice = { print }
})()
