<script setup>
import { withBase } from 'vitepress'
import HomeSection from './HomeSection.vue'

defineProps({
  content: { type: Object, default: null },
  games: { type: Array, default: () => [] }
})

const statusLabels = {
  planned: '计划中',
  translating: '汉化中',
  released: '已发布',
  paused: '暂停'
}

function statusLabel(status) {
  return statusLabels[status] || status || '状态待补充'
}
</script>

<template>
  <HomeSection id="games" :title="content?.meta?.title || '汉化游戏目录'">
    <div
      v-if="content?.html"
      class="home-section__markdown"
      v-html="content.html"
    />

    <ul v-if="games.length" class="home-games">
      <li v-for="game in games" :key="game.id" class="home-games__item">
        <a
          class="home-games__link"
          :href="withBase(game.url)"
        >
          <img
            v-if="game.cover"
            class="home-games__cover"
            :src="withBase(game.cover)"
            :alt="`${game.title} 封面`"
            loading="lazy"
            decoding="async"
          />
          <span class="home-games__content">
            <span class="home-games__header">
              <span class="home-games__name">{{ game.title }}</span>
              <span class="home-games__status">{{ statusLabel(game.status) }}</span>
            </span>
            <span v-if="game.description" class="home-games__description">
              {{ game.description }}
            </span>
          </span>
        </a>
      </li>
    </ul>
    <p v-else class="home-section__empty">游戏目录整理中。</p>
  </HomeSection>
</template>

<style scoped>
.home-games {
  display: grid;
  gap: 14px;
  margin: 26px 0 0;
  padding: 0;
  list-style: none;
}

.home-games__item {
  min-height: 0;
  padding: 20px 22px;
  border: 1px solid var(--site-line);
  background: rgba(4, 8, 24, 0.62);
  transition: border-color 180ms ease, background-color 180ms ease;
}

.home-games__item:hover,
.home-games__item:focus-within {
  border-color: rgba(157, 202, 255, 0.68);
  background: rgba(10, 20, 48, 0.82);
}

.home-games__link {
  display: flex;
  align-items: center;
  gap: 20px;
  color: var(--site-blue);
  text-decoration: none;
}

.home-games__cover {
  flex: 0 0 180px;
  width: 180px;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--site-line);
  border-radius: 6px;
  background: rgba(4, 8, 24, 0.8);
  object-fit: cover;
}

.home-games__content {
  flex: 1;
  min-width: 0;
}

.home-games__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.home-games__name {
  font-size: 1.08rem;
}

.home-games__status {
  flex: none;
  color: var(--site-muted);
  font-size: 0.76rem;
  letter-spacing: 0.08em;
}

.home-games__description {
  display: block;
  margin-top: 10px;
  color: var(--site-muted);
  line-height: 1.8;
}

@media (max-width: 680px) {
  .home-games__link {
    align-items: stretch;
    flex-direction: column;
  }

  .home-games__cover {
    flex-basis: auto;
    width: 100%;
  }
}
</style>
