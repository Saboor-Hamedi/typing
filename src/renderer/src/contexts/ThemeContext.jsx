import { createContext, useContext, useState, useEffect, useLayoutEffect, useCallback } from 'react'
import { THEMES, STORAGE_KEYS } from '../constants'

const ThemeContext = createContext(null)

/**
 * Theme Provider Component
 * Manages theme state and persistence across localStorage and electron-store
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME) || THEMES.DEFAULT
  })
  
  const [isThemeLoaded, setIsThemeLoaded] = useState(false)

  // Load theme from electron-store on mount
  useEffect(() => {
    const loadTheme = async () => {
      if (window.api?.settings) {
        const savedTheme = await window.api.settings.get(STORAGE_KEYS.SETTINGS.THEME)
        if (savedTheme) {
          setTheme(savedTheme)
        }
      }
      setIsThemeLoaded(true)
    }
    loadTheme()
  }, [])

  // Apply theme to DOM (synchronous for zero-flash)
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    
    // Update CSS variable for Chameleon Flow
    const colors = THEMES.COLORS
    const rgb = colors[theme] || colors[THEMES.DEFAULT]
    document.documentElement.style.setProperty('--main-color-rgb', rgb.join(', '))
  }, [theme])

  // Persist theme changes
  useEffect(() => {
    if (!isThemeLoaded) return
    
    localStorage.setItem(STORAGE_KEYS.THEME, theme)
    
    if (window.api?.settings) {
      window.api.settings.set(STORAGE_KEYS.SETTINGS.THEME, theme)
    }
  }, [theme, isThemeLoaded])

  /**
   * Change theme and return success status
   * @param {string} newTheme - Theme name from THEMES.AVAILABLE
   * @returns {boolean} Success status
   */
  const changeTheme = useCallback((newTheme) => {
    if (!THEMES.AVAILABLE.includes(newTheme)) {
      console.warn(`Invalid theme: ${newTheme}`)
      return false
    }
    setTheme(newTheme)
    return true
  }, [])

  const value = {
    theme,
    setTheme: changeTheme,
    availableThemes: THEMES.AVAILABLE,
    isThemeLoaded,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to access theme context
 * @returns {Object} Theme context value
 * @throws {Error} If used outside ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
