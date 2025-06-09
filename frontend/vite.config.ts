import path from "path"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // 🌐 Proxy para la API - redirige /api al backend
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Mantener el path /api
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('🚨 Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('📤 Proxying request:', req.method, req.url, '-> http://localhost:8080' + req.url);
          });
        }
      }
    }
  },
  // 🎯 Variables de entorno por defecto
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'http://localhost:8080/api'
    ),
  },
})
