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

      <div class="comparison-arrow" aria-hidden="true">
        <svg viewBox="0 0 80 60" fill="none">
          <path class="arrow-desktop" d="M15 56C18 13 57 13 65 56M53 43Q60 49 65 56Q66 47 70 39" />
          <path class="arrow-stacked" d="M9 43C17 28 36 20 68 25M52 14C58 18 63 21 69 25C62 28 58 33 54 39" />
        </svg>
      </div>

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
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 20px;
  align-items: stretch;
  margin-top: 64px;
}

.comparison-arrow {
  position: absolute;
  top: -88px;
  left: 50%;
  display: grid;
  width: 112px;
  height: 84px;
  align-self: center;
  justify-self: center;
  place-items: center;
  color: #9873df;
  pointer-events: none;
  transform: translateX(-50%);
}

.comparison-arrow svg {
  width: 112px;
  height: 84px;
  stroke: currentColor;
  stroke-width: 2.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.arrow-stacked {
  display: none;
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
  overflow-x: auto;
}

.code-content :deep(code) {
  padding: 0;
  font-size: 13px;
  line-height: 1.85;
  white-space: pre;
  overflow-wrap: normal;
  word-break: normal;
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

@media (max-width: 1100px) {
  .hero-comparison {
    grid-template-columns: minmax(0, 1fr);
    margin-top: 0;
  }

  .comparison-arrow {
    position: static;
    width: 64px;
    height: 52px;
    transform: rotate(90deg);
  }

  .comparison-arrow svg {
    width: 64px;
    height: 52px;
    stroke-width: 3.25;
  }

  .arrow-desktop {
    display: none;
  }

  .arrow-stacked {
    display: inline;
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
