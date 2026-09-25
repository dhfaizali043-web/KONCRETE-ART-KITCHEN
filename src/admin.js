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
  orderAlertEmail: $('orderAlertEmail'),
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
  authEnabled: $('authEnabled'),
  authOwners: $('authOwners'),
  rulesCode: $('rulesCode'),
  fbApiKey: $('fbApiKey'),
  fbAuthDomain: $('fbAuthDomain'),
  fbProjectId: $('fbProjectId'),
  fbStorageBucket: $('fbStorageBucket'),
  fbSenderId: $('fbSenderId'),
  fbAppId: $('fbAppId'),
  products: $('products'),
  siteImages: $('siteImages'),
  status: $('status'),
  ghStatus: $('ghStatus'),
  dashGithub: $('dashGithub'),
  loadBtn: $('loadBtn'),
  saveBtn: $('saveBtn'),
  addBtn: $('addBtn'),
  downloadBtn: $('downloadBtn'),
  forgetBtn: $('forgetBtn')
}

let sha = null
let currentImages = {}

const DEFAULT_IMAGES = {
  logoWhite: 'brand/logo-white.png',
  logoBlack: 'brand/logo-black.png',
  seal: 'brand/kak-logo.jpg',
  hero: 'brand/nameplates/plate-04.png',
  gallery1: 'brand/nameplates/plate-01.png',
  gallery2: 'brand/nameplates/plate-02.png',
  gallery3: 'brand/nameplates/plate-03.png',
  gallery4: 'brand/nameplates/plate-04.png',
  gallery5: 'brand/nameplates/plate-05.png',
  genie: 'brand/genie.webp',
  genieAvatar: 'brand/genie-avatar.webp'
}

const SITE_IMAGE_SLOTS = [
  { key: 'logoWhite', label: 'Logo (white)', hint: 'Header and footer logo on every page' },
  { key: 'logoBlack', label: 'Logo (black)', hint: 'Mobile home-screen icon' },
  { key: 'hero', label: 'Home hero image', hint: 'Large image at the top of the home page' },
  { key: 'seal', label: 'Studio seal / wordmark', hint: 'Image in the About section' },
  { key: 'gallery1', label: 'Home gallery 1', hint: 'First tile in the home gallery' },
  { key: 'gallery2', label: 'Home gallery 2' },
  { key: 'gallery3', label: 'Home gallery 3' },
  { key: 'gallery4', label: 'Home gallery 4' },
  { key: 'gallery5', label: 'Home gallery 5' },
  { key: 'genie', label: 'Chat assistant image', hint: 'Large image in the chat panel' },
  { key: 'genieAvatar', label: 'Chat assistant avatar', hint: 'Small round image on the chat button' }
]

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
  els.downloadBtn?.addEventListener('click', () => {
    downloadCatalog(JSON.stringify(collect(), null, 2) + '\n')
    setStatus('Downloaded catalog.json — upload it manually to ' + els.path.value.trim(), 'warn')
  })
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
  els.authOwners.addEventListener('input', updateRulesCode)
  els.siteImages?.addEventListener('input', (event) => {
    const input = event.target.closest('[data-img-path]')
    if (!input) return
    const card = input.closest('[data-img-key]')
    const key = card.dataset.imgKey
    currentImages[key] = input.value.trim()
    setPreviewSrc(card, input.value.trim() ? resolveImage(input.value.trim()) : '')
  })
  els.siteImages?.addEventListener('change', (event) => {
    const input = event.target.closest('[data-img-upload]')
    if (input) handleSiteImageUpload(input)
  })

  const navButtons = document.querySelectorAll('[data-go]')
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => showSection(btn.dataset.go))
  })
  const initial = (location.hash || '#dashboard').slice(1)
  showSection(document.querySelector(`[data-section="${initial}"]`) ? initial : 'dashboard')

  updateRulesCode()
  loadRemote()
}

