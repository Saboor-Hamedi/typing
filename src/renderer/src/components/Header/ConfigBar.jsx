import { memo } from 'react'
import { Palette, Clock, Type, Eye, EyeOff } from 'lucide-react'
import { useTheme, useSettings } from '../../contexts'
import { Tooltip } from '../Common'

/**
 * ConfigBar Component
 * 
 * Configuration bar for test settings: theme, mode (time/words), limits, and zen mode.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.openThemeModal - Function to open the theme selection modal
 * 
 * @example
 * ```jsx
 * <ConfigBar openThemeModal={() => setThemeModalOpen(true)} />
 * ```
 */
const ConfigBar = memo(({ openThemeModal }) => {
  const { theme } = useTheme()
  const { 
    testMode, 
    setTestMode, 
    testLimit, 
    setTestLimit,
    isZenMode,
    setIsZenMode
  } = useSettings()

  return (
    <div className="master-config">
      <Tooltip content="Change Theme">
        <div className="config-group themes clickable" onClick={openThemeModal}>
          <Palette size={16} />
        </div>
      </Tooltip>

      <div className="config-divider" />

      {/* Mode Selector */}
      <div className="config-group mode-switch">
        <Tooltip content="Time Mode">
          <button 
            onClick={() => setTestMode('time')}
            className={`config-btn ${testMode === 'time' ? 'active' : ''}`}
            aria-label="Time Mode"
          >
            <Clock size={16} />
          </button>
        </Tooltip>
        
        <Tooltip content="Words Mode">
          <button 
            onClick={() => setTestMode('words')}
            className={`config-btn ${testMode === 'words' ? 'active' : ''}`}
            aria-label="Words Mode"
          >
            <Type size={16} />
          </button>
        </Tooltip>
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

      {/* Zen Toggle */}
      <Tooltip content={isZenMode ? "Disable Zen Mode" : "Enable Zen Mode"} align="right">
        <div 
          className={`zen-box ${isZenMode ? 'active' : ''}`}
          onClick={() => setIsZenMode(!isZenMode)}
        >
          {isZenMode ? <EyeOff size={16} /> : <Eye size={16} />}
        </div>
      </Tooltip>
    </div>
  )
})

ConfigBar.displayName = 'ConfigBar'

export default ConfigBar
