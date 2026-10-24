import { defineConfig } from 'vitepress'

const siteBase = process.env.SITE_BASE || '/'
const normalizedBase = siteBase.endsWith('/') ? siteBase : `${siteBase}/`

function prefixPublicAsset(src) {
  if (!src || normalizedBase === '/' || !src.startsWith('/') || src.startsWith('//')) {
    return src
  }

  if (src === normalizedBase || src.startsWith(normalizedBase)) return src
  return `${normalizedBase.slice(0, -1)}${src}`
}

export default defineConfig({
  base: normalizedBase,
  lang: 'zh-CN',
  title: '元星联邦',
  description: '元星联邦汉化组官网',
  cleanUrls: true,
  srcExclude: ['home/**', 'games/README.md'],
  outDir: '../dist',
  scrollOffset: 88,
  markdown: {
    config(md) {
      const imageRule = md.renderer.rules.image
      md.renderer.rules.image = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        const src = token.attrGet('src')
        const prefixed = prefixPublicAsset(src)
        if (prefixed && prefixed !== src) token.attrSet('src', prefixed)
        return imageRule
          ? imageRule(tokens, idx, options, env, self)
          : self.renderToken(tokens, idx, options)
      }
    }
  },
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
