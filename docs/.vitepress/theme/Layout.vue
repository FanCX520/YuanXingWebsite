<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, withBase } from 'vitepress'
// 直接引用 Content，避免 data loader 与 VitePress 公共入口形成循环 chunk。
import { Content } from 'vitepress/dist/client/app/components/Content.js'
import BrandWordmark from '../../../src/components/BrandWordmark.vue'
import SpaceBackdrop from '../../../src/components/SpaceBackdrop.vue'
import { data as homeSections } from '../data/home.data.js'

const LogoHero = defineAsyncComponent(() => import('../../../src/components/LogoHero.vue'))

const route = useRoute()
const logoHeroRef = ref(null)
const heroAnchorRef = ref(null)
const wordmarkRef = ref(null)
const sceneFailed = ref(false)
const scrollProgress = ref(0)
const activeSection = ref('')
const viewport = ref({ width: 1440, height: 900 })
let introModule = null
let introHandle = null
let scrollFrame = 0
let sceneReady = false

const isHome = computed(() => {
  if (route.path === '/') return true
  return typeof window !== 'undefined' && window.location.pathname === '/'
})
const brandProgress = computed(() => {
  const progress = scrollProgress.value
  return progress * progress * (3 - 2 * progress)
})
const sectionPositions = {
  about: { desktop: { x: 0.14, y: 0.36 }, mobile: { x: 0.13, y: 0.54 } },
  games: { desktop: { x: 0.84, y: 0.39 }, mobile: { x: 0.87, y: 0.54 } },
  links: { desktop: { x: 0.2, y: 0.76 }, mobile: { x: 0.5, y: 0.79 } }
}

const sections = [...(homeSections || [])]
  .filter((section) => sectionPositions[section.id])
  .sort((a, b) => (a.meta.order ?? 999) - (b.meta.order ?? 999))
  .map((section) => ({
    id: section.id,
    label: section.meta.navLabel || section.meta.title || section.id,
    scattered: sectionPositions[section.id]
  }))

const navigationTargets = computed(() => {
  const { width, height } = viewport.value
  const progress = isHome.value ? scrollProgress.value : 1
  const easedProgress = progress * progress * (3 - 2 * progress)
  const mobile = width <= 680

  return sections.map((section, index) => {
    const scattered = mobile ? section.scattered.mobile : section.scattered.desktop
    const settled = mobile
      ? { x: (index + 0.5) / sections.length, y: 0.91 }
      : { x: (width - 388 + index * 124) / width, y: 0.06 }
    const x = lerp(scattered.x, settled.x, easedProgress)
    const y = lerp(scattered.y, settled.y, easedProgress)

    return {
      id: section.id,
      label: section.label,
      href: withBase(`/#${section.id}`),
      active: isHome.value && activeSection.value === section.id,
      x,
      y,
      style: {
        left: `${x * width}px`,
        top: `${y * height}px`
      }
    }
  })
})

const brandLayout = computed(() => {
  const { width } = viewport.value
  const compact = width <= 680
  const insetX = compact ? 18 : 34
  const insetY = compact ? 16 : 26
  const logoSize = compact ? 30 : 38
  const gap = compact ? 7 : 9

  return {
    insetX,
    insetY,
    logoSize,
    logoCenterX: insetX + logoSize / 2,
    logoCenterY: insetY + logoSize / 2,
    wordmarkLeft: insetX + logoSize + gap,
    wordmarkFontSize: compact ? 13 : 14
  }
})

