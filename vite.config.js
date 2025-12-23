import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/UBC_GO_V1/',
  // Ensure environment variables are available during build
  define: {
    // Vite automatically replaces import.meta.env.VITE_* at build time
    // This is just to ensure the variables are accessible
  },
})

