import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import SpriteSheet from './components/SpriteSheet';
import Gallery from './components/Gallery.tsx';
import AvTest from './components/AvTest.tsx';

// Scale the UI chrome up on tablets so kids get big, easy targets.
function setUi() {
  const ui = Math.max(
    1,
    Math.min(1.75, Math.min(window.innerWidth / 430, window.innerHeight / 680))
  );
  document.documentElement.style.setProperty('--ui', ui.toFixed(3));
}
setUi();
window.addEventListener('resize', setUi);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.search.includes('sprites') ? (
      <SpriteSheet />
    ) : window.location.search.includes('gallery') ? (
      <Gallery />
    ) : window.location.search.includes('avtest') ? (
      <AvTest />
    ) : (
      <App />
    )}
  </StrictMode>
);
