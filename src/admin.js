const DEFAULTS = {
  repo: 'dhfaizali043-web/KONCRETE-ART-KITCHEN',
  branch: 'main',
  path: 'public/data/catalog.json'
}

const LS = {
  token: 'kak_admin_token',
  repo: 'kak_admin_repo',
  branch: 'kak_admin_branch',
  path: 'kak_admin_path',
  pin: 'kak_admin_pin_hash'
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
  socialInstagram: $('socialInstagram'),
  socialPinterest: $('socialPinterest'),
  socialYoutube: $('socialYoutube'),
  socialX: $('socialX'),
  payUpiId: $('payUpiId'),
  payUpiName: $('payUpiName'),
  payRazorpay: $('payRazorpay'),
  bankName: $('bankName'),
  bankBankName: $('bankBankName'),
  bankAccount: $('bankAccount'),
  bankIfsc: $('bankIfsc'),
  shipEnabled: $('shipEnabled'),
  shipFlat: $('shipFlat'),
  shipFree: $('shipFree'),
  shipZonesInput: $('shipZonesInput'),
  couponsInput: $('couponsInput'),
  chatName: $('chatName'),
  chatApiUrl: $('chatApiUrl'),
  chatGreeting: $('chatGreeting'),
  chatQuick: $('chatQuick'),
  chatAbout: $('chatAbout'),
  chatKnowledge: $('chatKnowledge'),
  b2bEyebrow: $('b2bEyebrow'),
  b2bTitle: $('b2bTitle'),
  b2bIntro: $('b2bIntro'),
  b2bAudiences: $('b2bAudiences'),
  b2bOfferings: $('b2bOfferings'),
  b2bProcess: $('b2bProcess'),
  b2bTerms: $('b2bTerms'),
  b2bNote: $('b2bNote'),
  homeAnnouncements: $('homeAnnouncements'),
  homeFeatures: $('homeFeatures'),
  homeReviews: $('homeReviews'),
  newsTitle: $('newsTitle'),
  newsText: $('newsText'),
  newsEmail: $('newsEmail'),
  heroBadge: $('heroBadge'),
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
  categoryList: $('categoryList'),
  addCategoryBtn: $('addCategoryBtn'),
  addressList: $('addressList'),
  addAddressBtn: $('addAddressBtn'),
  siteImages: $('siteImages'),
  status: $('status'),
  ghStatus: $('ghStatus'),
  dashGithub: $('dashGithub'),
  loadBtn: $('loadBtn'),
  saveBtn: $('saveBtn'),
  addBtn: $('addBtn'),
  downloadBtn: $('downloadBtn'),
  forgetBtn: $('forgetBtn'),
  adminLock: $('adminLock'),
  adminLockForm: $('adminLockForm'),
  adminPinInput: $('adminPinInput'),
  adminLockError: $('adminLockError'),
  pinNew: $('pinNew'),
  pinConfirm: $('pinConfirm'),
  pinSaveBtn: $('pinSaveBtn'),
  pinRemoveBtn: $('pinRemoveBtn'),
  lockNowBtn: $('lockNowBtn'),
  pinStatus: $('pinStatus')
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

function boot() {
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
    const addImage = event.target.closest('[data-image-add]')
    if (addImage) {
      const list = addImage.closest('.admin-product').querySelector('[data-image-list]')
      addImageRow(list, '')
      return
    }
    const removeImage = event.target.closest('[data-image-remove]')
    if (removeImage) {
      const list = removeImage.closest('[data-image-list]')
      removeImage.closest('.admin-image-row').remove()
      if (!list.querySelector('.admin-image-row')) addImageRow(list, '')
      return
    }
    const addReview = event.target.closest('[data-review-add]')
    if (addReview) {
      const list = addReview.closest('.admin-product').querySelector('[data-review-list]')
      addReviewRow(list, {})
      return
    }
    const removeReview = event.target.closest('[data-review-remove]')
    if (removeReview) {
      removeReview.closest('.admin-review').remove()
      return
    }
    const btn = event.target.closest('button[data-remove]')
    if (btn) btn.closest('.admin-product').remove()
  })
  els.products.addEventListener('input', (event) => {
    const imageInput = event.target.closest('[data-field="image"]')
    if (imageInput) {
      const value = imageInput.value.trim()
      setPreviewSrc(imageInput.closest('.admin-image-row'), value ? resolveImage(value) : '')
    }
    const nameInput = event.target.closest('[data-field="name"]')
    if (nameInput) {
      const title = nameInput.closest('.admin-product').querySelector('[data-product-title]')
      if (title) title.textContent = nameInput.value.trim() || 'New product'
    }
  })
  els.products.addEventListener('change', (event) => {
    const upload = event.target.closest('[data-upload]')
    if (upload) {
      handleUpload(upload)
      return
    }
    const reviewUpload = event.target.closest('[data-review-upload]')
    if (reviewUpload) {
      handleReviewImageUpload(reviewUpload)
      return
    }
    const catSelect = event.target.closest('[data-field="category"]')
    if (catSelect) populateSubcategorySelect(catSelect.closest('.admin-product'))
  })
  els.authOwners.addEventListener('input', updateRulesCode)
  els.addCategoryBtn?.addEventListener('click', () => addCategoryRow({}))
  els.addAddressBtn?.addEventListener('click', () => addAddressRow({}))
  els.categoryList?.addEventListener('click', (event) => {
    const addSub = event.target.closest('[data-sub-add]')
    if (addSub) {
      const list = addSub.closest('.admin-cat').querySelector('[data-sub-list]')
      addSubcategoryRow(list, {})
      return
    }
    const removeSub = event.target.closest('[data-sub-remove]')
    if (removeSub) {
      removeSub.closest('[data-sub]').remove()
      return
    }
    const removeCat = event.target.closest('[data-cat-remove]')
    if (removeCat) removeCat.closest('.admin-cat').remove()
  })
  els.categoryList?.addEventListener('input', (event) => {
    const imageInput = event.target.closest('[data-field="cat-image"]')
    if (imageInput) {
      const catEl = imageInput.closest('.admin-cat')
      const value = imageInput.value.trim()
      setPreviewSrc(catEl.querySelector('[data-cat-img]'), value ? resolveImage(value) : '')
    }
    const nameInput = event.target.closest('[data-field="cat-name"]')
    if (nameInput) {
      const title = nameInput.closest('.admin-cat').querySelector('[data-cat-title]')
      if (title) title.textContent = nameInput.value.trim() || 'New category'
    }
    if (event.target.closest('[data-field="cat-id"]') || event.target.closest('[data-field="cat-name"]')) {
      refreshProductCategoryOptions()
    }
  })
  els.categoryList?.addEventListener('change', (event) => {
    const upload = event.target.closest('[data-cat-upload]')
    if (upload) handleCategoryImageUpload(upload)
  })
  els.addressList?.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-address-remove]')
    if (remove) remove.closest('.admin-address').remove()
  })
  els.addressList?.addEventListener('change', (event) => {
    if (event.target.closest('[data-addr-field="primary"]')) enforcePrimaryAddress(event.target)
  })
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

  els.pinSaveBtn?.addEventListener('click', savePin)
  els.pinRemoveBtn?.addEventListener('click', removePin)
  els.lockNowBtn?.addEventListener('click', () => {
    if (!localStorage.getItem(LS.pin)) {
      setPinStatus('Set a PIN first, then you can lock the admin.', 'warn')
      return
    }
    showLock(true)
  })

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
  const ship = store.shipping || {}
  if (els.shipEnabled) els.shipEnabled.checked = !!ship.enabled
  if (els.shipFlat) els.shipFlat.value = Number(ship.flatRate) || 0
  if (els.shipFree) els.shipFree.value = Number(ship.freeThreshold) || 0
  if (els.shipZonesInput) {
    els.shipZonesInput.value = (ship.zones || [])
      .map((z) => `${z.pinPrefix || ''} | ${z.rate ?? 0}`)
      .join('\n')
  }
  if (els.couponsInput) {
    els.couponsInput.value = (store.coupons || [])
      .map((c) => `${c.code || ''} | ${c.type || 'percent'} | ${c.value ?? 0} | ${c.minOrder ?? 0}`)
      .join('\n')
  }
  const chat = store.chat || {}
  els.chatName.value = chat.name || ''
  els.chatApiUrl.value = chat.apiUrl || ''
  els.chatGreeting.value = chat.greeting || ''
  els.chatQuick.value = (chat.quickReplies || []).join('\n')
  els.chatAbout.value = chat.about || ''
  const b2b = store.b2b || {}
  if (els.b2bEyebrow) els.b2bEyebrow.value = b2b.eyebrow || ''
  if (els.b2bTitle) els.b2bTitle.value = b2b.title || ''
  if (els.b2bIntro) els.b2bIntro.value = b2b.intro || ''
  if (els.b2bAudiences) els.b2bAudiences.value = (b2b.audiences || []).join('\n')
  if (els.b2bOfferings) {
    els.b2bOfferings.value = (b2b.offerings || [])
      .map((o) => `${o.title || ''} | ${o.text || ''}`)
      .join('\n')
  }
  if (els.b2bProcess) els.b2bProcess.value = (b2b.process || []).join('\n')
  if (els.b2bTerms) els.b2bTerms.value = (b2b.terms || []).join('\n')
  if (els.b2bNote) els.b2bNote.value = b2b.note || ''
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
  const social = store.social || {}
  if (els.socialInstagram) els.socialInstagram.value = social.instagram || ''
  if (els.socialPinterest) els.socialPinterest.value = social.pinterest || ''
  if (els.socialYoutube) els.socialYoutube.value = social.youtube || ''
  if (els.socialX) els.socialX.value = social.x || ''
  els.authOwners.value = (auth.owners || []).join(', ')
  els.homeAnnouncements.value = (store.announcements || []).join('\n')
  renderCategoriesAdmin(store.categories || [])
  renderAddressesAdmin(store.addresses || [])
  els.homeFeatures.value = (store.features || [])
    .map((f) => `${f.title || ''} | ${f.text || ''}`)
    .join('\n')
  els.homeReviews.value = (store.reviews || [])
    .map((r) => `${r.name || ''} | ${r.location || ''} | ${r.rating || 5} | ${r.text || ''}`)
    .join('\n')
  const news = store.newsletter || {}
  els.newsTitle.value = news.title || ''
  els.newsText.value = news.text || ''
  els.newsEmail.value = news.email || ''
  els.heroBadge.value = (store.heroBadge && store.heroBadge.label) || ''
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
  const bullets = Array.isArray(product.bullets) ? product.bullets : []
  const custom = product.custom || {}
  const images = Array.isArray(product.images) && product.images.length
    ? product.images.slice()
    : product.image
      ? [product.image]
      : ['']
  el.innerHTML = `
    <div class="admin-product-head">
      <strong data-product-title>${escapeHtml(product.name || 'New product')}</strong>
      <button type="button" class="admin-remove" data-remove>Remove</button>
    </div>
    <div class="admin-images">
      <div class="admin-images-head">
        <span>Images — the first image is the main (thumbnail)</span>
        <button type="button" class="admin-remove" data-image-add>+ Add image</button>
      </div>
      <div class="admin-image-list" data-image-list></div>
    </div>
    <div class="admin-reviews">
      <div class="admin-images-head">
        <span>Reviews — customer comments, ratings aur photos</span>
        <button type="button" class="admin-remove" data-review-add>+ Add review</button>
      </div>
      <div class="admin-review-list" data-review-list></div>
    </div>
    <div class="admin-grid">
      <label>Name <input data-field="name" value="${escapeAttr(product.name)}" /></label>
      <label>Price <input data-field="price" type="number" min="0" value="${escapeAttr(product.price ?? 0)}" /></label>
      <label>ID (optional) <input data-field="id" value="${escapeAttr(product.id)}" placeholder="auto from name" /></label>
      <label>Category <select data-field="category">${categoryOptions(product.category)}</select></label>
      <label>Subcategory <select data-field="subcategory">${subcategoryOptions(product.category, product.subcategory)}</select></label>
      <label>Badge (optional) <input data-field="badge" value="${escapeAttr(product.badge)}" placeholder="New / Best seller" /></label>
      <label>Old price (optional) <input data-field="oldPrice" type="number" min="0" value="${escapeAttr(product.oldPrice ?? 0)}" /></label>
      <label>Stock (optional) <input data-field="stock" type="number" min="0" placeholder="blank = unlimited" value="${escapeAttr(product.stock ?? '')}" /></label>
      <label>Rating (0-5, optional) <input data-field="rating" type="number" min="0" max="5" step="0.1" value="${escapeAttr(product.rating ?? 0)}" /></label>
      <label>Rating count (optional) <input data-field="ratingCount" type="number" min="0" value="${escapeAttr(product.ratingCount ?? 0)}" /></label>
      <label class="admin-wide">Description <textarea data-field="description" rows="2">${escapeHtml(product.description)}</textarea></label>
      <label class="admin-wide">Bullet points / keywords <textarea data-field="bullets" rows="4" placeholder="One bullet per line, e.g.&#10;Handmade in our studio&#10;Made to order">${escapeHtml(bullets.join('\n'))}</textarea></label>
      <label class="admin-check"><input data-field="available" type="checkbox" ${
        product.available === false ? '' : 'checked'
      } /> Available</label>
    </div>
    <div class="admin-custom">
      <div class="admin-images-head">
        <span>Customisation — let the customer type their own text</span>
      </div>
      <div class="admin-grid">
        <label class="admin-check"><input data-field="custom-enabled" type="checkbox" ${
          custom.enabled ? 'checked' : ''
        } /> Allow customisation on this product</label>
        <label>Field label <input data-field="custom-label" value="${escapeAttr(
          custom.label
        )}" placeholder="Name / text to be made" /></label>
        <label>Placeholder <input data-field="custom-placeholder" value="${escapeAttr(
          custom.placeholder
        )}" placeholder="Type the name or text" /></label>
        <label>Max length <input data-field="custom-max" type="number" min="1" max="200" value="${escapeAttr(
          custom.maxLength ?? 60
        )}" /></label>
        <label>Help note (optional) <input data-field="custom-note" value="${escapeAttr(
          custom.note
        )}" placeholder="We will contact you to confirm the design" /></label>
        <label class="admin-check"><input data-field="custom-required" type="checkbox" ${
          custom.required ? 'checked' : ''
        } /> Required before adding to cart</label>
      </div>
    </div>`
  els.products.appendChild(el)
  const list = el.querySelector('[data-image-list]')
  images.forEach((src) => addImageRow(list, src))
  const reviewList = el.querySelector('[data-review-list]')
  const reviews = Array.isArray(product.reviews) ? product.reviews : []
  reviews.forEach((review) => addReviewRow(reviewList, review))
}

