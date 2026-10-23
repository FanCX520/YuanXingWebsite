import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'
import { useRouter, withBase } from 'vitepress'
import {
  beginGameReturn,
  endGameReturn,
  getGameCardKey,
  readActiveGameKey,
  rememberActiveGame,
  waitForGameCarouselReady
} from '../components/games/gameCarouselState.js'
import { useViewTransitionNavigation } from './useViewTransitionNavigation.js'

export function useSiteRouteTransitions({
  route,
  isHome,
  isGamePage,
  siteHomePath,
  scrollToSection
}) {
  const routeLeaving = ref(false)
  const gameReturnPending = ref(false)
  const router = useRouter()
  const {
    navigate: navigateWithTransition,
    transitionExistingNavigation
  } = useViewTransitionNavigation()
  let previousScrollRestoration = 'auto'

  function normalizeSitePath(pathname) {
    const path = String(pathname || '/').replace(/\/+$/, '')
    return `${path}/`
  }

  watch(isGamePage, (gamePage) => {
    if (gamePage && typeof window !== 'undefined') {
      rememberActiveGame(getGameCardKey({ url: route.path }))
    }
  }, { immediate: true })

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
    if (
      normalizeSitePath(window.location.pathname) !==
      normalizeSitePath(siteHomePath.value)
    ) {
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

  async function leaveHomeTo(href) {
    if (routeLeaving.value) return

    routeLeaving.value = true
    await new Promise((resolve) => window.setTimeout(resolve, 180))

    try {
      await router.go(href)
    } finally {
      window.setTimeout(() => {
        routeLeaving.value = false
      }, 0)
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

    if (!isHome.value) {
      event.preventDefault()
      event.stopPropagation()
      await leaveHomeTo(item.href)
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
    await leaveHomeTo(withBase('/'))
  }

  onMounted(() => {
    previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    window.addEventListener('popstate', handleBrowserBack)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('popstate', handleBrowserBack)
    window.history.scrollRestoration = previousScrollRestoration
  })

  return {
    routeLeaving,
    scrollToCurrentHomeSection,
    handleSectionNavigation,
    handleHomeNavigation
  }
}
