import * as THREE from 'three'
import {
  createCosmicCamera,
  createCosmicRenderer,
  resizeCosmicCamera
} from './cosmicRuntime.js'
import { createLogoBloom } from './logoBloom.js'
import {
  createNavigationStarField,
  createNavigationStarUpdater
} from './navigationStars.js'

export function createNavigationStarScene(canvas, {
  getTargets = () => []
} = {}) {
  const renderer = createCosmicRenderer(canvas)

  const scene = new THREE.Scene()
  const camera = createCosmicCamera()

  const field = createNavigationStarField({ count: 3 })
  field.setIntro([1, 1, 1])
  scene.add(field.group)

  const bloom = createLogoBloom(renderer, scene, camera)
  bloom.setIntensity(1)

  const updateNavigationStars = createNavigationStarUpdater(field)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let frameId = 0
  let elapsed = 0
  let lastTime = performance.now()

  function resize() {
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight
    renderer.setSize(width, height, false)
    bloom.resize(width, height)
    resizeCosmicCamera(camera, width, height)
  }

  function render(timestamp) {
    const delta = Math.min((timestamp - lastTime) / 1000, 0.05)
    lastTime = timestamp
    elapsed += delta

    const motionEnabled = !reducedMotion.matches
    updateNavigationStars({
      targets: getTargets(),
      bounds: canvas.getBoundingClientRect(),
      camera,
      elapsed,
      reducedMotion: !motionEnabled
    })
    field.update(motionEnabled ? elapsed : 0, motionEnabled)
    bloom.render()
    frameId = window.requestAnimationFrame(render)
  }

  resize()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  frameId = window.requestAnimationFrame(render)

  return {
    destroy() {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      field.dispose()
      bloom.dispose()
      renderer.dispose()
    }
  }
}
