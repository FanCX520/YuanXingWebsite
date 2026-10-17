import * as THREE from 'three'
import { createSparkleOctagramGeometry } from './starGeometry.js'
import { createOrbitBandGeometry } from './orbitGeometry.js'

// 星体外观：哑光深蓝，体积交给模型本身，材质只做基础塑形
const STAR_MATERIAL = {
  color: 0x213c6e,
  metalness: 0.55,
  roughness: 0.42,
  clearcoat: 0.3,
  clearcoatRoughness: 0.4,
  emissive: 0x060c1c,
  emissiveIntensity: 0.12,
  envMapIntensity: 0.9
}

// 星芒比例取自参考图测量值：针芒细长、谷点内凹
// concavity 控制边缘内凹深度：越大针芒越细越锋利
// radiusX 控制针芒根部的鼓包半径，radiusY 控制针芒长度
// valleyX / valleyY 控制谷点位置：贴近 1 时根部过渡平滑
const NEEDLE = {
  valleyX: 0.85,
  valleyY: 0.05,
  concavity: 0.76,
  curveSegments: 64
}
const VERTICAL_STAR = { ...NEEDLE, radiusX: 0.2, radiusY: 1.12 }
const HORIZONTAL_STAR = { ...NEEDLE, radiusX: 0.2, radiusY: 1.02 }
const DIAGONAL_STAR = { ...NEEDLE, radiusX: 0.14, radiusY: 0.62 }
const OCTAGRAM = {
  halfThickness: 0.2243,
  edgeStart: 0.88,
  edgeThicknessRatio: 0.12,
  radialSegments: 512,
  rings: 96
}
const ORBITS = [
  {
    semiMajor: 1.28,
    semiMinor: 1.28,
    roll: 0,
    tilt: 1.05,
    tiltY: 0.12,
    planeRoll: 0.55,
    centerX: 0,
    centerY: 0,
    depthOffset: 0.02,
    thickness: 0.045,
    taperStart: 0.02,
    taperEnd: 0.48
  },
  {
    semiMajor: 1.15,
    semiMinor: 1.15,
    roll: 0,
    tilt: -1.05,
    tiltY: -0.12,
    planeRoll: -0.55,
    centerX: 0,
    centerY: 0,
    depthOffset: -0.02,
    thickness: 0.04,
    taperStart: 0.02,
    taperEnd: 0.48
  }
]

// 八角轮廓由长针主星与 45° 短针星取并集，前后共用同一厚度场
function buildStarEmblem(material) {
  const geometry = createSparkleOctagramGeometry({
    primary: {
      vertical: VERTICAL_STAR,
      horizontal: HORIZONTAL_STAR
    },
    secondary: {
      vertical: DIAGONAL_STAR,
      horizontal: DIAGONAL_STAR
    },
    ...OCTAGRAM
  })
  return new THREE.Mesh(geometry, material)
}

// 程序化生成摄影棚式环境贴图：上亮下暗的蓝色渐变 + 两条高光带
function createStudioEnvironment(renderer) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height)
  sky.addColorStop(0, '#0b1430')
  sky.addColorStop(0.4, '#2f57a6')
  sky.addColorStop(0.55, '#16294f')
  sky.addColorStop(1, '#04060d')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const band = (x, y, w, h, color, alpha) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, w)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.globalAlpha = alpha
    ctx.fillStyle = gradient
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(1, h / w)
    ctx.translate(-x, -y)
    ctx.fillRect(x - w, y - w, w * 2, w * 2)
    ctx.restore()
    ctx.globalAlpha = 1
  }

  band(300, 150, 320, 130, '#eaf2ff', 0.95)
  band(760, 190, 260, 110, '#7db4ff', 0.8)
  band(520, 400, 360, 150, '#20408a', 0.7)

  const texture = new THREE.CanvasTexture(canvas)
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.colorSpace = THREE.SRGBColorSpace

  const pmrem = new THREE.PMREMGenerator(renderer)
  const envMap = pmrem.fromEquirectangular(texture).texture
  pmrem.dispose()
  texture.dispose()
  return envMap
}

// 冷色三点光：主光塑形、轮廓光勾边、底部补光
function buildLights(scene) {
  scene.add(new THREE.AmbientLight(0x24365e, 0.7))

  const key = new THREE.DirectionalLight(0xdceaff, 2.2)
  key.position.set(2.6, 3.0, 4.4)
  scene.add(key)

  const rim = new THREE.DirectionalLight(0x4f8dff, 1.5)
  rim.position.set(-3.4, -1.6, 2.6)
  scene.add(rim)

  const fill = new THREE.PointLight(0x86bcff, 26, 16, 2)
  fill.position.set(0, -2.2, 3.2)
  scene.add(fill)
}

export function createLogoScene(canvas) {
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

  const scene = new THREE.Scene()
  const environment = createStudioEnvironment(renderer)
  scene.environment = environment

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50)
  // 相机接近水平：水平视角下轮廓呈 + 星，体积由光影与俯仰揭示
  camera.position.set(0, 0.15, 4.6)

  buildLights(scene)

  const starMaterial = new THREE.MeshPhysicalMaterial({
    color: STAR_MATERIAL.color,
    metalness: STAR_MATERIAL.metalness,
    roughness: STAR_MATERIAL.roughness,
    clearcoat: STAR_MATERIAL.clearcoat,
    clearcoatRoughness: STAR_MATERIAL.clearcoatRoughness,
    emissive: new THREE.Color(STAR_MATERIAL.emissive),
    emissiveIntensity: STAR_MATERIAL.emissiveIntensity,
    envMapIntensity: STAR_MATERIAL.envMapIntensity
  })
  const orbitMaterial = starMaterial.clone()
  orbitMaterial.color.set(0x0d1830)
  orbitMaterial.metalness = 0.52
  orbitMaterial.roughness = 0.34
  orbitMaterial.clearcoat = 0.22
  orbitMaterial.clearcoatRoughness = 0.45
  orbitMaterial.emissiveIntensity = 0.05
  orbitMaterial.envMapIntensity = 0.82

  const root = new THREE.Group()
  root.add(buildStarEmblem(starMaterial))
  for (const orbit of ORBITS) {
    root.add(new THREE.Mesh(createOrbitBandGeometry(orbit), orbitMaterial))
  }
  scene.add(root)

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
    targetTilt.y = pointer.x * 0.3
    targetTilt.x = pointer.y * 0.2
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

    // 旋转体绕垂直轴对称，体积靠俯仰角度展示；鼠标位置叠加微倾
    const sway = Math.sin(elapsed * 0.28) * 0.12
    const pitch = Math.sin(elapsed * 0.24) * 0.18
    currentTilt.x = THREE.MathUtils.lerp(currentTilt.x, targetTilt.x + pitch, 0.05)
    currentTilt.y = THREE.MathUtils.lerp(currentTilt.y, targetTilt.y + sway, 0.05)

    root.rotation.x = currentTilt.x
    root.rotation.y = currentTilt.y
    root.position.y = Math.sin(elapsed * 0.45) * 0.035

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.3, 0.04)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.15 + pointer.y * 0.2, 0.04)
    camera.lookAt(0, 0, 0)

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

      const geometries = new Set()
      root.traverse((object) => {
        if (object.isMesh && object.geometry) geometries.add(object.geometry)
      })
      geometries.forEach((geometry) => geometry.dispose())
      starMaterial.dispose()
      orbitMaterial.dispose()
      environment.dispose()
      renderer.dispose()
    }
  }
}
