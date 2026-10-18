<script setup lang="ts">
import { withBase } from 'vitepress'
</script>

<template>
  <section class="flow-hero" aria-labelledby="flow-hero-title">
    <div class="hero-intro">
      <h1 id="flow-hero-title">Turn prompts into clear workflows.</h1>
      <p class="hero-description">
        Review a release, stop on blockers, and get approval before the handoff.
        The same task, with every step and decision visible.
      </p>
    </div>

    <div class="hero-comparison">
      <article class="comparison-panel prompt-panel" aria-labelledby="prompt-title">
        <header class="panel-header">
          <h2 id="prompt-title">Traditional prompt</h2>
          <span class="panel-label">One long request</span>
        </header>
        <div class="prompt-content vp-doc">
          <slot name="prompt" />
        </div>
      </article>

      <article class="comparison-panel code-panel" aria-labelledby="flow-title">
        <header class="panel-header">
          <h2 id="flow-title">Equivalent Flow</h2>
          <span class="panel-label">release-handoff.flow</span>
        </header>
        <div class="code-content vp-doc">
          <slot name="flow" />
        </div>
      </article>
    </div>

    <div class="hero-actions">
      <a class="hero-link primary" :href="withBase('/quick-start.html')">Get started</a>
      <a class="hero-link secondary" :href="withBase('/examples.html')">Explore real-world examples <span aria-hidden="true">→</span></a>
    </div>
  </section>
</template>

<style scoped>
.flow-hero {
  max-width: 1440px;
  margin: 0 auto;
  padding: 40px 32px 0;
}

.hero-intro {
  max-width: 1000px;
  margin-bottom: 28px;
}

.hero-intro h1 {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: clamp(32px, 4vw, 54px);
  font-weight: 650;
  letter-spacing: -0.045em;
  line-height: 1.12;
  text-wrap: balance;
}

.hero-description {
  max-width: 760px;
  margin: 16px 0 0;
  color: var(--vp-c-text-2);
  font-size: 17px;
  line-height: 1.6;
}

.hero-comparison {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 20px;
  align-items: stretch;
}

.comparison-panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
}

.prompt-panel {
  background: var(--vp-c-bg-soft);
}

.panel-header {
  display: flex;
  min-height: 54px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 22px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.panel-header h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
}

.panel-label {
  color: var(--vp-c-text-2);
  font-size: 11px;
  line-height: 1.5;
}

.prompt-content {
  padding: 22px;
}

.prompt-content :deep(blockquote) {
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--vp-c-text-2);
}

.prompt-content :deep(p) {
  margin: 0 0 18px;
  font-size: 14px;
  line-height: 1.7;
}

.prompt-content :deep(p:last-child) {
  margin-bottom: 0;
}

.code-panel {
  background: var(--vp-code-block-bg);
  border-color: var(--vp-c-brand-soft);
  color: var(--vp-code-block-color);
}

.code-panel .panel-header {
  border-bottom-color: var(--vp-code-block-divider-color);
}

.code-panel .panel-label {
  color: #a3a8b2;
  font-family: var(--vp-font-family-mono);
}

.code-content :deep(div[class*='language-']) {
  margin: 0;
  border-radius: 0;
}

.code-content :deep(pre) {
  padding: 22px;
}

.code-content :deep(code) {
  padding: 0;
  font-size: 13px;
  line-height: 1.85;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.hero-link {
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  text-decoration: none;
}

.hero-link.primary {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
}

.hero-link.primary:hover {
  background: var(--vp-c-brand-2);
}

.hero-link.secondary {
  border-color: var(--vp-c-divider);
  color: var(--vp-c-text-1);
}

.hero-link.secondary:hover {
  background: var(--vp-c-bg-soft);
}

.hero-link:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 4px;
}

@media (max-width: 700px) {
  .hero-comparison {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 600px) {
  .flow-hero {
    padding: 28px 20px 0;
  }

  .hero-description {
    font-size: 16px;
  }

  .panel-header,
  .prompt-content,
  .code-content :deep(pre) {
    padding: 18px;
  }

  .panel-header {
    flex-wrap: wrap;
    gap: 4px 12px;
  }
}
</style>
