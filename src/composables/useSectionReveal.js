import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useSectionReveal() {
  const target = ref(null)
  const ready = ref(false)
  const revealed = ref(false)
  let observer = null

  onMounted(() => {
    const element = target.value
    if (!element) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const alreadyVisible = element.getBoundingClientRect().top < window.innerHeight * 0.85
    ready.value = true

    if (reducedMotion || alreadyVisible || !('IntersectionObserver' in window)) {
      revealed.value = true
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        revealed.value = true
        observer?.disconnect()
        observer = null
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    observer.observe(element)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
  })

  return { target, ready, revealed }
}
