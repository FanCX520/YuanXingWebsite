import { createTimeline, engine } from 'animejs'

// 全站只保留一个 requestAnimationFrame：Anime 引擎由 logoScene 的渲染循环手动驱动。
// 渲染循环里每帧先 engine.update()，再更新 uniform / 渲染，保证补间值当帧生效。
engine.useDefaultMainLoop = false

const INTRO_PARAM = new URLSearchParams(window.location.search).get('intro')
const FREEZE_SECONDS = INTRO_PARAM?.startsWith('freeze-') ? Number(INTRO_PARAM.slice(7)) : null
const INTRO_SEEN_KEY = 'yuanxing:intro-seen'

// 场景侧：星核扩散半径 / 环带光波半径 / 星体与环带亮度 / 光晕 / 点光源 / 泛光 / 交互动效强度
const SCENE_START = {
  starReveal: -0.2,
  ringReveal: 0,
  star: 0,
  ribbon: 0,
  glow: 0,
  light: 0,
  bloom: 0,
  motion: 0,
  nav1: 0,
  nav2: 0,
  nav3: 0
}

const SCENE_END = {
  starReveal: 1.7,
  ringReveal: 1.25,
  star: 1,
  ribbon: 1,
  glow: 1,
  light: 1,
  bloom: 1,
  motion: 1,
  nav1: 1,
  nav2: 1,
  nav3: 1
}

// DOM 侧：字标底色亮度 / 高光强度 / 高光扩散 / 高光中心高度 / 字标展开掩膜 / 背景浮现
const CSS_START = {
  '--intro-wordmark': '0.15',
  '--intro-glow': '0',
  '--intro-spread': '1.5',
  '--intro-shift': '-30',
  '--intro-reveal': '0',
  '--intro-backdrop': '0',
  '--intro-nav-label': '0'
}

const CSS_END = {
  '--intro-wordmark': '1',
  '--intro-glow': '1',
  '--intro-spread': '1.25',
  '--intro-shift': '0',
  '--intro-reveal': '1',
  '--intro-backdrop': '1',
  '--intro-nav-label': '1'
}

const SAFETY_TIMEOUT = 9000

const rootStyle = document.documentElement.style

function hasSeenIntro() {
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function rememberIntro() {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, '1')
  } catch {
    // 存储不可用时仍允许本次播放，不阻断开场流程
  }
}

function shouldPlayIntro(reducedMotion) {
  if (INTRO_PARAM === 'off' || reducedMotion) return false
  if (INTRO_PARAM === 'on') return true
  return !hasSeenIntro()
}

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
  writeCss(shouldPlayIntro(reduced) ? CSS_START : CSS_END)
}

export function initIntro({ scene, onComplete }) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const disabled = !shouldPlayIntro(reduced)

  // WebGL 初始化失败时没有场景可驱动，直接给终态，避免黑屏卡死
  if (!scene || disabled) {
    if (scene) applyScene(scene, SCENE_END)
    writeCss(CSS_END)
    onComplete?.()
    return { skip() {}, dispose() {} }
  }

  applyScene(scene, SCENE_START)
  writeCss(CSS_START)

  let finished = false
  let safety = 0

  const cleanup = () => {
    window.clearTimeout(safety)
  }

  const finish = () => {
    if (finished) return
    finished = true
    applyScene(scene, SCENE_END)
    writeCss(CSS_END)
    cleanup()
    onComplete?.()
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
    .add(scene.intro, { ringReveal: 1.25, duration: 1400, ease: 'outCubic' }, 1150)
    .add(scene.intro, { ribbon: 1, duration: 1300, ease: 'inOutSine' }, 1200)

  // 主星亮到一半后，三颗导航星依次显现；其余环带、字标和背景时间轴保持不变
  timeline
    .add(scene.intro, { nav1: 1, duration: 420, ease: 'outCubic' }, 900)
    .add(scene.intro, { nav2: 1, duration: 420, ease: 'outCubic' }, 1080)
    .add(scene.intro, { nav3: 1, duration: 420, ease: 'outCubic' }, 1260)

  // ④ 光从字标中间上方展开，把字标由暗到亮照亮（3.3s 前完成）
  timeline
    .add(document.documentElement, { '--intro-reveal': 1, duration: 1250, ease: 'outCubic' }, 1950)
    .add(document.documentElement, { '--intro-glow': 1, duration: 900, ease: 'outCubic' }, 2000)
    .add(document.documentElement, { '--intro-shift': 0, duration: 850, ease: 'inOutSine' }, 2000)
    .add(document.documentElement, { '--intro-spread': 1.25, duration: 1200, ease: 'inOutSine' }, 2000)
    .add(document.documentElement, { '--intro-wordmark': 1, duration: 1250, ease: 'inOutSine' }, 2050)
    .add(document.documentElement, { '--intro-nav-label': 1, duration: 1250, ease: 'inOutSine' }, 2050)

  // ⑤ 背景与字标同步亮起，最后交给交互
  timeline
    .add(document.documentElement, { '--intro-backdrop': 1, duration: 1350, ease: 'inOutSine' }, 1950)
    .add(scene.intro, { motion: 1, duration: 1100, ease: 'inOutSine' }, 3500)

  safety = window.setTimeout(skip, SAFETY_TIMEOUT)

  if (Number.isFinite(FREEZE_SECONDS)) {
    // 调试：冻结在指定秒数，便于逐帧截图调时间轴
    timeline.pause()
    timeline.seek(Math.max(0, FREEZE_SECONDS * 1000))
    cleanup()
    onComplete?.()
  } else {
    rememberIntro()
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
