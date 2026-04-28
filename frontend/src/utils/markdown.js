/**
 * Safe markdown → HTML renderer for chat replies.
 *
 * Pipeline:
 *   raw markdown → marked (parse) → DOMPurify (sanitize) → HTML string
 *
 * Code fences get syntax-highlighted via highlight.js. We wrap each block
 * in a small container so the bubble component can attach a "Copy" button
 * on top of it using event delegation (see MessageBubble.vue).
 *
 * Security:
 *   - DOMPurify strips anything that could execute script.
 *   - We still enable ALLOW_DATA_ATTR so the `data-code` attribute survives
 *     (it lets the copy button read the unescaped source).
 *   - Links open in a new tab with rel="noopener noreferrer" to avoid
 *     tabnabbing.
 */

import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/common'

// Configure marked once. `gfm: true` turns on tables, strikethrough,
// task lists, etc.; `breaks: true` converts lone \n to <br> which matches
// how chat models format casual replies.
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false
})

// Custom renderer so we can (a) inject a highlighted inner <code> with a
// language class and (b) stash the raw source on the <pre> element for
// the copy-to-clipboard handler.
const renderer = new marked.Renderer()

renderer.code = function (code, infostring) {
  const raw = typeof code === 'string' ? code : String(code ?? '')
  const langRaw = (infostring || '').trim().split(/\s+/)[0] || ''
  const lang = langRaw.toLowerCase()

  let highlighted
  let detectedLang = lang
  try {
    if (lang && hljs.getLanguage(lang)) {
      highlighted = hljs.highlight(raw, { language: lang, ignoreIllegals: true }).value
    } else {
      // Auto-detect for unlabeled fences; fall back to plaintext if
      // auto-detect is unreliable.
      const auto = hljs.highlightAuto(raw)
      highlighted = auto.value
      detectedLang = auto.language || ''
    }
  } catch (_err) {
    highlighted = escapeHtml(raw)
  }

  // Base64 the raw source so it survives DOMPurify regardless of quotes
  // / angle brackets in the code. The copy handler decodes on click.
  const rawB64 = btoa(unescape(encodeURIComponent(raw)))
  const langLabel = detectedLang ? escapeHtml(detectedLang) : ''

  return (
    `<div class="md-codeblock" data-code="${rawB64}">` +
    `<div class="md-codeblock__header">` +
    `<span class="md-codeblock__lang">${langLabel || 'code'}</span>` +
    `<button type="button" class="md-codeblock__copy" data-copy-code aria-label="Copy code">` +
    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    `<rect x="9" y="9" width="13" height="13" rx="2"/>` +
    `<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>` +
    `</svg>` +
    `<span class="md-codeblock__copy-label">Copy</span>` +
    `</button>` +
    `</div>` +
    `<pre class="md-codeblock__pre"><code class="hljs${detectedLang ? ` language-${escapeHtml(detectedLang)}` : ''}">${highlighted}</code></pre>` +
    `</div>`
  )
}

// Ensure every external link opens in a new tab safely.
renderer.link = function (href, title, text) {
  const safeHref = typeof href === 'string' ? href : ''
  const safeTitle = title ? ` title="${escapeHtml(title)}"` : ''
  return (
    `<a href="${escapeHtml(safeHref)}"${safeTitle} target="_blank" rel="noopener noreferrer">` +
    `${text}</a>`
  )
}

marked.use({ renderer })

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const PURIFY_CONFIG = {
  // Keep inline markdown-ish attributes we set ourselves.
  ADD_ATTR: ['target', 'rel', 'data-copy-code', 'data-code'],
  // Keep <br> / <hr> / tables / blockquotes / code / pre / etc.
  // (DOMPurify's defaults already allow those.)
  FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload']
}

/**
 * Render untrusted markdown to sanitized HTML. Always safe to pass to v-html.
 */
export function renderMarkdown(source) {
  if (source == null) return ''
  const text = String(source)
  if (!text.trim()) return ''
  const html = marked.parse(text)
  return DOMPurify.sanitize(html, PURIFY_CONFIG)
}

/**
 * Decode a base64 blob written into a ``data-code`` attribute by the
 * custom code renderer. Returns an empty string on any failure.
 */
export function decodeCopyPayload(b64) {
  if (!b64) return ''
  try {
    return decodeURIComponent(escape(atob(b64)))
  } catch (_err) {
    return ''
  }
}

export default renderMarkdown
