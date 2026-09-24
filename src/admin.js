const DEFAULTS = {
  repo: 'dhfaizali043-web/KONCRETE-ART-KITCHEN',
  branch: 'main',
  path: 'public/data/catalog.json'
}

const LS = {
  token: 'kak_admin_token',
  repo: 'kak_admin_repo',
  branch: 'kak_admin_branch',
  path: 'kak_admin_path'
}

const $ = (id) => document.getElementById(id)

const els = {
  token: $('token'),
  repo: $('repo'),
  branch: $('branch'),
  path: $('path'),
  whatsapp: $('whatsapp'),
  currencySymbol: $('currencySymbol'),
  currencyCode: $('currencyCode'),
  payUpiId: $('payUpiId'),
  payUpiName: $('payUpiName'),
  payRazorpay: $('payRazorpay'),
  bankName: $('bankName'),
  bankBankName: $('bankBankName'),
  bankAccount: $('bankAccount'),
  bankIfsc: $('bankIfsc'),
  chatName: $('chatName'),
  chatApiUrl: $('chatApiUrl'),
  chatGreeting: $('chatGreeting'),
  chatQuick: $('chatQuick'),
  chatKnowledge: $('chatKnowledge'),
  products: $('products'),
  status: $('status'),
  loadBtn: $('loadBtn'),
  saveBtn: $('saveBtn'),
  addBtn: $('addBtn'),
  forgetBtn: $('forgetBtn')
}

let sha = null

function fieldValue(input, key, fallback) {
  const saved = localStorage.getItem(LS[key])
  return saved !== null ? saved : fallback
}

function init() {
  els.token.value = localStorage.getItem(LS.token) || ''
  els.repo.value = fieldValue(els.repo, 'repo', DEFAULTS.repo)
  els.branch.value = fieldValue(els.branch, 'branch', DEFAULTS.branch)
  els.path.value = fieldValue(els.path, 'path', DEFAULTS.path)

  els.loadBtn.addEventListener('click', loadRemote)
  els.saveBtn.addEventListener('click', save)
  els.addBtn.addEventListener('click', () => addProduct({}))
  els.forgetBtn.addEventListener('click', forgetToken)
  els.products.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-remove]')
    if (btn) btn.closest('.admin-product').remove()
  })
  els.products.addEventListener('input', (event) => {
    const input = event.target.closest('[data-field="image"]')
    if (input) setPreviewSrc(input.closest('.admin-product'), input.value.trim() ? resolveImage(input.value.trim()) : '')
  })
  els.products.addEventListener('change', (event) => {
    const input = event.target.closest('[data-upload]')
    if (input) handleUpload(input)
  })

  loadRemote()
}

function getConfig() {
  const token = els.token.value.trim()
  const repo = els.repo.value.trim() || DEFAULTS.repo
  const branch = els.branch.value.trim() || DEFAULTS.branch
  const path = els.path.value.trim() || DEFAULTS.path
  if (token) localStorage.setItem(LS.token, token)
  localStorage.setItem(LS.repo, repo)
  localStorage.setItem(LS.branch, branch)
  localStorage.setItem(LS.path, path)
  return { token, repo, branch, path }
}

function apiUrl({ repo, path, branch }, withRef) {
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  const base = `https://api.github.com/repos/${repo}/contents/${encoded}`
  return withRef ? `${base}?ref=${encodeURIComponent(branch)}` : base
}

async function loadRemote() {
  const config = getConfig()
  setStatus('Loading…')
  try {
    let data
    if (config.token) {
      const res = await fetch(apiUrl(config, true), {
        headers: { Authorization: `token ${config.token}`, Accept: 'application/vnd.github+json' },
        cache: 'no-store'
      })
      if (!res.ok) throw new Error(await ghError(res))
      const json = await res.json()
      sha = json.sha
      data = JSON.parse(decodeBase64(json.content))
    } else {
      const res = await fetch('./data/catalog.json', { cache: 'no-store' })
      data = await res.json()
      setStatus('Loaded local copy (read-only). Add a token to publish.', 'warn')
    }
    fillForm(data)
    if (config.token) setStatus('Loaded latest data from GitHub.')
  } catch (error) {
    setStatus('Could not load: ' + error.message, 'error')
  }
}

