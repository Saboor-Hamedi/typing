import { useState, useMemo, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import Header from '../Header/Header'
import TitleBar from '../TitleBar/TitleBar'
import Sidebar from '../Sidebar/Sidebar'
import TypingEngine from '../../engine/TypingEngine'
import { useEngine } from '../../engine/useEngine'
import { soundEngine } from '../../utils/SoundEngine'
import HistoryView from '../History/HistoryView'
import SettingsView from '../Settings/SettingsView'
import DashboardView from '../Dashboard/DashboardView'
import ThemeModal from '../Modals/ThemeModal'
import LoginModal from '../Modals/LoginModal'
import { ToastContainer } from '../Notification/Toast'
import { supabase, getCurrentUser, signOut } from '../../utils/supabase'
import LeaderboardView from '../Leaderboard/LeaderboardView'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmationModal from '../Modals/ConfirmationModal'
import { calculateLevel } from '../../utils/Leveling'

import { useAccountManager } from '../../hooks/useAccountManager'

const AppLayout = () => {
  const isElectron = !!window.api
  const isWeb = !isElectron
  
  // --- 1. Navigation & UI State ---
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
  const [isSmoothCaret, setIsSmoothCaret] = useState(() => {
    const saved = localStorage.getItem('isSmoothCaret')
    return saved !== null ? JSON.parse(saved) : true 
  })

  const [toasts, setToasts] = useState([])
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false)

  // Notifications
  const addToast = useCallback((message, type = 'info') => {
    const id = `${performance.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])
  
  // 2. The Engine
  const engine = useEngine(testMode, testLimit)
  const { 
    startTime, isFinished, results, liveWpm, timeLeft, pb, setPb,
    isSoundEnabled, setIsSoundEnabled,
    isHallEffect, setIsHallEffect,
    isGhostEnabled, setIsGhostEnabled,
    testHistory, clearAllData,
    ghostSpeed, setGhostSpeed
  } = engine

  // 3. Account & Progress (Hookified)
  const account = useAccountManager(engine, addToast)
  const {
    isLoggedIn, username, localUsername, setLocalUsername,
    unlockedAvatars, setUnlockedAvatars,
    selectedAvatarId, setSelectedAvatarId,
    isSettingsLoaded, setIsSettingsLoaded,
    handleLogout, handleUpdateNickname, updateSelectedAvatar,
    mergedHistory, currentLevel, isLoggingOut
  } = account

  // 4. Global Interactions
  const handleGlobalInteraction = useCallback(() => soundEngine.warmUp(), [])
  const handleReload = useCallback(() => {
    setActiveTab('typing')
    engine.resetGame()
  }, [engine])

  const handleClearAllData = useCallback(async () => {
    if (typeof clearAllData === 'function') {
      await clearAllData()
      addToast('History and PBs cleared', 'success')
      setIsClearDataModalOpen(false)
    }
  }, [clearAllData, addToast])

  const toggleThemeModal = useCallback((isOpen) => setIsThemeModalOpen(isOpen), [])
  const toggleLoginModal = useCallback((isOpen) => setIsLoginModalOpen(isOpen), [])
  const toggleLogoutModal = useCallback((isOpen) => setIsLogoutModalOpen(isOpen), [])
  const toggleClearModal = useCallback((isOpen) => setIsClearDataModalOpen(isOpen), [])

  // Settings Loading Effect (Atomic)
  useEffect(() => {
    const loadSettings = async () => {
      if (window.api?.settings) {
        const [
          savedTheme, savedMode, savedLimit, savedChameleon, savedKinetic, savedSmooth, 
          savedUser, savedAvatarId, savedUnlocked
        ] = await Promise.all([
          window.api.settings.get('theme'),
          window.api.settings.get('testMode'),
          window.api.settings.get('testLimit'),
          window.api.settings.get('isChameleonEnabled'),
          window.api.settings.get('isKineticEnabled'),
          window.api.settings.get('isSmoothCaret'),
          window.api.settings.get('localUsername'),
          window.api.settings.get('selectedAvatarId'),
          window.api.settings.get('unlockedAvatars')
        ])
        
        if (savedTheme) setTheme(savedTheme)
        if (savedMode) setTestMode(savedMode)
        if (savedLimit) setTestLimit(savedLimit)
        if (savedChameleon !== undefined) setIsChameleonEnabled(savedChameleon)
        if (savedKinetic !== undefined) setIsKineticEnabled(savedKinetic)
        if (savedSmooth !== undefined) setIsSmoothCaret(savedSmooth)
        if (savedUser) setLocalUsername(savedUser)
        if (savedAvatarId !== undefined) setSelectedAvatarId(savedAvatarId)
        if (savedUnlocked) setUnlockedAvatars([...new Set([0, 1, ...savedUnlocked])])
      }
      setIsSettingsLoaded(true)
    }
    loadSettings()
  }, [setLocalUsername, setSelectedAvatarId, setUnlockedAvatars, setIsSettingsLoaded])

  // Deep Link Handler (Secure Bridge)
  useEffect(() => {
    if (window.api?.onDeepLink) {
      const removeListener = window.api.onDeepLink(async (url) => {
        if (url.includes('access_token=')) {
          const hash = url.split('#')[1]
          if (!hash) return
          const params = new URLSearchParams(hash)
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')
          
          if (access_token && refresh_token) {
            try {
              // Reset the manual logout flag: this is a deliberate login action
              localStorage.removeItem('typingzone-manual-logout')
              
              const { error } = await supabase.auth.setSession({ access_token, refresh_token })
              if (error) throw error
              addToast('Authenticated via browser!', 'success')
              setIsLoginModalOpen(false)
            } catch (err) {
              addToast('Deep link authentication failed', 'error')
            }
          }
        }
      })
      return () => removeListener()
    }
  }, [addToast])

  // Ready signal for main process
  useEffect(() => {
    if (isSettingsLoaded && window.api?.rendererReady) window.api.rendererReady()
  }, [isSettingsLoaded])

  // Visibility & Tab Focus Persistence
  useEffect(() => {
    const handleVisibilitySync = async () => {
      // If we are currently logging out or already logged out, DON'T sync session
      if (document.visibilityState === 'visible' && !isLoggingOut.current && isLoggedIn) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
           handleLogout()
           addToast('Session expired', 'info')
        } 
      }
    }
    window.addEventListener('visibilitychange', handleVisibilitySync)
    window.addEventListener('focus', handleVisibilitySync)
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilitySync)
      window.removeEventListener('focus', handleVisibilitySync)
    }
  }, [isLoggedIn, handleLogout, addToast, isLoggingOut])

  // High-Performance Layout Effects
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    const colors = { carbon: '226, 183, 20', nord: '136, 192, 208', dracula: '189, 147, 249', serika_blue: '29, 161, 242', matrix: '21, 255, 0', lavender: '187, 154, 247' }
    document.documentElement.style.setProperty('--main-color-rgb', colors[theme] || colors.carbon)
  }, [theme])

  // Persistence Sync
  useEffect(() => {
    localStorage.setItem('theme', theme); localStorage.setItem('testMode', testMode); localStorage.setItem('testLimit', testLimit);
    localStorage.setItem('isChameleonEnabled', isChameleonEnabled); localStorage.setItem('isKineticEnabled', isKineticEnabled);
    localStorage.setItem('isSmoothCaret', isSmoothCaret);
    if (window.api?.settings && isSettingsLoaded) {
      window.api.settings.set('theme', theme); window.api.settings.set('testMode', testMode); window.api.settings.set('testLimit', testLimit);
      window.api.settings.set('isChameleonEnabled', isChameleonEnabled); window.api.settings.set('isKineticEnabled', isKineticEnabled); window.api.settings.set('isSmoothCaret', isSmoothCaret);
    }
  }, [theme, testMode, testLimit, isChameleonEnabled, isKineticEnabled, isSmoothCaret, isSettingsLoaded])

  // Dynamic Aesthetic: Chameleon Flow
  useEffect(() => {
    if (!isChameleonEnabled || !startTime || isFinished) return
    const baseColors = { carbon: [226, 183, 20], nord: [136, 192, 208], dracula: [189, 147, 249], serika_blue: [29, 161, 242], matrix: [21, 255, 0], lavender: [187, 154, 247] }
    const hotColor = [226, 68, 20]
    const base = baseColors[theme] || baseColors.carbon
    const targetWpm = pb > 0 ? pb : 100 
    let heat = (liveWpm - (targetWpm * 0.6)) / ((targetWpm * 1.1) - (targetWpm * 0.6))
    heat = Math.max(0, Math.min(1, heat))
    const [r, g, b] = base.map((c, i) => Math.round(c + (hotColor[i] - c) * heat))
    document.documentElement.style.setProperty('--main-color-rgb', `${r}, ${g}, ${b}`)
  }, [liveWpm, isChameleonEnabled, startTime, isFinished, theme, pb])

  const displayValue = useMemo(() => {
    if (startTime) return testMode === 'time' ? timeLeft : liveWpm
    if (isFinished) return results.wpm
    return testMode === 'time' ? testLimit : '—'
  }, [startTime, isFinished, testMode, timeLeft, liveWpm, results.wpm, testLimit])

  return (
    <div className="app-container" onClick={handleGlobalInteraction} onKeyDown={handleGlobalInteraction} style={{ paddingTop: isWeb ? '0' : '32px' }}>
      {!isWeb && <TitleBar />}
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
        isSmoothCaret={isSmoothCaret}
        setIsSmoothCaret={setIsSmoothCaret}
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
          isLoggedIn={isLoggedIn}
          setUsername={handleUpdateNickname}
          onReload={handleReload}
          openThemeModal={() => toggleThemeModal(true)}
          openLoginModal={() => toggleLoginModal(true)}
          onLogoutRequest={() => toggleLogoutModal(true)}
          selectedAvatarId={selectedAvatarId}
        />

        <main className="content-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              {activeTab === 'typing' ? (
                <TypingEngine 
                    engine={engine}
                    testMode={testMode} 
                    testLimit={testLimit} 
                    isSmoothCaret={isSmoothCaret}
                />
              ) : activeTab === 'history' ? (
                <HistoryView data={mergedHistory} />
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
                    isSmoothCaret={isSmoothCaret}
                    setIsSmoothCaret={setIsSmoothCaret}
                    onClearHistory={() => toggleClearModal(true)}
                    openThemeModal={() => toggleThemeModal(true)}
                    ghostSpeed={ghostSpeed}
                    setGhostSpeed={setGhostSpeed}
                />
              ) : activeTab === 'dashboard' ? (
                <DashboardView 
                  stats={{ pb }} 
                  history={mergedHistory} 
                  username={username}
                  selectedAvatarId={selectedAvatarId}
                  unlockedAvatars={unlockedAvatars}
                  onUpdateAvatar={updateSelectedAvatar}
                />
              ) : activeTab === 'leaderboard' ? (
                <LeaderboardView currentUser={username} />
              ) : (
                <div className="placeholder-view glass-panel">
                    <h2>{activeTab.toUpperCase()}</h2>
                    <p>Advanced metrics coming soon.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
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
        onClose={() => toggleThemeModal(false)} 
        currentTheme={theme}
        onSelect={(t) => {
          setTheme(t)
          addToast(`Theme switched to ${t}`, 'success')
        }}
      />
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => toggleLoginModal(false)}
        onLogin={() => {
          toggleLoginModal(false)
        }}
      />
      <ConfirmationModal 
        isOpen={isLogoutModalOpen}
        onClose={() => toggleLogoutModal(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure? This will end your active session and pause cloud synchronization until you sign back in."
        confirmText="Sign Out Now"
      />
      <ConfirmationModal 
        isOpen={isClearDataModalOpen}
        onClose={() => toggleClearModal(false)}
        onConfirm={handleClearAllData}
        title="Clear All Data"
        message="This will permanently delete your local history and PBs. This cannot be undone."
        confirmText="Clear All"
      />
    </div>
  )
}

export default AppLayout
