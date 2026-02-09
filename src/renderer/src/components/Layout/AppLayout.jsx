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
import ConfirmationModal from '../Modals/ConfirmationModal'
import SentenceModal from '../Modals/SentenceModal'
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
import ChameleonAura from '../Effects/ChameleonAura'
import {
  Search,
  Keyboard,
  Palette,
  Globe,
  History,
  Trophy,
  Settings,
  LogOut,
  Play,
  RefreshCw,
  User,
  Shield,
  Flame,
  Type,
  Zap,
  Ghost,
  Volume2,
  VolumeX,
  Cpu,
  Activity,
  AlertCircle,
  BookOpen,
  Quote,
  LogIn,
  Pause
} from 'lucide-react'
import ProfileMenu from '../Sidebar/ProfileMenu'
import './AppLayout.css'

// Lazy load views for code splitting
const SettingsView = lazy(() => import('../Settings/SettingsView'))
const DashboardView = lazy(() => import('../Dashboard/DashboardView'))
const LeaderboardView = lazy(() => import('../Leaderboard/LeaderboardView'))
const HistoryView = lazy(() => import('../History/HistoryView'))
const AchievementsView = lazy(() => import('../Achievements/AchievementsView'))
const DocumentationView = lazy(() => import('../Documentation/DocumentationView'))
const DatabaseView = lazy(() => import('../Database/DatabaseView'))
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
    isFireCaretEnabled,
    setIsFireCaretEnabled,
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
    setUnlockedAvatars,
    handleLogout,
    updateUsername,
    isUserLoaded
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
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isCapsLockOn, setIsCapsLockOn] = useState(false)
  const [paletteInitialQuery, setPaletteInitialQuery] = useState('')
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isSentenceModalOpen, setIsSentenceModalOpen] = useState(false)

  // Engine hook
  const engine = useEngine(testMode, testLimit, activeTab)
  const {
    startTime,
    isFinished,
    isReplaying,
    results,
    liveWpm,
    timeLeft,
    elapsedTime,
    pb,
    isSoundEnabled,
    setIsSoundEnabled,
    isHallEffect,
    setIsHallEffect,
    soundProfile,
    setSoundProfile,
    isGhostEnabled,
    setIsGhostEnabled,
    testHistory,
    clearAllData,
    ghostSpeed,
    setGhostSpeed,
    isPaused,
    isManuallyPaused,
    pauseGame,
    resumeGame,
    resetGame
  } = engine

  // Derived state for immersive mode
  const isTestRunning = !!startTime && !isFinished

  // Account manager hook
  const account = useAccountManager(engine, addToast)
  const { mergedHistory, currentLevel, progression } = account

  // Chameleon Flow (optimized: no longer return heat to prevent re-renders)
  useChameleonFlow(liveWpm, pb, isTestRunning, isChameleonEnabled)

  // Combined Progress Calculation
  const testProgress = useMemo(() => {
    if (!isTestRunning || !engine.wordProgress) return 0

    // Both modes now track word progression for a consistent "type-to-move" feel
    const typed = engine.wordProgress.typed
    const total = engine.words.length
    return total > 0 ? typed / total : 0
  }, [isTestRunning, engine.wordProgress, engine.words.length])

  // Synchronize unlocked avatars with current level (Add-only Sync)
  useEffect(() => {
    if (!isUserLoaded || typeof currentLevel !== 'number') return

    // Calculate which avatars SHOULD be unlocked based on current level
    const eligibleIds = PROGRESSION.AVATAR_UNLOCK_LEVELS.filter(
      (entry) => currentLevel >= entry.level
    ).map((entry) => entry.id)

    // Merge existing persistsed unlocks with new eligible ones (never remove)
    const updatedUnlocked = [
      ...new Set([...unlockedAvatars, ...PROGRESSION.DEFAULT_UNLOCKED_AVATARS, ...eligibleIds])
    ]
    const currentUnlockedSorted = [...unlockedAvatars].sort((a, b) => a - b)
    const updatedUnlockedSorted = [...updatedUnlocked].sort((a, b) => a - b)

    // Only update if there are NEW unlocks
    if (JSON.stringify(updatedUnlockedSorted) !== JSON.stringify(currentUnlockedSorted)) {
      const newlyUnlocked = updatedUnlocked.filter((id) => !unlockedAvatars.includes(id))
      if (newlyUnlocked.length > 0) {
        newlyUnlocked.forEach((id) => {
          const def = PROGRESSION.AVATAR_UNLOCK_LEVELS.find((a) => a.id === id)
          if (def) addToast?.(`${SUCCESS_MESSAGES.AVATAR_UNLOCKED}: ${def.name}`, 'success')
        })
        // Persist the new unlock set
        setUnlockedAvatars(updatedUnlocked)
      }
    }
  }, [currentLevel, unlockedAvatars, setUnlockedAvatars, addToast, isUserLoaded])

  // Global interactions
  const handleGlobalInteraction = useCallback(() => soundEngine.warmUp(), [])

  const handleReload = useCallback(() => {
    setActiveTab('typing')
    resetGame()
  }, [resetGame])

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
  const toggleProfileMenu = useCallback((isOpen) => setIsProfileMenuOpen(isOpen), [])

  const togglePause = useCallback(() => {
    if (isManuallyPaused) {
      resumeGame()
    } else if (startTime && !isFinished) {
      pauseGame(true)
    } else {
      resetGame()
      setActiveTab('typing')
    }
  }, [isManuallyPaused, resumeGame, pauseGame, startTime, isFinished, resetGame, setActiveTab])

  // Theme change handler
  const handleThemeChange = useCallback(
    (newTheme) => {
      setTheme(newTheme)
    },
    [setTheme]
  )

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
  const isOverlayActive =
    isThemeModalOpen ||
    isLoginModalOpen ||
    isLogoutModalOpen ||
    isClearDataModalOpen ||
    isShortcutsModalOpen ||
    isCommandPaletteOpen ||
    isSentenceModalOpen

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

      // Escape handling
      if (e.key === 'Escape') {
        // 1. Close any open modal first
        if (isOverlayActive) {
          if (isThemeModalOpen) setIsThemeModalOpen(false)
          if (isLoginModalOpen) setIsLoginModalOpen(false)
          if (isLogoutModalOpen) setIsLogoutModalOpen(false)
          if (isClearDataModalOpen) setIsClearDataModalOpen(false)
          if (isShortcutsModalOpen) setIsShortcutsModalOpen(false)
          if (isCommandPaletteOpen) setIsCommandPaletteOpen(false)
          if (isProfileMenuOpen) setIsProfileMenuOpen(false)
          if (isSentenceModalOpen) setIsSentenceModalOpen(false)
          return
        }

        // 2. If no modal is open and we're not in typing tab, go back to typing
        if (activeTab !== 'typing') {
          setActiveTab('typing')
          return
        }

        // 3. If we're already in typing tab and test is finished, engine.js handles reset via its own listener
      }

      // Don't intercept if a modal is open (except shortcuts modal and command palette)
      if (isOverlayActive && !isShortcutsModalOpen && !isCommandPaletteOpen) return

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey

      // Ctrl/Cmd + R: Restart test
      if (ctrlKey && e.key === 'r' && !e.shiftKey) {
        e.preventDefault()
        resetGame()
        return
      }

      // Ctrl/Cmd + Shift + R: Reload Window
      if (ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault()
        window.location.reload()
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

      // Ctrl/Cmd + Shift + P: Open Command Palette in COMMAND MODE
      if (ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setPaletteInitialQuery('>')
        setIsCommandPaletteOpen(true)
        return
      }

      // Ctrl/Cmd + P: Open Command Palette in SEARCH MODE
      if (ctrlKey && e.key.toLowerCase() === 'p' && !e.shiftKey) {
        e.preventDefault()
        setPaletteInitialQuery('')
        setIsCommandPaletteOpen(true)
        return
      }

      // Ctrl/Cmd + Shift + Enter: Toggle Pause
      if (ctrlKey && e.shiftKey && e.key === 'Enter') {
        e.preventDefault()
        togglePause()
        return
      }

      // Ctrl/Cmd + T: Open Themes
      if (ctrlKey && e.key === 't') {
        e.preventDefault()
        setIsThemeModalOpen((prev) => !prev)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    isOverlayActive,
    isThemeModalOpen,
    isLoginModalOpen,
    isLogoutModalOpen,
    isClearDataModalOpen,
    isShortcutsModalOpen,
    isCommandPaletteOpen,
    engine,
    togglePause
  ])

  // Display value for header (Now always WPM)
  const displayValue = (() => {
    if (startTime) return liveWpm
    if (isFinished) return results.wpm
    return '—'
  })()

  // Define Command Palette Actions

  const commandPaletteActions = [
    {
      id: 'restart',
      label: 'Restart Test',
      icon: <RefreshCw size={18} />,
      shortcut: 'Tab',
      type: 'command',
      category: 'Game',
      onSelect: () => resetGame()
    },
    {
      id: 'pause-test',
      label:
        !startTime || isFinished ? 'Game Start' : isManuallyPaused ? 'Game Resume' : 'Game Stop',
      icon: !startTime || isFinished || isManuallyPaused ? <Play size={18} /> : <Pause size={18} />,
      shortcut: 'Ctrl+Shift+Enter',
      type: 'command',
      category: 'Game',
      onSelect: togglePause
    },
    {
      id: 'chameleon',
      label: `Chameleon Flow: ${isChameleonEnabled ? 'ON' : 'OFF'}`,
      icon: <Flame size={18} />,
      type: 'command',
      category: 'Effects',
      onSelect: () => setIsChameleonEnabled(!isChameleonEnabled)
    },
    {
      id: 'caret-style-thick-block',
      label: `Caret Style: ${caretStyle === 'block' ? 'Thick Block' : 'Line Caret'}`,
      icon: <Type size={18} />,
      type: 'command',
      category: 'Display',
      onSelect: () => {
        const styles = ['bar', 'block']
        const next = styles[(styles.indexOf(caretStyle) + 1) % styles.length]
        setCaretStyle(next)
      }
    },
    {
      id: 'fire-caret',
      label: `Fire Caret Effect: ${isFireCaretEnabled ? 'ON' : 'OFF'}`,
      icon: <Flame size={18} />,
      type: 'command',
      category: 'Effects',
      onSelect: () => setIsFireCaretEnabled(!isFireCaretEnabled)
    },
    {
      id: 'smooth-caret',
      label: `Smooth Caret: ${isSmoothCaret ? 'ON' : 'OFF'}`,
      icon: <Zap size={18} />,
      type: 'command',
      category: 'Display',
      onSelect: () => setIsSmoothCaret(!isSmoothCaret)
    },
    {
      id: 'kinetic',
      label: `Kinetic Feedback: ${isKineticEnabled ? 'ON' : 'OFF'}`,
      icon: <Activity size={18} />,
      type: 'command',
      category: 'Feedback',
      onSelect: () => setIsKineticEnabled(!isKineticEnabled)
    },
    {
      id: 'sound-toggle',
      label: `Sound Effects: ${isSoundEnabled ? 'ON' : 'OFF'}`,
      icon: isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />,
      type: 'command',
      category: 'Audio',
      onSelect: () => setIsSoundEnabled(!isSoundEnabled)
    },
    {
      id: 'sound-thocky',
      label: 'Sound: Thocky',
      icon: <Volume2 size={18} />,
      type: 'command',
      category: 'Sound Profiles',
      onSelect: () => engine.setSoundProfile('thocky')
    },
    {
      id: 'sound-creamy',
      label: 'Sound: Creamy',
      icon: <Volume2 size={18} />,
      type: 'command',
      category: 'Sound Profiles',
      onSelect: () => engine.setSoundProfile('creamy')
    },
    {
      id: 'sound-clicky',
      label: 'Sound: Clicky',
      icon: <Volume2 size={18} />,
      type: 'command',
      category: 'Sound Profiles',
      onSelect: () => engine.setSoundProfile('clicky')
    },
    {
      id: 'sound-asmr',
      label: 'Sound: ASMR',
      icon: <Volume2 size={18} />,
      type: 'command',
      category: 'Sound Profiles',
      onSelect: () => engine.setSoundProfile('asmr')
    },
    {
      id: 'sound-raindrop',
      label: 'Sound: Raindrop',
      icon: <Volume2 size={18} />,
      type: 'command',
      category: 'Sound Profiles',
      onSelect: () => engine.setSoundProfile('raindrop')
    },
    {
      id: 'sound-wood',
      label: 'Sound: Wood',
      icon: <Volume2 size={18} />,
      type: 'command',
      category: 'Sound Profiles',
      onSelect: () => engine.setSoundProfile('wood')
    },
    {
      id: 'sound-velvet',
      label: 'Sound: Velvet',
      icon: <Volume2 size={18} />,
      type: 'command',
      category: 'Sound Profiles',
      onSelect: () => engine.setSoundProfile('velvet')
    },
    {
      id: 'sound-zen-profile',
      label: 'Sound: Zen',
      icon: <Volume2 size={18} />,
      type: 'command',
      category: 'Sound Profiles',
      onSelect: () => engine.setSoundProfile('zen')
    },
    {
      id: 'sound-paper',
      label: 'Sound: Paper',
      icon: <Volume2 size={18} />,
      type: 'command',
      category: 'Sound Profiles',
      onSelect: () => engine.setSoundProfile('paper')
    },
    {
      id: 'hall-effect',
      label: `Hall Effect: ${isHallEffect ? 'ON' : 'OFF'}`,
      icon: <Cpu size={18} />,
      type: 'command',
      category: 'Audio',
      onSelect: () => setIsHallEffect(!isHallEffect)
    },
    {
      id: 'error-feedback',
      label: `Error Feedback: ${isErrorFeedbackEnabled ? 'ON' : 'OFF'}`,
      icon: <AlertCircle size={18} />,
      type: 'command',
      category: 'Feedback',
      onSelect: () => setIsErrorFeedbackEnabled(!isErrorFeedbackEnabled)
    },
    {
      id: 'ghost',
      label: `Ghost Racing: ${isGhostEnabled ? 'ON' : 'OFF'}`,
      icon: <Ghost size={18} />,
      type: 'command',
      category: 'Game',
      onSelect: () => setIsGhostEnabled(!isGhostEnabled)
    },
    {
      id: 'zen',
      label: `Zen Mode: ${isZenMode ? 'ON' : 'OFF'}`,
      icon: <Play size={18} />,
      type: 'command',
      category: 'Modes',
      onSelect: () => setIsZenMode(!isZenMode)
    },
    {
      id: 'typing',
      label: 'Typing Mode',
      icon: <Keyboard size={18} />,
      type: 'command',
      category: 'Navigation',
      onSelect: () => setActiveTab('typing')
    },
    {
      id: 'leaderboard',
      label: 'Global Leaderboard',
      icon: <Globe size={18} />,
      type: 'command',
      category: 'Navigation',
      onSelect: () => setActiveTab('leaderboard')
    },
    {
      id: 'achievements',
      label: 'Rank & Achievements',
      icon: <Trophy size={18} />,
      type: 'command',
      category: 'Navigation',
      onSelect: () => setActiveTab('achievements')
    },
    {
      id: 'docs',
      label: 'System Documentation',
      icon: <BookOpen size={18} />,
      type: 'command',
      category: 'Navigation',
      onSelect: () => setActiveTab('docs')
    },
    {
      id: 'history',
      label: 'Test History',
      icon: <History size={18} />,
      type: 'command',
      category: 'Navigation',
      onSelect: () => setActiveTab('history')
    },
    {
      id: 'dashboard',
      label: 'Profile Dashboard',
      icon: <User size={18} />,
      type: 'command',
      category: 'Navigation',
      onSelect: () => setActiveTab('dashboard')
    },
    {
      id: 'themes',
      label: 'Change Theme',
      icon: <Palette size={18} />,
      shortcut: 'Ctrl+T',
      type: 'command',
      category: 'Navigation',
      onSelect: () => setIsThemeModalOpen(true)
    },
    {
      id: 'settings',
      label: 'App Settings',
      icon: <Settings size={18} />,
      shortcut: 'Ctrl+,',
      type: 'command',
      category: 'Navigation',
      onSelect: () => setActiveTab('settings')
    },
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts',
      icon: <Shield size={18} />,
      shortcut: '?',
      type: 'command',
      category: 'System',
      onSelect: () => setIsShortcutsModalOpen(true)
    },
    {
      id: 'reload-window',
      label: 'Reload Window',
      icon: <RefreshCw size={18} />,
      shortcut: 'Ctrl+Shift+R',
      type: 'command',
      category: 'System',
      onSelect: () => window.location.reload()
    },
    {
      id: 'emergency-logout',
      label: 'Emergency Sign Out',
      icon: <LogOut size={18} />,
      type: 'command',
      category: 'System',
      onSelect: () => handleLogout()
    },
    isLoggedIn
      ? {
          id: 'logout',
          label: 'Sign Out',
          icon: <LogOut size={18} />,
          type: 'command',
          onSelect: () => toggleLogoutModal(true)
        }
      : {
          id: 'login',
          label: 'Sign In / Register',
          icon: <User size={18} />,
          type: 'command',
          onSelect: () => toggleLoginModal(true)
        }
  ]

  return (
    <div
      className={`app-container ${isTestRunning ? 'is-typing' : ''}`}
      onPointerDown={handleGlobalInteraction}
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
          style={{}}
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
        currentLevel={currentLevel}
        isLoggedIn={isLoggedIn}
        onProfileClick={() => setIsProfileMenuOpen((prev) => !prev)}
      />

      <ProfileMenu
        isOpen={isProfileMenuOpen}
        onClose={() => setIsProfileMenuOpen(false)}
        isLoggedIn={isLoggedIn}
        username={username}
        currentLevel={currentLevel}
        selectedAvatarId={selectedAvatarId}
        onAction={(action) => {
          if (action === 'dashboard') {
            if (isLoggedIn) {
              setActiveTab('dashboard')
            } else {
              setIsLoginModalOpen(true)
            }
          } else if (action === 'settings') {
            setActiveTab('settings')
          } else if (action === 'logout') {
            setIsLogoutModalOpen(true)
          } else if (action === 'login') {
            setIsLoginModalOpen(true)
          }
        }}
      />

      <div className="main-viewport">
        {/* Chameleon Ambient Aura & Fire Effect (Centered behind content) */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <ChameleonAura isEnabled={isTestRunning && isChameleonEnabled} />
        </div>
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
            openSentenceModal={() => setIsSentenceModalOpen(true)}
            resetGame={engine.resetGame}
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
                    addToast={addToast}
                  />
                ) : activeTab === 'history' ? (
                  <HistoryView
                    data={mergedHistory}
                    username={username}
                    avatarId={selectedAvatarId}
                  />
                ) : activeTab === 'settings' ? (
                  <SettingsView
                    onClearHistory={() => toggleClearModal(true)}
                    openThemeModal={() => toggleThemeModal(true)}
                  />
                ) : activeTab === 'dashboard' ? (
                  <DashboardView
                    stats={{ pb }}
                    history={mergedHistory}
                    username={username}
                    selectedAvatarId={selectedAvatarId}
                    unlockedAvatars={unlockedAvatars}
                    currentLevel={currentLevel}
                    progression={progression}
                    onUpdateAvatar={updateAvatar}
                    setUsername={updateUsername}
                    isLoggedIn={isLoggedIn}
                    onDeleteAccount={() => toggleDeleteAccountModal(true)}
                    onLogout={() => toggleLogoutModal(true)}
                    onSettings={() => setActiveTab('settings')}
                    openLoginModal={() => toggleLoginModal(true)}
                  />
                ) : activeTab === 'docs' ? (
                  <DocumentationView />
                ) : activeTab === 'leaderboard' ? (
                  <LeaderboardView currentUser={username} />
                ) : activeTab === 'achievements' ? (
                  <AchievementsView currentLevel={currentLevel} unlockedAvatars={unlockedAvatars} />
                ) : activeTab === 'database' ? (
                  <DatabaseView addToast={addToast} />
                ) : (
                  <NotFound activeTab={activeTab} onBackHome={() => setActiveTab('typing')} />
                )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        <footer
          className={`status-bar ${!!startTime && !isFinished && isZenMode ? 'zen-active' : ''}`}
        >
          <div className="status-bar-left">
            <div className="status-item">
              <span className="status-label">WPM</span>
              <span className="status-value">
                {!!startTime && !isFinished ? liveWpm : isFinished ? results.wpm : '—'}
              </span>
            </div>
            {(testMode === 'time' || testMode === 'words') && (
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
                    if (isFinished) {
                      const mins = Math.floor(results.duration / 60)
                      const secs = results.duration % 60
                      if (mins > 0) return `${mins}:${String(secs).padStart(2, '0')}`
                      return `${results.duration}s`
                    }
                    return '0s'
                  })()}
                </span>
                {!!startTime && !isFinished && !isReplaying && (
                  <div
                    className="status-item clickable pause-status-item"
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePause()
                    }}
                    title={
                      isPaused || isManuallyPaused
                        ? 'Resume Test'
                        : 'Pause Test (Esc or Ctrl+Shift+Enter)'
                    }
                  >
                    <kbd
                      style={{
                        width: '24px',
                        display: 'flex',
                        justifyContent: 'center',
                        padding: '2px 0'
                      }}
                    >
                      {isPaused || isManuallyPaused ? (
                        <Play size={10} fill="currentColor" />
                      ) : (
                        <Pause size={10} fill="currentColor" />
                      )}
                    </kbd>
                  </div>
                )}
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
        engine={engine}
      />

      <SentenceModal
        isOpen={isSentenceModalOpen}
        onClose={() => setIsSentenceModalOpen(false)}
        addToast={addToast}
      />
    </div>
  )
}

export default AppLayout
