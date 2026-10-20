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
cover: /images/games/example-game.webp
draft: false
```

`cover` 是可选的展示图，把图片放到 `docs/public/images/games/`，并填写站点绝对路径，例如 `/images/games/example-game.webp`。游戏卡片会根据这些字段自动出现在首页。修改后可运行 `npm run dev` 预览，运行 `npm run build` 验证。

## 正文图片排版

正文图片可以在 Markdown 图片后直接选择位置：

```md
![单独左对齐](./images/example.webp){.image-left}

![居中图片](./images/example.webp){.image-center}

![单独右对齐](./images/example.webp){.image-right}

![全宽截图](./images/example.webp){.image-full}

![左侧环绕](./images/example.webp){.image-left .image-wrap}

![右侧环绕](./images/example.webp){.image-right .image-wrap}
```

需要只让部分正文环绕时，在第一个不再环绕的段落上添加 `image-wrap-stop`：

```md
![左侧环绕](./images/example.webp){.image-left .image-wrap}

这一段在图片右侧环绕。

这一段仍然在图片右侧环绕。

从这一段开始停止环绕
{.image-wrap-stop}

后续正文会在图片下方正常排版。
```

- `image-left` / `image-right`：独立图片，默认最大占正文宽度的 50%，不环绕。
- `image-center`：居中上下摆放。
- `image-full`：占满正文宽度的上下摆放。
- 在左/右基础上再加 `image-wrap`，才启用桌面端图文环绕：
  - `{.image-left .image-wrap}`
  - `{.image-right .image-wrap}`
- `image-wrap-stop`：加在第一个不再环绕的段落上，使该段及后续内容回到图片下方。
- 同一段落里同时放一张 `.image-left` 和一张 `.image-right`，会自动排成左右两列；用空行分开则各自独占一行。
- 小于 680px 时环绕图自动改为全宽上下排版。
- 首页 section 的图片使用 `/images/home/...` 这类站点绝对路径；游戏 Wiki 可以使用 `./images/...` 相对路径。
