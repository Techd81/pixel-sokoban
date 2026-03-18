import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      input: 'index.html',
      output: {
        // 将大模块分割为异步 chunk，提升首屏加载速度
        manualChunks(id) {
          if (id.includes('solver') || id.includes('generator')) {
            return 'solver';
          }
          if (
            id.includes('audio') ||
            id.includes('particles') ||
            id.includes('animation')
          ) {
            return 'fx';
          }
          if (
            id.includes('charts') ||
            id.includes('heatmap') ||
            id.includes('stats_panel') ||
            id.includes('visualizer') ||
            id.includes('calendar')
          ) {
            return 'stats';
          }
          if (
            id.includes('editor_modal') ||
            id.includes('race') ||
            id.includes('leaderboard') ||
            id.includes('sharecard') ||
            id.includes('tutorial') ||
            id.includes('skins') ||
            id.includes('worlds') ||
            id.includes('export') ||
            id.includes('macro')
          ) {
            return 'extras';
          }
          if (
            id.includes('gestures') ||
            id.includes('notify') ||
            id.includes('haptic') ||
            id.includes('minimap') ||
            id.includes('accessibility') ||
            id.includes('combo') ||
            id.includes('hint_engine') ||
            id.includes('notes') ||
            id.includes('screenshot') ||
            id.includes('curve') ||
            id.includes('fsm') ||
            id.includes('bus') ||
            id.includes('danmaku') ||
            id.includes('perf') ||
            id.includes('journal') ||
            id.includes('daily') ||
            id.includes('favorites') ||
            id.includes('adaptive') ||
            id.includes('search')
          ) {
            return 'ux';
          }
        },
      },
    },
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 提升 chunk 大小警告阈值（已做分割，不需要低阈值噪音）
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 3000,
    open: true,
  },
})
