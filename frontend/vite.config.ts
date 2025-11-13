import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Make sure this matches the port you use
    host: true,   // This is the same as --host
    hmr: {
      clientPort: 443 // This helps with WebSocket connections in cloud envs
    },
    allowedHosts: [
      '.ngrok-free.dev', // Allows your new ngrok free domain
      '.ngrok.io'        // Allows the older ngrok domains just in case
    ]
  }
})