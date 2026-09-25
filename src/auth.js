const CATALOG_URL = './data/catalog.json'
const CDN = 'https://www.gstatic.com/firebasejs/11.6.0/'

const state = {
  enabled: false,
  user: null,
  auth: null,
  db: null,
  fs: null,
  authMod: null
}

const listeners = new Set()

function onAuthChange(callback) {
  listeners.add(callback)
  if (state.enabled) callback(state.user)
  return () => listeners.delete(callback)
}

function notify() {
  listeners.forEach((callback) => {
    try {
      callback(state.user)
    } catch {
      /* ignore listener errors */
    }
  })
}

async function loadStore() {
  try {
    const res = await fetch(CATALOG_URL, { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()).store || null
  } catch {
    return null
  }
}

async function init() {
  const store = await loadStore()
  const authCfg = (store && store.auth) || {}
  const cfg = authCfg.config || {}
  if (!authCfg.enabled || !cfg.apiKey || !cfg.projectId) return

  try {
    const [appMod, authMod, fsMod] = await Promise.all([
      import(/* @vite-ignore */ CDN + 'firebase-app.js'),
      import(/* @vite-ignore */ CDN + 'firebase-auth.js'),
      import(/* @vite-ignore */ CDN + 'firebase-firestore.js')
    ])
    const app = appMod.initializeApp(cfg)
    state.auth = authMod.getAuth(app)
    state.db = fsMod.getFirestore(app)
    state.fs = fsMod
    state.authMod = authMod
    try {
      await authMod.setPersistence(state.auth, authMod.browserLocalPersistence)
    } catch {
      /* persistence optional */
    }
    state.enabled = true
    buildUI()
    authMod.onAuthStateChanged(state.auth, (user) => {
      state.user = user
      renderNav()
      notify()
    })
  } catch (error) {
    console.error('Account setup failed:', error)
  }
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  })
}

function buildUI() {
  const nav = document.getElementById('nav')
  if (nav && !document.getElementById('authNavBtn')) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.id = 'authNavBtn'
    btn.className = 'nav-auth'
    btn.textContent = 'Login'
    btn.addEventListener('click', () => {
      const menu = document.getElementById('nav')
      if (menu) menu.classList.remove('open')
      if (state.user) openAccount()
      else openAuth('signin')
    })
    nav.appendChild(btn)
  }

  if (!document.getElementById('authOverlay')) {
    const overlay = document.createElement('div')
    overlay.id = 'authOverlay'
    overlay.className = 'auth-overlay'
    overlay.hidden = true
    overlay.innerHTML = `
      <div class="auth-modal" role="dialog" aria-modal="true" aria-label="Account">
        <button type="button" class="auth-close" id="authClose" aria-label="Close">&times;</button>
        <div class="auth-body" id="authBody"></div>
      </div>`
    document.body.appendChild(overlay)
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeAuth()
    })
    document.getElementById('authClose').addEventListener('click', closeAuth)
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAuth()
    })
  }
  renderNav()
}

function renderNav() {
  const btn = document.getElementById('authNavBtn')
  if (!btn) return
  if (state.user) {
    const name = state.user.displayName || (state.user.email || '').split('@')[0] || 'Account'
    btn.textContent = name.length > 16 ? name.slice(0, 15) + '…' : name
  } else {
    btn.textContent = 'Login'
  }
}

function openAuth(tab) {
  const body = document.getElementById('authBody')
  if (!body) return
  body.innerHTML = `
    <div class="auth-tabs">
      <button type="button" class="auth-tab" data-tab="signin">Sign in</button>
      <button type="button" class="auth-tab" data-tab="signup">Create account</button>
    </div>
    <form class="auth-form" id="authForm">
      <label data-only="signup">Name<input type="text" id="authName" autocomplete="name" /></label>
      <label>Email<input type="email" id="authEmail" autocomplete="email" required /></label>
      <label>Password<input type="password" id="authPass" autocomplete="current-password" minlength="6" required /></label>
      <button type="submit" class="btn btn-solid auth-submit" id="authSubmit">Sign in</button>
      <p class="auth-msg" id="authMsg" role="status" aria-live="polite"></p>
    </form>
    <div class="auth-or"><span>or</span></div>
    <button type="button" class="btn btn-ghost auth-google" id="authGoogle">Continue with Google</button>
    <p class="auth-note">Guests can checkout without an account. Login is only needed to see your order history.</p>`
  showOverlay()
  setupAuthForm(tab)
}

