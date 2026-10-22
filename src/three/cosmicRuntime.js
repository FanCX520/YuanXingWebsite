import * as THREE from 'three'

export const COSMIC_FRUSTUM_SIZE = 1.35

export function createCosmicRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.setClearColor(0x000000, 0)
  return renderer
}

export function createCosmicCamera() {
  const camera = new THREE.OrthographicCamera(
    -COSMIC_FRUSTUM_SIZE,
    COSMIC_FRUSTUM_SIZE,
    COSMIC_FRUSTUM_SIZE,
    -COSMIC_FRUSTUM_SIZE,
    0.1,
    50
  )
  camera.position.set(0, 0, 5)
  camera.up.set(0, 1, 0)
  camera.lookAt(0, 0, 0)
  return camera
}

export function resizeCosmicCamera(camera, width, height) {
  const aspect = width / Math.max(height, 1)
  const halfHeight = COSMIC_FRUSTUM_SIZE / Math.min(aspect, 1)
  camera.left = -halfHeight * aspect
  camera.right = halfHeight * aspect
  camera.top = halfHeight
  camera.bottom = -halfHeight
  camera.updateProjectionMatrix()
}
