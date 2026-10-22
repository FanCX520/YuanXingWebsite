<script setup>
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'
import { useData, useRoute, useRouter, withBase } from 'vitepress'
// 直接引用 Content，避免 data loader 与 VitePress 公共入口形成循环 chunk。
import { Content } from 'vitepress/dist/client/app/components/Content.js'
import BrandWordmark from '../../../src/components/BrandWordmark.vue'
import GameArticleHero from '../../../src/components/games/GameArticleHero.vue'
import NavigationStarCanvas from '../../../src/components/navigation/NavigationStarCanvas.vue'
import SiteHeader from '../../../src/components/navigation/SiteHeader.vue'
import SpaceBackdrop from '../../../src/components/SpaceBackdrop.vue'
import { data as homeSections } from '../data/home.data.js'
import { usePageSectionSnap } from '../../../src/composables/usePageSectionSnap.js'
import { useSiteNavigation } from '../../../src/composables/useSiteNavigation.js'

const LogoHero = defineAsyncComponent(() => import('../../../src/components/LogoHero.vue'))

const route = useRoute()
const router = useRouter()
const { frontmatter } = useData()
const logoHeroRef = ref(null)
const heroAnchorRef = ref(null)
const wordmarkRef = ref(null)
const sceneFailed = ref(false)
const navigationSceneReady = ref(false)
const navigationSceneFailed = ref(false)
const introLocked = ref(false)
const routeLeaving = ref(false)
const scrollProgress = ref(0)
const logoReplacementProgress = ref(0)
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
const isGamePage = computed(() => frontmatter.value?.type === 'game')

if (isHome.value) introLocked.value = true

const { scrollToSection } = usePageSectionSnap({ enabled: isHome })

const brandProgress = computed(() => {
  if (!isHome.value) return 1

  const progress = scrollProgress.value
  return progress * progress * (3 - 2 * progress)
})
const {
  items: navigationTargets,
  glassVisible: navigationGlassVisible
} = useSiteNavigation({
  sections: homeSections,
  viewport,
  scrollProgress,
  isHome,
  activeSection
})

const navigationFallback = computed(() => {
  if (isHome.value) return sceneFailed.value
  return !navigationSceneReady.value || navigationSceneFailed.value
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
    height: `${layout.logoSize + padding * 2}px`,
    '--brand-logo-size': `${layout.logoSize}px`,
    '--brand-padding': `${padding}px`
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
  logoReplacementProgress.value = calculateLogoReplacementProgress()
}

function calculateLogoReplacementProgress() {
  if (typeof window === 'undefined' || !isHome.value) return 0

  const settleAt = window.innerHeight * 0.62
  const hero = document.querySelector('.home-hero')
  const sectionTop = hero
    ? hero.getBoundingClientRect().bottom + window.scrollY
    : window.innerHeight
  const range = Math.max(sectionTop - settleAt, 1)

  return Math.min(Math.max((window.scrollY - settleAt) / range, 0), 1)
}

function getMainLogoOpacity() {
  return 1 - calculateLogoReplacementProgress()
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

function handleSectionNavigation(event, item) {
  if (
    !isHome.value ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return
  }

  const target = document.getElementById(item.id)
  if (!target) return

  event.preventDefault()
  event.stopPropagation()
  scrollToSection(target, item.href)
}

async function handleHomeNavigation(event) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return
  }

  if (isHome.value) {
    const hero = document.querySelector('.home-hero')
    if (!hero) return

    event.preventDefault()
    event.stopPropagation()
    scrollToSection(hero, withBase('/'))
    return
  }

  event.preventDefault()
  event.stopPropagation()
  if (routeLeaving.value) return

  routeLeaving.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 180))

  try {
    await router.go(withBase('/'))
  } finally {
    window.setTimeout(() => {
      routeLeaving.value = false
    }, 0)
  }
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

function setIntroLock(locked) {
  introLocked.value = locked
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('intro-locked', locked)
}

function applyStaticPageVisuals() {
  document.documentElement.style.setProperty('--intro-backdrop', '1')
}

function resetHomeScene() {
  introHandle?.dispose()
  introHandle = null
  sceneReady = false
  sceneFailed.value = false
}

function finishIntro() {
  setIntroLock(false)
}

function updateSceneFrame() {
  introModule?.updateIntroEngine()
}

