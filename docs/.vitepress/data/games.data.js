import { createContentLoader } from 'vitepress'

export default createContentLoader('games/**/*.md', {
  transform(items) {
    return items
      .filter(
        (item) =>
          item.frontmatter.type === 'game' &&
          item.frontmatter.draft !== true
      )
      .map((item) => ({
        id: item.frontmatter.id || item.url,
        title: item.frontmatter.title || '未命名游戏',
        description: item.frontmatter.description || '',
        status: item.frontmatter.status || '',
        cover: item.frontmatter.cover || '',
        order: item.frontmatter.order ?? 999,
        url: item.url
      }))
      .sort(
        (a, b) =>
          a.order - b.order ||
          a.title.localeCompare(b.title, 'zh-CN')
      )
  }
})
