<script setup>
import LogoHero from './components/LogoHero.vue'
</script>

<template>
  <main class="page">
    <section class="hero">
      <LogoHero />
      <div class="caption">
        <p class="title">元星联邦</p>
        <p class="subtitle">METASTELLAR · FEDERATION</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse 70% 55% at 50% 42%, rgba(58, 102, 200, 0.22), transparent 70%),
    radial-gradient(ellipse 90% 70% at 50% 100%, rgba(20, 40, 110, 0.35), transparent 65%),
    var(--bg);
  padding: 24px 16px 40px;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.caption {
  text-align: center;
  margin-top: -8px;
}

.title {
  margin: 0;
  font-size: clamp(1.6rem, 3.2vw, 2.25rem);
  font-weight: 600;
  letter-spacing: 0.35em;
  padding-left: 0.35em;
  color: var(--ink);
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
</style>
