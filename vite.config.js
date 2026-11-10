import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  base: '/ferry_call/',
  plugins: [tailwindcss()],
})
