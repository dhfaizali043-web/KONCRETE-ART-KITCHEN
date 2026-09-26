/* Journal: lists posts on blog.html and renders one post on post.html. */

const F = window.KAKFront

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  })
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function resolveImage(path) {
  const value = String(path || '')
  if (!value) return ''
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  return './' + value.replace(/^\.?\//, '')
}

function posts() {
  const store = (F.state.catalog && F.state.catalog.store) || {}
  const list = Array.isArray(store.posts) ? store.posts : []
  return list
    .filter((post) => post && post.title)
    .map((post) => ({
      title: post.title,
      slug: post.slug || slugify(post.title),
      date: post.date || '',
      image: post.image || '',
      excerpt: post.excerpt || '',
      body: post.body || ''
    }))
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  try {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return value
  }
}

function bodyHtml(body) {
  return String(body || '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block)}</p>`)
    .join('')
}

function renderList() {
  const wrap = document.getElementById('blogList')
  const empty = document.getElementById('blogEmpty')
  if (!wrap) return
  const list = posts()
  if (!list.length) {
    if (empty) empty.hidden = false
    return
  }
  wrap.innerHTML = list
    .map(
      (post) => `
      <article class="blog-card">
        ${
          post.image
            ? `<a class="blog-card-media" href="./post.html?slug=${encodeURIComponent(
                post.slug
              )}"><img src="${escapeHtml(resolveImage(post.image))}" alt="${escapeHtml(
                post.title
              )}" loading="lazy" /></a>`
            : ''
        }
        <div class="blog-card-body">
          ${post.date ? `<span class="blog-date">${escapeHtml(formatDate(post.date))}</span>` : ''}
          <h2><a href="./post.html?slug=${encodeURIComponent(post.slug)}">${escapeHtml(
            post.title
          )}</a></h2>
          ${post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : ''}
          <a class="blog-more" href="./post.html?slug=${encodeURIComponent(post.slug)}">Read more</a>
        </div>
      </article>`
    )
    .join('')
}

function renderPost() {
  const wrap = document.getElementById('postView')
  if (!wrap) return
  const slug = new URLSearchParams(location.search).get('slug') || ''
  const post = posts().find((item) => item.slug === slug)
  if (!post) {
    wrap.innerHTML = `
      <div class="section-index">Journal</div>
      <h1>Post not found</h1>
      <p class="lede">This post may have been removed. <a href="./blog.html">Back to the journal</a>.</p>`
    return
  }
  document.title = `${post.title} — Koncrete Art Kitchen`
  const meta = document.querySelector('meta[name="description"]')
  if (meta && post.excerpt) meta.setAttribute('content', post.excerpt)
  wrap.innerHTML = `
    <div class="section-index">Journal</div>
    <article class="post-article">
      ${post.date ? `<span class="blog-date">${escapeHtml(formatDate(post.date))}</span>` : ''}
      <h1>${escapeHtml(post.title)}</h1>
      ${
        post.image
          ? `<img class="post-image" src="${escapeHtml(resolveImage(post.image))}" alt="${escapeHtml(
              post.title
            )}" />`
          : ''
      }
      <div class="post-body">${bodyHtml(post.body || post.excerpt)}</div>
    </article>
    <p><a class="btn btn-ghost" href="./blog.html">Back to the journal</a></p>`
  injectSchema(post)
}

function injectSchema(post) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.date || undefined,
    image: post.image ? resolveImage(post.image) : undefined,
    description: post.excerpt || undefined,
    author: { '@type': 'Organization', name: 'Koncrete Art Kitchen' }
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
    /* render empty state */
  }
  if (document.getElementById('postView')) renderPost()
  else renderList()
}

init()
