import { createContentLoader } from 'vitepress'

export default createContentLoader('home/*.md', {
  render: true,
  transform(items) {
    return items
      .filter((item) => item.frontmatter.id)
      .map((item) => ({
        id: item.frontmatter.id,
        meta: item.frontmatter,
        html: item.html || '',
        url: item.url
      }))
  }
})
