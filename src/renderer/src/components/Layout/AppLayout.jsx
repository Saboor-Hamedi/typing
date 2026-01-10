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
import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../Header/Header'
import TitleBar from '../TitleBar/TitleBar'
import Sidebar from '../Sidebar/Sidebar'
import TypingEngine from '../../engine/TypingEngine'
import HistoryView from '../History/HistoryView'
import SettingsView from '../Settings/SettingsView'
import DashboardView from '../Dashboard/DashboardView'
import LeaderboardView from '../Leaderboard/LeaderboardView'
import NotFound from '../Views/NotFound'
import ThemeModal from '../Modals/ThemeModal'
import LoginModal from '../Modals/LoginModal'
import ConfirmationModal from '../Modals/ConfirmationModal'
import { useEngine } from '../../engine/useEngine'
import { useAccountManager } from '../../hooks/useAccountManager'
import { useChameleonFlow } from '../../hooks/useChameleonFlow'
import { useTheme, useSettings, useUser } from '../../contexts'
import { soundEngine } from '../../utils/SoundEngine'
import { ANIMATIONS, SUCCESS_MESSAGES, PROGRESSION } from '../../constants'

/**
 * Main Application Layout
 * Orchestrates all major views and manages global state
 */
const AppLayout = ({ addToast }) => {
  const isElectron = !!window.api
  const isWeb = !isElectron

  // Get context values
  const { theme, setTheme } = useTheme()
  const { 
    testMode, 
    testLimit, 
    setTestMode, 
    setTestLimit,
    isChameleonEnabled,
    isSmoothCaret,
    isZenMode,
    setIsZenMode
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
  const [activeTab, setActiveTab] = useState('typing')
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false)

  // Engine hook
  const engine = useEngine(testMode, testLimit)
  const {
    startTime,
    isFinished,
    results,
    liveWpm,
    timeLeft,
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

  const handleClearAllData = useCallback(async () => {
    if (typeof clearAllData === 'function') {
      await clearAllData()
      addToast('History and PBs cleared', 'success')
      setIsClearDataModalOpen(false)
    }
  }, [clearAllData, addToast])

  // Modal toggles
  const toggleThemeModal = useCallback((isOpen) => setIsThemeModalOpen(isOpen), [])
  const toggleLoginModal = useCallback((isOpen) => setIsLoginModalOpen(isOpen), [])
  const toggleLogoutModal = useCallback((isOpen) => setIsLogoutModalOpen(isOpen), [])
  const toggleClearModal = useCallback((isOpen) => setIsClearDataModalOpen(isOpen), [])

  // Theme change handler
  const handleThemeChange = useCallback((newTheme) => {
    setTheme(newTheme)
    addToast(`${SUCCESS_MESSAGES.THEME_CHANGED} ${newTheme}`, 'success')
  }, [setTheme, addToast])

  // Auto-close Login modal upon successful authentication (OAuth or password)
  useEffect(() => {
    if (isLoggedIn && isLoginModalOpen) {
      setIsLoginModalOpen(false)
      addToast?.('Signed in successfully', 'success')
    }
  }, [isLoggedIn, isLoginModalOpen, addToast])

  // Display value for header
  const displayValue = (() => {
    if (startTime) return testMode === 'time' ? timeLeft : liveWpm
    if (isFinished) return results.wpm
    return testMode === 'time' ? testLimit : '—'
  })()

  // Detect if any modal/overlay is currently active
  const isOverlayActive = isThemeModalOpen || isLoginModalOpen || isLogoutModalOpen || isClearDataModalOpen

  return (
    <div 
      className="app-container" 
      onClick={handleGlobalInteraction} 
      onKeyDown={handleGlobalInteraction}
      style={{ paddingTop: isWeb ? '0' : '32px' }}
      id="main-content"
    >
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
        onNotification={addToast}
      />

      <div className="main-viewport">
        {!isOverlayActive && (
          <Header
            activeTab={activeTab}
            testStarted={!!startTime && !isFinished}
            isZenMode={isZenMode}
            displayValue={displayValue}
            pb={pb}
            username={username}
            isLoggedIn={isLoggedIn}
            setUsername={updateUsername}
            onReload={handleReload}
            openThemeModal={() => toggleThemeModal(true)}
            openLoginModal={() => toggleLoginModal(true)}
            onLogoutRequest={() => toggleLogoutModal(true)}
            selectedAvatarId={selectedAvatarId}
          />
        )}

        <main className="content-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              {...ANIMATIONS.PAGE_TRANSITION}
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
            >
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
                />
              ) : activeTab === 'leaderboard' ? (
                <LeaderboardView currentUser={username} />
              ) : (
                <NotFound 
                  activeTab={activeTab} 
                  onBackHome={() => setActiveTab('typing')} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className={(!!startTime && !isFinished) && isZenMode ? 'zen-active' : ''}>
          <div className="hint">
            <kbd>tab</kbd> to restart |
            <span className="kb-hint"> Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> for command palette</span>
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
    </div>
  )
}

export default AppLayout
