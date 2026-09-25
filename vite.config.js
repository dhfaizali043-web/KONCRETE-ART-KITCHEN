import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const entry = (path) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: entry('./index.html'),
        shop: entry('./shop.html'),
        category: entry('./category.html'),
        product: entry('./product.html'),
        checkout: entry('./checkout.html'),
        contact: entry('./contact.html'),
        orders: entry('./orders.html'),
        returns: entry('./returns.html'),
        shipping: entry('./shipping.html'),
        privacy: entry('./privacy.html'),
        terms: entry('./terms.html'),
        admin: entry('./admin.html')
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
