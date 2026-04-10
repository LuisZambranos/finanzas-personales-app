import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Actualiza la app sola cuando haces cambios
      includeAssets: ['logo.jpg'], // Archivos estáticos a cachear
      manifest: {
        name: "Finanzas Personales",
        short_name: "Finanzas",
        description: "Controla tus ingresos, gastos y metas financieras.",
        theme_color: "#10B981",
        background_color: "#111111",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/logo.jpg",
            sizes: "192x192",
            type: "image/jpeg"
          },
          {
            src: "/logo.jpg",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})