function fillForm(data) {
  const store = data.store || {}
  els.whatsapp.value = store.whatsapp || ''
  els.currencySymbol.value = store.currencySymbol || '₹'
  els.currencyCode.value = store.currencyCode || 'INR'
  const pay = store.payments || {}
  const bank = pay.bank || {}
  els.payUpiId.value = pay.upiId || ''
  els.payUpiName.value = pay.upiName || ''
  els.payRazorpay.value = pay.razorpayLink || ''
  els.bankName.value = bank.accountName || ''
  els.bankBankName.value = bank.bankName || ''
  els.bankAccount.value = bank.accountNumber || ''
  els.bankIfsc.value = bank.ifsc || ''
  const chat = store.chat || {}
  els.chatName.value = chat.name || ''
  els.chatApiUrl.value = chat.apiUrl || ''
  els.chatGreeting.value = chat.greeting || ''
  els.chatQuick.value = (chat.quickReplies || []).join('\n')
  els.chatKnowledge.value = (chat.knowledge || [])
    .map((entry) => `${entry.q || entry.question || ''} | ${entry.a || entry.answer || ''}`)
    .join('\n')
  els.products.innerHTML = ''
  ;(data.products || []).forEach((product) => addProduct(product))
}

function addProduct(product) {
  const el = document.createElement('div')
  el.className = 'admin-product'
  const imagePath = product.image || ''
  el.innerHTML = `
    <div class="admin-product-head">
      <strong>${escapeHtml(product.name || 'New product')}</strong>
      <button type="button" class="admin-remove" data-remove>Remove</button>
    </div>
    <div class="admin-image">
      <img class="admin-image-preview" alt="" src="${imagePath ? escapeAttr(resolveImage(imagePath)) : ''}" ${
        imagePath ? '' : 'hidden'
      } />
      <div class="admin-image-fields">
        <label>Image path or URL <input data-field="image" value="${escapeAttr(imagePath)}" /></label>
        <label class="admin-upload">Upload image from device
          <input type="file" accept="image/*" data-upload />
        </label>
        <span class="admin-upload-status" data-upload-status></span>
      </div>
    </div>
    <div class="admin-grid">
      <label>Name <input data-field="name" value="${escapeAttr(product.name)}" /></label>
      <label>Price <input data-field="price" type="number" min="0" value="${escapeAttr(product.price ?? 0)}" /></label>
      <label>ID (optional) <input data-field="id" value="${escapeAttr(product.id)}" placeholder="auto from name" /></label>
      <label class="admin-wide">Description <textarea data-field="description" rows="2">${escapeHtml(product.description)}</textarea></label>
      <label class="admin-check"><input data-field="available" type="checkbox" ${
        product.available === false ? '' : 'checked'
      } /> Available</label>
    </div>`
  els.products.appendChild(el)
}

