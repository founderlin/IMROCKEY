import apiClient from './client'

export const chatApi = {
  listAllConversations({ limit } = {}) {
    const params = {}
    if (limit != null) params.limit = limit
    return apiClient
      .get('/api/conversations', { params })
      .then((r) => r.data)
  },
  listConversations(projectId) {
    return apiClient
      .get(`/api/projects/${projectId}/conversations`)
      .then((r) => r.data)
  },
  createConversation(projectId, payload = {}) {
    return apiClient
      .post(`/api/projects/${projectId}/conversations`, payload)
      .then((r) => r.data)
  },
  getConversation(conversationId) {
    return apiClient
      .get(`/api/conversations/${conversationId}`)
      .then((r) => r.data)
  },
  updateConversation(conversationId, patch) {
    return apiClient
      .patch(`/api/conversations/${conversationId}`, patch)
      .then((r) => r.data)
  },
  deleteConversation(conversationId) {
    return apiClient
      .delete(`/api/conversations/${conversationId}`)
      .then((r) => r.data)
  },
  deleteMessage(conversationId, messageId) {
    // Server cascades: the message + everything after it are removed.
    return apiClient
      .delete(
        `/api/conversations/${conversationId}/messages/${messageId}`
      )
      .then((r) => r.data)
  },
  listMessages(conversationId) {
    return apiClient
      .get(`/api/conversations/${conversationId}/messages`)
      .then((r) => r.data)
  },
  sendMessage(
    conversationId,
    { content, model, provider, attachmentIds, signal } = {}
  ) {
    const body = { content, model }
    if (provider) body.provider = provider
    if (Array.isArray(attachmentIds) && attachmentIds.length) {
      body.attachment_ids = attachmentIds
    }
    const config = {}
    if (signal) config.signal = signal
    // Chat completions can take a while on big prompts; avoid axios's
    // default 15s timeout cutting us off mid-flight.
    config.timeout = 120_000
    return apiClient
      .post(
        `/api/conversations/${conversationId}/messages`,
        body,
        config
      )
      .then((r) => r.data)
  },
  summarizeConversation(conversationId, { model } = {}) {
    const body = {}
    if (model) body.model = model
    return apiClient
      .post(`/api/conversations/${conversationId}/summarize`, body)
      .then((r) => r.data)
  },
  retryAssistant(
    conversationId,
    { model, provider, signal } = {}
  ) {
    const body = {}
    if (model) body.model = model
    if (provider) body.provider = provider
    const config = { timeout: 120_000 }
    if (signal) config.signal = signal
    return apiClient
      .post(
        `/api/conversations/${conversationId}/regenerate`,
        body,
        config
      )
      .then((r) => r.data)
  }
}

export default chatApi
