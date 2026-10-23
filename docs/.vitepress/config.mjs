import { defineConfig } from 'vitepress'

const siteBase = process.env.SITE_BASE || '/'
const normalizedBase = siteBase.endsWith('/') ? siteBase : `${siteBase}/`

export default defineConfig({
  base: normalizedBase,
  lang: 'zh-CN',
  title: '元星联邦',
  description: '元星联邦汉化组官网',
  cleanUrls: true,
  srcExclude: ['home/**', 'games/README.md'],
  outDir: '../dist',
  scrollOffset: 88,
  head: [
    [
      'link',
      {
        rel: 'icon',
        href: `${normalizedBase}images/brand/logo-mark.png`,
        type: 'image/png'
      }
    ]
  ],
  themeConfig: {
    outline: false
  }
})
