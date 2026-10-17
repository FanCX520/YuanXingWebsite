import * as THREE from 'three'
import { createGalaxyMaterial } from './galaxyMaterial.js'
import {
  createOrbitTubeGeometry,
  createPointedArcShape,
  createSparkle3DGeometry,
  createSparkleShape,
  createSpikeShape,
  extrudeShape
} from './emblemGeometry.js'

const COLORS = {
  background: 0x070b18,
  frameBlue: 0x4f86f0,
  emblemDark: 0x121f3a,
  emblemEmissive: 0x1a3a7a,
  dust: 0x7ec8ff
}

function buildOuterFrame() {
  const group = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({
    color: COLORS.frameBlue,
    metalness: 0.32,
    roughness: 0.42,
    emissive: new THREE.Color(0x1d4fd8),
    emissiveIntensity: 0.16
  })

  const innerRadius = 1.02
  const outerRadius = 1.14
  const gap = 0.28
  const arcSpan = Math.PI / 2 - gap

  for (let i = 0; i < 4; i += 1) {
    const center = i * (Math.PI / 2)
    const start = center - arcSpan / 2
    const end = center + arcSpan / 2
    const shape = createPointedArcShape(innerRadius, outerRadius, start, end, 0.16)
    const mesh = new THREE.Mesh(extrudeShape(shape, 0.07, 0.01), material)
    mesh.position.z = 0.02
    group.add(mesh)
  }

  const spikeShape = createSpikeShape(0.58, 0.075, 0.16)
  const spikeGeometry = extrudeShape(spikeShape, 0.06, 0.008)
  for (let i = 0; i < 4; i += 1) {
    const angle = Math.PI / 4 + i * (Math.PI / 2)
    const mesh = new THREE.Mesh(spikeGeometry, material)
    mesh.position.set(Math.cos(angle) * 1.1, Math.sin(angle) * 1.1, 0.02)
    mesh.rotation.z = angle - Math.PI / 2
    group.add(mesh)
  }

  return group
}

function buildDarkEmblem() {
  const group = new THREE.Group()

  // 星体：金属感 + 淡蓝自发光，棱面会被灯光切出来
  const starMaterial = new THREE.MeshStandardMaterial({
    color: 0x162645,
    metalness: 0.62,
    roughness: 0.28,
    emissive: new THREE.Color(0x2448a0),
    emissiveIntensity: 0.42,
    flatShading: true
  })

  const orbitMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.emblemDark,
    metalness: 0.5,
    roughness: 0.38,
    emissive: new THREE.Color(COLORS.emblemEmissive),
    emissiveIntensity: 0.22
  })

  // 立体主星：射线修长，棱面受光
  const star = new THREE.Mesh(createSparkle3DGeometry(0.88, 1.2, 0.125), starMaterial)
  star.position.z = 0.22
  group.add(star)

  // 双轨道管
  const orbitGeometry = createOrbitTubeGeometry(0.82, 0.42, 0.032)

  const orbitA = new THREE.Mesh(orbitGeometry, orbitMaterial)
  orbitA.position.z = 0.12
  orbitA.rotation.z = THREE.MathUtils.degToRad(-24)
  group.add(orbitA)

  const orbitB = new THREE.Mesh(orbitGeometry, orbitMaterial)
  orbitB.position.z = 0.13
  orbitB.rotation.z = THREE.MathUtils.degToRad(66)
  orbitB.scale.setScalar(0.96)
  group.add(orbitB)

  // 小火花：扁一点的立体星
  const sparkGeometry = createSparkle3DGeometry(0.13, 0.17, 0.035)
  const sparkPositions = [
    [-0.52, 0.42, 0.95],
    [0.42, 0.48, 0.85],
    [0.6, -0.12, 0.72],
    [-0.38, -0.5, 0.82],
    [0.2, -0.56, 0.66],
    [-0.58, -0.04, 0.6]
  ]

  for (const [x, y, s] of sparkPositions) {
    const mesh = new THREE.Mesh(sparkGeometry, starMaterial)
    mesh.position.set(x, y, 0.14)
    mesh.scale.setScalar(s)
    mesh.rotation.z = Math.random() * Math.PI
    group.add(mesh)
  }

  return group
}

