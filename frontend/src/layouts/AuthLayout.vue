<template>
  <div class="auth-layout">
    <header class="auth-layout__brand">
      <RouterLink to="/" class="brand">
        <svg class="brand-logo-svg" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Main box body -->
          <path d="M21 8L12 12L3 8L12 4L21 8Z" fill="#3B82F6" stroke="#3B82F6" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M21 8V16L12 20L3 16V8L12 12L21 8Z" fill="#2563EB" stroke="#2563EB" stroke-width="1.5" stroke-linejoin="round"/>
          <!-- Terminal prompt on the box -->
          <path d="M7 13L9 15L7 17" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="10" y1="17" x2="13" y2="17" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          <!-- Sparkle/Star -->
          <path d="M19 3L19.5 5L21 5.5L19.5 6L19 8L18.5 6L17 5.5L18.5 5L19 3Z" fill="#3B82F6"/>
        </svg>
        <h1 class="brand-name">
          <span class="brand-name__prompt">Prompt</span>
          <span class="brand-name__package">Package</span>
        </h1>
      </RouterLink>
    </header>

    <main class="auth-layout__main">
      <slot />
    </main>

    <footer class="auth-layout__footer">
      <span>Prompt Package · MVP v0.1.0</span>
      <span>·</span>
      <RouterLink to="/privacy">Privacy</RouterLink>
    </footer>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import logoSrc from '@/icon.jpeg'
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.auth-layout__brand {
  display: flex;
  align-items: center;
  padding: var(--space-5) var(--space-6);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-primary);
  text-decoration: none;
}

.brand:hover {
  text-decoration: none;
}

.brand-logo-svg {
  flex-shrink: 0;
}

.brand-name {
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1;
  display: flex;
  gap: 4px;
}

.brand-name__prompt {
  color: #3b82f6;
}

.brand-name__package {
  color: #111827;
}

.auth-layout__main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5);
}

.auth-layout__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-5);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
