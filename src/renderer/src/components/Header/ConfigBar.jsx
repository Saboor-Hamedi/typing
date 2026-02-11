import { memo, useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Type,
  Eye,
  EyeOff,
  Hash,
  CaseSensitive,
  FileText,
  Settings,
  ChevronDown,
  Sparkles,
  Zap,
  Quote,
  Palette,
  Plus
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useSettings } from '../../contexts/SettingsContext'
import { Tooltip } from '../Common'
import './ConfigBar.css'

/**
 * ConfigBar Component (Now transformed into a beautiful Menu)
 */
const ConfigBar = memo(({ openThemeModal, openSentenceModal, resetGame }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const {
    testMode,
    setTestMode,
    isZenMode,
    setIsZenMode,
    hasPunctuation,
    setHasPunctuation,
    hasNumbers,
    setHasNumbers,
    hasCaps,
    setHasCaps,
    isSentenceMode,
    setIsSentenceMode,
    difficulty,
    setDifficulty
  } = useSettings()

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Handle Escape to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  // Robust update helper that forces immediate reset with overrides
  const toggleSetting = useCallback(
    (setter, current, key) => {
      const newValue = !current
      setter(newValue)
      if (resetGame) {
        // Pass the immediate change as an override to bypass stale closures
        resetGame({ [key]: newValue })
      }
    },
    [resetGame]
  )

  const setModeValue = useCallback(
    (setter, value, key) => {
      setter(value)
      if (resetGame) {
        resetGame({ [key]: value })
      }
    },
    [resetGame]
  )

  // Toggle ConfigBar
  useEffect(() => {
    const handleToggle = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey
      const shiftKey = e.shiftKey
      // Toggle the modal itself
      if (ctrlKey && shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      //  Toggle between standard and sentence mode
      if (ctrlKey && shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        setModeValue(setIsSentenceMode, !isSentenceMode, 'isSentenceMode')
        return
      }

      // Toggle between time and word mode
      if (ctrlKey && shiftKey && e.key.toLowerCase() === 'u') {
        e.preventDefault()
        setModeValue(setTestMode, testMode === 'time' ? 'words' : 'time', 'testMode')
        return
      }
      // Select beginner mode
      if (ctrlKey && shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setModeValue(setDifficulty, 'beginner', 'difficulty')
        return
      } else if (ctrlKey && shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        setModeValue(setDifficulty, 'intermediate', 'difficulty')
        return
      } else if (ctrlKey && shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setModeValue(setDifficulty, 'advanced', 'difficulty')
        return
      }
    }
    document.addEventListener('keydown', handleToggle)
    return () => document.removeEventListener('keydown', handleToggle)
  }, [setModeValue, setIsSentenceMode, isSentenceMode, setTestMode, testMode])
  return (
    <div className="config-container" ref={menuRef}>
      {/* Trigger Pill */}
      <motion.button
        className={`config-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Zap size={14} className={testMode === 'time' ? 'text-main' : ''} />
        <span>
          {testMode === 'time' ? 'Time' : 'Words'}
          {isSentenceMode ? ' (Quotes)' : ''}
        </span>
        <ChevronDown size={14} className="chevron" />
      </motion.button>

      {/* Beautiful Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="config-menu-panel"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Section: Test Mode */}
            <div className="config-section">
              <span className="config-section-label">Test Mode</span>
              <div className="config-options-grid">
                <button
                  className={`menu-item-btn ${testMode === 'time' ? 'active' : ''}`}
                  onClick={() => setModeValue(setTestMode, 'time', 'testMode')}
                >
                  <Clock size={12} />
                  <span>Time</span>
                  <div className="status-dot" />
                </button>
                <button
                  className={`menu-item-btn ${testMode === 'words' ? 'active' : ''}`}
                  onClick={() => setModeValue(setTestMode, 'words', 'testMode')}
                >
                  <Type size={12} />
                  <span>Words</span>
                  <div className="status-dot" />
                </button>
              </div>
            </div>

            {/* Section: Content Type */}
            <div className="config-section">
              <span className="config-section-label">Content</span>
              <div className="config-options-grid">
                <button
                  className={`menu-item-btn ${!isSentenceMode ? 'active' : ''}`}
                  onClick={() => setModeValue(setIsSentenceMode, false, 'isSentenceMode')}
                >
                  <Zap size={12} />
                  <span>Standard</span>
                  <div className="status-dot" />
                </button>
                <button
                  className={`menu-item-btn ${isSentenceMode ? 'active' : ''}`}
                  onClick={() => setModeValue(setIsSentenceMode, true, 'isSentenceMode')}
                >
                  <Quote size={12} />
                  <span>Sentences</span>
                  <div className="status-dot" />
                </button>
              </div>

              {/* Notice: Add Custom Quote removed for local dashboard management */}
            </div>

            {/* Section: Dictionary Difficulty */}
            {!isSentenceMode && (
              <div className="config-section">
                <span className="config-section-label">Dictionary</span>
                <div className="config-options-grid three-col">
                  <button
                    className={`menu-item-btn ${difficulty === 'beginner' ? 'active' : ''}`}
                    onClick={() => setModeValue(setDifficulty, 'beginner', 'difficulty')}
                  >
                    <span>Easy (Ctrl+Shift+E)</span>
                    <div className="status-dot" />
                  </button>
                  <button
                    className={`menu-item-btn ${difficulty === 'intermediate' ? 'active' : ''}`}
                    onClick={() => setModeValue(setDifficulty, 'intermediate', 'difficulty')}
                  >
                    <span>Medium (Ctrl+Shift+M)</span>
                    <div className="status-dot" />
                  </button>
                  <button
                    className={`menu-item-btn ${difficulty === 'advanced' ? 'active' : ''}`}
                    onClick={() => setModeValue(setDifficulty, 'advanced', 'difficulty')}
                  >
                    <span>Hard (Ctrl+Shift+A)</span>
                    <div className="status-dot" />
                  </button>
                </div>
              </div>
            )}

            {/* Section: Modifiers */}
            <div className="config-section">
              <span className="config-section-label">General Modifiers</span>
              <div className="modifiers-row">
                <button
                  className={`menu-item-btn ${hasPunctuation ? 'active' : ''}`}
                  onClick={() => toggleSetting(setHasPunctuation, hasPunctuation, 'hasPunctuation')}
                >
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, lineHeight: 1 }}>.</span>
                  <div
                    className="status-dot"
                    style={{ position: 'absolute', top: 6, right: 6, margin: 0 }}
                  />
                </button>
                <button
                  className={`menu-item-btn ${hasNumbers ? 'active' : ''}`}
                  onClick={() => toggleSetting(setHasNumbers, hasNumbers, 'hasNumbers')}
                >
                  <Hash size={12} />
                  <div
                    className="status-dot"
                    style={{ position: 'absolute', top: 6, right: 6, margin: 0 }}
                  />
                </button>
                <button
                  className={`menu-item-btn ${hasCaps ? 'active' : ''}`}
                  onClick={() => toggleSetting(setHasCaps, hasCaps, 'hasCaps')}
                >
                  <CaseSensitive size={18} />
                  <div
                    className="status-dot"
                    style={{ position: 'absolute', top: 6, right: 6, margin: 0 }}
                  />
                </button>
              </div>
            </div>

            {/* Section: Utilities */}
            <div className="config-section">
              <span className="config-section-label">Appearance & View</span>
              <div className="utilities-row">
                <button
                  className={`utility-btn ${isZenMode ? 'active' : ''}`}
                  onClick={() => setIsZenMode(!isZenMode)}
                >
                  {isZenMode ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>Zen</span>
                  <div className="status-dot" />
                </button>

                <button
                  className="utility-btn"
                  onClick={() => {
                    setIsOpen(false)
                    if (openThemeModal) openThemeModal()
                  }}
                >
                  <Palette size={14} />
                  <span>Themes</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

ConfigBar.displayName = 'ConfigBar'

export default ConfigBar
