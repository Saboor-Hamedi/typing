import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  settings: {
    get: (key) => ipcRenderer.invoke('settings-get', key),
    set: (key, val) => ipcRenderer.invoke('settings-set', key, val)
  },
  data: {
    get: (key) => ipcRenderer.invoke('data-get', key),
    set: (key, val) => ipcRenderer.invoke('data-set', key, val)
  },
  store: {
    get: (key) => ipcRenderer.invoke('store-get', key),
    set: (key, val) => ipcRenderer.invoke('store-set', key, val)
  },
  getVersion: () => ipcRenderer.invoke('get-version'),
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close')
  },
  update: {
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    quitAndInstall: () => ipcRenderer.send('quit-and-install'),
    onUpdateAvailable: (callback) => {
      const subscription = (_event, ...args) => callback(...args)
      ipcRenderer.on('update-available', subscription)
      return () => ipcRenderer.removeListener('update-available', subscription)
    },
    onUpdateNotAvailable: (callback) => {
      const subscription = (_event, ...args) => callback(...args)
      ipcRenderer.on('update-not-available', subscription)
      return () => ipcRenderer.removeListener('update-not-available', subscription)
    },
    onUpdateDownloaded: (callback) => {
      const subscription = (_event, ...args) => callback(...args)
      ipcRenderer.on('update-downloaded', subscription)
      return () => ipcRenderer.removeListener('update-downloaded', subscription)
    },
    onDownloadProgress: (callback) => {
      const subscription = (_event, ...args) => callback(...args)
      ipcRenderer.on('download-progress', subscription)
      return () => ipcRenderer.removeListener('download-progress', subscription)
    }
  },
  onDeepLink: (callback) => {
    const subscription = (_event, ...args) => callback(...args)
    ipcRenderer.on('deep-link', subscription)
    return () => ipcRenderer.removeListener('deep-link', subscription)
  },
  rendererReady: () => ipcRenderer.send('renderer-ready')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
