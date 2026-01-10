/**
 * App
 *
 * Purpose:
 * - Root component that composes global providers (Theme, Settings, User) and the application layout.
 * - Hosts a global toast system and common utilities (ErrorBoundary, OfflineBanner).
 *
 * Notes:
 * - `addToast` is passed to UserProvider/AppLayout so deeper components can trigger notifications.
 */
import { useState, useCallback } from 'react'
import AppLayout from './components/Layout/AppLayout'
import { ThemeProvider, SettingsProvider, UserProvider } from './contexts'
import { ToastContainer } from './components/Notification/Toast'
import { ErrorBoundary, OfflineBanner } from './components/Common'
import './assets/main.css'

function App() {
  // Toast notification system (shared across all contexts)
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = `${performance.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ErrorBoundary>
      {/* Skip link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <OfflineBanner />
      
      <ThemeProvider>
        <SettingsProvider>
          <UserProvider addToast={addToast}>
            <AppLayout addToast={addToast} />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
          </UserProvider>
        </SettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
