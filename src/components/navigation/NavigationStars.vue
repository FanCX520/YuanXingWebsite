<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import {
  NAVIGATION_BREATH_SPEED,
  NAVIGATION_ROTATION_SPEED,
  createNavigationStarField
} from '../../three/navigationStars.js'

const emit = defineEmits(['scene-ready', 'scene-error'])
const canvasRef = ref(null)
let renderer = null
let scene = null
let camera = null
let field = null
let frameId = 0
let resizeObserver = null
let elapsed = 0
let lastTime = 0
let targets = []
let reducedMotion = null

function collectTargets() {
  const brandStar = document.querySelector('.brand-home__star')
  const links = Array.from(document.querySelectorAll('.star-navigation__link'))

  targets = [
    ...(brandStar ? [{ element: brandStar, size: 34 }] : []),
    ...links.map((element) => ({ element, size: null }))
  ]
}

function resize() {
  if (!renderer || !camera || !canvasRef.value) return

  const width = canvasRef.value.clientWidth || window.innerWidth
  const height = canvasRef.value.clientHeight || window.innerHeight
  renderer.setSize(width, height, false)

  const aspect = width / Math.max(height, 1)
  const halfHeight = 1.35 / Math.min(aspect, 1)
  camera.left = -halfHeight * aspect
  camera.right = halfHeight * aspect
  camera.top = halfHeight
  camera.bottom = -halfHeight
  camera.updateProjectionMatrix()
}

function updateTargets() {
  if (!field || !canvasRef.value || !camera) return

  const bounds = canvasRef.value.getBoundingClientRect()
  if (!bounds.width || !bounds.height) return

  const worldWidth = camera.right - camera.left
  const worldHeight = camera.top - camera.bottom
  const position = new THREE.Vector3()
  const rotation = new THREE.Quaternion()
  const scale = new THREE.Vector3()
  const euler = new THREE.Euler()

  targets.forEach(({ element, size }, index) => {
    if (!element?.isConnected) return

    const rect = element.getBoundingClientRect()
    const variant = field.variants[index % field.variants.length]
    const x = rect.left + rect.width / 2 - bounds.left
    const y = rect.top + rect.height / 2 - bounds.top
    const navBreath = reducedMotion.matches
      ? 0
      : Math.sin(elapsed * NAVIGATION_BREATH_SPEED + variant.phase)
    const rotationZ = reducedMotion.matches
      ? variant.phase
      : elapsed * NAVIGATION_ROTATION_SPEED + variant.phase

    position.set(
      camera.left + (x / bounds.width) * worldWidth,
      camera.top - (y / bounds.height) * worldHeight,
      0.68 + variant.depth
    )
    euler.set(
      reducedMotion.matches ? 0 : variant.tiltX,
      reducedMotion.matches ? 0 : variant.tiltY,
      rotationZ
    )
    rotation.setFromEuler(euler)

    const pixelSize = size ?? Math.max(Math.min(rect.width, rect.height), 28)
    const worldSize = (pixelSize / bounds.width) * worldWidth * 0.52
    const scaleBreath = reducedMotion.matches ? 1 : 1 + navBreath * 0.06
    scale.setScalar(worldSize * variant.scale * scaleBreath)

    field.setTransform(index, position, rotation, scale, euler.z)
  })

  field.commit()
}

function render(timestamp) {
  const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0
  lastTime = timestamp

  if (!reducedMotion.matches) elapsed += delta

  updateTargets()
  field.update(reducedMotion.matches ? 0 : elapsed, !reducedMotion.matches)
  renderer.render(scene, camera)
  frameId = window.requestAnimationFrame(render)
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  try {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.setClearColor(0x000000, 0)

    scene = new THREE.Scene()
    camera = new THREE.OrthographicCamera(-1.35, 1.35, 1.35, -1.35, 0.1, 50)
    camera.position.set(0, 0, 5)
    camera.lookAt(0, 0, 0)

    collectTargets()
    field = createNavigationStarField({ count: Math.max(targets.length, 1) })
    field.setIntro(targets.map(() => 1))
    scene.add(field.group)

    resize()
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    frameId = window.requestAnimationFrame(render)
    emit('scene-ready')
  } catch (error) {
    emit('scene-error', error)
  }
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(frameId)
  resizeObserver?.disconnect()
  field?.dispose()
  renderer?.dispose()
  field = null
  renderer = null
  scene = null
  camera = null
  targets = []
})
</script>

<template>
  <canvas ref="canvasRef" class="navigation-stars-canvas" aria-hidden="true" />
</template>

<style scoped>
.navigation-stars-canvas {
  position: fixed;
  z-index: 31;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
