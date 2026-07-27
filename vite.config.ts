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
        'icon-192.png',
        'icon-512.png',
      ],
      manifest: {
        name: 'G360 Price Audit',
        short_name: 'Price Audit',
        description: 'Comparador de precios y simulador de márgenes para análisis competitivo.',
        id: '/g360-price-audit/',
        start_url: '/g360-price-audit/',
        display: 'standalone',
        background_color: '#0b1220',
        theme_color: '#1a56db',
        orientation: 'any',
        scope: '/g360-price-audit/',
        lang: 'es',
        categories: ['utilities', 'finance', 'productivity', 'business'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
