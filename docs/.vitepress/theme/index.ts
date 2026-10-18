import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import FlowHero from './FlowHero.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('FlowHero', FlowHero)
  },
} satisfies Theme
