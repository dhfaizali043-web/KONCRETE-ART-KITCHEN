const menuBtn = document.getElementById('menuBtn')
const nav = document.getElementById('nav')
const form = document.getElementById('briefForm')
const statusEl = document.getElementById('formStatus')
const lightbox = document.getElementById('lightbox')
const lightboxImg = document.getElementById('lightboxImg')
const lightboxCap = document.getElementById('lightboxCap')
const lightboxClose = document.getElementById('lightboxClose')

menuBtn?.addEventListener('click', () => {
  const open = nav.classList.toggle('open')
  menuBtn.setAttribute('aria-expanded', String(open))
})

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open')
    menuBtn?.setAttribute('aria-expanded', 'false')
  })
})

document.querySelectorAll('.tile').forEach((tile) => {
  tile.addEventListener('click', () => {
    lightboxImg.src = tile.dataset.src
    lightboxImg.alt = tile.querySelector('img')?.alt || ''
    lightboxCap.textContent = tile.dataset.caption || ''
    lightbox.hidden = false
  })
})

const closeLightbox = () => {
  lightbox.hidden = true
  lightboxImg.src = ''
}

lightboxClose?.addEventListener('click', closeLightbox)
lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox()
})
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !lightbox.hidden) closeLightbox()
})

form?.addEventListener('submit', (event) => {
  event.preventDefault()
  const data = new FormData(form)
  const place = data.get('place')
  const name = data.get('name')
  const email = data.get('email')
  const message = data.get('message') || ''
  const body = [
    `Place: ${place}`,
    `Name: ${name}`,
    `Email: ${email}`,
    '',
    message
  ].join('\n')
  const href = `mailto:hello@koncreteartkitchen.com?subject=${encodeURIComponent(
    `Commission brief: ${place}`
  )}&body=${encodeURIComponent(body)}`
  window.location.href = href
  statusEl.hidden = false
  statusEl.textContent = 'Opening your mail app with the brief.'
})
