import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '元星联邦',
  description: '元星联邦汉化组官网',
  cleanUrls: true,
  srcExclude: ['home/**', 'games/README.md'],
  outDir: '../dist',
  scrollOffset: 88,
  head: [
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }]
  ],
  themeConfig: {
    outline: false
  }
})
