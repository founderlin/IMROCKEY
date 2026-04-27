<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import apiClient from '@/api/client'
import attachmentsApi from '@/api/attachments'
import { modelLabel } from '@/constants/models'

const props = defineProps({
  message: { type: Object, required: true },
  highlighted: { type: Boolean, default: false },
  /** Whether this message can be retried (assistants only, disabled while pending). */
  canRetry: { type: Boolean, default: false }
})

const emit = defineEmits(['copy', 'retry', 'delete'])

const copyFeedback = ref('')
let copyFeedbackTimer = null

const domId = computed(() => {
  if (props.message?.id == null) return undefined
  return `msg-${props.message.id}`
})

const isUser = computed(() => props.message.role === 'user')
const isAssistant = computed(() => props.message.role === 'assistant')
const isSystem = computed(() => props.message.role === 'system')

const avatarLabel = computed(() => {
  if (isUser.value) return 'You'
  if (isSystem.value) return 'Sys'
  return 'AI'
})

const modelText = computed(() => {
  if (!isAssistant.value) return ''
  return props.message.model ? modelLabel(props.message.model) : ''
})

const tokensText = computed(() => {
  if (!isAssistant.value) return ''
  return props.message.total_tokens != null
    ? `${props.message.total_tokens} tok`
    : ''
})

