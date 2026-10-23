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
import {
  beginGameReturn,
  endGameReturn,
  getGameCardKey,
  readActiveGameKey,
  rememberActiveGame,
  waitForGameCarouselReady
} from '../../../src/components/games/gameCarouselState.js'
import NavigationStarCanvas from '../../../src/components/navigation/NavigationStarCanvas.vue'
import SiteHeader from '../../../src/components/navigation/SiteHeader.vue'
import SpaceBackdrop from '../../../src/components/SpaceBackdrop.vue'
import { data as homeSections } from '../data/home.data.js'
import { usePageSectionSnap } from '../../../src/composables/usePageSectionSnap.js'
import { useIntroController } from '../../../src/composables/useIntroController.js'
import { useSiteNavigation } from '../../../src/composables/useSiteNavigation.js'
import { useViewTransitionNavigation } from '../../../src/composables/useViewTransitionNavigation.js'
import { getBrandGeometry } from '../../../src/layout/brandGeometry.js'

const LogoHero = defineAsyncComponent(() => import('../../../src/components/LogoHero.vue'))

const route = useRoute()
const router = useRouter()
const { frontmatter } = useData()
const logoHeroRef = ref(null)
const heroAnchorRef = ref(null)
const wordmarkRef = ref(null)
const navigationSceneReady = ref(false)
const navigationSceneFailed = ref(false)
const routeLeaving = ref(false)
const gameReturnPending = ref(false)
const scrollProgress = ref(0)
const logoReplacementProgress = ref(0)
const activeSection = ref('')
const viewport = ref({ width: 1440, height: 900 })
let scrollFrame = 0
let previousScrollRestoration = 'auto'

function normalizeSitePath(pathname) {
  const path = String(pathname || '/').replace(/\/+$/, '')
  return `${path}/`
}

const siteHomePath = computed(() => normalizeSitePath(withBase('/')))
const isHome = computed(() => {
  const homePath = siteHomePath.value
  if (normalizeSitePath(route.path) === homePath) return true

  return (
    typeof window !== 'undefined' &&
    normalizeSitePath(window.location.pathname) === homePath
  )
})
const isGamePage = computed(() => frontmatter.value?.type === 'game')
const {
  introLocked,
  sceneFailed,
  enterHome: enterHomeIntro,
  leaveHome: leaveHomeIntro,
  updateSceneFrame,
  handleSceneReady,
  handleSceneError
} = useIntroController({
  isHome,
  logoHeroRef
})

watch(isGamePage, (gamePage) => {
  if (gamePage && typeof window !== 'undefined') {
    rememberActiveGame(getGameCardKey({ url: route.path }))
  }
}, { immediate: true })

const { scrollToSection } = usePageSectionSnap({ enabled: isHome })
const {
  navigate: navigateWithTransition,
  transitionExistingNavigation
} = useViewTransitionNavigation()

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

const brandGeometry = computed(() => getBrandGeometry({
  viewport: viewport.value,
  scrollProgress: scrollProgress.value,
  isHome: isHome.value
}))
const heroAnchorStyle = computed(() => brandGeometry.value.heroAnchorStyle)
const wordmarkStyle = computed(() => brandGeometry.value.wordmarkStyle)
const brandHomeStyle = computed(() => brandGeometry.value.brandHomeStyle)
const brandReady = computed(() => brandGeometry.value.brandReady)

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

function scrollToCurrentHomeSection() {
  const hash = route.hash?.slice(1)
  let target = null

  if (hash) {
    try {
      target = document.getElementById(decodeURIComponent(hash))
    } catch {
      target = document.getElementById(hash)
    }
  }

  window.scrollTo({
    top: target?.offsetTop ?? 0,
    behavior: 'auto'
  })
}

function waitForHomeRoute() {
  if (isHome.value) return nextTick()

  return new Promise((resolve) => {
    let settled = false
    let timeout = 0
    let stop = null

    const finish = async () => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      stop?.()
      await nextTick()
      resolve()
    }

    stop = watch(isHome, (home) => {
      if (home) finish()
    }, { flush: 'post' })
    timeout = window.setTimeout(finish, 800)
  })
}

function handleBrowserBack() {
  if (gameReturnPending.value) return
  if (normalizeSitePath(window.location.pathname) !== siteHomePath.value) {
    return
  }
  if (!document.querySelector('.game-article-hero')) return

  const gameKey = readActiveGameKey()
  if (!gameKey) return

  gameReturnPending.value = true
  beginGameReturn(gameKey)
  transitionExistingNavigation({
    waitFor: async () => {
      await waitForHomeRoute()
      await waitForGameCarouselReady()
    },
    onFinished: () => {
      endGameReturn()
      gameReturnPending.value = false
    }
  }).finally(() => {
    if (!gameReturnPending.value) return
    endGameReturn()
    gameReturnPending.value = false
  })
}

async function handleGameCatalogReturn() {
  if (gameReturnPending.value) return
  gameReturnPending.value = true
  beginGameReturn(getGameCardKey({ url: route.path }))

  try {
    await navigateWithTransition(withBase('/#games'), {
      afterRouteChange: waitForGameCarouselReady,
      onFinished: endGameReturn
    })
  } finally {
    gameReturnPending.value = false
  }
}

async function handleSectionNavigation(event, item) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return
  }

  if (!isHome.value && isGamePage.value && item.id === 'games') {
    event.preventDefault()
    event.stopPropagation()
    await handleGameCatalogReturn()
    return
  }

  if (!isHome.value) return

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

function handleNavigationSceneReady() {
  navigationSceneReady.value = true
  navigationSceneFailed.value = false
}

function handleNavigationSceneError() {
  navigationSceneReady.value = false
  navigationSceneFailed.value = true
}

watch(isHome, async (home) => {
  navigationSceneReady.value = false
  navigationSceneFailed.value = false

  if (!home) {
    leaveHomeIntro()
    return
  }

  scrollToCurrentHomeSection()
  await enterHomeIntro()
}, { flush: 'post' })

onMounted(async () => {
  previousScrollRestoration = window.history.scrollRestoration
  window.history.scrollRestoration = 'manual'
  window.addEventListener('popstate', handleBrowserBack)
  window.addEventListener('scroll', scheduleViewportUpdate, { passive: true })
  window.addEventListener('resize', scheduleViewportUpdate)
  updateViewport()
  updateScrollState()
  updateActiveSection()
  if (isHome.value) scrollToCurrentHomeSection()

  if (isHome.value) {
    await enterHomeIntro()
    return
  }

  leaveHomeIntro()
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handleBrowserBack)
  window.removeEventListener('scroll', scheduleViewportUpdate)
  window.removeEventListener('resize', scheduleViewportUpdate)
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
  window.history.scrollRestoration = previousScrollRestoration
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
      heading-id="home-title"
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
      <div v-if="isGamePage" class="game-article-body">
        <Content />
      </div>
      <Content v-else />
    </main>

    <div v-if="isHome && introLocked" class="intro-input-lock" aria-hidden="true" />
  </div>
</template>
