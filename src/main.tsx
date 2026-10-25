import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './v2.css';
import './decor.css';
import App from './App.tsx';
import Gallery from './components/Gallery.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>{window.location.search.includes('gallery') ? <Gallery /> : <App />}</StrictMode>
);
