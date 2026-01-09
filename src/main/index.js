import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'

let mainWindow = null
let pendingDeepLink = null

function handleDeepLink(url) {
  if (!url || typeof url !== 'string') return
  if (!url.startsWith('typingzone://')) return

  if (mainWindow && mainWindow.webContents) {
    // If window is ready, send immediately
    mainWindow.webContents.send('deep-link', url)
  } else {
    // Otherwise buffer it for later
    pendingDeepLink = url
  }
}

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
    // Command line contains the URL on Windows
    const url = commandLine.pop()
    handleDeepLink(url)
  })
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    frame: false, // Frameless window
    ...((process.platform === 'linux' || process.platform === 'win32') ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })
  
  // Remove default menu for true frameless experience
  mainWindow.setMenu(null)

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    // DevTools: Closed by default. Toggle with Ctrl+Shift+I
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        mainWindow.webContents.toggleDevTools()
        event.preventDefault()
      }
    })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  // Handle Deep Linking / Custom Protocol
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('typingzone', process.execPath, [join(__dirname, '../../')])
    }
  } else {
    app.setAsDefaultProtocolClient('typingzone')
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Electron Store Setup & Migration
  const Store = require('electron-store')
  const settingsStore = new Store({ name: 'settings' })
  const dataStore = new Store({ name: 'data' })
  const legacyStore = new Store({ name: 'config' }) // Default was config.json

  // Migration: Move legacy stats to data.json and legacy preferences to settings.json
  const migrateLegacy = async () => {
    try {
      const legacyPb = legacyStore.get('pb')
      const legacyHistory = legacyStore.get('history')
      
      // If we have legacy data but new data store is empty, migrate
      if (legacyPb && !dataStore.has('pb')) {
        dataStore.set('pb', legacyPb)
        dataStore.set('history', legacyHistory || [])
        // Optional: clear legacy to prevent re-migration
        // legacyStore.clear() 
      }
      
      // Migrate settings if settings store is fresh
      if (legacyStore.has('theme') && !settingsStore.has('theme')) {
        const keys = ['theme', 'testMode', 'testLimit', 'isGhostEnabled', 'isSoundEnabled', 'isHallEffect']
        keys.forEach(key => {
          if (legacyStore.has(key)) settingsStore.set(key, legacyStore.get(key))
        })
      }
    } catch (e) {
      console.error('Migration failed:', e)
    }
  }
  migrateLegacy()

  // Settings Handlers
  ipcMain.handle('settings-get', (event, key) => settingsStore.get(key))
  ipcMain.handle('settings-set', (event, key, val) => settingsStore.set(key, val))

  // Deep Link Ready Handler (called by renderer when it's ready to listen)
  ipcMain.on('renderer-ready', () => {
    if (pendingDeepLink) {
      mainWindow.webContents.send('deep-link', pendingDeepLink)
      pendingDeepLink = null
    }
  })

  // Data Handlers (History, PB, etc)
  ipcMain.handle('data-get', (event, key) => dataStore.get(key))
  ipcMain.handle('data-set', (event, key, val) => dataStore.set(key, val))

  // Legacy/Default store handler for backward compatibility
  ipcMain.handle('store-get', (event, key) => settingsStore.get(key) || dataStore.get(key))
  ipcMain.handle('store-set', (event, key, val) => {
    // Determine which store to use based on key
    const dataKeys = ['pb', 'history']
    if (dataKeys.includes(key)) dataStore.set(key, val)
    else settingsStore.set(key, val)
  })

  ipcMain.handle('get-version', () => {
    return app.getVersion()
  })

  // Window Controls Handlers
  ipcMain.on('window-minimize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.minimize()
  })

  ipcMain.on('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      if (win.isMaximized()) win.unmaximize()
      else win.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.close()
  })

  // Auto-updater Configuration
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  ipcMain.on('check-for-updates', () => {
    if (!is.dev) {
      autoUpdater.checkForUpdates()
    } else {
      const win = BrowserWindow.getFocusedWindow()
      if (win) win.webContents.send('update-not-available')
    }
  })

  ipcMain.on('quit-and-install', () => {
    autoUpdater.quitAndInstall()
  })

  autoUpdater.on('update-available', (info) => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) win.webContents.send('update-available', info)
  })

  autoUpdater.on('update-not-available', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) win.webContents.send('update-not-available')
  })

  autoUpdater.on('download-progress', (progressObj) => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) win.webContents.send('download-progress', progressObj.percent)
  })

  autoUpdater.on('update-downloaded', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) win.webContents.send('update-downloaded')
  })

  // Start checking for updates after 5 seconds of launch
  setTimeout(() => {
    if (!is.dev) autoUpdater.checkForUpdatesAndNotify()
  }, 5000)

  createWindow()

  // Handle launch URL on Windows/Linux Cold Boot
  if (process.platform === 'win32' || process.platform === 'linux') {
    const protocolUrl = process.argv.find(arg => arg.startsWith('typingzone://'))
    if (protocolUrl) handleDeepLink(protocolUrl)
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Deep Link handler for macOS
app.on('open-url', (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
