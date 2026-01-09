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
