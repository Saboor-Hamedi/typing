/**
 * AppLayout
 *
 * Purpose:
 * - Orchestrates the renderer UI: TitleBar, Sidebar, Header, main routed views, and modals.
 * - Bridges engine state (typing session) with account/state contexts and passes derived data
 *   (PB, merged history, current level, avatar) to views like Dashboard and History.
 *
 * Key Responsibilities:
 * - Manage view routing via `activeTab` and overlay state for modals to pause interactions.
 * - Initialize and pass the typing `engine` (from useEngine) to the `TypingEngine` view.
 * - Drive visual systems: Chameleon Flow (perf-based color), Zen mode, sound toggles.
 * - Auth UX glue: auto-close Login modal when `isLoggedIn` flips true (password or OAuth).
 * - Propagate profile visuals: `selectedAvatarId`, `unlockedAvatars`, `currentLevel` to Dashboard.
 *
 * Notable Side Effects:
 * - `useChameleonFlow` colors react to live WPM during an active test.
 * - `handleGlobalInteraction` warms up the SoundEngine on first user gesture.
 * - History clear confirmation uses `engine.clearAllData()` and toasts the outcome.
 */
import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../Header/Header'
import TitleBar from '../TitleBar/TitleBar'
import Sidebar from '../Sidebar/Sidebar'
import ConfigBar from '../Header/ConfigBar'
import TypingEngine from '../../engine/TypingEngine'
import ThemeModal from '../Modals/ThemeModal'
import LoginModal from '../Modals/LoginModal'
import CustomContentModal from '../Modals/CustomContentModal'
import ConfirmationModal from '../Modals/ConfirmationModal'
import { useEngine } from '../../engine/useEngine'
import { useAccountManager } from '../../hooks/useAccountManager'
import { useChameleonFlow } from '../../hooks/useChameleonFlow'
import { useTheme, useSettings, useUser } from '../../contexts'
import { soundEngine } from '../../utils/SoundEngine'
import { SUCCESS_MESSAGES, PROGRESSION, STORAGE_KEYS } from '../../constants'
import { deleteUserData } from '../../utils/supabase'
import { LoadingSpinner, KeyboardShortcutsModal, Tooltip } from '../Common'
import CommandPalette from '../CommandPalette/CommandPalette'
import { Search, Keyboard, Palette, Globe, History, Trophy, Settings, LogOut, Play, RefreshCw, User, Shield, Flame, Type, Zap, Ghost, Volume2, VolumeX, Cpu, Activity, AlertCircle, BookOpen } from 'lucide-react'
import './AppLayout.css'

// Lazy load views for code splitting
const HistoryView = lazy(() => import('../History/HistoryView'))
const SettingsView = lazy(() => import('../Settings/SettingsView'))
const DashboardView = lazy(() => import('../Dashboard/DashboardView'))
const LeaderboardView = lazy(() => import('../Leaderboard/LeaderboardView'))
const NotFound = lazy(() => import('../Views/NotFound'))

/**
 * Main Application Layout
 * Orchestrates all major views and manages global state
 */
