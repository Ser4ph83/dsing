// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 👇 Altere APENAS este nome se o repositório tiver outro nome
const repoName = 'dsign';

export default defineConfig({
  plugins: [react()],
  base: `/${repoName}/`, // Caminho base para o GitHub Pages
  build: {
    outDir: 'docs', // 👈 Envia o build direto pra /docs
  },
  server: {
    port: 5173, // Porta padrão local (opcional)
  },
});