function addReviewRow(list, review) {
  const r = review || {}
  const row = document.createElement('div')
  row.className = 'admin-review'
  const photo = r.photo ? r.photo : ''
  row.innerHTML = `
    <div class="admin-review-head">
      <strong data-review-title>${escapeHtml(r.name || 'New review')}</strong>
      <button type="button" class="admin-remove" data-review-remove>Remove review</button>
    </div>
    <div class="admin-grid">
      <label>Customer name <input data-review-field="name" value="${escapeAttr(r.name)}" /></label>
      <label>Rating (1–5) <input data-review-field="rating" type="number" min="1" max="5" step="0.5" value="${escapeAttr(r.rating ?? 5)}" /></label>
      <label>Date (optional) <input data-review-field="date" value="${escapeAttr(r.date)}" placeholder="2026-09-25" /></label>
      <label class="admin-wide">Comment <textarea data-review-field="text" rows="2">${escapeHtml(r.text)}</textarea></label>
      <label class="admin-wide">Photo path or URL (optional) <input data-review-field="photo" value="${escapeAttr(photo)}" /></label>
      <label class="admin-upload">Upload photo from device
        <input type="file" accept="image/*" data-review-upload />
      </label>
      <span class="admin-upload-status" data-upload-status></span>
    </div>`
  list.appendChild(row)
}

