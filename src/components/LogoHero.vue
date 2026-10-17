<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createLogoScene } from '../three/logoScene.js'

const canvasRef = ref(null)
let sceneHandle = null

onMounted(() => {
  if (!canvasRef.value) return
  sceneHandle = createLogoScene(canvasRef.value)
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
  width: min(100vw, 900px);
  height: min(100vw, 900px);
  max-height: 92vh;
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
