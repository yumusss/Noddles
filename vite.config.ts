import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages serves the site under /<repo>/
export default defineConfig({
  base: '/Noddles/',
  plugins: [react()],
});
