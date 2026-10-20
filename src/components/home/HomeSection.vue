<script setup>
import { computed } from 'vue'
import { useSectionReveal } from '../../composables/useSectionReveal.js'

const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, default: '' }
})

const headingId = computed(() => `${props.id}-title`)
const { target, ready, revealed } = useSectionReveal()
</script>

<template>
  <section
    :id="id"
    ref="target"
    class="home-section"
    :class="{ 'home-section--ready': ready, 'is-revealed': revealed }"
    :aria-labelledby="headingId"
    :data-section="id"
  >
    <h2 :id="headingId">{{ title }}</h2>
    <div class="home-section__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.home-section {
  scroll-margin-top: 88px;
}

.home-section--ready {
  transition: opacity 600ms ease, transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
}

.home-section--ready:not(.is-revealed) {
  opacity: 0;
  transform: translateY(24px);
}

@media (prefers-reduced-motion: reduce) {
  .home-section--ready {
    transition: none;
  }
}
</style>
