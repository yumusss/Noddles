import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves this game under /<repo>/sushi/ (the noodle game lives at /<repo>/)
export default defineConfig({
  base: '/Noddles/sushi/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Yuki Sushi — Karlı Liman',
        short_name: 'Yuki Sushi',
        description: 'Karlı Liman’da hayvan müşterilere sushi hazırla, Nefis puanını yükselt.',
        lang: 'tr',
        start_url: '/Noddles/sushi/',
        scope: '/Noddles/sushi/',
        display: 'fullscreen',
        orientation: 'any',
        background_color: '#2b3560',
        theme_color: '#2b3560',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
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
