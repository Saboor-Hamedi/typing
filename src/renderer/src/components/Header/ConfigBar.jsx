import { memo } from 'react'
import { Palette, Clock, Type, Eye, EyeOff, Hash, CaseSensitive, Quote, Flame, BookOpen } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useSettings } from '../../contexts/SettingsContext'
import { Tooltip } from '../Common'

/**
 * ConfigBar Component
 * 
 * Configuration bar for test settings: theme, mode (time/words), limits, and zen mode.
 */
const ConfigBar = memo(({ openThemeModal, openContentModal }) => {
  const { theme } = useTheme()
  const { 
    testMode, 
    setTestMode, 
    testLimit, 
    setTestLimit,
    isZenMode,
    setIsZenMode,
    difficulty,
    setDifficulty,
    hasPunctuation,
    setHasPunctuation,
    hasNumbers,
    setHasNumbers,
    hasCaps,
    setHasCaps,
    caretStyle,
    setCaretStyle
  } = useSettings()

  return (
    <div className="master-config">
      {difficulty !== 'custom' && (
        <>
          {/* Modifiers Group */}
          <div className="config-group modifiers">
            <Tooltip content="Punctuation">
              <button 
                onClick={() => setHasPunctuation(!hasPunctuation)}
                className={`config-btn ${hasPunctuation ? 'active' : ''}`}
              >
                <Quote size={14} />
              </button>
            </Tooltip>
            {/* ... other modifiers ... */}
            <Tooltip content="Numbers">
              <button 
                onClick={() => setHasNumbers(!hasNumbers)}
                className={`config-btn ${hasNumbers ? 'active' : ''}`}
              >
                <Hash size={14} />
              </button>
            </Tooltip>
            <Tooltip content="Capitalization">
              <button 
                onClick={() => setHasCaps(!hasCaps)}
                className={`config-btn ${hasCaps ? 'active' : ''}`}
              >
                <CaseSensitive size={14} />
              </button>
            </Tooltip>
          </div>

          <div className="config-divider" />

          {/* Mode & Limit Group - The "Shrinking" Part */}
          <div className="config-group mode-options">
            <div className="mode-toggles">
              <Tooltip content="Time Mode">
                <button 
                  onClick={() => setTestMode('time')}
                  className={`config-btn mode-btn ${testMode === 'time' ? 'active' : ''}`}
                >
                  <Clock size={13} className="mode-icon" />
                  <span className="mode-label">Time</span>
                </button>
              </Tooltip>
              <Tooltip content="Words Mode">
                <button 
                  onClick={() => setTestMode('words')}
                  className={`config-btn mode-btn ${testMode === 'words' ? 'active' : ''}`}
                >
                  <Type size={13} className="mode-icon" />
                  <span className="mode-label">Words</span>
                </button>
              </Tooltip>
            </div>
          </div>

          <div className="config-divider" />
        </>
      )}

      {/* Difficulty Group */}
      <div className="config-group difficulty">
        {['beginner', 'intermediate', 'advanced', 'custom'].map(d => (
          <Tooltip key={d} content={d === 'custom' ? 'Custom Content' : `${d.charAt(0).toUpperCase() + d.slice(1)} Mode`}>
            <button 
              onClick={() => {
                setDifficulty(d)
                if (d === 'custom') {
                  setTestMode('words')
                  setHasPunctuation(false)
                  setHasNumbers(false)
                  setHasCaps(false)
                }
              }}
              className={`text-btn ${difficulty === d ? 'active' : ''}`}
            >
              {d === 'beginner' ? 'beg' : d === 'intermediate' ? 'int' : d === 'advanced' ? 'dev' : 'cus'}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Explicit Custom Content Manager */}
      <Tooltip content="Manage Custom Content">
        <button 
          className="config-btn" 
          onClick={openContentModal}
          style={{ marginLeft: '4px' }}
        >
          <BookOpen size={14} />
        </button>
      </Tooltip>

      <div className="config-divider" />

      {/* Zen Toggle (Keep as it is useful for immersion) */}
      <Tooltip content={isZenMode ? "Disable Zen Mode" : "Enable Zen Mode"}>
        <button 
          className={`config-btn ${isZenMode ? 'active' : ''}`}
          onClick={() => setIsZenMode(!isZenMode)}
        >
          {isZenMode ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </Tooltip>
    </div>
  )
})

ConfigBar.displayName = 'ConfigBar'

export default ConfigBar
