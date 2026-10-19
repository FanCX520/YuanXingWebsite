<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

// 深色圆形“镜头”：跟随鼠标悬停在字标上，圈内显示另一段字
const rootRef = ref(null)

function isIntroDone() {
  return document.documentElement.classList.contains('intro-done')
}

function hide() {
  rootRef.value?.classList.remove('is-visible')
}

function onPointerMove(event) {
  const root = rootRef.value
  if (!root) return

  // 触屏不展示悬停镜头
  if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
    hide()
    return
  }
  if (!isIntroDone()) {
    hide()
    return
  }

  const text = document.querySelector('.brand-wordmark__base')
  if (!text) return
  const rect = text.getBoundingClientRect()
  const padX = Math.max(20, rect.width * 0.04)
  const padY = Math.max(36, rect.height * 0.55)
  const inside =
    event.clientX > rect.left - padX &&
    event.clientX < rect.right + padX &&
    event.clientY > rect.top - padY &&
    event.clientY < rect.bottom + padY

  if (!inside) {
    hide()
    return
  }

  const host = root.getBoundingClientRect()
  root.style.setProperty('--lens-x', `${event.clientX - host.left}px`)
  root.style.setProperty('--lens-y', `${event.clientY - host.top}px`)
  root.classList.add('is-visible')
}

function onPointerLeave() {
  hide()
}

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('blur', onPointerLeave)
  document.documentElement.addEventListener('pointerleave', onPointerLeave)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('blur', onPointerLeave)
  document.documentElement.removeEventListener('pointerleave', onPointerLeave)
})
</script>

<template>
  <div ref="rootRef" class="wordmark-lens" aria-hidden="true">
    <div class="wordmark-lens__disc">
      <span class="wordmark-lens__zh">循此苦旅，终抵繁星</span>
      <span class="wordmark-lens__la">Per aspera ad astra</span>
    </div>
  </div>
</template>

<style scoped>
.wordmark-lens {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.wordmark-lens__disc {
  position: absolute;
  left: var(--lens-x, 50%);
  top: var(--lens-y, 50%);
  width: clamp(140px, calc(min(68vw, 620px, 72vh) * 0.34), 215px);
  height: clamp(140px, calc(min(68vw, 620px, 72vh) * 0.34), 215px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.72);
  background: radial-gradient(circle at 50% 40%, rgba(32, 23, 13, 0.98), rgba(9, 7, 5, 0.98) 68%, #040302 100%);
  border: 1px solid rgba(236, 199, 138, 0.22);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.35),
    0 14px 36px rgba(0, 0, 0, 0.55),
    0 0 28px rgba(255, 196, 120, 0.08),
    inset 0 0 28px rgba(255, 203, 129, 0.1);
  container-type: size;
  transition: opacity 0.16s ease, transform 0.18s cubic-bezier(0.2, 0.7, 0.3, 1);
  will-change: transform, opacity;
}

.wordmark-lens.is-visible .wordmark-lens__disc {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.wordmark-lens__zh {
  font-family: "Songti SC", "STSong", "SimSun", "Noto Serif SC", serif;
  font-size: 8.4cqw;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #f4e0b8;
  text-shadow: 0 0 14px rgba(255, 211, 140, 0.35);
  white-space: nowrap;
}

.wordmark-lens__la {
  margin-top: 2.6cqw;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 4.6cqw;
  font-style: italic;
  letter-spacing: 0.1em;
  color: rgba(240, 210, 160, 0.85);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .wordmark-lens__disc {
    transition: opacity 0.16s ease;
  }
}
</style>
