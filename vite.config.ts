import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Link previews (WhatsApp, Telegram) only show the image when og:image is an absolute URL.
// On Vercel the production domain is available at build time; locally it stays relative.
function siteUrl(): Plugin {
  const domain = process.env.VERCEL_PROJECT_PRODUCTION_URL
  const origin = domain ? `https://${domain}` : ''
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', origin),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), siteUrl()],
})