function addImageRow(list, src) {
  const value = typeof src === 'string' ? src : ''
  const row = document.createElement('div')
  row.className = 'admin-image admin-image-row'
  row.innerHTML = `
    <img class="admin-image-preview" alt="" src="${value ? escapeAttr(resolveImage(value)) : ''}" ${
      value ? '' : 'hidden'
    } />
    <div class="admin-image-fields">
      <label>Image path or URL <input data-field="image" value="${escapeAttr(value)}" /></label>
      <label class="admin-upload">Upload image from device
        <input type="file" accept="image/*" data-upload />
      </label>
      <span class="admin-upload-status" data-upload-status></span>
      <button type="button" class="admin-remove admin-image-remove" data-image-remove>Remove image</button>
    </div>`
  list.appendChild(row)
}

function renderCategoriesAdmin(categories) {
  if (!els.categoryList) return
  els.categoryList.innerHTML = ''
  const list = Array.isArray(categories) ? categories : []
  if (!list.length) {
    addCategoryRow({})
    return
  }
  list.forEach((cat) => addCategoryRow(cat))
}

function addCategoryRow(category) {
  const cat = category || {}
  const subs = Array.isArray(cat.subcategories) ? cat.subcategories : []
  const el = document.createElement('div')
  el.className = 'admin-cat'
  el.innerHTML = `
    <div class="admin-cat-head">
      <strong data-cat-title>${escapeHtml(cat.name || 'New category')}</strong>
      <button type="button" class="admin-remove" data-cat-remove>Remove category</button>
    </div>
    <div class="admin-grid">
      <label>ID (slug) <input data-field="cat-id" value="${escapeAttr(cat.id)}" placeholder="name-plate" /></label>
      <label>Name <input data-field="cat-name" value="${escapeAttr(cat.name)}" placeholder="Name Plates" /></label>
      <div class="admin-wide admin-image" data-cat-img>
        <img class="admin-image-preview" alt="" src="${cat.image ? escapeAttr(resolveImage(cat.image)) : ''}" ${
          cat.image ? '' : 'hidden'
        } />
        <div class="admin-image-fields">
          <label>Image path or URL (optional) <input data-field="cat-image" value="${escapeAttr(cat.image)}" placeholder="brand/site/example.jpg" /></label>
          <label class="admin-upload">Upload image from device
            <input type="file" accept="image/*" data-cat-upload />
          </label>
          <span class="admin-upload-status" data-cat-img-status></span>
        </div>
      </div>
    </div>
    <div class="admin-sub-block">
      <div class="admin-sub-head">
        <span>Subcategories</span>
        <button type="button" class="admin-remove" data-sub-add>+ Add subcategory</button>
      </div>
      <div class="admin-sub-list" data-sub-list></div>
    </div>`
  els.categoryList.appendChild(el)
  const subList = el.querySelector('[data-sub-list]')
  subs.forEach((sub) => addSubcategoryRow(subList, sub))
}