function startIntroIfReady() {
  if (!isHome.value || !introModule || introHandle) return
  if (!sceneReady && !sceneFailed.value) return

  introHandle = introModule.initIntro({
    scene: sceneReady ? logoHeroRef.value?.getScene?.() ?? null : null,
    onComplete: finishIntro
  })
}

function handleSceneReady() {
  sceneReady = true
  sceneFailed.value = false
  startIntroIfReady()
}

function handleSceneError() {
  sceneReady = false
  sceneFailed.value = true
  startIntroIfReady()
}

function handleNavigationSceneReady() {
  navigationSceneReady.value = true
  navigationSceneFailed.value = false
}

function handleNavigationSceneError() {
  navigationSceneReady.value = false
  navigationSceneFailed.value = true
}

watch(isHome, async (home) => {
  resetHomeScene()
  navigationSceneReady.value = false
  navigationSceneFailed.value = false

  if (!home) {
    setIntroLock(false)
    applyStaticPageVisuals()
    return
  }

  setIntroLock(true)
  window.scrollTo({ top: 0, behavior: 'auto' })
  await nextTick()
  if (!isHome.value) return

  if (!introModule) {
    introModule = await import('../../../src/intro/intro.js')
  }
  introModule.applyIntroFallback()
  startIntroIfReady()
})

onMounted(async () => {
  window.addEventListener('scroll', scheduleViewportUpdate, { passive: true })
  window.addEventListener('resize', scheduleViewportUpdate)
  updateViewport()
  updateScrollState()
  updateActiveSection()
  setIntroLock(isHome.value)
  if (isHome.value) window.scrollTo({ top: 0, behavior: 'auto' })

  if (isHome.value) {
    introModule = await import('../../../src/intro/intro.js')
    introModule.applyIntroFallback()
    startIntroIfReady()
    return
  }

  applyStaticPageVisuals()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleViewportUpdate)
  window.removeEventListener('resize', scheduleViewportUpdate)
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
  introHandle?.dispose()
  introHandle = null
  setIntroLock(false)
})
</script>

<template>
  <div
    class="site-shell"
    :class="{
      'site-shell--home': isHome,
      'site-shell--route-leaving': routeLeaving
    }"
  >
    <SpaceBackdrop />

    <SiteHeader
      :items="navigationTargets"
      :home="isHome"
      :brand-ready="brandReady"
      :brand-style="brandHomeStyle"
      :brand-href="withBase('/')"
      :brand-mark-src="withBase('/images/brand/logo-mark.png')"
      :wordmark-style="wordmarkStyle"
      :glass-visible="navigationGlassVisible"
      :locked="introLocked"
      :show-fallback="navigationFallback"
      @brand-select="handleHomeNavigation"
      @item-select="handleSectionNavigation"
    />

    <NavigationStarCanvas
      v-if="!isHome"
      :items="navigationTargets"
      @scene-ready="handleNavigationSceneReady"
      @scene-error="handleNavigationSceneError"
    />

    <BrandWordmark
      v-if="isHome"
      ref="wordmarkRef"
      :travel-style="wordmarkStyle"
    />

    <main v-if="isHome" class="home-page" :style="{ '--scroll-progress': scrollProgress }">
      <section class="home-hero" aria-labelledby="home-title">
        <div ref="heroAnchorRef" class="hero-logo-anchor" :style="heroAnchorStyle" />
        <img
          class="hero-logo-replacement"
          :src="withBase('/images/brand/logo-mark.png')"
          :style="[heroAnchorStyle, { opacity: logoReplacementProgress }]"
          alt=""
          aria-hidden="true"
          decoding="async"
        />
        <LogoHero
          ref="logoHeroRef"
          class="home-hero__scene"
          :on-frame="updateSceneFrame"
          :get-logo-target="getLogoTarget"
          :get-main-logo-opacity="getMainLogoOpacity"
          :get-navigation-targets="getNavigationTargets"
          @light-update="updateWordmarkLight"
          @scene-ready="handleSceneReady"
          @scene-error="handleSceneError"
        />
      </section>
      <div class="page-content" :inert="introLocked ? '' : null">
        <Content />
      </div>
    </main>

    <main
      v-else
      class="page-content page-content--article"
      :class="{ 'page-content--game': isGamePage }"
    >
      <GameArticleHero
        v-if="isGamePage"
        :frontmatter="frontmatter"
      />
      <Content />
    </main>

    <div v-if="isHome && introLocked" class="intro-input-lock" aria-hidden="true" />
  </div>
</template>