function showSection(name) {
  document.querySelectorAll('[data-section]').forEach((section) => {
    section.hidden = section.dataset.section !== name
  })
  document.querySelectorAll('.admin-nav [data-go]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.go === name)
  })
  if (location.hash.slice(1) !== name) history.replaceState(null, '', '#' + name)
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
      fillForm(data)
      setGithubState(true, `Connected to ${config.repo} (${config.branch}). ${data.products.length} products loaded.`)
      setStatus('Loaded latest data from GitHub. Publish to make edits live.')
    } else {
      const res = await fetch('./data/catalog.json?t=' + Date.now(), { cache: 'no-store' })
      data = await res.json()
      fillForm(data)
      setGithubState(false, 'Read-only: not connected to GitHub. Open "GitHub & publish" and add a token to go live.')
      setStatus('Loaded site copy (read-only). Connect GitHub in "GitHub & publish" to publish changes.', 'warn')
    }
  } catch (error) {
    setGithubState(false, 'Not connected: ' + error.message)
    setStatus('Could not load from GitHub (' + error.message + '). Check your token, repository and file path. Showing the site copy instead.', 'error')
    try {
      const res = await fetch('./data/catalog.json?t=' + Date.now(), { cache: 'no-store' })
      fillForm(await res.json())
    } catch {
      /* ignore */
    }
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
  const auth = store.auth || {}
  const fb = auth.config || {}
  els.authEnabled.checked = auth.enabled === true
  els.fbApiKey.value = fb.apiKey || ''
  els.fbAuthDomain.value = fb.authDomain || ''
  els.fbProjectId.value = fb.projectId || ''
  els.fbStorageBucket.value = fb.storageBucket || ''
  els.fbSenderId.value = fb.messagingSenderId || ''
  els.fbAppId.value = fb.appId || ''
  els.orderAlertEmail.value = (store.orders || {}).alertEmail || ''
  els.authOwners.value = (auth.owners || []).join(', ')
  updateRulesCode()
  renderSiteImages(store.images || {})
  els.products.innerHTML = ''
  ;(data.products || []).forEach((product) => addProduct(product))
  setText('dashProducts', (data.products || []).length)
  setText('dashLogin', auth.enabled === true ? 'On' : 'Off')
}

function setText(id, value) {
  const el = document.getElementById(id)
  if (el) el.textContent = value
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

function renderSiteImages(images) {
  currentImages = { ...DEFAULT_IMAGES, ...(images || {}) }
  if (!els.siteImages) return
  els.siteImages.innerHTML = SITE_IMAGE_SLOTS.map((slot) => {
    const value = currentImages[slot.key] || ''
    return `<div class="admin-image" data-img-key="${slot.key}">
      <img class="admin-image-preview" alt="" src="${value ? escapeAttr(resolveImage(value)) : ''}" ${
        value ? '' : 'hidden'
      } />
      <div class="admin-image-fields">
        <strong>${escapeHtml(slot.label)}</strong>
        ${slot.hint ? `<span class="admin-help">${escapeHtml(slot.hint)}</span>` : ''}
        <label>Image path or URL <input data-img-path value="${escapeAttr(value)}" /></label>
        <label class="admin-upload">Upload image from device
          <input type="file" accept="image/*" data-img-upload />
        </label>
        <span class="admin-upload-status" data-img-status></span>
      </div>
    </div>`
  }).join('')
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
    const path = await uploadImageTo(file, 'public/brand/products')
    imageField.value = path
    setUploadStatus(status, 'Image uploaded. Now click "Save & publish".', 'ok')
  } catch (error) {
    setUploadStatus(status, error.message, 'error')
  } finally {
    input.value = ''
  }
}

async function handleSiteImageUpload(input) {
  const card = input.closest('[data-img-key]')
  const status = card.querySelector('[data-img-status]')
  const pathField = card.querySelector('[data-img-path]')
  const file = input.files && input.files[0]
  if (!file) return

  setPreviewSrc(card, URL.createObjectURL(file))
  setUploadStatus(status, 'Uploading...', '')

  try {
    const path = await uploadImageTo(file, 'public/brand/site')
    currentImages[card.dataset.imgKey] = path
    pathField.value = path
    setUploadStatus(status, 'Uploaded. Now click "Save & publish".', 'ok')
  } catch (error) {
    setUploadStatus(status, error.message, 'error')
  } finally {
    input.value = ''
  }
}

