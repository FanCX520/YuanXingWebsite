const ACTIVE_GAME_KEY = 'yuanxing:active-game'

export function getGameCardKey(game) {
  return game?.url || game?.id || game?.title || ''
}

export function readActiveGameKey() {
  try {
    return window.sessionStorage.getItem(ACTIVE_GAME_KEY) || ''
  } catch {
    return ''
  }
}

export function rememberActiveGame(gameKey) {
  if (!gameKey) return

  try {
    window.sessionStorage.setItem(ACTIVE_GAME_KEY, gameKey)
  } catch {
    // 存储不可用时保持当前会话行为
  }
}
