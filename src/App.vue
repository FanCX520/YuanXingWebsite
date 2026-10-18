<script setup>
import { ref } from 'vue'
import LogoHero from './components/LogoHero.vue'
import SpaceBackdrop from './components/SpaceBackdrop.vue'

const brandWordmarkRef = ref(null)
const wordmarkLightRef = ref(null)
const logoHeroRef = ref(null)

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
      <LogoHero ref="logoHeroRef" @light-update="updateLight" />
      <div class="caption">
        <p class="subtitle">METASTELLAR · FEDERATION</p>
      </div>
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
  top: 84%;
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
  /* 原 220% 是相对 1em 行盒的 2.2em，改用 em 固定纵向光斑，不受内边距影响 */
  background: radial-gradient(
    ellipse 34% 2.2em at var(--light-x) var(--light-y),
    rgba(255, 255, 246, 1) 0%,
    rgba(255, 249, 222, 0.98) 24%,
    rgba(255, 235, 175, 0.62) 52%,
    rgba(255, 247, 225, 0) 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  opacity: var(--light-opacity);
  filter: drop-shadow(0 0 5px rgba(255, 249, 219, 0.92));
}

.caption {
  text-align: center;
  margin-top: -8px;
}

.subtitle {
  margin: 10px 0 0;
  font-size: clamp(0.72rem, 1.4vw, 0.92rem);
  font-weight: 500;
  letter-spacing: 0.42em;
  padding-left: 0.42em;
  color: var(--accent-bright);
  opacity: 0.85;
}

@media (max-width: 640px) {
  .brand-wordmark__text {
    font-size: clamp(2.8rem, 13vw, 5rem);
    letter-spacing: 0.12em;
    padding-left: 0.12em;
  }
}
</style>
