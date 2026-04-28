import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/base.css'
// highlight.js theme for rendered code blocks inside chat bubbles.
// GitHub-style theme matches the rest of the UI's light/neutral palette.
import 'highlight.js/styles/github.css'
// Browser tab / PWA favicon — square "mark" variant of the logo.
import faviconHref from './icon1.png'

const app = createApp(App)
app.use(router)

function applySiteBrandAssets() {
  // Remove any stale icon <link> tags that a previous build (or the
  // inline <link rel="icon"> in index.html) left behind, then install a
  // single canonical one pointing at the imported icon1.png so Vite's
  // hashed asset URL is always correct.
  document
    .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
    .forEach((node) => node.parentNode?.removeChild(node))

  const icon = document.createElement('link')
  icon.rel = 'icon'
  icon.type = 'image/png'
  icon.href = faviconHref
  document.head.appendChild(icon)
}
applySiteBrandAssets()

// Wait for the first navigation (which triggers the auth `init`) before
// mounting so we don't flash a protected page when the user is logged out.
router.isReady().then(() => {
  app.mount('#app')
})
