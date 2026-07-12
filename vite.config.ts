import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'android-chrome-192x192.png',
        'android-chrome-512x512.png',
      ],
      manifest: {
        name: 'Precios - Auditoría de Precios G360',
        short_name: 'Auditoría Precios',
        description: 'Auditoría de precios de mercado con análisis de márgenes, ranking competitivo y exportación de informes.',
        start_url: '/g360-price-audit/',
        display: 'standalone',
        background_color: '#0b1220',
        theme_color: '#1a56db',
        orientation: 'portrait-primary',
        scope: '/g360-price-audit/',
        lang: 'es',
        categories: ['utilities', 'finance', 'productivity', 'business'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  base: '/g360-price-audit/',
  build: {
    chunkSizeWarningLimit: 2048,
    outDir: 'dist',
    assetsDir: 'assets',
  },
  optimizeDeps: {
    include: ['tailwindcss', '@tailwindcss/postcss'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
});
