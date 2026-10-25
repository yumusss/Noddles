import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import Gallery from './components/Gallery.tsx';
import AvTest from './components/AvTest.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.search.includes('gallery') ? (
      <Gallery />
    ) : window.location.search.includes('avtest') ? (
      <AvTest />
    ) : (
      <App />
    )}
  </StrictMode>
);