function addSubcategoryRow(list, sub) {
  const item = sub || {}
  const row = document.createElement('div')
  row.className = 'admin-sub'
  row.setAttribute('data-sub', '')
  row.innerHTML = `
    <input data-field="sub-id" value="${escapeAttr(item.id)}" placeholder="id (slug)" />
    <input data-field="sub-name" value="${escapeAttr(item.name)}" placeholder="Subcategory name" />
    <button type="button" class="admin-remove" data-sub-remove aria-label="Remove subcategory">Remove</button>`
  list.appendChild(row)
}

function populateSubcategorySelect(productEl, selected) {
  const catSelect = productEl.querySelector('[data-field="category"]')
  const subSelect = productEl.querySelector('[data-field="subcategory"]')
  if (!catSelect || !subSelect) return
  const current = selected !== undefined ? selected : subSelect.value
  subSelect.innerHTML = subcategoryOptions(catSelect.value, current)
}

function refreshProductCategoryOptions() {
  if (!els.products) return
  ;[...els.products.querySelectorAll('.admin-product')].forEach((productEl) => {
    const catSelect = productEl.querySelector('[data-field="category"]')
    const subSelect = productEl.querySelector('[data-field="subcategory"]')
    if (!catSelect) return
    const catValue = catSelect.value
    const subValue = subSelect ? subSelect.value : ''
    catSelect.innerHTML = categoryOptions(catValue)
    if (subSelect) subSelect.innerHTML = subcategoryOptions(catValue, subValue)
  })
}

