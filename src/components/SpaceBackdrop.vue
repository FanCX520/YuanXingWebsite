<template>
  <div class="space-backdrop" aria-hidden="true">
    <div class="space-backdrop__track" />
    <div class="space-backdrop__veil" />
  </div>
</template>

<style scoped>
.space-backdrop {
  position: absolute;
  inset: 0;
  z-index: -2;
  overflow: hidden;
  background: #050817;
  pointer-events: none;
}

.space-backdrop__track {
  position: absolute;
  inset: 0;
  min-height: 100%;
  background-image: url('/assets/space-bg-mirror.webp');
  background-position: center top;
  background-repeat: repeat-y;
  background-size: 100% auto;
}

.space-backdrop__veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(3, 7, 22, 0.42), rgba(3, 7, 22, 0.12) 42%, rgba(3, 7, 22, 0.56)),
    radial-gradient(ellipse 72% 58% at 50% 42%, rgba(4, 9, 28, 0.1), rgba(4, 9, 28, 0.38));
}

</style>
