import { onBeforeUnmount, onMounted, watch } from 'vue'

const SNAP_RATIO = 0.32
const IDLE_DELAY = 140
const SNAP_MIN_DURATION = 240
const SNAP_MAX_DURATION = 520
const SNAP_DURATION_PER_PIXEL = 0.5
const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' '
])

function getDocumentTop(element) {
  const top = element.getBoundingClientRect().top + window.scrollY
  const transform = window.getComputedStyle(element).transform
  if (transform === 'none' || !window.DOMMatrixReadOnly) return top

  return top - new window.DOMMatrixReadOnly(transform).m42
}

export function usePageSectionSnap({ enabled }) {
  let idleTimer = 0
  let snapFrame = 0
  let snapToken = 0
  let stopEnabledWatch = null
  let isSnapping = false

  function canSnap() {
    return (
      enabled.value &&
      window.innerWidth > 680 &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  }

  function clearIdleTimer() {
    window.clearTimeout(idleTimer)
    idleTimer = 0
  }

  function finishSnap() {
    if (snapFrame) {
      window.cancelAnimationFrame(snapFrame)
      snapFrame = 0
    }

    snapToken += 1
    isSnapping = false
  }

  function cancelSnap() {
    clearIdleTimer()
    if (!isSnapping) return

    finishSnap()
  }

  function getSnapTargets() {
    return Array.from(document.querySelectorAll('.home-hero, .home-section'))
      .map((element) => getDocumentTop(element))
      .sort((a, b) => a - b)
  }

  function alignNearestSection() {
    idleTimer = 0
    if (!canSnap() || isSnapping) return

    const targets = getSnapTargets()
    if (!targets.length) return

    const current = window.scrollY
    const nearest = targets.reduce((best, target) =>
      Math.abs(target - current) < Math.abs(best - current) ? target : best
    )
    const threshold = Math.min(
      Math.max(window.innerHeight * SNAP_RATIO, 160),
      320
    )

    if (Math.abs(nearest - current) <= 1) return
    if (Math.abs(nearest - current) > threshold) return

    startSnap(nearest)
  }

  function startSnap(target) {
    finishSnap()

    const start = window.scrollY
    const distance = target - start
    const duration = Math.min(
      Math.max(Math.abs(distance) * SNAP_DURATION_PER_PIXEL, SNAP_MIN_DURATION),
      SNAP_MAX_DURATION
    )
    const startedAt = window.performance.now()
    const token = ++snapToken

    isSnapping = true

    const step = (timestamp) => {
      if (!isSnapping || token !== snapToken) return

      const progress = Math.min((timestamp - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      window.scrollTo({ top: start + distance * eased, behavior: 'auto' })

      if (progress < 1) {
        snapFrame = window.requestAnimationFrame(step)
        return
      }

      snapFrame = 0
      isSnapping = false
    }

    snapFrame = window.requestAnimationFrame(step)
  }

  function handleScroll() {
    if (!canSnap() || isSnapping) return
    clearIdleTimer()
    idleTimer = window.setTimeout(alignNearestSection, IDLE_DELAY)
  }

  function handleScrollEnd() {
    if (!enabled.value) return

    if (isSnapping) return

    clearIdleTimer()
    alignNearestSection()
  }

  function handleInput() {
    cancelSnap()
  }

  function handleKeydown(event) {
    if (SCROLL_KEYS.has(event.key)) cancelSnap()
  }

  function handleResize() {
    cancelSnap()
    clearIdleTimer()
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('scrollend', handleScrollEnd, { passive: true })
    window.addEventListener('wheel', handleInput, { passive: true })
    window.addEventListener('touchstart', handleInput, { passive: true })
    window.addEventListener('pointerdown', handleInput, { passive: true })
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('resize', handleResize)

    stopEnabledWatch = watch(enabled, (active) => {
      if (active) return
      cancelSnap()
      clearIdleTimer()
    })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('scrollend', handleScrollEnd)
    window.removeEventListener('wheel', handleInput)
    window.removeEventListener('touchstart', handleInput)
    window.removeEventListener('pointerdown', handleInput)
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('resize', handleResize)
    stopEnabledWatch?.()
    stopEnabledWatch = null
    finishSnap()
    clearIdleTimer()
  })
}
