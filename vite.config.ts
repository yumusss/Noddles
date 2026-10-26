import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the site under /<repo>/
export default defineConfig({
  base: '/Noddles/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Noodles — Noodle Dükkânı',
        short_name: 'Noodles',
        description:
          'Hikâyeli noodle dükkânı oyunu. Siparişleri al, kaseyi hazırla, mahalleyi kurtar.',
        lang: 'tr',
        start_url: '/Noddles/',
        scope: '/Noddles/',
        display: 'fullscreen',
        orientation: 'any',
        background_color: '#fbeedc',
        theme_color: '#fbeedc',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // the sushi game is published under /Noddles/sushi/ with its own service worker
        navigateFallbackDenylist: [/\/sushi\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
});