const AppLayout = ({ addToast }) => {
  const isElectron = !!window.api
  const isWeb = !isElectron
  const [version, setVersion] = useState('0.0.0')

  // Get context values
  const { theme, setTheme } = useTheme()
  const { 
    testMode, 
    testLimit, 
    setTestMode, 
    setTestLimit,
    isChameleonEnabled,
    setIsChameleonEnabled,
    isSmoothCaret,
    setIsSmoothCaret,
    isKineticEnabled,
    setIsKineticEnabled,
    isZenMode,
    setIsZenMode,
    caretStyle,
    setCaretStyle,
    isErrorFeedbackEnabled,
    setIsErrorFeedbackEnabled
  } = useSettings()
  
  const { 
    isLoggedIn, 
    username, 
    selectedAvatarId,
    unlockedAvatars,
    updateAvatar,
    unlockAvatar,
    handleLogout,
    updateUsername
  } = useUser()

  // Local UI state
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'typing'
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) || 'typing'
  })
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false)
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false)
  const [isContentModalOpen, setIsContentModalOpen] = useState(false)
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isCapsLockOn, setIsCapsLockOn] = useState(false)

  // Engine hook
  const engine = useEngine(testMode, testLimit)
  const {
    startTime,
    isFinished,
    results,
    liveWpm,
    timeLeft,
    elapsedTime,
    pb,
    isSoundEnabled,
    setIsSoundEnabled,
    isHallEffect,
    setIsHallEffect,
    isGhostEnabled,
    setIsGhostEnabled,
    testHistory,
    clearAllData,
    ghostSpeed,
    setGhostSpeed
  } = engine

  // Derived state for immersive mode
  const isCurrentlyTyping = !!startTime && !isFinished && engine.isTyping

  // Account manager hook
  const account = useAccountManager(engine, addToast)
  const { mergedHistory, currentLevel } = account

  // Chameleon Flow (optimized)
  useChameleonFlow(
    liveWpm,
    pb,
    !!startTime && !isFinished,
    isChameleonEnabled
  )

  // Auto-unlock avatars when level increases (edge-triggered, separated, robust)
  const lastLevelRef = useRef(currentLevel)
  useEffect(() => {
    // Only act on level increases to avoid render churn
    const prev = lastLevelRef.current
    if (typeof currentLevel !== 'number' || currentLevel <= prev) {
      lastLevelRef.current = currentLevel
      return
    }

    // Identify newly eligible avatars
    const newlyEligible = PROGRESSION.AVATAR_UNLOCK_LEVELS.filter(({ id, level }) => (
      currentLevel >= level && !unlockedAvatars.includes(id)
    ))

    if (newlyEligible.length === 0) {
      lastLevelRef.current = currentLevel
      return
    }

    // Unlock each separately and toast per unlock for clarity
    newlyEligible.forEach(({ id, name }) => {
      unlockAvatar(id)
      addToast?.(`${SUCCESS_MESSAGES.AVATAR_UNLOCKED}: ${name}`, 'success')
    })

    lastLevelRef.current = currentLevel
  }, [currentLevel, unlockedAvatars, unlockAvatar, addToast])

  // Global interactions
  const handleGlobalInteraction = useCallback(() => soundEngine.warmUp(), [])
  
  const handleReload = useCallback(() => {
    setActiveTab('typing')
    engine.resetGame()
  }, [engine])

  // Persist active tab across reloads
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab)
  }, [activeTab])

  const handleClearAllData = useCallback(async () => {
    if (typeof clearAllData === 'function') {
      await clearAllData()
      addToast('History and PBs cleared', 'success')
      setIsClearDataModalOpen(false)
    }
  }, [clearAllData, addToast])

  const handleDeleteAccount = useCallback(async () => {
    if (!isLoggedIn) {
      addToast?.('You need to be signed in to delete your account', 'warning')
      setIsDeleteAccountModalOpen(false)
      return
    }

    try {
      await deleteUserData()
      await clearAllData?.()
      await handleLogout()
      addToast?.('Account deleted and data removed from cloud', 'success')
    } catch (err) {
      console.error('Delete account failed:', err)
      addToast?.('Failed to delete account. Please try again.', 'error')
    } finally {
      setIsDeleteAccountModalOpen(false)
    }
  }, [isLoggedIn, clearAllData, handleLogout, addToast])

  // Modal toggles
  const toggleThemeModal = useCallback((isOpen) => setIsThemeModalOpen(isOpen), [])
  const toggleLoginModal = useCallback((isOpen) => setIsLoginModalOpen(isOpen), [])
  const toggleLogoutModal = useCallback((isOpen) => setIsLogoutModalOpen(isOpen), [])
  const toggleClearModal = useCallback((isOpen) => setIsClearDataModalOpen(isOpen), [])
  const toggleDeleteAccountModal = useCallback((isOpen) => setIsDeleteAccountModalOpen(isOpen), [])

  // Theme change handler
  const handleThemeChange = useCallback((newTheme) => {
    setTheme(newTheme)
  }, [setTheme])

  // Auto-close Login modal upon successful authentication (OAuth or password)
  useEffect(() => {
    if (isLoggedIn && isLoginModalOpen) {
      setIsLoginModalOpen(false)
      addToast?.('Signed in successfully', 'success')
    }
  }, [isLoggedIn, isLoginModalOpen, addToast])

  // Fetch version for status bar
  useEffect(() => {
    const fetchVersion = async () => {
      if (window.api && window.api.getVersion) {
        const v = await window.api.getVersion()
        setVersion(v)
      }
    }
    fetchVersion()
  }, [])

  // Detect if any modal/overlay is currently active
  const isOverlayActive = isThemeModalOpen || isLoginModalOpen || isLogoutModalOpen || isClearDataModalOpen || isShortcutsModalOpen || isCommandPaletteOpen || isContentModalOpen

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Update Caps Lock state
      if (typeof e.getModifierState === 'function') {
        setIsCapsLockOn(e.getModifierState('CapsLock'))
      }

      // Don't intercept if user is typing in an input/textarea
      const active = document.activeElement
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
      if (isInput && active.type !== 'text' && active.type !== 'password') return

      // Escape: Close any open modal
      if (e.key === 'Escape') {
        if (isThemeModalOpen) setIsThemeModalOpen(false)
        if (isLoginModalOpen) setIsLoginModalOpen(false)
        if (isLogoutModalOpen) setIsLogoutModalOpen(false)
        if (isClearDataModalOpen) setIsClearDataModalOpen(false)
        if (isShortcutsModalOpen) setIsShortcutsModalOpen(false)
        if (isCommandPaletteOpen) setIsCommandPaletteOpen(false)
        if (isContentModalOpen) setIsContentModalOpen(false)
      }

      // Don't intercept if a modal is open (except shortcuts modal)
      if (isOverlayActive && !isShortcutsModalOpen) return

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey

      // Ctrl/Cmd + R: Restart test
      if (ctrlKey && e.key === 'r' && !e.shiftKey) {
        e.preventDefault()
        if (engine.resetGame) {
          engine.resetGame()
        }
        return
      }

      // Ctrl/Cmd + ,: Open settings
      if (ctrlKey && e.key === ',') {
        e.preventDefault()
        setActiveTab('settings')
        return
      }

      // ?: Show keyboard shortcuts
      if (e.key === '?' && !isInput) {
        e.preventDefault()
        setIsShortcutsModalOpen(true)
        return
      }

      // Ctrl/Cmd + P: Open Command Palette
      if (ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setIsCommandPaletteOpen(prev => !prev)
        return
      }

      // Ctrl/Cmd + T: Open Themes
      if (ctrlKey && e.key === 't') {
        e.preventDefault()
        setIsThemeModalOpen(prev => !prev)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOverlayActive, isThemeModalOpen, isLoginModalOpen, isLogoutModalOpen, isClearDataModalOpen, isShortcutsModalOpen, isCommandPaletteOpen, isContentModalOpen, engine])

  // Display value for header
  const displayValue = (() => {
    if (startTime) return testMode === 'time' ? timeLeft : liveWpm
    if (isFinished) return results.wpm
    return testMode === 'time' ? testLimit : '—'
  })()

  // Define Command Palette Actions
  const commandPaletteActions = [
    { id: 'restart', label: 'Restart Test', icon: <RefreshCw size={18} />, shortcut: 'Tab', onSelect: () => engine.resetGame() },
    { id: 'chameleon', label: `Chameleon Flow: ${isChameleonEnabled ? 'ON' : 'OFF'}`, icon: <Flame size={18} />, onSelect: () => setIsChameleonEnabled(!isChameleonEnabled) },
    { 
      id: 'caret-style', 
      label: `Caret Style: ${caretStyle.toUpperCase()}`, 
      icon: <Type size={18} />, 
      onSelect: () => {
        const styles = ['bar', 'block', 'fire'];
        const next = styles[(styles.indexOf(caretStyle) + 1) % styles.length];
        setCaretStyle(next);
      } 
    },
    { id: 'smooth-caret', label: `Smooth Caret: ${isSmoothCaret ? 'ON' : 'OFF'}`, icon: <Zap size={18} />, onSelect: () => setIsSmoothCaret(!isSmoothCaret) },
    { id: 'kinetic', label: `Kinetic Feedback: ${isKineticEnabled ? 'ON' : 'OFF'}`, icon: <Activity size={18} />, onSelect: () => setIsKineticEnabled(!isKineticEnabled) },
    { id: 'sound', label: `Sound Effects: ${isSoundEnabled ? 'ON' : 'OFF'}`, icon: isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />, onSelect: () => setIsSoundEnabled(!isSoundEnabled) },
    { id: 'hall-effect', label: `Hall Effect: ${isHallEffect ? 'ON' : 'OFF'}`, icon: <Cpu size={18} />, onSelect: () => setIsHallEffect(!isHallEffect) },
    { id: 'error-feedback', label: `Error Feedback: ${isErrorFeedbackEnabled ? 'ON' : 'OFF'}`, icon: <AlertCircle size={18} />, onSelect: () => setIsErrorFeedbackEnabled(!isErrorFeedbackEnabled) },
    { id: 'ghost', label: `Ghost Racing: ${isGhostEnabled ? 'ON' : 'OFF'}`, icon: <Ghost size={18} />, onSelect: () => setIsGhostEnabled(!isGhostEnabled) },
    { id: 'zen', label: `Zen Mode: ${isZenMode ? 'ON' : 'OFF'}`, icon: <Play size={18} />, onSelect: () => setIsZenMode(!isZenMode) },
    { id: 'typing', label: 'Typing Mode', icon: <Keyboard size={18} />, onSelect: () => setActiveTab('typing') },
    { id: 'leaderboard', label: 'Global Leaderboard', icon: <Globe size={18} />, onSelect: () => setActiveTab('leaderboard') },
    { id: 'history', label: 'Test History', icon: <History size={18} />, onSelect: () => setActiveTab('history') },
    { id: 'dashboard', label: 'Profile Dashboard', icon: <User size={18} />, onSelect: () => setActiveTab('dashboard') },
    { id: 'themes', label: 'Change Theme', icon: <Palette size={18} />, shortcut: 'Ctrl+T', onSelect: () => setIsThemeModalOpen(true) },
    { id: 'settings', label: 'App Settings', icon: <Settings size={18} />, shortcut: 'Ctrl+,', onSelect: () => setActiveTab('settings') },
    { id: 'custom-content', label: 'Custom Content', icon: <BookOpen size={18} />, onSelect: () => setIsContentModalOpen(true) },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: <Shield size={18} />, shortcut: '?', onSelect: () => setIsShortcutsModalOpen(true) },
    { id: 'emergency-logout', label: 'Emergency Sign Out', icon: <LogOut size={18} />, onSelect: () => handleLogout() },
    isLoggedIn 
      ? { id: 'logout', label: 'Sign Out', icon: <LogOut size={18} />, onSelect: () => toggleLogoutModal(true) }
      : { id: 'login', label: 'Sign In / Register', icon: <User size={18} />, onSelect: () => toggleLoginModal(true) }
  ]

  return (
    <div 
      className={`app-container ${isCurrentlyTyping ? 'is-typing' : ''}`}
      onClick={handleGlobalInteraction} 
      onKeyDown={handleGlobalInteraction}
      style={{ paddingTop: isWeb ? '0' : '32px' }}
      id="main-content"
    >
      {/* Flow Progress Bar */}
      {isCurrentlyTyping && testMode === 'time' && (
        <motion.div 
          className="flow-progress-bar"
          initial={{ width: '0%' }}
          animate={{ width: `${(timeLeft / testLimit) * 100}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      )}
      {!isWeb && <TitleBar />}
      
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        testStarted={!!startTime && !isFinished}
        isZenMode={isZenMode}
        onNotification={addToast}
        selectedAvatarId={selectedAvatarId}
        isLoggedIn={isLoggedIn}
        onProfileClick={() => {
          if (isLoggedIn) {
            setActiveTab('dashboard')
          } else {
            toggleLoginModal(true)
          }
        }}
      />

      <div className="main-viewport">
        {!isOverlayActive && (
          <Header
            testStarted={!!startTime && !isFinished}
            username={username}
            isLoggedIn={isLoggedIn}
            setUsername={updateUsername}
            openLoginModal={() => toggleLoginModal(true)}
            onLogoutRequest={() => toggleLogoutModal(true)}
            selectedAvatarId={selectedAvatarId}
            onNavigateDashboard={() => setActiveTab('dashboard')}
            liveWpm={liveWpm}
            openThemeModal={() => toggleThemeModal(true)}
            openContentModal={() => setIsContentModalOpen(true)}
          />
        )}

        {/* Config Bar moved to Header */}

        <main className="content-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              style={{ height: '100%', width: '100%' }}
            >
              <Suspense fallback={<LoadingSpinner />}>
                {activeTab === 'typing' ? (
                  <TypingEngine
                    engine={engine}
                    testMode={testMode}
                    testLimit={testLimit}
                    isSmoothCaret={isSmoothCaret}
                    isOverlayActive={isOverlayActive}
                  />
                ) : activeTab === 'history' ? (
                  <HistoryView data={mergedHistory} />
                ) : activeTab === 'settings' ? (
                  <SettingsView
                    onClearHistory={() => toggleClearModal(true)}
                    openThemeModal={() => toggleThemeModal(true)}
                    openContentModal={() => setIsContentModalOpen(true)}
                  />
                ) : activeTab === 'dashboard' ? (
                  <DashboardView
                    stats={{ pb }}
                    history={mergedHistory}
                    username={username}
                    selectedAvatarId={selectedAvatarId}
                    unlockedAvatars={unlockedAvatars}
                    currentLevel={currentLevel}
                    onUpdateAvatar={updateAvatar}
                    setUsername={updateUsername}
                    isLoggedIn={isLoggedIn}
                    onDeleteAccount={() => toggleDeleteAccountModal(true)}
                    onLogout={() => toggleLogoutModal(true)}
                    onSettings={() => setActiveTab('settings')}
                  />
                ) : activeTab === 'leaderboard' ? (
                  <LeaderboardView currentUser={username} />
                ) : (
                  <NotFound 
                    activeTab={activeTab} 
                    onBackHome={() => setActiveTab('typing')} 
                  />
                )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className={`status-bar ${(!!startTime && !isFinished && isZenMode) ? 'zen-active' : ''}`}>
          <div className="status-bar-left">
            <div className="status-item">
              <span className="status-label">WPM</span>
              <span className="status-value">{(!!startTime && !isFinished) ? liveWpm : (isFinished ? results.wpm : '—')}</span>
            </div>
            {testMode === 'time' && (
              <div className="status-item">
                <span className="status-label">Time</span>
                <span className="status-value">
                  {(() => {
                    const displayTime = (!!startTime && !isFinished) ? (timeLeft ?? testLimit) : testLimit
                    return `${Math.max(0, Math.round(displayTime))}s`
                  })()}
                </span>
              </div>
            )}
            {testMode === 'words' && (
              <div className="status-item">
                <span className="status-label">Time</span>
                <span className="status-value">
                  {(() => {
                    if (!!startTime && !isFinished) {
                      const mins = Math.floor(elapsedTime / 60)
                      const secs = elapsedTime % 60
                      if (mins > 0) {
                        return `${mins}:${String(secs).padStart(2, '0')}`
                      }
                      return `${elapsedTime}s`
                    }
                    return '0s'
                  })()}
                </span>
              </div>
            )}
          </div>
          <div className="status-bar-right">
            <div className="status-item clickable" onClick={handleReload} title="Restart test">
              <kbd>Tab</kbd> to restart
            </div>
            {/* Visual alert for Caps Lock to prevent user frustration during tests */}
            {isCapsLockOn && (
              <div className="caps-lock-abs-container">
                <Tooltip content="Caps Lock is ON" align="top">
                  <div className="caps-locks" />
                </Tooltip>
              </div>
            )}

            {window.api && window.api.getVersion && (
              <div className="status-item version-item clickable" title={`Version ${version}`}>
                v{version}
              </div>
            )}
          </div>
        </footer>
      </div>

      {/* Modals */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => toggleThemeModal(false)}
        currentTheme={theme}
        onSelect={handleThemeChange}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => toggleLoginModal(false)}
        onLogin={() => toggleLoginModal(false)}
      />

      <CustomContentModal
        isOpen={isContentModalOpen}
        onClose={() => setIsContentModalOpen(false)}
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

      <ConfirmationModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => toggleDeleteAccountModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="This will delete your cloud account, email, profile, and scores permanently. This action cannot be undone."
        confirmText="Delete Account"
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        actions={commandPaletteActions}
        theme={theme}
      />
    </div>
  )
}

export default AppLayout
