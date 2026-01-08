import { motion } from 'framer-motion'
import { Palette, Clock, Type, Eye, EyeOff } from 'lucide-react'

const ConfigBar = ({ 
  testMode, 
  setTestMode, 
  testLimit, 
  setTestLimit, 
  theme, 
  openThemeModal, 
  isZenMode, 
  setIsZenMode 
}) => {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="master-config glass-panel"
    >
      <div className="config-group themes clickable" onClick={openThemeModal}>
        <Palette size={14} />
        <span className="current-theme-label">{theme}</span>
      </div>

      <div className="config-divider" />

      {/* Mode Selector */}
      <div className="config-group mode-switch">
        <button 
          onClick={() => { setTestMode('time'); setTestLimit(30) }}
          className={`config-btn ${testMode === 'time' ? 'active' : ''}`}
        >
          <Clock size={16} />
          <span>time</span>
        </button>
        <button 
          onClick={() => { setTestMode('words'); setTestLimit(25) }}
          className={`config-btn ${testMode === 'words' ? 'active' : ''}`}
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
    </motion.div>
  )
}

export default ConfigBar
