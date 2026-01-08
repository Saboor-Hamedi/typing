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
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
    onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback)
  }
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