function renderAddressesAdmin(addresses) {
  if (!els.addressList) return
  els.addressList.innerHTML = ''
  const list = Array.isArray(addresses) ? addresses : []
  if (!list.length) {
    addAddressRow({ primary: true })
    return
  }
  list.forEach((address) => addAddressRow(address))
}

function addAddressRow(address) {
  const a = address || {}
  const el = document.createElement('div')
  el.className = 'admin-address'
  el.innerHTML = `
    <div class="admin-address-head">
      <strong data-addr-title>${escapeHtml(a.label || 'New address')}</strong>
      <button type="button" class="admin-remove" data-address-remove>Remove</button>
    </div>
    <div class="admin-grid">
      <label>Label <input data-addr-field="label" value="${escapeAttr(a.label)}" placeholder="Studio / Workshop" /></label>
      <label>Phone (optional) <input data-addr-field="phone" value="${escapeAttr(a.phone)}" placeholder="+91 ..." /></label>
      <label class="admin-wide">Address <textarea data-addr-field="lines" rows="3" placeholder="Shop no / building&#10;Street, area&#10;City, State - PIN">${escapeHtml(a.lines)}</textarea></label>
      <label class="admin-wide">Google Maps link (optional) <input data-addr-field="mapsUrl" value="${escapeAttr(a.mapsUrl)}" placeholder="https://maps.google.com/..." /></label>
      <label class="admin-check"><input type="checkbox" data-addr-field="primary" ${a.primary ? 'checked' : ''} /> Primary address</label>
    </div>`
  els.addressList.appendChild(el)
}

