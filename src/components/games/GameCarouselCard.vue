<script setup>
import { computed } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps({
  game: { type: Object, required: true },
  active: { type: Boolean, default: false }
})

const statusLabels = {
  planned: '计划中',
  translating: '汉化中',
  released: '已发布',
  paused: '暂停'
}

const statusLabel = computed(
  () => statusLabels[props.game.status] || props.game.status || '状态待补充'
)
</script>

<template>
  <a
    class="game-card__link"
    :href="withBase(game.url)"
    :aria-current="active ? 'true' : undefined"
  >
    <span class="game-card__cover-frame">
      <img
        v-if="game.cover"
        class="game-card__cover"
        :src="withBase(game.cover)"
        :alt="`${game.title} 封面`"
        loading="lazy"
        decoding="async"
      />
      <span v-else class="game-card__placeholder" aria-hidden="true">✦</span>
    </span>

    <span class="game-card__body">
      <span class="game-card__header">
        <span class="game-card__name">{{ game.title }}</span>
        <span class="game-card__status">{{ statusLabel }}</span>
      </span>
      <span v-if="game.description" class="game-card__description">
        {{ game.description }}
      </span>
      <span class="game-card__action">
        查看 Wiki
        <span aria-hidden="true">↗</span>
      </span>
    </span>
  </a>
</template>

<style scoped>
.game-card__link {
  position: relative;
  display: block;
  overflow: hidden;
  border: 1px solid rgba(157, 185, 255, 0.28);
  border-radius: 14px;
  background:
    linear-gradient(145deg, rgba(12, 24, 55, 0.96), rgba(4, 9, 24, 0.94)),
    rgba(4, 8, 24, 0.9);
  box-shadow:
    0 24px 70px rgba(0, 0, 0, 0.36),
    inset 0 1px 0 rgba(217, 232, 255, 0.06);
  color: var(--ink);
  text-decoration: none;
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.game-card__link::after {
  position: absolute;
  inset: 0;
  background: rgba(1, 5, 16, 0.54);
  content: '';
  opacity: calc(var(--carousel-depth, 0) * 0.82);
  pointer-events: none;
}

.game-card__link[aria-current='true'] {
  border-color: rgba(164, 207, 255, 0.72);
  box-shadow:
    0 28px 86px rgba(29, 88, 190, 0.3),
    0 0 28px rgba(109, 170, 255, 0.14),
    inset 0 1px 0 rgba(226, 240, 255, 0.12);
}

.game-card__link:hover,
.game-card__link:focus-visible {
  border-color: rgba(196, 225, 255, 0.92);
}

.game-card__link:focus-visible {
  outline: 2px solid rgba(184, 216, 255, 0.9);
  outline-offset: 4px;
}

.game-card__cover-frame {
  position: relative;
  display: grid;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 16 / 9;
  place-items: center;
  background:
    radial-gradient(circle at 50% 50%, rgba(75, 136, 230, 0.24), transparent 54%),
    rgba(4, 9, 24, 0.92);
}

.game-card__cover-frame::after {
  position: absolute;
  inset: auto 0 0;
  height: 44%;
  background: linear-gradient(transparent, rgba(3, 7, 19, 0.86));
  content: '';
  pointer-events: none;
}

.game-card__cover {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
}

.game-card__link[aria-current='true']:hover .game-card__cover,
.game-card__link[aria-current='true']:focus-visible .game-card__cover {
  transform: scale(1.025);
}

.game-card__placeholder {
  color: #fff0ae;
  font-size: 3.4rem;
  text-shadow: 0 0 24px rgba(118, 172, 255, 0.8);
}

.game-card__body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-height: 154px;
  padding: 20px 22px 21px;
}

.game-card__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 18px;
}

.game-card__name {
  color: #eef5ff;
  font-size: clamp(1.16rem, 2vw, 1.42rem);
  font-weight: 700;
  letter-spacing: 0.03em;
}

.game-card__status {
  flex: none;
  color: #f0dda1;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
}

.game-card__description {
  margin-top: 10px;
  color: var(--site-muted);
  line-height: 1.75;
}

.game-card__action {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 7px;
  margin-top: auto;
  padding-top: 18px;
  color: var(--site-blue);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
}

@media (max-width: 680px) {
  .game-card__body {
    min-height: 140px;
    padding: 16px 18px 18px;
  }

  .game-card__description {
    line-height: 1.65;
  }
}

@media (prefers-reduced-motion: reduce) {
  .game-card__link,
  .game-card__cover {
    transition: none;
  }
}
</style>
