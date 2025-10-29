// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Obtenha o nome do seu repositório.
// Exemplo: Se o link for https://USUARIO.github.io/dsign, o base é '/dsign/'
const repoName = 'dsign'; // <--- **ATUALIZE COM O NOME DO SEU REPOSITÓRIO**

export default defineConfig({
  plugins: [react()],
  // NOVO: Adicione a propriedade base
  base: `/${repoName}/`, // Garante que os caminhos dos assets sejam relativos
})