function setupAuthForm(tab) {
  const form = document.getElementById('authForm')
  const nameLabel = form.querySelector('[data-only="signup"]')
  const submit = document.getElementById('authSubmit')
  const msg = document.getElementById('authMsg')
  const pass = document.getElementById('authPass')
  const nameInput = document.getElementById('authName')
  const emailInput = document.getElementById('authEmail')

  let mode = tab
  const setMode = (next) => {
    mode = next
    document.querySelectorAll('.auth-tab').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.tab === next)
    })
    nameLabel.style.display = next === 'signup' ? '' : 'none'
    submit.textContent = next === 'signup' ? 'Create account' : 'Sign in'
    pass.autocomplete = next === 'signup' ? 'new-password' : 'current-password'
    msg.textContent = ''
    msg.className = 'auth-msg'
  }

  document.querySelectorAll('.auth-tab').forEach((el) => {
    el.addEventListener('click', () => setMode(el.dataset.tab))
  })
  setMode(tab)

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const email = emailInput.value.trim()
    const password = pass.value
    const name = nameInput.value.trim()
    setMsg(msg, 'Please wait…')
    try {
      if (mode === 'signup') {
        const cred = await state.authMod.createUserWithEmailAndPassword(state.auth, email, password)
        if (cred.user) state.user = cred.user
        if (name && cred.user) await state.authMod.updateProfile(cred.user, { displayName: name })
        await saveProfile({ name })
      } else {
        await state.authMod.signInWithEmailAndPassword(state.auth, email, password)
      }
      closeAuth()
    } catch (error) {
      setMsg(msg, friendlyError(error), 'error')
    }
  })

  document.getElementById('authGoogle').addEventListener('click', async () => {
    setMsg(msg, 'Opening Google…')
    try {
      const provider = new state.authMod.GoogleAuthProvider()
      await state.authMod.signInWithPopup(state.auth, provider)
      closeAuth()
    } catch (error) {
      setMsg(msg, friendlyError(error), 'error')
    }
  })
}

function openAccount() {
  const body = document.getElementById('authBody')
  if (!body) return
  const email = state.user.email || ''
  body.innerHTML = `
    <h3 class="auth-title">My account</h3>
    <p class="auth-sub">${escapeHtml(email)}</p>
    <div class="auth-actions">
      <button type="button" class="btn btn-solid" id="authOrdersBtn">My orders</button>
      <button type="button" class="btn btn-ghost" id="authLogout">Logout</button>
    </div>
    <div class="auth-orders" id="authOrders"></div>`
  showOverlay()
  document.getElementById('authLogout').addEventListener('click', async () => {
    await state.authMod.signOut(state.auth)
    closeAuth()
  })
  document.getElementById('authOrdersBtn').addEventListener('click', renderOrders)
}

async function renderOrders() {
  const box = document.getElementById('authOrders')
  if (!box) return
  box.innerHTML = '<p class="auth-msg">Loading orders…</p>'
  try {
    const orders = await getOrders()
    if (!orders.length) {
      box.innerHTML = '<p class="auth-msg">Abhi koi order nahi hai.</p>'
      return
    }
    box.innerHTML = orders
      .map((order) => {
        const items = (order.items || [])
          .map((item) => `${escapeHtml(item.name || 'Item')} × ${item.qty || 1}`)
          .join(', ')
        return `<div class="auth-order">
          <div class="auth-order-head">
            <strong>${escapeHtml(order.total || '')}</strong>
            <span>${formatDate(order.createdAt)}</span>
          </div>
          <p>${items}</p>
          <p class="auth-order-meta">${escapeHtml(order.method || '')} · ${escapeHtml(order.status || 'new')}</p>
        </div>`
      })
      .join('')
  } catch (error) {
    box.innerHTML = `<p class="auth-msg is-error">${escapeHtml(friendlyError(error))}</p>`
  }
}

