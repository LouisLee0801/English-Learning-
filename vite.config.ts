import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' 讓 build 產物可以直接部署在任何子路徑（如 GitHub Pages）
export default defineConfig({
  base: './',
  plugins: [react()],
})
