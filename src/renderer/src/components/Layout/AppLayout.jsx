import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
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
import ConfirmationModal from '../Modals/ConfirmationModal'

const AppLayout = () => {
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
  const [isSmoothCaret, setIsSmoothCaret] = useState(() => {
    const saved = localStorage.getItem('isSmoothCaret')
    // Default to true as user requested smooth caret
    return saved !== null ? JSON.parse(saved) : true 
  })

  const [username, setUsername] = useState(() => localStorage.getItem('username') || 'Guest')
  const [localUsername, setLocalUsername] = useState(() => localStorage.getItem('localUsername') || 'Guest')
  const [toasts, setToasts] = useState([])
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false)
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

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
  
  // 2. The Engine (Lifted for global access)
  const engine = useEngine(testMode, testLimit)
  const { 
    startTime, isFinished, results, liveWpm, timeLeft, pb,
    isSoundEnabled, setIsSoundEnabled,
    isHallEffect, setIsHallEffect,
    isGhostEnabled, setIsGhostEnabled,
    ghostPos, testHistory, clearAllData
  } = engine

  // 3. Callbacks
  const handleGlobalInteraction = useCallback(() => {
    soundEngine.warmUp();
  }, []);

  const handleReload = useCallback(() => {
    setActiveTab('typing')
    engine.resetGame()
  }, [engine])

  // Persistence & Auth Layer
  const isFirstAuthCheck = useRef(true)
  const lastNotifiedUser = useRef(null)

  useEffect(() => {
    // A. Load Settings
    const loadSettings = async () => {
      if (window.api && window.api.settings) {
        const [
          savedTheme, savedMode, savedLimit, savedChameleon, savedKinetic, savedSmooth, 
          savedLocalUsername, savedUsername
        ] = await Promise.all([
          window.api.settings.get('theme'),
          window.api.settings.get('testMode'),
          window.api.settings.get('testLimit'),
          window.api.settings.get('isChameleonEnabled'),
          window.api.settings.get('isKineticEnabled'),
          window.api.settings.get('isSmoothCaret'),
          window.api.settings.get('localUsername'),
          window.api.settings.get('username')
        ])
        
        if (savedTheme) setTheme(savedTheme)
        if (savedMode) setTestMode(savedMode)
        if (savedLimit) setTestLimit(savedLimit)
        if (savedChameleon !== undefined) setIsChameleonEnabled(savedChameleon)
        if (savedKinetic !== undefined) setIsKineticEnabled(savedKinetic)
        if (savedSmooth !== undefined) setIsSmoothCaret(savedSmooth)
        if (savedLocalUsername) setLocalUsername(savedLocalUsername)
        
        const session = await getCurrentUser()
        if (session?.user_metadata?.username) {
           const cloudName = session.user_metadata.username
           setUsername(cloudName)
           setIsLoggedIn(true)
        } else {
           // If not logged in, always use the local name
           setUsername(savedLocalUsername || 'Guest')
           setIsLoggedIn(false)
        }
        setIsSettingsLoaded(true)
      }
    }
    loadSettings()

    // B. Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const name = session?.user?.user_metadata?.username

      if (event === 'SIGNED_IN' && name) {
         setUsername(name)
         setIsLoggedIn(true)
         
         // Only show notification if NOT the initial boot check 
         // AND if it's a different user than last time we notified
         if (!isFirstAuthCheck.current && lastNotifiedUser.current !== name) {
            addToast(`Signed in as ${name}`, 'success')
            lastNotifiedUser.current = name
         } else if (isFirstAuthCheck.current) {
            // Even if silent boot, track the name so we don't toast it later on focus
            lastNotifiedUser.current = name
         }
      } else if (event === 'SIGNED_OUT') {
         setUsername(localUsername)
         setIsLoggedIn(false)
         lastNotifiedUser.current = null // Clear on sign out
         
         if (!isFirstAuthCheck.current) {
            addToast('Signed out successfully', 'info')
         }
      }
    })

    // Suppress notifications for the first 2 seconds of app load
    // to catch any initial session/signed-in events silently
    const timer = setTimeout(() => {
      isFirstAuthCheck.current = false
    }, 2000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [localUsername])

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
    // Sync to localStorage
    localStorage.setItem('theme', theme)
    localStorage.setItem('testMode', testMode)
    localStorage.setItem('testLimit', testLimit)
    localStorage.setItem('isChameleonEnabled', isChameleonEnabled)
    localStorage.setItem('isKineticEnabled', isKineticEnabled)
    localStorage.setItem('isSmoothCaret', isSmoothCaret)
    localStorage.setItem('localUsername', localUsername)
    localStorage.setItem('username', username)

    if (window.api && window.api.settings && isSettingsLoaded) {
      window.api.settings.set('theme', theme)
      window.api.settings.set('testMode', testMode)
      window.api.settings.set('testLimit', testLimit)
      window.api.settings.set('isChameleonEnabled', isChameleonEnabled)
      window.api.settings.set('isKineticEnabled', isKineticEnabled)
      window.api.settings.set('isSmoothCaret', isSmoothCaret)
      window.api.settings.set('username', username)
      window.api.settings.set('localUsername', localUsername)
    }
  }, [theme, testMode, testLimit, isChameleonEnabled, isKineticEnabled, isSmoothCaret, username, localUsername, isSettingsLoaded])

  // Chameleon Flow
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
    const hotColor = [226, 68, 20]
    const base = baseColors[theme] || baseColors.carbon
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

  const displayValue = startTime 
    ? (testMode === 'time' ? timeLeft : liveWpm) 
    : (isFinished ? results.wpm : '—')

  const isWeb = window.api?.isWeb;

  const handleUpdateNickname = async (newName) => {
     if (!newName.trim()) return

     if (isLoggedIn) {
        // 1. Update Cloud Identity
        try {
          const { error } = await supabase.auth.updateUser({
            data: { username: newName.trim() }
          })
          if (error) throw error
          setUsername(newName.trim())
          addToast('Cloud profile updated', 'success')
        } catch (err) {
          console.error('Cloud name update failed:', err)
          addToast('Cloud sync failed - using local only', 'warning')
          setUsername(newName.trim())
        }
     } else {
        // 2. Update Local Identity
        setUsername(newName.trim())
        setLocalUsername(newName.trim())
        addToast('Local nickname saved', 'success')
     }
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (err) {
      setUsername(localUsername)
      addToast('Signed out (Local session cleared)', 'info')
    } finally {
      setIsLogoutModalOpen(false)
    }
  }

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
          openThemeModal={() => setIsThemeModalOpen(true)}
          openLoginModal={() => setIsLoginModalOpen(true)}
          onLogoutRequest={() => setIsLogoutModalOpen(true)}
        />

        <main className="content-area">
          {activeTab === 'typing' ? (
             <TypingEngine 
                engine={engine}
                testMode={testMode} 
                testLimit={testLimit} 
                isSmoothCaret={isSmoothCaret}
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
                isSmoothCaret={isSmoothCaret}
                setIsSmoothCaret={setIsSmoothCaret}
                onClearHistory={() => setIsClearDataModalOpen(true)}
                openThemeModal={() => setIsThemeModalOpen(true)}
             />
          ) : activeTab === 'dashboard' ? (
             <DashboardView stats={{ pb }} history={testHistory} username={username} />
          ) : activeTab === 'leaderboard' ? (
             <LeaderboardView currentUser={username} />
          ) : (
             <div className="placeholder-view glass-panel">
                <h2>{activeTab.toUpperCase()}</h2>
                <p>Advanced metrics coming soon.</p>
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
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={(name) => {
          setUsername(name)
          addToast(`Welcome back, ${name}!`, 'success')
        }}
      />
      <ConfirmationModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to sign out of your account?"
        confirmText="Logout"
      />
      <ConfirmationModal 
        isOpen={isClearDataModalOpen}
        onClose={() => setIsClearDataModalOpen(false)}
        onConfirm={async () => {
           await clearAllData()
           addToast('History and PBs cleared successfully', 'success')
        }}
        title="Clear All Data"
        message="This will permanently delete your local history and PBs. This cannot be undone."
        confirmText="Clear All"
      />
    </div>
  )
}

export default AppLayout
