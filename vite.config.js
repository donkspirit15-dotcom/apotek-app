import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Apotek',
        short_name: 'Apotek',
        description: 'Aplikasi kasir dan stok apotek',
        lang: 'id',
        theme_color: '#12302e',
        background_color: '#12302e',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Data master untuk Kasir: pakai jaringan, kalau gagal/lambat pakai salinan terakhir
            urlPattern: ({ url, request }) => request.mode !== 'navigate' && /^\/(stok|obat|kategori|supplier)(\/|$)/.test(url.pathname),
            handler: 'NetworkFirst',
            options: { cacheName: 'api-data', networkTimeoutSeconds: 4, cacheableResponse: { statuses: [200] } },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fonts', cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
});
