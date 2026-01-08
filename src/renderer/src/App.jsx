import { useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import Header from './components/Header/Header'
import TitleBar from './components/TitleBar/TitleBar'
import Sidebar from './components/Sidebar/Sidebar'
import TypingEngine from './engine/TypingEngine'
import { useEngine } from './engine/useEngine'
import { soundEngine } from './utils/SoundEngine'
import HistoryView from './components/History/HistoryView'
import SettingsView from './components/Settings/SettingsView'
import DashboardView from './components/Dashboard/DashboardView'
import ThemeModal from './components/Modals/ThemeModal'
import { ToastContainer } from './components/Notification/Toast'
import './assets/main.css'

function App() {
  // 1. Core State
  const [activeTab, setActiveTab] = useState('typing')
  const [testMode, setTestMode] = useState('words')
  const [testLimit, setTestLimit] = useState(() => Number(localStorage.getItem('testLimit')) || 25)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'carbon')
  const [isZenMode, setIsZenMode] = useState(false)
  const [isChameleonEnabled, setIsChameleonEnabled] = useState(() => {
    const saved = localStorage.getItem('isChameleonEnabled')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [isKineticEnabled, setIsKineticEnabled] = useState(() => {
    const saved = localStorage.getItem('isKineticEnabled')
    return saved !== null ? JSON.parse(saved) : false
  })
  const [username, setUsername] = useState(() => localStorage.getItem('username') || 'Guest')
  const [toasts, setToasts] = useState([])
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false)

  // Notification Utility
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])
  
  // 2. The Engine (Lifted to App for global access)
  const engine = useEngine(testMode, testLimit)
  const { 
    startTime, isFinished, results, liveWpm, timeLeft, pb,
    isSoundEnabled, setIsSoundEnabled,
    isHallEffect, setIsHallEffect,
    isGhostEnabled, setIsGhostEnabled,
    ghostPos, isTyping, testHistory, clearAllData
  } = engine

  // 3. Callbacks
  const handleGlobalInteraction = useCallback(() => {
    soundEngine.warmUp();
  }, []);

  const handleReload = useCallback(() => {
    setActiveTab('typing')
    engine.resetGame()
  }, [engine])

  // 4. Persistence Layer (Consolidated)
  useEffect(() => {
    const loadSettings = async () => {
      if (window.api && window.api.settings) {
        const [savedTheme, savedMode, savedLimit, savedChameleon, savedKinetic, savedUsername] = await Promise.all([
          window.api.settings.get('theme'),
          window.api.settings.get('testMode'),
          window.api.settings.get('testLimit'),
          window.api.settings.get('isChameleonEnabled'),
          window.api.settings.get('isKineticEnabled'),
          window.api.settings.get('username')
        ])
        if (savedTheme) setTheme(savedTheme)
        if (savedMode) setTestMode(savedMode)
        if (savedLimit) setTestLimit(savedLimit)
        if (savedChameleon !== undefined) setIsChameleonEnabled(savedChameleon)
        if (savedKinetic !== undefined) setIsKineticEnabled(savedKinetic)
        if (savedUsername) setUsername(savedUsername)
        
        setIsSettingsLoaded(true)
      }
    }
    loadSettings()
  }, [])

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    const colors = {
      carbon: '226, 183, 20',
      nord: '136, 192, 208',
      dracula: '189, 147, 249',
      serika_blue: '29, 161, 242',
      matrix: '21, 255, 0',
      lavender: '187, 154, 247'
    }
    document.documentElement.style.setProperty('--main-color-rgb', colors[theme] || colors.carbon)
  }, [theme])

  useEffect(() => {
    // Sync to localStorage immediately for next reload speed
    localStorage.setItem('theme', theme)
    localStorage.setItem('testMode', testMode)
    localStorage.setItem('testLimit', testLimit)
    localStorage.setItem('isChameleonEnabled', isChameleonEnabled)
    localStorage.setItem('isKineticEnabled', isKineticEnabled)
    localStorage.setItem('username', username)

    if (window.api && window.api.settings && isSettingsLoaded) {
      window.api.settings.set('theme', theme)
      window.api.settings.set('testMode', testMode)
      window.api.settings.set('testLimit', testLimit)
      window.api.settings.set('isChameleonEnabled', isChameleonEnabled)
      window.api.settings.set('isKineticEnabled', isKineticEnabled)
      window.api.settings.set('username', username)
    }
  }, [theme, testMode, testLimit, isChameleonEnabled, isKineticEnabled, username, isSettingsLoaded])

  // 4. Chameleon Flow (WPM-Responsive Theme)
  useEffect(() => {
    if (!isChameleonEnabled || !startTime || isFinished) return

    const baseColors = {
      carbon: [226, 183, 20],
      nord: [136, 192, 208],
      dracula: [189, 147, 249],
      serika_blue: [29, 161, 242],
      matrix: [21, 255, 0],
      lavender: [187, 154, 247]
    }
    
    const hotColor = [226, 68, 20] // Fast orange-red
    const base = baseColors[theme] || baseColors.carbon
    
    // Target WPM is PB (or 100 if no PB)
    const targetWpm = pb > 0 ? pb : 100 
    const startHeatAt = targetWpm * 0.6
    const maxHeatAt = targetWpm * 1.1
    
    let heat = (liveWpm - startHeatAt) / (maxHeatAt - startHeatAt)
    heat = Math.max(0, Math.min(1, heat))
    
    const r = Math.round(base[0] + (hotColor[0] - base[0]) * heat)
    const g = Math.round(base[1] + (hotColor[1] - base[1]) * heat)
    const b = Math.round(base[2] + (hotColor[2] - base[2]) * heat)
    
    document.documentElement.style.setProperty('--main-color-rgb', `${r}, ${g}, ${b}`)
  }, [liveWpm, isChameleonEnabled, startTime, isFinished, theme, pb])

  // Calculated display value (Timer or WPM)
  const displayValue = startTime 
    ? (testMode === 'time' ? timeLeft : liveWpm) 
    : (isFinished ? results.wpm : '—')

  return (
    <div className="app-container" onClick={handleGlobalInteraction} onKeyDown={handleGlobalInteraction} style={{ paddingTop: '32px' }}>
      <TitleBar />
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        testStarted={!!startTime && !isFinished}
        isZenMode={isZenMode}
        isSoundEnabled={isSoundEnabled}
        setIsSoundEnabled={setIsSoundEnabled}
        isHallEffect={isHallEffect}
        setIsHallEffect={setIsHallEffect}
        isGhostEnabled={isGhostEnabled}
        setIsGhostEnabled={setIsGhostEnabled}
        onNotification={addToast}
      />

      <div className="main-viewport">
        <Header 
          activeTab={activeTab}
          testStarted={!!startTime && !isFinished}
          isZenMode={isZenMode}
          theme={theme}
          setTheme={setTheme}
          testMode={testMode}
          setTestMode={setTestMode}
          testLimit={testLimit}
          setTestLimit={setTestLimit}
          setIsZenMode={setIsZenMode}
          displayValue={displayValue}
          pb={pb}
          username={username}
          setUsername={setUsername}
          onReload={handleReload}
          openThemeModal={() => setIsThemeModalOpen(true)}
        />

        <main className="content-area">
          {activeTab === 'typing' ? (
             <TypingEngine 
                engine={engine}
                testMode={testMode} 
                testLimit={testLimit} 
             />
          ) : activeTab === 'history' ? (
             <HistoryView data={testHistory} />
          ) : activeTab === 'settings' ? (
             <SettingsView 
                isGhostEnabled={isGhostEnabled}
                setIsGhostEnabled={setIsGhostEnabled}
                isSoundEnabled={isSoundEnabled}
                setIsSoundEnabled={setIsSoundEnabled}
                isHallEffect={isHallEffect}
                setIsHallEffect={setIsHallEffect}
                isChameleonEnabled={isChameleonEnabled}
                setIsChameleonEnabled={setIsChameleonEnabled}
                isKineticEnabled={isKineticEnabled}
                setIsKineticEnabled={setIsKineticEnabled}
                onClearHistory={async () => {
                  await clearAllData()
                  addToast('History and PBs cleared successfully', 'success')
                }}
                openThemeModal={() => setIsThemeModalOpen(true)}
             />
          ) : activeTab === 'dashboard' ? (
             <DashboardView stats={{ pb }} history={testHistory} username={username} />
          ) : (
             <div className="placeholder-view glass-panel">
                <h2>{activeTab.toUpperCase()}</h2>
                <p>Advanced metrics and achievements coming soon.</p>
             </div>
          )}
        </main>

        <footer className={(!!startTime && !isFinished) && isZenMode ? 'zen-active' : ''}>
          <div className="hint">
            <kbd>tab</kbd> to restart | 
            <span className="kb-hint">Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> for command palette</span>
          </div>
        </footer>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ThemeModal 
        isOpen={isThemeModalOpen} 
        onClose={() => setIsThemeModalOpen(false)} 
        currentTheme={theme}
        onSelect={(t) => {
          setTheme(t)
          addToast(`Theme switched to ${t}`, 'success')
        }}
      />
    </div>
  )
}

export default App
