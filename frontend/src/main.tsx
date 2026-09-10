import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Keep the frontend independent from an older local backend that may already
// occupy port 8000. Override VITE_API_BASE_URL when a different API host is
// required.
if (import.meta.env.DEV) {
  const legacyApiBaseUrl = 'http://localhost:8000';
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith(legacyApiBaseUrl)) {
      return nativeFetch(`${apiBaseUrl}${input.slice(legacyApiBaseUrl.length)}`, init);
    }

    return nativeFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
