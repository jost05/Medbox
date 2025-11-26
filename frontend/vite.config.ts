import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss, { type PluginOptions } from '@tailwindcss/vite'
import tailwindConfig from './tailwind.config'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(tailwindConfig as PluginOptions)],
})

