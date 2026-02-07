// WebPolyfill.js
// This ensures the app runs in a browser by mocking Electron APIs using localStorage

export const initWebPolyfill = () => {
  if (window.api) return // Electron is present, do nothing

  if (import.meta.env.DEV) {
    console.log('🌐 Applying Web Polyfill for Browser Environment')
  }

  const getStorage = (key, defaultVal) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultVal
    } catch {
      return defaultVal
    }
  }

  const setStorage = (key, val) => {
    localStorage.setItem(key, JSON.stringify(val))
    return val
  }

  window.api = {
    isWeb: true, // Flag for UI to adapt
    getVersion: () => Promise.resolve('1.0.2-web'),

    // Settings & Data
    store: {
      get: (key) => Promise.resolve(getStorage(key, null)),
      set: (key, val) => Promise.resolve(setStorage(key, val))
    },
    settings: {
      get: (key) => Promise.resolve(getStorage(key, null)),
      set: (key, val) => Promise.resolve(setStorage(key, val))
    },
    data: {
      get: (key) => Promise.resolve(getStorage(key, [])),
      set: (key, val) => Promise.resolve(setStorage(key, val))
    },

    // Window Controls (No-op in browser)
    window: {
      minimize: () => {},
      maximize: () => {},
      close: () => {}
    },

    // Updates (No-op)
    update: {
      checkForUpdates: () => {},
      quitAndInstall: () => {},
      onUpdateAvailable: () => () => {},
      onUpdateNotAvailable: () => () => {},
      onUpdateDownloaded: () => () => {}
    }
  }
}
