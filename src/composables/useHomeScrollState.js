import {
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'

export function useHomeScrollState({ isHome }) {
  const viewport = ref({ width: 1440, height: 900 })
  const scrollProgress = ref(0)
  const logoReplacementProgress = ref(0)
  const activeSection = ref('')
  let scrollFrame = 0
  let heroSpan = 0
  let measuredWidth = 0

  function readViewportSize() {
    return {
      width: document.documentElement.clientWidth || window.innerWidth,
      height: window.innerHeight
    }
  }

  function updateViewport() {
    const live = readViewportSize()
    const widthChanged = Math.abs(live.width - measuredWidth) > 2
    // 手机浏览器收起地址栏时 innerHeight 会跳，收缩中的星标就会顿一下。
    // 宽度不变时沿用上一次高度，只在旋转或首次测量时更新。
    const compact = live.width <= 680
    const height = compact && measuredWidth && !widthChanged
      ? viewport.value.height
      : live.height

    measuredWidth = live.width
    if (widthChanged) {
      const hero = document.querySelector('.home-hero')
      heroSpan = hero?.offsetHeight || height
    }

    if (viewport.value.width === live.width && viewport.value.height === height) return
    viewport.value = { width: live.width, height }
  }

  function calculateLogoReplacementProgress() {
    if (!isHome.value) return 0

    const height = viewport.value.height || window.innerHeight
    const settleAt = height * 0.62
    const span = heroSpan || height
    const range = Math.max(span - settleAt, 1)

    return Math.min(Math.max((window.scrollY - settleAt) / range, 0), 1)
  }

  function updateScrollProgress() {
    const height = viewport.value.height || window.innerHeight
    scrollProgress.value = Math.min(
      Math.max(window.scrollY / Math.max(height * 0.62, 1), 0),
      1
    )
    logoReplacementProgress.value = calculateLogoReplacementProgress()
  }

  function updateActiveSection() {
    if (!isHome.value) {
      activeSection.value = ''
      return
    }

    const activationLine = window.innerHeight * 0.5
    const section = Array.from(document.querySelectorAll('.home-section'))
      .find((element) => {
        const bounds = element.getBoundingClientRect()
        return bounds.top <= activationLine && bounds.bottom > activationLine
      })

    activeSection.value = section?.dataset.section ?? ''
  }

  function refreshLayout() {
    if (scrollFrame) {
      window.cancelAnimationFrame(scrollFrame)
      scrollFrame = 0
    }

    updateViewport()
    updateScrollProgress()
    updateActiveSection()
  }

  function scheduleLayoutRefresh() {
    if (scrollFrame) return

    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0
      refreshLayout()
    })
  }

  function getMainLogoOpacity() {
    return 1 - calculateLogoReplacementProgress()
  }

  watch(isHome, refreshLayout, { flush: 'post' })

  onMounted(() => {
    window.addEventListener('scroll', scheduleLayoutRefresh, { passive: true })
    window.addEventListener('resize', scheduleLayoutRefresh)
    refreshLayout()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', scheduleLayoutRefresh)
    window.removeEventListener('resize', scheduleLayoutRefresh)

    if (scrollFrame) {
      window.cancelAnimationFrame(scrollFrame)
      scrollFrame = 0
    }
  })

  return {
    viewport,
    scrollProgress,
    logoReplacementProgress,
    activeSection,
    getMainLogoOpacity,
    refreshLayout
  }
}
