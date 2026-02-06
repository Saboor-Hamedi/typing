import { memo } from 'react'
import { Clock, Type, Eye, EyeOff, Hash, CaseSensitive, Quote } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useSettings } from '../../contexts/SettingsContext'
import { Tooltip } from '../Common'

/**
 * ConfigBar Component
 * 
 * Configuration bar for test settings: theme, mode (time/words), limits, and zen mode.
 */
const ConfigBar = memo(({ openThemeModal }) => {
  const { theme } = useTheme()
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
    setIsSentenceMode
  } = useSettings()

  return (
    <div className="master-config">
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

        <Tooltip content="Sentence Mode">
           <button 
             onClick={() => setIsSentenceMode(!isSentenceMode)}
             className={`config-btn ${isSentenceMode ? 'active' : ''}`}
             style={{ display: 'flex' }} // Force display if hidden by CSS
           >
             <span style={{ fontSize: '12px', fontWeight: 800, lineHeight: 1 }}>Ab.</span>
           </button>
         </Tooltip>
      </div>

      <div className="config-divider" />

      {/* Mode & Limit Group */}
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
