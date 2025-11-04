// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ Nome EXATO do seu repositório no GitHub
const repoName = 'dsign'

export default defineConfig({
  plugins: [react()],
  base: `/${repoName}/`, // ✅ Corrige o caminho dos assets
  build: {
    outDir: 'docs', // ✅ Gera dentro da pasta que o GitHub Pages usa
  },
})