function enforcePrimaryAddress(changed) {
  if (!changed.checked) return
  els.addressList.querySelectorAll('[data-addr-field="primary"]').forEach((box) => {
    if (box !== changed) box.checked = false
  })
}

function collectAddresses() {
  return [...els.addressList.querySelectorAll('.admin-address')]
    .map((el) => {
      const get = (field) => el.querySelector(`[data-addr-field="${field}"]`)
      const label = get('label') ? get('label').value.trim() : ''
      const lines = get('lines') ? get('lines').value.trim() : ''
      const phone = get('phone') ? get('phone').value.trim() : ''
      const mapsUrl = get('mapsUrl') ? get('mapsUrl').value.trim() : ''
      const primary = get('primary') ? get('primary').checked : false
      if (!label && !lines && !phone && !mapsUrl) return null
      return { label, lines, phone, mapsUrl, primary }
    })
    .filter(Boolean)
}

async function handleCategoryImageUpload(input) {
  const catEl = input.closest('.admin-cat')
  const status = catEl.querySelector('[data-cat-img-status]')
  const imageField = catEl.querySelector('[data-field="cat-image"]')
  const file = input.files && input.files[0]
  if (!file) return

  setUploadStatus(status, 'Uploading...', '')
  try {
    const path = await uploadImageTo(file, 'public/brand/categories')
    imageField.value = path
    setPreviewSrc(catEl.querySelector('[data-cat-img]'), resolveImage(path))
    setUploadStatus(status, 'Image uploaded. Now click "Save & publish".', 'ok')
  } catch (error) {
    setUploadStatus(status, error.message, 'error')
  } finally {
    input.value = ''
  }
}

