import { memo } from 'react'
import { Palette, Clock, Type, Eye, EyeOff } from 'lucide-react'
import { useTheme, useSettings } from '../../contexts'

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
    <div className="master-config glass-panel">
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
          aria-label="Time mode"
        >
          <Clock size={16} />
          <span>time</span>
        </button>
        <button 
          onClick={() => setTestMode('words')}
          className={`config-btn ${testMode === 'words' ? 'active' : ''}`}
          aria-label="Words mode"
        >
          <Type size={16} />
          <span>words</span>
        </button>
      </div>

      <div className="config-divider" />

      {/* Limit Selector */}
      <div className="config-group limit-options">
        {(testMode === 'time' ? [15, 30, 60, 120] : [10, 25, 50, 100]).map(v => (
          <button 
            key={v} 
            onClick={() => setTestLimit(v)}
            className={`config-btn ${testLimit === v ? 'active' : ''}`}
            aria-label={`Set limit to ${v}`}
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
        role="button"
        aria-label={`${isZenMode ? 'Disable' : 'Enable'} zen mode`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsZenMode(!isZenMode)
          }
        }}
      >
        {isZenMode ? <EyeOff size={16} /> : <Eye size={16} />}
        <span>zen</span>
      </div>
    </div>
  )
})

ConfigBar.displayName = 'ConfigBar'

export default ConfigBar
