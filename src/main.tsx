import './polyfills';
import { installErrorOverlay } from './polyfills';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

installErrorOverlay();
registerSW({ immediate: true });

// No pinch-zoom on iOS Safari (the viewport meta is not enough there).
document.addEventListener('gesturestart', (e) => e.preventDefault());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