async function handleReviewImageUpload(input) {
  const reviewEl = input.closest('.admin-review')
  const status = reviewEl.querySelector('[data-upload-status]')
  const photoField = reviewEl.querySelector('[data-review-field="photo"]')
  const file = input.files && input.files[0]
  if (!file) return

  setUploadStatus(status, 'Uploading...', '')
  try {
    const path = await uploadImageTo(file, 'public/brand/reviews')
    photoField.value = path
    setUploadStatus(status, 'Photo uploaded. Now click "Save & publish".', 'ok')
  } catch (error) {
    setUploadStatus(status, error.message, 'error')
  } finally {
    input.value = ''
  }
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
  const row = input.closest('.admin-image-row')
  const status = row.querySelector('[data-upload-status]')
  const imageField = row.querySelector('[data-field="image"]')
  const file = input.files && input.files[0]
  if (!file) return

  setPreviewSrc(row, URL.createObjectURL(file))
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

function collectReviews(productEl) {
  return [...productEl.querySelectorAll('.admin-review')]
    .map((el) => {
      const get = (field) => el.querySelector(`[data-review-field="${field}"]`)
      const name = get('name') ? get('name').value.trim() : ''
      const text = get('text') ? get('text').value.trim() : ''
      const rating = get('rating') ? Number(get('rating').value) : 0
      const date = get('date') ? get('date').value.trim() : ''
      const photo = get('photo') ? get('photo').value.trim() : ''
      if (!name && !text && !photo && !rating) return null
      return { name, rating: Math.max(1, Math.min(5, rating || 5)), text, date, photo }
    })
    .filter(Boolean)
}

function collect() {
  const products = [...els.products.querySelectorAll('.admin-product')].map((el) => {
    const get = (field) => el.querySelector(`[data-field="${field}"]`)
    const name = get('name').value.trim()
    let id = get('id').value.trim()
    if (!id) id = slugify(name) || 'product-' + Math.random().toString(36).slice(2, 7)
    const images = [...el.querySelectorAll('[data-image-list] [data-field="image"]')]
      .map((input) => input.value.trim())
      .filter(Boolean)
    return {
      id,
      name,
      description: get('description').value.trim(),
      bullets: lines(get('bullets').value),
      price: Number(get('price').value) || 0,
      oldPrice: Number(get('oldPrice') ? get('oldPrice').value : 0) || 0,
      stock: get('stock') && get('stock').value.trim() !== '' ? Number(get('stock').value) || 0 : '',
      badge: get('badge') ? get('badge').value.trim() : '',
      rating: Number(get('rating') ? get('rating').value : 0) || 0,
      ratingCount: Number(get('ratingCount') ? get('ratingCount').value : 0) || 0,
      category: get('category') ? get('category').value.trim() : '',
      subcategory: get('subcategory') ? get('subcategory').value.trim() : '',
      images,
      image: images[0] || '',
      available: get('available').checked,
      custom: {
        enabled: get('custom-enabled') ? get('custom-enabled').checked : false,
        label: get('custom-label') ? get('custom-label').value.trim() : '',
        placeholder: get('custom-placeholder') ? get('custom-placeholder').value.trim() : '',
        note: get('custom-note') ? get('custom-note').value.trim() : '',
        maxLength: Number(get('custom-max') ? get('custom-max').value : 0) || 60,
        required: get('custom-required') ? get('custom-required').checked : false
      },
      reviews: collectReviews(el)
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
      shipping: {
        enabled: els.shipEnabled ? els.shipEnabled.checked : false,
        flatRate: els.shipFlat ? Number(els.shipFlat.value) || 0 : 0,
        freeThreshold: els.shipFree ? Number(els.shipFree.value) || 0 : 0,
        zones: lines(els.shipZonesInput ? els.shipZonesInput.value : '')
          .map((line) => {
            const [prefix, rate] = line.split('|')
            return {
              pinPrefix: (prefix || '').replace(/\D/g, ''),
              rate: Number((rate || '').trim()) || 0
            }
          })
          .filter((zone) => zone.pinPrefix)
      },
      coupons: lines(els.couponsInput ? els.couponsInput.value : '')
        .map((line) => {
          const [code, type, value, minOrder] = line.split('|')
          return {
            code: (code || '').trim().toUpperCase(),
            type: (type || 'percent').trim().toLowerCase() === 'flat' ? 'flat' : 'percent',
            value: Number((value || '').trim()) || 0,
            minOrder: Number((minOrder || '').trim()) || 0,
            active: true
          }
        })
        .filter((coupon) => coupon.code && coupon.value > 0),
      chat: {
        name: els.chatName.value.trim() || 'Studio Genie',
        apiUrl: els.chatApiUrl.value.trim(),
        greeting: els.chatGreeting.value.trim(),
        about: els.chatAbout ? els.chatAbout.value.trim() : '',
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
      social: {
        instagram: els.socialInstagram ? els.socialInstagram.value.trim() : '',
        pinterest: els.socialPinterest ? els.socialPinterest.value.trim() : '',
        youtube: els.socialYoutube ? els.socialYoutube.value.trim() : '',
        x: els.socialX ? els.socialX.value.trim() : ''
      },
      addresses: collectAddresses(),
      announcements: lines(els.homeAnnouncements.value),
      categories: collectCategories(),
      features: lines(els.homeFeatures.value)
        .map((line) => {
          const [title, ...rest] = line.split('|')
          return { title: (title || '').trim(), text: rest.join('|').trim() }
        })
        .filter((f) => f.title),
      reviews: lines(els.homeReviews.value)
        .map((line) => {
          const [name, location, rating, ...rest] = line.split('|')
          return {
            name: (name || '').trim(),
            location: (location || '').trim(),
            rating: Number(rating) || 5,
            text: rest.join('|').trim()
          }
        })
        .filter((r) => r.name),
      newsletter: {
        title: els.newsTitle.value.trim(),
        text: els.newsText.value.trim(),
        email: els.newsEmail.value.trim()
      },
      heroBadge: { label: els.heroBadge.value.trim() },
      b2b: {
        enabled: true,
        eyebrow: els.b2bEyebrow ? els.b2bEyebrow.value.trim() : '',
        title: els.b2bTitle ? els.b2bTitle.value.trim() : '',
        intro: els.b2bIntro ? els.b2bIntro.value.trim() : '',
        audiences: els.b2bAudiences ? lines(els.b2bAudiences.value) : [],
        offerings: els.b2bOfferings
          ? lines(els.b2bOfferings.value)
              .map((line) => {
                const [title, ...rest] = line.split('|')
                return { title: (title || '').trim(), text: rest.join('|').trim() }
              })
              .filter((o) => o.title || o.text)
          : [],
        process: els.b2bProcess ? lines(els.b2bProcess.value) : [],
        terms: els.b2bTerms ? lines(els.b2bTerms.value) : [],
        note: els.b2bNote ? els.b2bNote.value.trim() : ''
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

function collectCategories() {
  if (!els.categoryList) return []
  return [...els.categoryList.querySelectorAll('.admin-cat')]
    .map((el) => {
      const id = (el.querySelector('[data-field="cat-id"]')?.value || '').trim()
      const name = (el.querySelector('[data-field="cat-name"]')?.value || '').trim()
      const image = (el.querySelector('[data-field="cat-image"]')?.value || '').trim()
      const subcategories = [...el.querySelectorAll('[data-sub]')]
        .map((row) => {
          const subId = (row.querySelector('[data-field="sub-id"]')?.value || '').trim()
          const subName = (row.querySelector('[data-field="sub-name"]')?.value || '').trim()
          return { id: subId, name: subName || subId }
        })
        .filter((sub) => sub.id)
      return { id, name: name || id, image, subcategories }
    })
    .filter((cat) => cat.id)
}

function categoryOptions(selected) {
  const list = collectCategories()
  if (selected && !list.some((cat) => cat.id === selected)) {
    list.push({ id: selected, name: selected, subcategories: [] })
  }
  const options = ['<option value="">— none —</option>']
  list.forEach((cat) => {
    options.push(
      `<option value="${escapeAttr(cat.id)}"${cat.id === selected ? ' selected' : ''}>${escapeHtml(
        cat.name
      )}</option>`
    )
  })
  return options.join('')
}

function subcategoryOptions(categoryId, selected) {
  const cat = collectCategories().find((c) => c.id === categoryId)
  const subs = cat ? cat.subcategories : []
  const options = ['<option value="">— none —</option>']
  subs.forEach((sub) => {
    options.push(
      `<option value="${escapeAttr(sub.id)}"${sub.id === selected ? ' selected' : ''}>${escapeHtml(
        sub.name
      )}</option>`
    )
  })
  if (selected && !subs.some((sub) => sub.id === selected)) {
    options.push(`<option value="${escapeAttr(selected)}" selected>${escapeHtml(selected)}</option>`)
  }
  return options.join('')
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

/* ---------- device lock & PIN ---------- */
async function hashPin(pin) {
  const text = 'kak-admin::' + String(pin)
  if (window.crypto && window.crypto.subtle && typeof TextEncoder !== 'undefined') {
    const buffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0
  }
  return 'f' + (hash >>> 0).toString(16)
}

function showLock(on) {
  if (!els.adminLock) return
  els.adminLock.hidden = !on
  document.body.classList.toggle('admin-locked', on)
  if (on) {
    if (els.adminLockError) els.adminLockError.hidden = true
    if (els.adminPinInput) {
      els.adminPinInput.value = ''
      setTimeout(() => els.adminPinInput.focus(), 40)
    }
  }
}

function setPinStatus(message, tone) {
  if (!els.pinStatus) return
  els.pinStatus.textContent = message
  els.pinStatus.style.color = tone === 'error' ? '#a3352b' : ''
}

async function savePin() {
  const pin = els.pinNew ? els.pinNew.value.trim() : ''
  const confirm = els.pinConfirm ? els.pinConfirm.value.trim() : ''
  if (!/^\d{4,6}$/.test(pin)) {
    setPinStatus('PIN must be 4 to 6 digits.', 'error')
    return
  }
  if (pin !== confirm) {
    setPinStatus('The two PINs do not match.', 'error')
    return
  }
  localStorage.setItem(LS.pin, await hashPin(pin))
  if (els.pinNew) els.pinNew.value = ''
  if (els.pinConfirm) els.pinConfirm.value = ''
  setPinStatus('PIN set. The admin will now lock when opened.')
}

async function removePin() {
  if (!localStorage.getItem(LS.pin)) {
    setPinStatus('No PIN is set.', 'warn')
    return
  }
  localStorage.removeItem(LS.pin)
  setPinStatus('PIN removed. The admin will open without a lock.')
}

let booted = false

function startBoot() {
  if (booted) return
  booted = true
  boot()
}

async function init() {
  if (els.adminLockForm) {
    els.adminLockForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      const storedHash = localStorage.getItem(LS.pin)
      const value = els.adminPinInput ? els.adminPinInput.value.trim() : ''
      const hash = storedHash ? await hashPin(value) : ''
      if (storedHash && hash === storedHash) {
        showLock(false)
        startBoot()
      } else if (els.adminLockError) {
        els.adminLockError.hidden = false
        if (els.adminPinInput) {
          els.adminPinInput.value = ''
          els.adminPinInput.focus()
        }
      }
    })
  }
  if (localStorage.getItem(LS.pin)) {
    showLock(true)
    return
  }
  startBoot()
}

init()
