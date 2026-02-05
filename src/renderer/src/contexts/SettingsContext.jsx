/**
 * SettingsContext
 *
 * Purpose:
 * - Centralizes user-configurable settings (test mode/limit, visual toggles, ghost speed).
 *
 * Persistence Strategy:
 * - Reads from/writes to both `localStorage` (web) and Electron `settings` store (desktop).
 * - Defers writes until initial load completes to prevent clobbering existing settings.
 *
 * API Surface:
 * - Exposes safe setters that validate/normalize values (e.g., `updateTestMode`, `updateTestLimit`).
 * - Provides `isSmoothCaret` toggle that directly controls caret animation behavior.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { GAME, STORAGE_KEYS } from '../constants'

const SettingsContext = createContext(null)

/**
 * Settings Provider Component
 * Manages all app settings (test mode, limits, toggles, etc.)
 */
export const SettingsProvider = ({ children }) => {
  // Test configuration
  const [testMode, setTestMode] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.TEST_MODE) || GAME.DEFAULT_MODE
  })
  
  const [testLimit, setTestLimit] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEST_LIMIT)
    return saved ? Number(saved) : GAME.DEFAULT_LIMIT
  })

  // Visual settings
  const [isChameleonEnabled, setIsChameleonEnabled] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CHAMELEON_ENABLED)
    return saved !== null ? JSON.parse(saved) : true
  })

  const [isKineticEnabled, setIsKineticEnabled] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.KINETIC_ENABLED)
    return saved !== null ? JSON.parse(saved) : false
  })

  const [isSmoothCaret, setIsSmoothCaret] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SMOOTH_CARET)
    return saved !== null ? JSON.parse(saved) : false // Changed default to false for performance
  })

  const [caretStyle, setCaretStyle] = useState(() => {
    return localStorage.getItem('caretStyle') || 'bar'
  })

  const [isErrorFeedbackEnabled, setIsErrorFeedbackEnabled] = useState(() => {
    const saved = localStorage.getItem('isErrorFeedbackEnabled')
    return saved !== null ? JSON.parse(saved) : true
  })

  const [isGhostEnabled, setIsGhostEnabled] = useState(() => {
    const saved = localStorage.getItem('isGhostEnabled')
    return saved !== null ? JSON.parse(saved) : false
  })

  const [ghostSpeed, setGhostSpeed] = useState(() => {
    const saved = localStorage.getItem('ghostSpeed')
    return saved ? Number(saved) : 1.0
  })

  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('isSoundEnabled')
    return saved !== null ? JSON.parse(saved) : true
  })

  const [isHallEffect, setIsHallEffect] = useState(() => {
    const saved = localStorage.getItem('isHallEffect')
    return saved !== null ? JSON.parse(saved) : true
  })

  const [soundProfile, setSoundProfile] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.SOUND_PROFILE) || 'thocky'
  })

  const [isCenteredScrolling, setIsCenteredScrolling] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CENTERED_SCROLLING)
    return saved !== null ? JSON.parse(saved) : true
  })

  // Complexity settings
  const [difficulty, setDifficulty] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.DIFFICULTY) || GAME.DEFAULT_DIFFICULTY
  })

  const [hasPunctuation, setHasPunctuation] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HAS_PUNCTUATION)
    return saved !== null ? JSON.parse(saved) : false
  })

  const [hasNumbers, setHasNumbers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HAS_NUMBERS)
    return saved !== null ? JSON.parse(saved) : false
  })

  const [hasCaps, setHasCaps] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HAS_CAPS)
    return saved !== null ? JSON.parse(saved) : false
  })

  // Custom Content
  const [dictionary, setDictionary] = useState({ sentences: [] })

  // UI state
  const [isZenMode, setIsZenMode] = useState(false)
  
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false)

  // Load settings from electron-store on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (window.api?.settings) {
        const [
          savedMode,
          savedLimit,
          savedChameleon,
          savedKinetic,
          savedSmooth,
          savedCaretStyle,
          savedErrorFeedback,
          savedSound,
          savedHall,
          savedProfile,
          savedCentered,
          savedDifficulty,
          savedPunctuation,
          savedNumbers,
          savedCaps
        ] = await Promise.all([
          window.api.settings.get(STORAGE_KEYS.SETTINGS.TEST_MODE),
          window.api.settings.get(STORAGE_KEYS.SETTINGS.TEST_LIMIT),
          window.api.settings.get(STORAGE_KEYS.SETTINGS.CHAMELEON),
          window.api.settings.get(STORAGE_KEYS.SETTINGS.KINETIC),
          window.api.settings.get(STORAGE_KEYS.SETTINGS.SMOOTH_CARET),
          window.api.settings.get('caretStyle'),
          window.api.settings.get('isErrorFeedbackEnabled'),
          window.api.settings.get('isSoundEnabled'),
          window.api.settings.get('isHallEffect'),
          window.api.settings.get(STORAGE_KEYS.SETTINGS.SOUND_PROFILE),
          window.api.settings.get(STORAGE_KEYS.SETTINGS.CENTERED_SCROLLING),
          window.api.settings.get(STORAGE_KEYS.SETTINGS.DIFFICULTY),
          window.api.settings.get(STORAGE_KEYS.SETTINGS.HAS_PUNCTUATION),
          window.api.settings.get(STORAGE_KEYS.SETTINGS.HAS_NUMBERS),
          window.api.settings.get(STORAGE_KEYS.SETTINGS.HAS_CAPS),
          window.api.settings.get(STORAGE_KEYS.SETTINGS.HAS_CAPS),
        ])

        if (savedMode) setTestMode(savedMode)
        if (savedLimit) setTestLimit(savedLimit)
        if (savedChameleon !== undefined) setIsChameleonEnabled(savedChameleon)
        if (savedKinetic !== undefined) setIsKineticEnabled(savedKinetic)
        if (savedSmooth !== undefined) setIsSmoothCaret(savedSmooth)
        if (savedCaretStyle) setCaretStyle(savedCaretStyle)
        if (savedErrorFeedback !== undefined) setIsErrorFeedbackEnabled(savedErrorFeedback)
        if (savedSound !== undefined) setIsSoundEnabled(savedSound)
        if (savedHall !== undefined) setIsHallEffect(savedHall)
        if (savedProfile) setSoundProfile(savedProfile)
        if (savedCentered !== undefined) setIsCenteredScrolling(savedCentered)
        if (savedDifficulty) setDifficulty(savedDifficulty)
        if (savedPunctuation !== undefined) setHasPunctuation(savedPunctuation)
        if (savedNumbers !== undefined) setHasNumbers(savedNumbers)
        if (savedCaps !== undefined) setHasCaps(savedCaps)

        // Load content store separately to prevent Promise failures
        if (window.api.content) {
          try {
             const savedSentences = await window.api.content.get(STORAGE_KEYS.SETTINGS.CUSTOM_SENTENCES)
             if (Array.isArray(savedSentences)) {
               setDictionary({ sentences: savedSentences })
             }
          } catch (e) {
             console.error("Failed to load custom content:", e)
          }
        }
      }
      setIsSettingsLoaded(true)
    }
    loadSettings()
  }, [])

  // Persist settings changes
  useEffect(() => {
    if (!isSettingsLoaded) return

    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.TEST_MODE, testMode)
    localStorage.setItem(STORAGE_KEYS.TEST_LIMIT, testLimit)
    localStorage.setItem(STORAGE_KEYS.CHAMELEON_ENABLED, isChameleonEnabled)
    localStorage.setItem(STORAGE_KEYS.KINETIC_ENABLED, isKineticEnabled)
    localStorage.setItem(STORAGE_KEYS.SMOOTH_CARET, isSmoothCaret)
    localStorage.setItem('isGhostEnabled', isGhostEnabled)
    localStorage.setItem('ghostSpeed', ghostSpeed)
    localStorage.setItem('caretStyle', caretStyle)
    localStorage.setItem('isErrorFeedbackEnabled', isErrorFeedbackEnabled)
    localStorage.setItem('isSoundEnabled', isSoundEnabled)
    localStorage.setItem('isHallEffect', isHallEffect)
    localStorage.setItem(STORAGE_KEYS.SOUND_PROFILE, soundProfile)
    localStorage.setItem(STORAGE_KEYS.CENTERED_SCROLLING, isCenteredScrolling)
    localStorage.setItem(STORAGE_KEYS.DIFFICULTY, difficulty)
    localStorage.setItem(STORAGE_KEYS.HAS_PUNCTUATION, hasPunctuation)
    localStorage.setItem(STORAGE_KEYS.HAS_NUMBERS, hasNumbers)
    localStorage.setItem(STORAGE_KEYS.HAS_CAPS, hasCaps)
    localStorage.setItem(STORAGE_KEYS.SETTINGS.CUSTOM_SENTENCES, JSON.stringify(dictionary.sentences))
    
    // Save to electron-store
    if (window.api?.settings) {
      window.api.settings.set(STORAGE_KEYS.SETTINGS.TEST_MODE, testMode)
      window.api.settings.set(STORAGE_KEYS.SETTINGS.TEST_LIMIT, testLimit)
      window.api.settings.set(STORAGE_KEYS.SETTINGS.CHAMELEON, isChameleonEnabled)
      window.api.settings.set(STORAGE_KEYS.SETTINGS.KINETIC, isKineticEnabled)
      window.api.settings.set(STORAGE_KEYS.SETTINGS.SMOOTH_CARET, isSmoothCaret)
      window.api.settings.set('isGhostEnabled', isGhostEnabled)
      window.api.settings.set('ghostSpeed', ghostSpeed)
      window.api.settings.set('caretStyle', caretStyle)
      window.api.settings.set('isErrorFeedbackEnabled', isErrorFeedbackEnabled)
      window.api.settings.set('isSoundEnabled', isSoundEnabled)
      window.api.settings.set('isHallEffect', isHallEffect)
      window.api.settings.set(STORAGE_KEYS.SETTINGS.SOUND_PROFILE, soundProfile)
      window.api.settings.set(STORAGE_KEYS.SETTINGS.CENTERED_SCROLLING, isCenteredScrolling)
      window.api.settings.set(STORAGE_KEYS.SETTINGS.DIFFICULTY, difficulty)
      window.api.settings.set(STORAGE_KEYS.SETTINGS.HAS_PUNCTUATION, hasPunctuation)
      window.api.settings.set(STORAGE_KEYS.SETTINGS.HAS_NUMBERS, hasNumbers)
      window.api.settings.set(STORAGE_KEYS.SETTINGS.HAS_CAPS, hasCaps)
    }

    if (window.api?.content) {
      // Only save if we have loaded settings, to avoid overwriting with initial empty state
      // (This is redundant due to isSettingsLoaded check above, but safe)
       window.api.content.set(STORAGE_KEYS.SETTINGS.CUSTOM_SENTENCES, dictionary.sentences)
    }
  }, [testMode, testLimit, isChameleonEnabled, isKineticEnabled, isSmoothCaret, isGhostEnabled, ghostSpeed, caretStyle, isErrorFeedbackEnabled, isSoundEnabled, isHallEffect, soundProfile, isCenteredScrolling, difficulty, hasPunctuation, hasNumbers, hasCaps, dictionary, isSettingsLoaded])

  /**
   * Update test mode and set appropriate default limit
   * @param {string} mode - 'time' or 'words'
   */
  const updateTestMode = useCallback((mode) => {
    setTestMode(mode)
    // Set default limit for the mode
    if (mode === 'time') {
      setTestLimit(15) // Default to 15 seconds per user request
    } else {
      setTestLimit(25) // Default to 25 words per user request
    }
  }, [])

  /**
   * Update test limit with validation
   * @param {number} limit - New test limit
   */
  const updateTestLimit = useCallback((limit) => {
    const validLimits = testMode === 'time' ? GAME.TIME_LIMITS : GAME.WORD_LIMITS
    if (validLimits.includes(limit)) {
      setTestLimit(limit)
    }
  }, [testMode])

  /**
   * Update custom sentences
   * @param {string[]} sentences - New list of sentences
   */
  const updateSentences = useCallback((sentences) => {
    setDictionary({ sentences })
  }, [])

  const value = {
    // Test configuration
    testMode,
    testLimit,
    setTestMode: updateTestMode,
    setTestLimit: updateTestLimit,

    // Visual settings
    isChameleonEnabled,
    setIsChameleonEnabled,
    isKineticEnabled,
    setIsKineticEnabled,
    isSmoothCaret,
    setIsSmoothCaret,
    isGhostEnabled,
    setIsGhostEnabled,
    ghostSpeed,
    setGhostSpeed,
    caretStyle,
    setCaretStyle,
    isErrorFeedbackEnabled,
    setIsErrorFeedbackEnabled,
    isSoundEnabled,
    setIsSoundEnabled,
    isHallEffect,
    setIsHallEffect,
    soundProfile,
    setSoundProfile,
    isCenteredScrolling,
    setIsCenteredScrolling,
    difficulty,
    setDifficulty,
    hasPunctuation,
    setHasPunctuation,
    hasNumbers,
    setHasNumbers,
    hasCaps,
    setHasCaps,
    dictionary,
    updateSentences,

    // UI state
    isZenMode,
    setIsZenMode,

    // Loading state
    isSettingsLoaded,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

/**
 * Hook to access settings context
 * @returns {Object} Settings context value
 * @throws {Error} If used outside SettingsProvider
 */
export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}
