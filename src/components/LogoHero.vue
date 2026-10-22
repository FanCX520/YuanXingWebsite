<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createLogoScene } from '../three/logoScene.js'

const props = defineProps({
  onFrame: { type: Function, default: null },
  getLogoTarget: { type: Function, default: null },
  getMainLogoOpacity: { type: Function, default: null },
  getNavigationTargets: { type: Function, default: null }
})
const emit = defineEmits(['light-update', 'scene-ready', 'scene-error'])
const canvasRef = ref(null)
let sceneHandle = null

onMounted(() => {
  if (!canvasRef.value) return
  const params = new URLSearchParams(window.location.search)
  try {
    sceneHandle = createLogoScene(canvasRef.value, {
      view: params.get('view') || 'front',
      animate: params.get('motion') !== 'off',
      getLogoTarget: () => props.getLogoTarget?.() ?? null,
      onLightUpdate: (state) => emit('light-update', state),
      onFrame: (state) => props.onFrame?.(state),
      getMainLogoOpacity: () => props.getMainLogoOpacity?.() ?? 1,
      getNavigationTargets: () => props.getNavigationTargets?.() ?? []
    })
    emit('scene-ready')
  } catch (error) {
    emit('scene-error', error)
  }
})

onBeforeUnmount(() => {
  sceneHandle?.destroy()
  sceneHandle = null
})

defineExpose({
  getScene: () => sceneHandle
})
</script>

<template>
  <div class="logo-hero">
    <canvas ref="canvasRef" class="logo-canvas" />
  </div>
</template>

<style scoped>
.logo-hero {
  position: relative;
  z-index: 1;
  width: min(68vw, 620px);
  height: min(68vw, 620px);
  max-height: 72vh;
  margin: 0 auto;
}

.logo-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: pan-y;
  cursor: grab;
}

.logo-canvas:active {
  cursor: grabbing;
}
</style>
