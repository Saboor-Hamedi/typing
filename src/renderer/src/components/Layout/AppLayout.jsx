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
import { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
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
import { useTheme } from '../../contexts/ThemeContext'
import { useSettings } from '../../contexts/SettingsContext'
import { useUser } from '../../contexts/UserContext'
import { soundEngine } from '../../utils/SoundEngine'
import { SUCCESS_MESSAGES, PROGRESSION, STORAGE_KEYS } from '../../constants'
import { deleteUserData } from '../../utils/supabase'
import { LoadingSpinner, KeyboardShortcutsModal, Tooltip } from '../Common'
import CommandPalette from '../CommandPalette/CommandPalette'
import { Search, Keyboard, Palette, Globe, History, Trophy, Settings, LogOut, Play, RefreshCw, User, Shield, Flame, Type, Zap, Ghost, Volume2, VolumeX, Cpu, Activity, AlertCircle, BookOpen, Quote, Edit } from 'lucide-react'
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
    setIsErrorFeedbackEnabled,
    difficulty,
    setDifficulty,
    dictionary // Exposed dictionary for search
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
  const [editingSentence, setEditingSentence] = useState(null)
  const [paletteInitialQuery, setPaletteInitialQuery] = useState('')

  const handleEditSentence = (text) => {
      setEditingSentence(text)
      setIsContentModalOpen(true)
  }

  const closeContentModal = () => {
      setIsContentModalOpen(false)
      setEditingSentence(null)
  }

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
  const isTestRunning = !!startTime && !isFinished

  // Account manager hook
  const account = useAccountManager(engine, addToast)
  const { mergedHistory, currentLevel } = account

  // Chameleon Flow (optimized)
  const { heat } = useChameleonFlow(
    liveWpm,
    pb,
    isTestRunning,
    isChameleonEnabled
  )

  // Combined Progress Calculation
  const testProgress = useMemo(() => {
    if (!isTestRunning) return 0
    if (testMode === 'time') {
      return 1 - (timeLeft / testLimit)
    } else if (engine.wordProgress) {
      const typed = engine.wordProgress.typed
      const total = engine.words.length
      return total > 0 ? typed / total : 0
    }
    return 0
  }, [isTestRunning, testMode, timeLeft, testLimit, engine.wordProgress, engine.words.length])

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

  // Persist activeTab active state
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

      // Don't intercept if a modal is open (except shortcuts modal and command palette)
      if (isOverlayActive && !isShortcutsModalOpen && !isCommandPaletteOpen && !isContentModalOpen) return

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
      // Ctrl/Cmd + Shift + P: Open Settings/Commands Mode
      if (ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        if (e.shiftKey) {
           setPaletteInitialQuery('>') // Command Mode
        } else {
           setPaletteInitialQuery('') // Content Mode
        }
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
  // 1. Content Actions (Type this text) - Visible in default mode
  const contentActions = (dictionary?.content || []).map((text, idx) => ({
    id: `content-${idx}`,
    label: text.length > 50 ? text.slice(0, 50) + '...' : text,
    icon: <Quote size={18} />,
    type: 'content',
    onSelect: () => {
        setActiveTab('typing')
        if (difficulty !== 'custom') setDifficulty('custom')
        engine.loadCustomText(text)
    }
  }))

  // 2. Edit Actions (Edit this text) - Visible in Command Mode (>)
  const editActions = (dictionary?.content || []).map((text, idx) => ({
    id: `edit-${idx}`,
    label: `Edit: "${text.length > 30 ? text.slice(0, 30) + '...' : text}"`,
    icon: <Edit size={18} />,
    type: 'command',
    onSelect: () => handleEditSentence(text)
  }))

  const commandPaletteActions = [
    { id: 'restart', label: 'Restart Test', icon: <RefreshCw size={18} />, shortcut: 'Tab', type: 'command', onSelect: () => engine.resetGame() },
    { id: 'chameleon', label: `Chameleon Flow: ${isChameleonEnabled ? 'ON' : 'OFF'}`, icon: <Flame size={18} />, type: 'command', onSelect: () => setIsChameleonEnabled(!isChameleonEnabled) },
    { 
      id: 'caret-style', 
      label: `Caret Style: ${caretStyle.toUpperCase()}`, 
      icon: <Type size={18} />, 
      type: 'command',
      onSelect: () => {
        const styles = ['bar', 'block', 'fire'];
        const next = styles[(styles.indexOf(caretStyle) + 1) % styles.length];
        setCaretStyle(next);
      } 
    },
    { id: 'smooth-caret', label: `Smooth Caret: ${isSmoothCaret ? 'ON' : 'OFF'}`, icon: <Zap size={18} />, type: 'command', onSelect: () => setIsSmoothCaret(!isSmoothCaret) },
    { id: 'kinetic', label: `Kinetic Feedback: ${isKineticEnabled ? 'ON' : 'OFF'}`, icon: <Activity size={18} />, type: 'command', onSelect: () => setIsKineticEnabled(!isKineticEnabled) },
    { id: 'sound', label: `Sound Effects: ${isSoundEnabled ? 'ON' : 'OFF'}`, icon: isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />, type: 'command', onSelect: () => setIsSoundEnabled(!isSoundEnabled) },
    { id: 'hall-effect', label: `Hall Effect: ${isHallEffect ? 'ON' : 'OFF'}`, icon: <Cpu size={18} />, type: 'command', onSelect: () => setIsHallEffect(!isHallEffect) },
    { id: 'error-feedback', label: `Error Feedback: ${isErrorFeedbackEnabled ? 'ON' : 'OFF'}`, icon: <AlertCircle size={18} />, type: 'command', onSelect: () => setIsErrorFeedbackEnabled(!isErrorFeedbackEnabled) },
    { id: 'ghost', label: `Ghost Racing: ${isGhostEnabled ? 'ON' : 'OFF'}`, icon: <Ghost size={18} />, type: 'command', onSelect: () => setIsGhostEnabled(!isGhostEnabled) },
    { id: 'zen', label: `Zen Mode: ${isZenMode ? 'ON' : 'OFF'}`, icon: <Play size={18} />, type: 'command', onSelect: () => setIsZenMode(!isZenMode) },
    { id: 'typing', label: 'Typing Mode', icon: <Keyboard size={18} />, type: 'command', onSelect: () => setActiveTab('typing') },
    { id: 'leaderboard', label: 'Global Leaderboard', icon: <Globe size={18} />, type: 'command', onSelect: () => setActiveTab('leaderboard') },
    { id: 'history', label: 'Test History', icon: <History size={18} />, type: 'command', onSelect: () => setActiveTab('history') },
    { id: 'dashboard', label: 'Profile Dashboard', icon: <User size={18} />, type: 'command', onSelect: () => setActiveTab('dashboard') },
    { id: 'themes', label: 'Change Theme', icon: <Palette size={18} />, shortcut: 'Ctrl+T', type: 'command', onSelect: () => setIsThemeModalOpen(true) },
    { id: 'settings', label: 'App Settings', icon: <Settings size={18} />, shortcut: 'Ctrl+,', type: 'command', onSelect: () => setActiveTab('settings') },
    { id: 'custom-content', label: 'Custom Content', icon: <BookOpen size={18} />, type: 'command', onSelect: () => setIsContentModalOpen(true) },
    // Add custom content actions
    ...contentActions,
    // Add edit actions (only visible in command mode)
    ...editActions,
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: <Shield size={18} />, shortcut: '?', type: 'command', onSelect: () => setIsShortcutsModalOpen(true) },
    { id: 'emergency-logout', label: 'Emergency Sign Out', icon: <LogOut size={18} />, type: 'command', onSelect: () => handleLogout() },
    isLoggedIn 
      ? { id: 'logout', label: 'Sign Out', icon: <LogOut size={18} />, type: 'command', onSelect: () => toggleLogoutModal(true) }
      : { id: 'login', label: 'Sign In / Register', icon: <User size={18} />, type: 'command', onSelect: () => toggleLoginModal(true) }
  ]

  return (
    <div 
      className={`app-container ${isTestRunning ? 'is-typing' : ''}`}
      onClick={handleGlobalInteraction} 
      onKeyDown={handleGlobalInteraction}
      style={{ paddingTop: isWeb ? '0' : '32px' }}
      id="main-content"
    >


      {/* Performance/Progress Hybrid Bar */}
      {isTestRunning && (
        <motion.div 
          className="chameleon-progress-bar"
          initial={{ width: '0%' }}
          animate={{ 
            width: `${testProgress * 100}%` 
          }}
          transition={{ 
            width: { type: 'spring', stiffness: 300, damping: 30 },
            layout: { duration: 0.2 }
          }}
          style={{
            // Extra glow purely based on speed
            filter: isChameleonEnabled ? `brightness(${1 + heat}) drop-shadow(0 0 ${heat * 10}px var(--main-color))` : 'none'
          }}
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
        {/* Chameleon Ambient Aura & Fire Effect (Centered behind content) */}
        {isTestRunning && isChameleonEnabled && (
          <div className="chameleon-aura-layer">
            {/* Ground Heat Base */}
            <div className="chameleon-fire-base" />

            {/* Real Full-Width Fire (Mellow slow flames) */}
            {[...Array(16)].map((_, i) => (
              <motion.div 
                key={i}
                className="chameleon-flame-tongue"
                animate={{ 
                  opacity: heat > 0.3 ? (heat - 0.3) * 0.6 : 0, 
                  height: [`${2 + (heat * 15)}%`, `${5 + (heat * 25)}%`, `${3 + (heat * 18)}%`],
                  scaleX: [1, 1.05, 0.98, 1],
                  translateX: [`${(i/16 * 100) - 2}%`, `${(i/16 * 100) + 1}%`, `${(i/16 * 100) - 2}%`]
                }}
                transition={{ 
                  height: { duration: 1.5 + (Math.random() * 1), repeat: Infinity, ease: "easeInOut" },
                  scaleX: { duration: 2 + (Math.random() * 1), repeat: Infinity, ease: "easeInOut" },
                  translateX: { duration: 3 + (Math.random() * 2), repeat: Infinity, ease: "easeInOut" },
                  opacity: { duration: 0.5 }
                }}
                style={{
                  left: `${(i / 16) * 100}%`,
                  background: `linear-gradient(to top, rgba(var(--main-color-rgb), 0.45) 0%, rgba(var(--main-color-rgb), 0.15) 60%, transparent)`
                }}
              />
            ))}
          </div>
        )}
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
                    onEditSentence={handleEditSentence}
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
        onClose={closeContentModal}
        editingSentence={editingSentence}
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
        initialQuery={paletteInitialQuery}
      />
    </div>
  )
}

export default AppLayout
