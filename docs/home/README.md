# 首页内容维护

首页正文由以下三个 Markdown 文件提供：

- `about.md`：汉化组介绍
- `games.md`：游戏目录引导文案
- `links.md`：社交链接

每个文件顶部的 frontmatter 控制导航信息：

```yaml
---
id: about
title: 汉化组介绍
navLabel: 汉化组
order: 10
---
```

- `id` 是锚点和组件关联键，不要随意修改。
- `title` 是页面上的二级标题。
- `navLabel` 是右上角导航文字。
- `order` 越小越靠前。
- 正文直接写普通 Markdown；不要在正文重复写二级标题。
- 首页图片和链接建议使用 `/` 开头的绝对路径，例如 `/home/team.webp`。

新增游戏时编辑 `docs/games/<slug>/index.md` 的 frontmatter：

```yaml
type: game
id: example-game
title: 示例游戏
description: 一句话简介。
status: translating
order: 10
draft: false
```

游戏卡片会根据这些字段自动出现在首页。修改后可运行 `npm run dev` 预览，运行 `npm run build` 验证。
