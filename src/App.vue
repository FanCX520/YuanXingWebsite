<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import LogoHero from './components/LogoHero.vue'
import SpaceBackdrop from './components/SpaceBackdrop.vue'
import { initIntro, updateIntroEngine } from './intro/intro.js'

const brandWordmarkRef = ref(null)
const wordmarkLightRef = ref(null)
const logoHeroRef = ref(null)
let introHandle = null

onMounted(() => {
  introHandle = initIntro({ scene: logoHeroRef.value?.getScene() ?? null })
})

onBeforeUnmount(() => {
  introHandle?.dispose()
  introHandle = null
})

function updateLight({ x, y, visible }) {
  const wordmark = brandWordmarkRef.value
  const text = wordmarkLightRef.value
  const logo = logoHeroRef.value?.$el
  if (!wordmark || !text || !logo) return

  const logoBounds = logo.getBoundingClientRect()
  const textBounds = text.getBoundingClientRect()
  if (!textBounds.width || !textBounds.height) return

  // 将模型画布中的光源投影换算到字形坐标，保留真实的上下距离。
  const lightX = logoBounds.left + logoBounds.width * x / 100
  const lightY = logoBounds.top + logoBounds.height * y / 100
  wordmark.style.setProperty('--light-x', `${(lightX - textBounds.left) / textBounds.width * 100}%`)
  wordmark.style.setProperty('--light-y', `${(lightY - textBounds.top) / textBounds.height * 100}%`)
  wordmark.style.setProperty('--light-opacity', visible === false ? '0' : '1')
}
</script>

<template>
  <main class="page">
    <SpaceBackdrop />
    <section class="hero">
      <div ref="brandWordmarkRef" class="brand-wordmark">
        <h1 class="brand-wordmark__text brand-wordmark__base">元星联邦</h1>
        <span ref="wordmarkLightRef" class="brand-wordmark__text brand-wordmark__glow" aria-hidden="true">元星联邦</span>
      </div>
      <LogoHero ref="logoHeroRef" :on-frame="updateIntroEngine" @light-update="updateLight" />
    </section>
  </main>
</template>

<style scoped>
.page {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  padding: 24px 16px 40px;
}

.hero {
  position: relative;
  width: min(100%, 1180px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.brand-wordmark {
  --light-x: 50%;
  --light-y: -140%;
  --light-opacity: 0;
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.brand-wordmark__text {
  /* 字形下缘会伸出 1em 行盒，留出上下内边距，避免 background-clip: text 把它裁掉 */
  --wordmark-bleed: 0.15em;
  position: absolute;
  top: 88%;
  left: 50%;
  margin: 0;
  transform: translate(-50%, -56%);
  white-space: nowrap;
  font-size: clamp(3.4rem, 11vw, 8.2rem);
  font-weight: 700;
  letter-spacing: 0.18em;
  line-height: 1;
  padding-block: var(--wordmark-bleed);
  padding-left: 0.18em;
}

.brand-wordmark__base {
  color: transparent;
  opacity: var(--intro-wordmark, 1);
  /* 开场时从"中间上方"向外展开的显现掩膜，--intro-reveal 由 0 涨到 1 */
  -webkit-mask-image: radial-gradient(
    circle at 50% 0%,
    #000 calc(var(--intro-reveal, 1) * 100%),
    transparent calc(var(--intro-reveal, 1) * 100% + 12%)
  );
  mask-image: radial-gradient(
    circle at 50% 0%,
    #000 calc(var(--intro-reveal, 1) * 100%),
    transparent calc(var(--intro-reveal, 1) * 100% + 12%)
  );
  /* 色标用 em 锚回 1em 行盒：内边距只把渐变盒撑高，不改变渐变在字形上的分布 */
  background: linear-gradient(
    180deg,
    rgba(206, 220, 255, 0.96) var(--wordmark-bleed),
    rgba(139, 165, 222, 0.94) calc(var(--wordmark-bleed) + 0.44em),
    rgba(66, 88, 145, 0.96) calc(var(--wordmark-bleed) + 1em)
  );
  background-clip: text;
  -webkit-background-clip: text;
  text-shadow: 0 0 16px rgba(20, 44, 120, 0.34);
}

.brand-wordmark__glow {
  color: transparent;
  /* 开场时高光从字标上方更远处落下、由窄变宽；--intro-* 由开屏时间轴驱动 */
  background: radial-gradient(
    ellipse calc(34% * var(--intro-spread, 1)) calc(2.2em * var(--intro-spread, 1))
      at var(--light-x) calc(var(--light-y) + var(--intro-shift, 0) * 1%),
    rgba(255, 255, 246, 1) 0%,
    rgba(255, 249, 222, 0.98) 24%,
    rgba(255, 235, 175, 0.62) 52%,
    rgba(255, 247, 225, 0) 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  opacity: calc(var(--light-opacity, 0) * var(--intro-glow, 1));
  filter: drop-shadow(0 0 5px rgba(255, 249, 219, 0.92));
}

@media (max-width: 640px) {
  .brand-wordmark__text {
    font-size: clamp(2.8rem, 13vw, 5rem);
    letter-spacing: 0.12em;
    padding-left: 0.12em;
  }
}
</style>
