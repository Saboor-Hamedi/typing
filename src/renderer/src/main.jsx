/**
 * Renderer Entrypoint
 *
 * Purpose:
 * - Bootstraps the React app, applies global CSS, and initializes web polyfills when not in Electron.
 * - Uses React 18 `createRoot` with `StrictMode` for development ergonomics.
 */
import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initWebPolyfill } from './utils/WebPolyfill'

// Initialize Polyfill if not in Electron
initWebPolyfill()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
