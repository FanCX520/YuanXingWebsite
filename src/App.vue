<script setup>
import { ref } from 'vue'
import LogoHero from './components/LogoHero.vue'
import SpaceBackdrop from './components/SpaceBackdrop.vue'

const brandWordmarkRef = ref(null)

function updateLight({ x, y }) {
  if (!brandWordmarkRef.value) return
  brandWordmarkRef.value.style.setProperty('--light-x', `${x}%`)
  brandWordmarkRef.value.style.setProperty('--light-y', `${y}%`)
}
</script>

<template>
  <main class="page">
    <SpaceBackdrop />
    <section class="hero">
      <div ref="brandWordmarkRef" class="brand-wordmark">
        <h1 class="brand-wordmark__text brand-wordmark__base">元星联邦</h1>
        <span class="brand-wordmark__text brand-wordmark__glow" aria-hidden="true">元星联邦</span>
      </div>
      <LogoHero @light-update="updateLight" />
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
  --light-y: 50%;
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.brand-wordmark__text {
  position: absolute;
  top: 50%;
  left: 50%;
  margin: 0;
  transform: translate(-50%, -56%);
  white-space: nowrap;
  font-size: clamp(3.4rem, 11vw, 8.2rem);
  font-weight: 700;
  letter-spacing: 0.18em;
  padding-left: 0.18em;
  line-height: 1;
}

.brand-wordmark__base {
  color: rgba(45, 62, 112, 0.5);
  text-shadow: 0 0 18px rgba(20, 44, 120, 0.2);
}

.brand-wordmark__glow {
  color: rgba(255, 245, 214, 0.9);
  clip-path: circle(14% at var(--light-x) var(--light-y));
  filter: blur(0.4px);
  text-shadow:
    0 0 5px rgba(255, 248, 224, 0.9),
    0 0 18px rgba(255, 244, 205, 0.62),
    0 0 34px rgba(180, 207, 255, 0.28);
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
