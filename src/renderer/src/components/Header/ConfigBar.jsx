import { memo } from 'react'
import { Palette, Clock, Type, Eye, EyeOff, Hash, CaseSensitive, Quote, Flame } from 'lucide-react'
import { useTheme, useSettings } from '../../contexts'
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
      <Tooltip content="Change Theme">
        <div className="config-group themes clickable" onClick={openThemeModal}>
          <Palette size={14} />
        </div>
      </Tooltip>

      <div className="config-divider" />

      {/* Punctuation, Numbers, Caps Toggles */}
      <div className="config-group modifiers">
        <Tooltip content="Punctuation">
          <button 
            onClick={() => setHasPunctuation(!hasPunctuation)}
            className={`config-btn ${hasPunctuation ? 'active' : ''}`}
            aria-label="Punctuation"
          >
            <Quote size={14} />
          </button>
        </Tooltip>
        
        <Tooltip content="Numbers">
          <button 
            onClick={() => setHasNumbers(!hasNumbers)}
            className={`config-btn ${hasNumbers ? 'active' : ''}`}
            aria-label="Numbers"
          >
            <Hash size={14} />
          </button>
        </Tooltip>

        <Tooltip content="Capitalization">
          <button 
            onClick={() => setHasCaps(!hasCaps)}
            className={`config-btn ${hasCaps ? 'active' : ''}`}
            aria-label="Capitals"
          >
            <CaseSensitive size={14} />
          </button>
        </Tooltip>
      </div>

      <div className="config-divider" />

      {/* Mode Selector */}
      <div className="config-group mode-switch">
        <Tooltip content="Time Mode">
          <button 
            onClick={() => setTestMode('time')}
            className={`config-btn ${testMode === 'time' ? 'active' : ''}`}
            aria-label="Time Mode"
          >
            <Clock size={14} />
          </button>
        </Tooltip>
        
        <Tooltip content="Words Mode">
          <button 
            onClick={() => setTestMode('words')}
            className={`config-btn ${testMode === 'words' ? 'active' : ''}`}
            aria-label="Words Mode"
          >
            <Type size={14} />
          </button>
        </Tooltip>
      </div>

      <div className="config-divider" />

      {/* Difficulty Selector */}
      <div className="config-group difficulty">
        {['beginner', 'intermediate', 'advanced'].map(d => (
          <Tooltip key={d} content={`${d.charAt(0).toUpperCase() + d.slice(1)} Words`}>
            <button 
              onClick={() => setDifficulty(d)}
              className={`config-btn ${difficulty === d ? 'active' : ''}`}
            >
              {d === 'beginner' ? 'beg' : d === 'intermediate' ? 'int' : 'adv'}
            </button>
          </Tooltip>
        ))}
      </div>

      <div className="config-divider" />

      {/* Limit Selector */}
      <div className="config-group limit-options">
        {(testMode === 'time' ? [15, 30, 60] : [10, 25, 50]).map(v => (
          <Tooltip key={v} content={`${v} ${testMode === 'time' ? 'seconds' : 'words'}`}>
            <button 
              onClick={() => setTestLimit(v)}
              className={`config-btn ${testLimit === v ? 'active' : ''}`}
            >
              {v}
            </button>
          </Tooltip>
        ))}
      </div>

      <div className="config-divider" />

      {/* Caret Selector */}
      <div className="config-group caret-switch">
        <Tooltip content="Thin Caret">
          <button 
            onClick={() => setCaretStyle('bar')}
            className={`config-btn ${caretStyle === 'bar' ? 'active' : ''}`}
          >
            <div style={{ width: 2, height: 12, background: 'currentColor' }} />
          </button>
        </Tooltip>
        
        <Tooltip content="Thick Caret">
          <button 
            onClick={() => setCaretStyle('block')}
            className={`config-btn ${caretStyle === 'block' ? 'active' : ''}`}
          >
            <div style={{ width: 6, height: 12, background: 'currentColor' }} />
          </button>
        </Tooltip>

        <Tooltip content="Flame Caret">
          <button 
            onClick={() => setCaretStyle('fire')}
            className={`config-btn ${caretStyle === 'fire' ? 'active' : ''}`}
          >
            <Flame size={14} color={caretStyle === 'fire' ? '#ff4500' : 'currentColor'} />
          </button>
        </Tooltip>
      </div>

      <div className="config-divider" />

      {/* Zen Toggle */}
      <Tooltip content={isZenMode ? "Disable Zen Mode" : "Enable Zen Mode"} align="right">
        <div 
          className={`zen-box ${isZenMode ? 'active' : ''}`}
          onClick={() => setIsZenMode(!isZenMode)}
        >
          {isZenMode ? <EyeOff size={14} /> : <Eye size={14} />}
        </div>
      </Tooltip>
    </div>
  )
})

ConfigBar.displayName = 'ConfigBar'

export default ConfigBar
