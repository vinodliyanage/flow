import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, type HeadConfig } from 'vitepress'

const extensionRoot = new URL('../../extensions/flow/', import.meta.url)
const flowVersion = '0.4.0'
const siteUrl = 'https://flow.vinodliyanage.me'
const siteDescription = 'Turn traditional prompts into readable agent workflows with clear steps, English conditions, and explicit approval pauses.'
const shareImage = `${siteUrl}/og-flow.png`
const shareImageAlt = 'Flow: Turn prompts into clear workflows, with a plain-English release review and approval example.'

const flowGrammar = JSON.parse(
  readFileSync(
    new URL('syntaxes/flow.tmLanguage.json', extensionRoot),
    'utf8',
  ),
)

const extensionManifest = JSON.parse(
  readFileSync(new URL('package.json', extensionRoot), 'utf8'),
)

const flowLanguage = {
  ...flowGrammar,
  name: 'flow',
}

const flowTheme = {
  name: 'flow-extension',
  type: 'dark',
  colors: {
    'editor.background': '#161618',
    'editor.foreground': '#D7DAE0',
  },
  settings: [
    {
      settings: {
        background: '#161618',
        foreground: '#D7DAE0',
      },
    },
    {
      scope: 'comment',
      settings: {
        foreground: '#7F848E',
        fontStyle: 'italic',
      },
    },
    {
      scope: 'string',
      settings: {
        foreground: '#98C379',
      },
    },
    {
      scope: 'constant.numeric',
      settings: {
        foreground: '#D19A66',
      },
    },
    ...extensionManifest.contributes.configurationDefaults[
      'editor.tokenColorCustomizations'
    ].textMateRules,
  ],
}

export default defineConfig({
  lang: 'en-US',
  title: 'Flow',
  description: siteDescription,
  base: '/',
  srcExclude: ['_partials/**'],
  lastUpdated: true,
  vite: {
    publicDir: fileURLToPath(
      new URL('images', extensionRoot),
    ),
  },
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/icon.png' }],
    ['meta', { name: 'theme-color', content: '#3157d5' }],
  ],
  transformHead({ pageData }) {
    if (pageData.relativePath === '404.md') return []

    const isHome = pageData.relativePath === 'index.md'
    const title = isHome
      ? 'Flow — Turn prompts into clear workflows'
      : `${pageData.title} | Flow`
    const description = pageData.description || siteDescription
    const pathname = isHome ? '/' : `/${pageData.relativePath.replace(/\.md$/, '.html')}`
    const url = new URL(pathname, siteUrl).href

    return [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:site_name', content: 'Flow' }],
      ['meta', { property: 'og:locale', content: 'en_US' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:image', content: shareImage }],
      ['meta', { property: 'og:image:type', content: 'image/png' }],
      ['meta', { property: 'og:image:width', content: '1200' }],
      ['meta', { property: 'og:image:height', content: '630' }],
      ['meta', { property: 'og:image:alt', content: shareImageAlt }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
      ['meta', { name: 'twitter:image', content: shareImage }],
      ['meta', { name: 'twitter:image:alt', content: shareImageAlt }],
    ] satisfies HeadConfig[]
  },
  markdown: {
    languages: [
      flowLanguage,
      { name: 'ebnf', scopeName: 'source.ebnf', patterns: [] },
    ],
    theme: flowTheme,
  },
  themeConfig: {
    logo: '/icon.png',
    nav: [
      { text: 'Learn', link: '/flow-language' },
      { text: 'Reference', link: '/commands' },
      { text: 'Specification', link: '/specification' },
      { text: 'Examples', link: '/examples' },
      { text: `v${flowVersion}`, link: '/specification#language-version' },
    ],
    sidebar: [
      {
        text: 'Learn Flow',
        items: [
          { text: 'Introduction', link: '/flow-language' },
          { text: 'Your first program', link: '/quick-start' },
          { text: 'Syntax and values', link: '/syntax' },
          { text: 'Prompt conversion', link: '/prompt-to-flow' },
        ],
      },
      {
        text: 'Guides',
        items: [
          { text: 'Reusing programs', link: '/reuse' },
          { text: 'Execution and failures', link: '/execution' },
          { text: 'Editor setup', link: '/editor-setup' },
          { text: 'Real-world examples', link: '/examples' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Command reference', link: '/commands' },
          { text: 'Language specification', link: '/specification' },
          { text: 'Agent interpreter contract', link: '/interpreter' },
        ],
      },
    ],
    search: {
      provider: 'local',
    },
    outline: {
      level: [2, 3],
      label: 'On this page',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vinodliyanage/flow' },
      {
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="1 1 22 22" style="fill:none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="9" r="3"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0"/></svg>',
        },
        link: 'https://vinodliyanage.me',
        ariaLabel: 'Vinod Liyanage portfolio',
      },
    ],
    editLink: {
      pattern: 'https://github.com/vinodliyanage/flow/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    lastUpdated: {
      text: 'Last updated',
    },
    docFooter: {
      prev: 'Previous page',
      next: 'Next page',
    },
    footer: {
      message: `Flow v${flowVersion} documentation`,
    },
  },
})
