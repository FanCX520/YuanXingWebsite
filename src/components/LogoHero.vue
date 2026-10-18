<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createLogoScene } from '../three/logoScene.js'

const emit = defineEmits(['light-update'])
const canvasRef = ref(null)
let sceneHandle = null

onMounted(() => {
  if (!canvasRef.value) return
  const params = new URLSearchParams(window.location.search)
  sceneHandle = createLogoScene(canvasRef.value, {
    view: params.get('view') || 'front',
    animate: params.get('motion') !== 'off',
    onLightUpdate: (state) => emit('light-update', state)
  })
})

onBeforeUnmount(() => {
  sceneHandle?.destroy()
  sceneHandle = null
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
  touch-action: none;
  cursor: grab;
}

.logo-canvas:active {
  cursor: grabbing;
}
</style>