const time = computed(() => {
  if (!props.message.created_at) return ''
  try {
    return new Date(props.message.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (_e) {
    return ''
  }
})

/** Show footer only for persisted, non-system messages. */
const showFooter = computed(
  () => !isSystem.value && props.message.id != null
)

const attachments = computed(() => {
  const list = Array.isArray(props.message.attachments)
    ? props.message.attachments
    : []
  return list
})

// Native <img src> can't send an Authorization header, so for image
// attachments we fetch them as blobs through the authenticated axios
// client, create an object URL, and render that. Each message bubble
// keeps its own cache keyed by attachment id so we don't re-fetch on
// every re-render. Object URLs are revoked on unmount.
const imageUrls = ref({})

function cacheKey(att) {
  return `a-${att.id || att.clientId || ''}`
}

async function loadImageFor(att) {
  if (!att) return
  const key = cacheKey(att)
  if (imageUrls.value[key]) return
  // Optimistic upload still has a previewUrl — prefer that locally.
  if (att.previewUrl) {
    imageUrls.value[key] = att.previewUrl
    return
  }
  if (!att.id || !props.message.conversation_id) return
  try {
    const res = await apiClient.get(
      `/api/conversations/${props.message.conversation_id}/attachments/${att.id}/download`,
      { responseType: 'blob' }
    )
    const blob = res.data
    if (typeof URL?.createObjectURL === 'function') {
      imageUrls.value[key] = URL.createObjectURL(blob)
    }
  } catch (_err) {
    // Mark as failed so we stop retrying.
    imageUrls.value[key] = ''
  }
}

function loadAllImages() {
  for (const att of attachments.value) {
    if (att.kind === 'image') loadImageFor(att)
  }
}

watch(
  () => attachments.value,
  () => loadAllImages(),
  { immediate: true, deep: true }
)

onBeforeUnmount(() => {
  for (const url of Object.values(imageUrls.value)) {
    if (!url) continue
    // Don't revoke the `previewUrl` one — the parent view owns it.
    if (typeof URL?.revokeObjectURL === 'function') {
      try {
        URL.revokeObjectURL(url)
      } catch (_e) {
        /* ignore */
      }
    }
  }
  if (copyFeedbackTimer) {
    clearTimeout(copyFeedbackTimer)
    copyFeedbackTimer = null
  }
})

function downloadUrl(att) {
  if (!props.message.conversation_id || !att?.id) return '#'
  return attachmentsApi.downloadUrl(props.message.conversation_id, att.id)
}

function formatBytes(n) {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

async function onFileClick(att, event) {
  // Native anchor download doesn't send our auth header, so fetch as
  // blob and trigger a download programmatically.
  if (!att?.id || !props.message.conversation_id) return
  event.preventDefault()
  try {
    const res = await apiClient.get(
      `/api/conversations/${props.message.conversation_id}/attachments/${att.id}/download`,
      { responseType: 'blob' }
    )
    const blob = res.data
    if (typeof URL?.createObjectURL === 'function') {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = att.filename || 'attachment'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
  } catch (_err) {
    /* no-op */
  }
}

function onCopyClick() {
  emit('copy', props.message)
  copyFeedback.value = 'Copied'
  if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer)
  copyFeedbackTimer = setTimeout(() => {
    copyFeedback.value = ''
    copyFeedbackTimer = null
  }, 1200)
}

function onRetryClick() {
  if (!props.canRetry) return
  emit('retry', props.message)
}

function onDeleteClick() {
  const ok = window.confirm(
    isUser.value
      ? 'Delete this message and everything after it in this blabla?'
      : 'Delete this reply?'
  )
  if (!ok) return
  emit('delete', props.message)
}
</script>

<template>
  <div
    :id="domId"
    class="bubble"
    :class="{
      'bubble--user': isUser,
      'bubble--assistant': isAssistant,
      'bubble--system': isSystem,
      'bubble--highlighted': highlighted
    }"
  >
    <div class="bubble__avatar" :class="{ 'bubble__avatar--user': isUser }">
      {{ avatarLabel }}
    </div>
    <div class="bubble__body">
      <div
        v-if="message.content"
        class="bubble__content"
      >{{ message.content }}</div>

      <ul
        v-if="attachments.length"
        class="bubble__attachments"
        :class="{ 'bubble__attachments--user': isUser }"
        aria-label="Attached files"
      >
        <li
          v-for="att in attachments"
          :key="att.id || att.clientId"
          class="bubble-attachment"
          :class="{
            'bubble-attachment--image': att.kind === 'image'
          }"
        >
          <a
            v-if="att.kind === 'image'"
            :href="downloadUrl(att)"
            @click="onFileClick(att, $event)"
            class="bubble-attachment__image-link"
            :title="att.filename"
          >
            <img
              v-if="imageUrls[cacheKey(att)]"
              :src="imageUrls[cacheKey(att)]"
              :alt="att.filename"
              class="bubble-attachment__image"
            />
            <span v-else class="bubble-attachment__image-fallback">
              <span class="spinner" aria-hidden="true" />
            </span>
          </a>
          <a
            v-else
            :href="downloadUrl(att)"
            class="bubble-attachment__file"
            @click="onFileClick(att, $event)"
          >
            <span
              class="bubble-attachment__icon"
              :data-kind="(att.kind || 'file').toLowerCase()"
              aria-hidden="true"
            >
              <svg
                v-if="att.kind === 'pdf'"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <text x="8" y="17" font-size="6" font-weight="700" fill="currentColor" stroke="none">PDF</text>
              </svg>
              <svg
                v-else
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="14" y2="17" />
              </svg>
            </span>
            <span class="bubble-attachment__meta">
              <span class="bubble-attachment__name">{{ att.filename }}</span>
              <span class="bubble-attachment__sub">
                {{ formatBytes(att.size_bytes) }}
                <template v-if="att.kind === 'pdf'"> · PDF</template>
                <template v-else-if="att.kind === 'text'"> · Text</template>
                <template v-if="att.text_truncated"> · truncated</template>
              </span>
            </span>
          </a>
        </li>
      </ul>

      <!-- Single-line footer: actions first (retry → copy → delete), then
           meta text (model · tokens · time for assistants; time only for
           users). Order is fixed so ChatGPT/OpenRouter-style power-user
           muscle memory works in both columns. -->
      <div
        v-if="showFooter"
        class="bubble__footer"
        :class="{ 'bubble__footer--user': isUser }"
      >
        <button
          type="button"
          class="bubble-action"
          :disabled="!canRetry"
          :title="
            canRetry
              ? isUser
                ? 'Regenerate the reply to this message'
                : 'Regenerate this reply'
              : 'Busy — try again in a moment'
          "
          aria-label="Retry"
          @click="onRetryClick"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.9"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>

        <button
          type="button"
          class="bubble-action"
          :title="copyFeedback || 'Copy message'"
          :aria-label="copyFeedback || 'Copy message'"
          @click="onCopyClick"
        >
          <svg
            v-if="!copyFeedback"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.9"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <svg
            v-else
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>

        <button
          type="button"
          class="bubble-action bubble-action--danger"
          :title="
            isUser
              ? 'Delete this message and everything after it'
              : 'Delete this reply'
          "
          aria-label="Delete"
          @click="onDeleteClick"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.9"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>

        <!-- Meta text — fixed order: model · tokens · time for assistants,
             time only for user messages. -->
        <span v-if="modelText" class="bubble__meta-text bubble__model">
          {{ modelText }}
        </span>
        <span v-if="tokensText" class="bubble__meta-text bubble__tokens">
          {{ tokensText }}
        </span>
        <span v-if="time" class="bubble__meta-text bubble__time">
          {{ time }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bubble {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
}

.bubble--user {
  flex-direction: row-reverse;
}

.bubble__avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--text-xs);
  letter-spacing: 0.02em;
}

.bubble__avatar--user {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
}

