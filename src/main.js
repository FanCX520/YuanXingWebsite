import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { applyIntroFallback } from './intro/intro.js'

// 首帧渲染前确定开场状态，避免闪出完成态画面
applyIntroFallback()

createApp(App).mount('#app')