async function uploadImageTo(file, dir) {
  const config = getConfig()
  if (!config.token) {
    throw new Error('Add your GitHub token in "GitHub & publish" to upload images.')
  }

  const prepared = await prepareImage(file)
  const base = slugify(String(file.name).replace(/\.[^.]+$/, '')) || 'image'
  const filename = `${base}-${Date.now()}.${prepared.ext}`
  const repoPath = `${dir}/${filename}`
  const buffer = await prepared.blob.arrayBuffer()

  const res = await fetch(apiUrl({ repo: config.repo, branch: config.branch, path: repoPath }, false), {
    method: 'PUT',
    headers: {
      Authorization: `token ${config.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `content: upload image ${filename}`,
      content: encodeBase64Binary(buffer),
      branch: config.branch
    })
  })
  if (!res.ok) throw new Error(await ghError(res))
  return `${dir.replace(/^public\//, '')}/${filename}`
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
        name: els.chatName.value.trim() || 'Studio Genie',
        apiUrl: els.chatApiUrl.value.trim(),
        greeting: els.chatGreeting.value.trim(),
        quickReplies: lines(els.chatQuick.value),
        knowledge: lines(els.chatKnowledge.value)
          .map((line) => {
            const [q, ...rest] = line.split('|')
            return { q: (q || '').trim(), a: rest.join('|').trim() }
          })
          .filter((entry) => entry.q && entry.a)
      },
      auth: {
        enabled: els.authEnabled.checked,
        owners: ownersList(),
        config: {
          apiKey: els.fbApiKey.value.trim(),
          authDomain: els.fbAuthDomain.value.trim(),
          projectId: els.fbProjectId.value.trim(),
          storageBucket: els.fbStorageBucket.value.trim(),
          messagingSenderId: els.fbSenderId.value.trim(),
          appId: els.fbAppId.value.trim()
        }
      },
      orders: {
        alertEmail: els.orderAlertEmail.value.trim()
      },
      images: { ...DEFAULT_IMAGES, ...currentImages }
    },
    products
  }
}

async function save() {
  const config = getConfig()
  const data = collect()

  if (!data.products.length) {
    setStatus('Nothing to publish — add at least one product in "Shop / Products" first.', 'error')
    showSection('products')
    return
  }
  if (data.products.some((p) => !p.name)) {
    setStatus('Every product needs a name. Please fill in the product name(s) and try again.', 'error')
    showSection('products')
    return
  }
  if (!config.token) {
    setStatus('Not connected to GitHub, so nothing was published. Open "GitHub & publish", paste your token, then click Save & publish again.', 'error')
    showSection('connect')
    return
  }

  const content = JSON.stringify(data, null, 2) + '\n'
  setStatus('Publishing…')
  try {
    const commit = await putFile(config, content)
    setGithubState(true, `Connected to ${config.repo} (${config.branch}).`)
    setStatus('Published — the live shop updates in about a minute.' + (commit ? ' Commit ' + commit.slice(0, 7) : ''))
  } catch (error) {
    setStatus('Publish failed: ' + error.message, 'error')
  }
}

async function putFile(config, content) {
  let attempt = 0
  while (attempt < 3) {
    attempt += 1
    if (!sha) {
      const res = await fetch(apiUrl(config, true), {
        headers: { Authorization: `token ${config.token}`, Accept: 'application/vnd.github+json' },
        cache: 'no-store'
      })
      if (res.ok) sha = (await res.json()).sha
      else if (res.status !== 404) throw new Error(await ghError(res))
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
    if (res.ok) {
      const json = await res.json()
      sha = json.content?.sha || sha
      return json.commit?.sha || ''
    }
    if (res.status === 409) {
      sha = null
      continue
    }
    throw new Error(await ghError(res))
  }
  throw new Error('The file changed while publishing. Please click Save & publish again.')
}

function setGithubState(connected, message) {
  if (els.ghStatus) {
    els.ghStatus.textContent = message
    els.ghStatus.className = 'admin-help'
  }
  if (els.dashGithub) {
    els.dashGithub.textContent = message
  }
}

function forgetToken() {
  localStorage.removeItem(LS.token)
  els.token.value = ''
  setGithubState(false, 'Token removed. Not connected to GitHub — changes cannot be published.')
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

function ownersList() {
  return String(els.authOwners.value || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
}

function updateRulesCode() {
  if (!els.rulesCode) return
  const list = ownersList()
    .map((email) => `'${email.replace(/'/g, "\\'")}'`)
    .join(', ')
  els.rulesCode.textContent = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner() {
      return request.auth != null && request.auth.token.email in [${list}];
    }
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /orders/{orderId} {
      allow create: if request.auth != null
        && request.resource.data.uid == request.auth.uid;
      allow read: if (request.auth != null && resource.data.uid == request.auth.uid)
        || isOwner();
      allow update: if isOwner();
    }
  }
}`
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