function buildDustField() {
  const count = 220
  const positions = new Float32Array(count * 3)

  for (let i = 0; i < count; i += 1) {
    const radius = 1.3 + Math.random() * 2.2
    const theta = Math.random() * Math.PI * 2
    const y = (Math.random() - 0.5) * 2.6
    positions[i * 3] = Math.cos(theta) * radius
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2.0
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: COLORS.dust,
    size: 0.015,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })

  return new THREE.Points(geometry, material)
}

export function createLogoScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(COLORS.background, 1)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(COLORS.background, 0.035)

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50)
  camera.position.set(0, 0.12, 5.4)

  // 冷色三点光，突出棱面与体积
  scene.add(new THREE.AmbientLight(0x6a86c8, 0.55))

  const key = new THREE.DirectionalLight(0xd8e8ff, 1.45)
  key.position.set(3.2, 2.6, 4.8)
  scene.add(key)

  const rim = new THREE.DirectionalLight(0x5b9bff, 0.95)
  rim.position.set(-3.6, -1.4, 2.0)
  scene.add(rim)

  const fill = new THREE.PointLight(0x8ed2ff, 16, 14, 2)
  fill.position.set(0, -1.4, 3.0)
  scene.add(fill)

  const root = new THREE.Group()
  scene.add(root)

  const galaxyMaterial = createGalaxyMaterial()
  const galaxy = new THREE.Mesh(new THREE.CircleGeometry(1.08, 128), galaxyMaterial)
  root.add(galaxy)

  root.add(buildOuterFrame())
  root.add(buildDarkEmblem())

  const dust = buildDustField()
  scene.add(dust)

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x2f66d8,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1.42, 64), glowMaterial)
  glow.position.z = -0.06
  root.add(glow)

  const pointer = { x: 0, y: 0 }
  const targetTilt = { x: 0, y: 0 }
  const currentTilt = { x: 0, y: 0 }
  let frameId = 0
  let elapsed = 0
  let lastTime = performance.now()

  function resize() {
    const width = canvas.clientWidth || canvas.parentElement?.clientWidth || 1
    const height = canvas.clientHeight || canvas.parentElement?.clientHeight || 1
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  function onPointerMove(event) {
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
    targetTilt.y = pointer.x * 0.28
    targetTilt.x = pointer.y * 0.18
  }

  function onPointerLeave() {
    targetTilt.x = 0
    targetTilt.y = 0
  }

  function tick() {
    const now = performance.now()
    const delta = Math.min((now - lastTime) / 1000, 0.05)
    lastTime = now
    elapsed += delta

    galaxyMaterial.uniforms.uTime.value = elapsed

    // 缓慢摇摆，展示立体棱面
    const sway = Math.sin(elapsed * 0.32) * 0.22
    const pitch = Math.cos(elapsed * 0.24) * 0.1
    currentTilt.x = THREE.MathUtils.lerp(currentTilt.x, targetTilt.x + pitch, 0.05)
    currentTilt.y = THREE.MathUtils.lerp(currentTilt.y, targetTilt.y + sway, 0.05)

    root.rotation.x = currentTilt.x
    root.rotation.y = currentTilt.y
    root.position.y = Math.sin(elapsed * 0.5) * 0.045

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.32, 0.04)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.12 + pointer.y * 0.2, 0.04)
    camera.lookAt(0, 0, 0)

    dust.rotation.y = elapsed * 0.025
    dust.rotation.x = Math.sin(elapsed * 0.1) * 0.06

    renderer.render(scene, camera)
    frameId = requestAnimationFrame(tick)
  }

  const ro = new ResizeObserver(resize)
  ro.observe(canvas.parentElement || canvas)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerleave', onPointerLeave)
  resize()
  tick()

  return {
    destroy() {
      cancelAnimationFrame(frameId)
      ro.disconnect()
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)

      scene.traverse((object) => {
        if (!object.isMesh && !object.isPoints) return
        object.geometry?.dispose?.()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach((material) => material?.dispose?.())
      })
      galaxyMaterial.dispose()
      renderer.dispose()
    }
  }
}