const heroAnchorStyle = computed(() => {
  const { width, height } = viewport.value
  const layout = brandLayout.value
  const progress = brandProgress.value
  const startSize = Math.min(width * 0.68, 620, height * 0.72)
  const size = lerp(startSize, layout.logoSize, progress)

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${lerp(width / 2, layout.logoCenterX, progress)}px`,
    top: `${lerp(height / 2, layout.logoCenterY, progress)}px`
  }
})

const wordmarkStyle = computed(() => {
  const { width, height } = viewport.value
  const layout = brandLayout.value
  const progress = brandProgress.value
  const startSize = Math.min(width * 0.68, 620, height * 0.72)
  const startFontSize = startSize * 0.195
  const startTop = height / 2 + startSize * 0.425 + 20

  return {
    left: `${lerp(width / 2, layout.wordmarkLeft, progress)}px`,
    top: `${lerp(startTop, layout.logoCenterY, progress)}px`,
    fontSize: `${lerp(startFontSize, layout.wordmarkFontSize, progress)}px`,
    transform: `translate(${lerp(-50, 0, progress)}%, ${lerp(-56, -50, progress)}%)`
  }
})

const brandReady = computed(() => isHome.value && brandProgress.value > 0.96)

const brandHomeStyle = computed(() => {
  const layout = brandLayout.value
  const padding = 8
  const wordmarkWidth = layout.wordmarkFontSize * 4.9

  return {
    left: `${layout.insetX - padding}px`,
    top: `${layout.insetY - padding}px`,
    width: `${layout.wordmarkLeft - layout.insetX + wordmarkWidth + padding * 2}px`,
    height: `${layout.logoSize + padding * 2}px`
  }
})

function lerp(from, to, progress) {
  return from + (to - from) * progress
}

function updateViewport() {
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
}

function updateScrollState() {
  scrollProgress.value = Math.min(
    Math.max(window.scrollY / Math.max(window.innerHeight * 0.62, 1), 0),
    1
  )
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

function scheduleViewportUpdate() {
  if (scrollFrame) return
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = 0
    updateViewport()
    updateScrollState()
    updateActiveSection()
  })
}

function getNavigationTargets() {
  return navigationTargets.value
}

function updateWordmarkLight({ x, y, visible }) {
  wordmarkRef.value?.updateLight({ x, y, visible }, heroAnchorRef.value)
}

function getLogoTarget() {
  return heroAnchorRef.value
}

function updateSceneFrame() {
  introModule?.updateIntroEngine()
}

function startIntroIfReady() {
  if (!introModule || !sceneReady || introHandle) return
  introHandle = introModule.initIntro({ scene: logoHeroRef.value?.getScene?.() ?? null })
}

function handleSceneReady() {
  sceneReady = true
  sceneFailed.value = false
  startIntroIfReady()
}

onMounted(async () => {
  window.addEventListener('scroll', scheduleViewportUpdate, { passive: true })
  window.addEventListener('resize', scheduleViewportUpdate)
  updateViewport()
  updateScrollState()
  updateActiveSection()

  introModule = await import('../../../src/intro/intro.js')
  introModule.applyIntroFallback()
  startIntroIfReady()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleViewportUpdate)
  window.removeEventListener('resize', scheduleViewportUpdate)
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
  introHandle?.dispose()
})
</script>

<template>
  <div class="site-shell" :class="{ 'site-shell--home': isHome }">
    <SpaceBackdrop />

    <a
      v-if="isHome"
      class="brand-home"
      :class="{ 'brand-home--ready': brandReady }"
      :style="brandHomeStyle"
      :href="withBase('/')"
      :tabindex="brandReady ? 0 : -1"
      :aria-hidden="!brandReady"
      aria-label="返回元星联邦首页"
    />
    <a
      v-else
      class="brand-home brand-home--static"
      :href="withBase('/')"
      aria-label="返回元星联邦首页"
    >
      <span class="brand-home__star" aria-hidden="true">✦</span>
      <span>元星联邦</span>
    </a>

    <nav class="star-navigation" aria-label="首页章节导航">
      <a
        v-for="(item, index) in navigationTargets"
        :key="item.id"
        class="star-navigation__link"
        :class="{ 'is-active': item.active }"
        :href="item.href"
        :style="item.style"
        :data-section-link="item.id"
        :aria-current="item.active ? 'location' : undefined"
      >
        <span v-if="!isHome || sceneFailed" class="star-navigation__fallback" aria-hidden="true">✦</span>
        <span class="star-navigation__label">{{ item.label }}</span>
      </a>
    </nav>

    <main v-if="isHome" class="home-page" :style="{ '--scroll-progress': scrollProgress }">
      <section class="home-hero" aria-labelledby="home-title">
        <div ref="heroAnchorRef" class="hero-logo-anchor" :style="heroAnchorStyle" />
        <LogoHero
          ref="logoHeroRef"
          class="home-hero__scene"
          :on-frame="updateSceneFrame"
          :get-logo-target="getLogoTarget"
          :get-navigation-targets="getNavigationTargets"
          @light-update="updateWordmarkLight"
          @scene-ready="handleSceneReady"
          @scene-error="sceneFailed = true"
        />
        <BrandWordmark ref="wordmarkRef" :travel-style="wordmarkStyle" />
      </section>
      <div class="page-content">
        <Content />
      </div>
    </main>

    <main v-else class="page-content page-content--article">
      <Content />
    </main>
  </div>
</template>
