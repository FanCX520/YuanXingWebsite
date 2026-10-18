import { createTimeline, engine } from 'animejs'

// 全站只保留一个 requestAnimationFrame：Anime 引擎由 logoScene 的渲染循环手动驱动。
// 渲染循环里每帧先 engine.update()，再更新 uniform / 渲染，保证补间值当帧生效。
engine.useDefaultMainLoop = false

const INTRO_PARAM = new URLSearchParams(window.location.search).get('intro')
const FREEZE_SECONDS = INTRO_PARAM?.startsWith('freeze-') ? Number(INTRO_PARAM.slice(7)) : null

// 场景侧：星核扩散半径 / 环带光波半径 / 星体与环带亮度 / 光晕 / 点光源 / 泛光 / 交互动效强度
const SCENE_START = {
  starReveal: -0.2,
  ringReveal: 0.25,
  star: 0,
  ribbon: 0,
  glow: 0,
  light: 0,
  bloom: 0,
  motion: 0
}

const SCENE_END = {
  starReveal: 1.7,
  ringReveal: 1.7,
  star: 1,
  ribbon: 1,
  glow: 1,
  light: 1,
  bloom: 1,
  motion: 1
}

// DOM 侧：字标底色亮度 / 高光强度 / 高光扩散 / 高光中心高度 / 字标展开掩膜 / 背景浮现
const CSS_START = {
  '--intro-wordmark': '0.15',
  '--intro-glow': '0',
  '--intro-spread': '1.5',
  '--intro-shift': '-30',
  '--intro-reveal': '0',
  '--intro-backdrop': '0'
}

const CSS_END = {
  '--intro-wordmark': '1',
  '--intro-glow': '1',
  '--intro-spread': '1',
  '--intro-shift': '0',
  '--intro-reveal': '1',
  '--intro-backdrop': '1'
}

const SAFETY_TIMEOUT = 9000

const rootStyle = document.documentElement.style

function writeCss(values) {
  Object.entries(values).forEach(([name, value]) => rootStyle.setProperty(name, value))
}

function applyScene(scene, values) {
  Object.assign(scene.intro, values)
}

export function updateIntroEngine() {
  engine.update()
}

/** 在首帧渲染前写入开场初始值；不支持动画的环境直接写终态 */
export function applyIntroFallback() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  writeCss(INTRO_PARAM === 'off' || reduced ? CSS_END : CSS_START)
}

export function initIntro({ scene }) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const disabled = INTRO_PARAM === 'off' || reduced

  // WebGL 初始化失败时没有场景可驱动，直接给终态，避免黑屏卡死
  if (!scene || disabled) {
    if (scene) applyScene(scene, SCENE_END)
    writeCss(CSS_END)
    return { skip() {}, dispose() {} }
  }

  applyScene(scene, SCENE_START)
  writeCss(CSS_START)

  let finished = false
  let safety = 0

  const cleanup = () => {
    window.clearTimeout(safety)
    window.removeEventListener('pointerdown', skip)
    window.removeEventListener('keydown', skip)
  }

  const finish = () => {
    if (finished) return
    finished = true
    applyScene(scene, SCENE_END)
    writeCss(CSS_END)
    cleanup()
  }

  const skip = () => {
    if (finished) return
    timeline.complete()
    finish()
  }

  const timeline = createTimeline({ autoplay: false, onComplete: finish })

  // ② 星核亮起 + ③ 光波从星心扫过环带
  timeline
    .add(scene.intro, { starReveal: 1.7, duration: 2100, ease: 'outQuad' }, 80)
    .add(scene.intro, { star: 1, duration: 1100, ease: 'outQuad' }, 180)
    .add(scene.intro, { glow: 1, duration: 1000, ease: 'outQuad' }, 180)
    .add(scene.intro, { bloom: 1, duration: 1300, ease: 'outQuad' }, 220)
    .add(scene.intro, { light: 1, duration: 1500, ease: 'inOutSine' }, 500)
    .add(scene.intro, { ringReveal: 1.7, duration: 1200, ease: 'outCubic' }, 1250)
    .add(scene.intro, { ribbon: 1, duration: 1300, ease: 'inOutSine' }, 1200)

  // ④ 光从字标中间上方展开，把字标由暗到亮照亮（3.3s 前完成）
  timeline
    .add(document.documentElement, { '--intro-reveal': 1, duration: 1250, ease: 'outCubic' }, 1950)
    .add(document.documentElement, { '--intro-glow': 1, duration: 900, ease: 'outCubic' }, 2000)
    .add(document.documentElement, { '--intro-shift': 0, duration: 850, ease: 'inOutSine' }, 2000)
    .add(document.documentElement, { '--intro-spread': 1, duration: 1200, ease: 'inOutSine' }, 2000)
    .add(document.documentElement, { '--intro-wordmark': 1, duration: 1250, ease: 'inOutSine' }, 2050)

  // ⑤ 等字标完全亮起后再浮现背景（3.5s 开始，不与字标重叠）
  timeline
    .add(document.documentElement, { '--intro-backdrop': 1, duration: 1300, ease: 'inOutSine' }, 3500)
    .add(scene.intro, { motion: 1, duration: 1100, ease: 'inOutSine' }, 3800)

  window.addEventListener('pointerdown', skip)
  window.addEventListener('keydown', skip)
  safety = window.setTimeout(skip, SAFETY_TIMEOUT)

  if (Number.isFinite(FREEZE_SECONDS)) {
    // 调试：冻结在指定秒数，便于逐帧截图调时间轴
    timeline.pause()
    timeline.seek(Math.max(0, FREEZE_SECONDS * 1000))
    cleanup()
  } else {
    timeline.play()
  }

  return {
    skip,
    dispose() {
      cleanup()
      timeline.cancel()
    }
  }
}
