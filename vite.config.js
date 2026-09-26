import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'

const entry = (path) => fileURLToPath(new URL(path, import.meta.url))

const SITE = 'https://dhfaizali043-web.github.io/KONCRETE-ART-KITCHEN'

const STATIC_PAGES = [
  ['', '1.0', 'weekly'],
  ['shop.html', '0.9', 'weekly'],
  ['b2b.html', '0.8', 'monthly'],
  ['faq.html', '0.6', 'monthly'],
  ['blog.html', '0.6', 'weekly'],
  ['contact.html', '0.6', 'monthly'],
  ['shipping.html', '0.4', 'yearly'],
  ['returns.html', '0.4', 'yearly'],
  ['privacy.html', '0.3', 'yearly'],
  ['terms.html', '0.3', 'yearly']
]

function sitemapXml(urls) {
  const body = urls
    .map(
      ({ loc, priority, changefreq }) => `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`
}

function sitemapPlugin() {
  return {
    name: 'kak-sitemap',
    apply: 'build',
    closeBundle() {
      try {
        const catalog = JSON.parse(readFileSync(entry('./public/data/catalog.json'), 'utf8'))
        const store = catalog.store || {}
        const urls = STATIC_PAGES.map(([path, priority, changefreq]) => ({
          loc: `${SITE}/${path}`,
          priority,
          changefreq
        }))

        ;(store.categories || []).forEach((cat) => {
          if (!cat || !cat.id) return
          urls.push({
            loc: `${SITE}/category.html?cat=${encodeURIComponent(cat.id)}`,
            priority: '0.7',
            changefreq: 'weekly'
          })
        })

        ;(catalog.products || []).forEach((product) => {
          if (!product || !product.id) return
          if (product.available === false) return
          if (product.stock === 0) return
          urls.push({
            loc: `${SITE}/product.html?id=${encodeURIComponent(product.id)}`,
            priority: '0.7',
            changefreq: 'weekly'
          })
        })

        ;(store.posts || []).forEach((post) => {
          const slug = post && (post.slug || post.title)
          if (!slug) return
          urls.push({
            loc: `${SITE}/post.html?slug=${encodeURIComponent(slug)}`,
            priority: '0.5',
            changefreq: 'monthly'
          })
        })

        writeFileSync(entry('./dist/sitemap.xml'), sitemapXml(urls))
      } catch {
        /* keep the static public/sitemap.xml if generation fails */
      }
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [sitemapPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: entry('./index.html'),
        shop: entry('./shop.html'),
        category: entry('./category.html'),
        product: entry('./product.html'),
        checkout: entry('./checkout.html'),
        contact: entry('./contact.html'),
        b2b: entry('./b2b.html'),
        orders: entry('./orders.html'),
        returns: entry('./returns.html'),
        shipping: entry('./shipping.html'),
        privacy: entry('./privacy.html'),
        terms: entry('./terms.html'),
        admin: entry('./admin.html'),
        faq: entry('./faq.html'),
        track: entry('./track.html'),
        blog: entry('./blog.html'),
        post: entry('./post.html'),
        wishlist: entry('./wishlist.html'),
        notfound: entry('./404.html')
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['.monkeycode-ai.live']
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: ['.monkeycode-ai.live']
  }
})
