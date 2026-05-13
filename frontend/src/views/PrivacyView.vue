<template>
  <div class="privacy-view">
    <PageHeader
      title="Privacy"
      :description="privacyIntro"
    />

    <section class="card">
      <h3 class="card__title card__title--sm">What we store</h3>
      <ul class="bullets">
        <li>Your account: email and a hashed password.</li>
        <li>Your OpenRouter API key, encrypted at rest. Never returned to the browser.</li>
        <li>Projects, blablas, messages, summaries, Context Packs, and Wrap Markdown files you save under project memory.</li>
      </ul>
    </section>

    <section class="card">
      <h3 class="card__title card__title--sm">What we don’t do</h3>
      <ul class="bullets">
        <li>We don’t share your data with third parties.</li>
        <li>We don’t print your API key in logs.</li>
        <li>We don’t train models on your blablas.</li>
      </ul>
    </section>

    <section class="card">
      <h3 class="card__title card__title--sm">Your controls</h3>
      <ul class="bullets">
        <li>You can delete any project, blabla, or Context Pack at any time.</li>
        <li>You can remove your API key from Settings.</li>
        <li>Full account deletion will be available in R12.</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { APP_VERSION } from '@/constants/appVersion'

const privacyIntro = computed(
  () =>
    `How Prompt Package handles your data in early releases (currently v${APP_VERSION}).`
)
</script>

<style scoped>
.privacy-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.bullets {
  margin: 0;
  padding-left: var(--space-5);
  color: var(--color-text-secondary);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