function resolveImage(src) {
  const value = String(src || '')
  if (!value) return ''
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  return './' + value.replace(/^\.?\//, '')
}

function setPreviewSrc(card, src) {
  const img = card.querySelector('.admin-image-preview')
  if (!img) return
  if (src) {
    img.src = src
    img.hidden = false
  } else {
    img.removeAttribute('src')
    img.hidden = true
  }
}

function setUploadStatus(statusEl, message, kind) {
  if (!statusEl) return
  statusEl.textContent = message
  statusEl.className = 'admin-upload-status' + (kind ? ' is-' + kind : '')
}

async function handleUpload(input) {
  const card = input.closest('.admin-product')
  const status = card.querySelector('[data-upload-status]')
  const imageField = card.querySelector('[data-field="image"]')
  const file = input.files && input.files[0]
  if (!file) return

  setPreviewSrc(card, URL.createObjectURL(file))
  setUploadStatus(status, 'Uploading...', '')

  try {
    const path = await uploadImage(file)
    imageField.value = path
    setUploadStatus(status, 'Image uploaded. Now click "Save & publish".', 'ok')
  } catch (error) {
    setUploadStatus(status, error.message, 'error')
  } finally {
    input.value = ''
  }
}

async function uploadImage(file) {
  const config = getConfig()
  if (!config.token) {
    throw new Error('Add your GitHub token in section 1 to upload images.')
  }

  const prepared = await prepareImage(file)
  const base = slugify(String(file.name).replace(/\.[^.]+$/, '')) || 'product'
  const filename = `${base}-${Date.now()}.${prepared.ext}`
  const repoPath = `public/brand/products/${filename}`
  const buffer = await prepared.blob.arrayBuffer()

  const res = await fetch(apiUrl({ repo: config.repo, branch: config.branch, path: repoPath }, false), {
    method: 'PUT',
    headers: {
      Authorization: `token ${config.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `content: upload product image ${filename}`,
      content: encodeBase64Binary(buffer),
      branch: config.branch
    })
  })
  if (!res.ok) throw new Error(await ghError(res))
  return `brand/products/${filename}`
}

async function prepareImage(file) {
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'avif']
  const ext = (String(file.name).split('.').pop() || '').toLowerCase()
  if (!file.type.startsWith('image/') && !allowed.includes(ext)) {
    throw new Error('Please choose a JPG, PNG, WEBP or AVIF image.')
  }
  const limit = 2 * 1024 * 1024
  if (file.size <= limit) {
    return { blob: file, ext: allowed.includes(ext) ? ext : 'jpg' }
  }

  const bitmap = await createImageBitmap(file)
  const max = 1600
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (!blob) throw new Error('Could not process this image. Try a smaller file.')
  return { blob, ext: 'jpg' }
}

function collect() {
  const products = [...els.products.querySelectorAll('.admin-product')].map((el) => {
    const get = (field) => el.querySelector(`[data-field="${field}"]`)
    const name = get('name').value.trim()
    let id = get('id').value.trim()
    if (!id) id = slugify(name) || 'product-' + Math.random().toString(36).slice(2, 7)
    return {
      id,
      name,
      description: get('description').value.trim(),
      price: Number(get('price').value) || 0,
      image: get('image').value.trim(),
      available: get('available').checked
    }
  })
  return {
    store: {
      whatsapp: els.whatsapp.value.trim(),
      currencySymbol: els.currencySymbol.value.trim() || '₹',
      currencyCode: els.currencyCode.value.trim() || 'INR',
      payments: {
        upiId: els.payUpiId.value.trim(),
        upiName: els.payUpiName.value.trim(),
        razorpayLink: els.payRazorpay.value.trim(),
        bank: {
          accountName: els.bankName.value.trim(),
          bankName: els.bankBankName.value.trim(),
          accountNumber: els.bankAccount.value.trim(),
          ifsc: els.bankIfsc.value.trim()
        }
      },
      chat: {
        name: els.chatName.value.trim() || 'Studio Assistant',
        apiUrl: els.chatApiUrl.value.trim(),
        greeting: els.chatGreeting.value.trim(),
        quickReplies: lines(els.chatQuick.value),
        knowledge: lines(els.chatKnowledge.value)
          .map((line) => {
            const [q, ...rest] = line.split('|')
            return { q: (q || '').trim(), a: rest.join('|').trim() }
          })
          .filter((entry) => entry.q && entry.a)
      }
    },
    products
  }
}

async function save() {
  const config = getConfig()
  const data = collect()
  const content = JSON.stringify(data, null, 2) + '\n'

  if (!config.token) {
    downloadCatalog(content)
    setStatus('No token — downloaded catalog.json. Upload it to ' + config.path, 'warn')
    return
  }

  setStatus('Publishing…')
  try {
    if (!sha) {
      const res = await fetch(apiUrl(config, true), {
        headers: { Authorization: `token ${config.token}`, Accept: 'application/vnd.github+json' }
      })
      if (res.ok) sha = (await res.json()).sha
    }
    const body = {
      message: 'content: update shop catalog',
      content: encodeBase64(content),
      branch: config.branch
    }
    if (sha) body.sha = sha
    const res = await fetch(apiUrl(config, false), {
      method: 'PUT',
      headers: {
        Authorization: `token ${config.token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error(await ghError(res))
    const json = await res.json()
    sha = json.content?.sha || sha
    setStatus('Published. The live site updates in about a minute.')
  } catch (error) {
    setStatus('Publish failed: ' + error.message, 'error')
  }
}

function forgetToken() {
  localStorage.removeItem(LS.token)
  els.token.value = ''
  setStatus('Token removed from this browser.')
}

function setStatus(message, kind) {
  if (!els.status) return
  els.status.textContent = message
  els.status.className = 'admin-status' + (kind ? ' is-' + kind : '')
}

async function ghError(res) {
  try {
    const json = await res.json()
    return json.message || `HTTP ${res.status}`
  } catch {
    return `HTTP ${res.status}`
  }
}

function lines(value) {
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

function encodeBase64Binary(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function decodeBase64(str) {
  const binary = atob(str.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function downloadCatalog(content) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'catalog.json'
  a.click()
  URL.revokeObjectURL(url)
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  })
}

function escapeAttr(str) {
  return escapeHtml(str)
}

init()
