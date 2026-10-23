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
import { getDocumentTop } from './usePageSectionSnap.js'
import { useViewTransitionNavigation } from './useViewTransitionNavigation.js'

export function useSiteRouteTransitions({
  route,
  isHome,
  isGamePage,
  siteHomePath,
  scrollToSection,
  scrollOffset = 0,
  refreshHomeScrollState = () => {}
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

  function getAnchorId(anchor) {
    const source = anchor ?? window.location.hash
    return String(source).replace(/^#/, '')
  }

  function findAnchorTarget(anchorId) {
    try {
      return document.getElementById(decodeURIComponent(anchorId))
    } catch {
      return document.getElementById(anchorId)
    }
  }

  function applyHomeAnchor(anchor) {
    if (!isHome.value) return false

    const anchorId = getAnchorId(anchor)
    if (!anchorId) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      refreshHomeScrollState()
      return true
    }

    const target = findAnchorTarget(anchorId)
    if (!target) return false

    const paddingTop = Number.parseFloat(
      window.getComputedStyle(target).paddingTop
    ) || 0

    window.scrollTo({
      top: getDocumentTop(target) - scrollOffset + paddingTop,
      behavior: 'auto'
    })
    refreshHomeScrollState()
    return true
  }

  function waitForHomeAnchor(anchorId) {
    return new Promise((resolve) => {
      let observer = null
      let timeout = 0

      const finish = (target) => {
        observer?.disconnect()
        window.clearTimeout(timeout)
        resolve(target)
      }

      const target = findAnchorTarget(anchorId)
      if (target) {
        finish(target)
        return
      }

      observer = new MutationObserver(() => {
        const nextTarget = findAnchorTarget(anchorId)
        if (nextTarget) finish(nextTarget)
      })
      observer.observe(document.body, { childList: true, subtree: true })
      timeout = window.setTimeout(() => finish(null), 800)
    })
  }

  async function restoreHomeAnchor(anchor) {
    if (!isHome.value) return false

    const anchorId = getAnchorId(anchor)
    if (!anchorId) return applyHomeAnchor()
    if (!findAnchorTarget(anchorId)) {
      await waitForHomeAnchor(anchorId)
    }

    return applyHomeAnchor(`#${anchorId}`)
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
        afterRouteChange: async () => {
          await restoreHomeAnchor('games')
          await waitForGameCarouselReady()
          await restoreHomeAnchor('games')
          await nextTick()
        },
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
      await nextTick()
      await restoreHomeAnchor()
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
    restoreHomeAnchor,
    handleSectionNavigation,
    handleHomeNavigation
  }
}