function showOverlay() {
  const overlay = document.getElementById('authOverlay')
  if (overlay) overlay.hidden = false
}

function closeAuth() {
  const overlay = document.getElementById('authOverlay')
  if (overlay) overlay.hidden = true
}

function setMsg(el, text, kind) {
  if (!el) return
  el.textContent = text
  el.className = 'auth-msg' + (kind ? ' is-' + kind : '')
}

function friendlyError(error) {
  const code = (error && error.code) || ''
  const map = {
    'auth/invalid-email': 'Email address theek nahi hai.',
    'auth/missing-password': 'Password daalein.',
    'auth/weak-password': 'Password kam se kam 6 characters ka rakhein.',
    'auth/email-already-in-use': 'Ye email pehle se registered hai. Sign in karein.',
    'auth/invalid-credential': 'Email ya password galat hai.',
    'auth/wrong-password': 'Password galat hai.',
    'auth/user-not-found': 'Is email se koi account nahi mila.',
    'auth/too-many-requests': 'Bahut zyada koshish. Thodi der baad try karein.',
    'auth/popup-blocked': 'Popup block ho gaya. Browser me popup allow karein.',
    'auth/operation-not-allowed': 'Ye sign-in method Firebase me enable nahi hai.',
    'auth/unauthorized-domain': 'Ye domain Firebase Authorized domains me add karein.'
  }
  return map[code] || (error && error.message) || 'Kuch galat ho gaya. Dobara try karein.'
}

async function getProfile() {
  if (!state.user || !state.db) return null
  const { doc, getDoc } = state.fs
  const snap = await getDoc(doc(state.db, 'users', state.user.uid))
  return snap.exists() ? snap.data() : null
}

async function saveProfile(profile) {
  if (!state.user || !state.db) return
  const { doc, setDoc, serverTimestamp } = state.fs
  const data = { email: state.user.email || '' }
  if (profile && profile.name) data.name = profile.name
  if (profile && profile.phone) data.phone = profile.phone
  if (profile && profile.address) data.address = profile.address
  await setDoc(
    doc(state.db, 'users', state.user.uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

async function saveOrder(order) {
  if (!state.user || !state.db) return null
  const { addDoc, collection, serverTimestamp } = state.fs
  const ref = await addDoc(collection(state.db, 'orders'), {
    uid: state.user.uid,
    email: state.user.email || '',
    ...order,
    status: 'new',
    createdAt: serverTimestamp()
  })
  return ref.id
}

async function getOrders() {
  if (!state.user || !state.db) return []
  const { collection, query, where, getDocs } = state.fs
  const q = query(collection(state.db, 'orders'), where('uid', '==', state.user.uid))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt))
}

async function getAllOrders(limitCount = 100) {
  if (!state.db) return []
  const { collection, query, orderBy, limit, getDocs } = state.fs
  const q = query(collection(state.db, 'orders'), orderBy('createdAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

async function updateOrderStatus(id, status) {
  if (!state.db) return
  const { doc, updateDoc, serverTimestamp } = state.fs
  await updateDoc(doc(state.db, 'orders', id), { status, updatedAt: serverTimestamp() })
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
    return new Date(time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

const ready = init()

window.KAKAuth = {
  get enabled() {
    return state.enabled
  },
  ready,
  currentUser: () => state.user,
  onAuthChange,
  getProfile,
  saveProfile,
  saveOrder,
  getOrders,
  getAllOrders,
  updateOrderStatus,
  open: () => (state.user ? openAccount() : openAuth('signin')),
  openAuth: (tab) => openAuth(tab || 'signin'),
  signIn: (email, password) => state.authMod.signInWithEmailAndPassword(state.auth, email, password),
  signInWithGoogle: () => {
    const provider = new state.authMod.GoogleAuthProvider()
    return state.authMod.signInWithPopup(state.auth, provider)
  },
  signOutUser: () => state.authMod.signOut(state.auth)
}
