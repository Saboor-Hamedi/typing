import { memo } from 'react'
import { Palette, Clock, Type, Eye, EyeOff } from 'lucide-react'
import { useTheme, useSettings } from '../../contexts'

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
      <div className="config-group themes clickable" onClick={openThemeModal}>
        <Palette size={14} />
        <span className="current-theme-label">{theme}</span>
      </div>

      <div className="config-divider" />

      {/* Mode Selector */}
      <div className="config-group mode-switch">
        <button 
          onClick={() => setTestMode('time')}
          className={`config-btn ${testMode === 'time' ? 'active' : ''}`}
        >
          <Clock size={16} />
          <span>time</span>
        </button>
        <button 
          onClick={() => setTestMode('words')}
          className={`config-btn ${testMode === 'words' ? 'active' : ''}`}
        >
          <Type size={16} />
          <span>words</span>
        </button>
      </div>

      <div className="config-divider" />

      {/* Limit Selector */}
      <div className="config-group limit-options">
        {(testMode === 'time' ? [15, 30, 60] : [10, 25, 50]).map(v => (
          <button 
            key={v} 
            onClick={() => setTestLimit(v)}
            className={`config-btn ${testLimit === v ? 'active' : ''}`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="config-divider" />

      {/* Zen Toggle */}
      <div 
        className={`zen-box ${isZenMode ? 'active' : ''}`}
        onClick={() => setIsZenMode(!isZenMode)}
      >
        {isZenMode ? <EyeOff size={16} /> : <Eye size={16} />}
        <span>zen</span>
      </div>
    </div>
  )
})

ConfigBar.displayName = 'ConfigBar'

export default ConfigBar
