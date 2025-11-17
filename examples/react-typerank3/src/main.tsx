import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import 'pitype-core/styles/pitype-core.css';
import '../style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
