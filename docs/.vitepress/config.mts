import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

const extensionRoot = new URL('../../extensions/flow/', import.meta.url)

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
  description: 'A small language for giving agents a visible path through a task.',
  base: '/',
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
  markdown: {
    languages: [flowLanguage],
    theme: flowTheme,
  },
  themeConfig: {
    logo: '/icon.png',
    nav: [
      { text: 'Guide', link: '/quick-start' },
      { text: 'Examples', link: '/examples' },
      { text: 'Commands', link: '/commands' },
    ],
    sidebar: [
      {
        text: 'Start',
        items: [
          { text: 'Why Flow', link: '/flow-language' },
          { text: 'Quick start', link: '/quick-start' },
          { text: 'Examples', link: '/examples' },
        ],
      },
      {
        text: 'Language',
        items: [
          { text: 'Syntax', link: '/syntax' },
          { text: 'Commands', link: '/commands' },
          { text: 'Reusing flows', link: '/reuse' },
          { text: 'Execution', link: '/execution' },
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
      message: 'Flow documentation',
    },
  },
})
