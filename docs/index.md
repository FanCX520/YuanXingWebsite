---
title: 元星联邦
description: 元星联邦汉化组官网。
---

<script setup>
import { data as homeSections } from './.vitepress/data/home.data.js'
import { data as games } from './.vitepress/data/games.data.js'
import HomeAboutSection from '../src/components/home/HomeAboutSection.vue'
import HomeGamesSection from '../src/components/home/HomeGamesSection.vue'
import HomeLinksSection from '../src/components/home/HomeLinksSection.vue'

const sectionComponents = {
  about: HomeAboutSection,
  games: HomeGamesSection,
  links: HomeLinksSection
}

const sections = [...(homeSections || [])]
  .filter((section) => sectionComponents[section.id])
  .sort((a, b) => (a.meta.order ?? 999) - (b.meta.order ?? 999))

function sectionProps(section) {
  return section.id === 'games'
    ? { content: section, games: games || [] }
    : { content: section }
}
</script>

<component
  v-for="section in sections"
  :is="sectionComponents[section.id]"
  :key="section.id"
  v-bind="sectionProps(section)"
/>