.bubble__body {
  max-width: min(720px, 80%);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bubble--user .bubble__body {
  align-items: flex-end;
}

.bubble__content {
  background: var(--color-surface);
  color: var(--color-text-primary);
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-1);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
  font-size: var(--text-base);
}

.bubble--user .bubble__content {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  border-color: transparent;
  border-bottom-right-radius: var(--radius-xs);
}

.bubble--assistant .bubble__content {
  border-bottom-left-radius: var(--radius-xs);
}

.bubble--system .bubble__content {
  background: var(--color-warning-soft);
  color: var(--color-warning);
  border-color: rgba(176, 96, 0, 0.3);
  font-style: italic;
}

/* Single footer row: retry / copy / delete / meta-text, in this exact
   order. For user bubbles the row flips with flex-direction: row-reverse
   so the buttons still read "retry → copy → delete → meta" when scanning
   from the outside edge of the bubble inward (i.e. the first thing next
   to the bubble on the outside is retry, like OpenRouter/ChatGPT). */
.bubble__footer {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  color: var(--color-text-muted);
}

.bubble__footer--user {
  flex-direction: row-reverse;
}

/* Actions fade in on hover to keep the feed calm when scanning. */
.bubble__footer .bubble-action,
.bubble__footer .bubble__meta-text {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.bubble:hover .bubble__footer .bubble-action,
.bubble:focus-within .bubble__footer .bubble-action,
.bubble:hover .bubble__footer .bubble__meta-text,
.bubble:focus-within .bubble__footer .bubble__meta-text {
  opacity: 1;
}

/* Keep the timestamp + model meta always visible so a turn never looks
   timeless at rest — only the action buttons hide. */
.bubble__footer .bubble__meta-text {
  opacity: 0.7;
}

.bubble:hover .bubble__footer .bubble__meta-text,
.bubble:focus-within .bubble__footer .bubble__meta-text {
  opacity: 1;
}

.bubble__meta-text {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
}

/* Small dot separators between meta items. Using ::before so it only
   appears between siblings, not before the first one. */
.bubble__meta-text + .bubble__meta-text::before {
  content: '·';
  margin: 0 6px;
  color: var(--color-text-muted);
  opacity: 0.6;
}

.bubble__model {
  font-weight: 500;
}

.bubble-action {
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease,
    border-color 0.12s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bubble-action:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

.bubble-action--danger:hover:not(:disabled) {
  background: rgba(198, 40, 40, 0.1);
  color: #c62828;
  border-color: rgba(198, 40, 40, 0.35);
}

.bubble-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (hover: none) {
  /* Touch devices never trigger hover — keep everything visible. */
  .bubble__footer .bubble-action,
  .bubble__footer .bubble__meta-text {
    opacity: 1;
  }
}

.bubble--highlighted .bubble__content {
  animation: bubble-flash 1.6s ease-out;
  box-shadow: 0 0 0 3px rgba(255, 213, 79, 0.55);
}

@keyframes bubble-flash {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 213, 79, 0.85);
  }
  20% {
    box-shadow: 0 0 0 6px rgba(255, 213, 79, 0.55);
  }
  100% {
    box-shadow: 0 0 0 3px rgba(255, 213, 79, 0);
  }
}

/* ---- Attachment rendering ---- */
.bubble__attachments {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 100%;
}

.bubble__attachments--user {
  justify-content: flex-end;
}

.bubble-attachment {
  display: flex;
  align-items: center;
}

.bubble-attachment--image {
  max-width: 260px;
}

.bubble-attachment__image-link {
  display: block;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: var(--color-surface-muted);
  line-height: 0;
  transition: border-color 0.12s ease, transform 0.12s ease;
}

.bubble-attachment__image-link:hover {
  border-color: var(--color-border-strong);
  transform: translateY(-1px);
}

.bubble-attachment__image {
  display: block;
  max-width: 260px;
  max-height: 260px;
  width: auto;
  height: auto;
}

.bubble-attachment__image-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 140px;
}

.bubble-attachment__file {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
  text-decoration: none;
  color: inherit;
  transition: background-color 0.12s ease, border-color 0.12s ease,
    transform 0.12s ease;
  max-width: 300px;
}

.bubble-attachment__file:hover {
  border-color: var(--color-border-strong);
  background: var(--color-surface-hover);
  transform: translateY(-1px);
}

.bubble-attachment__icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.bubble-attachment__icon[data-kind='pdf'] {
  background: rgba(198, 40, 40, 0.08);
  color: #c62828;
}

.bubble-attachment__icon[data-kind='text'] {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.bubble-attachment__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 220px;
}

.bubble-attachment__name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bubble-attachment__sub {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

/* On user bubbles, attachments sit right-aligned. The file-chip variant
   uses the same styling either way so it reads the same in both columns. */
</style>
