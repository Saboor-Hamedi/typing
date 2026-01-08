import { useState, useEffect } from 'react'
import './Header.css'
import './Header.css'
import { Zap, Trophy, Activity, Wifi, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ConfigBar from './ConfigBar'

const Header = ({ 
  testStarted, 
  isZenMode, 
  theme, 
  setTheme, 
  testMode, 
  setTestMode, 
  testLimit, 
  setTestLimit, 
  setIsZenMode,
  displayValue,
  pb,
  username,
  setUsername,
  onReload,
  openThemeModal,
  activeTab
}) => {
  const [version, setVersion] = useState('0.0.0')
  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState('')

  useEffect(() => {
    const fetchVersion = async () => {
      if (window.api && window.api.getVersion) {
        const v = await window.api.getVersion()
        setVersion(v)
      }
    }
    fetchVersion()
  }, [])

  return (
    <header className={`main-header ${testStarted && isZenMode ? 'zen-active' : ''}`}>
      {/* Top Layer: Branding & System Status */}
      <div className="header-top-row">
        <div className="branding" onClick={onReload}>
          <motion.div 
            className="logo-box"
            whileHover={{ rotate: 15, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Zap size={22} fill="var(--main-color)" />
          </motion.div>
          <div className="logo-text-group">
            <span className="logo-main">TYPINGZONE</span>
            <span className="logo-version">v{version}</span>
          </div>
        </div>

        <div className="system-status">
          <div className="status-item">
            <Activity size={12} className="pulse" />
            <span>Blazing Fast</span>
          </div>
          <div className="status-item">
            <Wifi size={12} />
            <span>Local Sync</span>
          </div>
          <div 
             className="user-profile" 
             onClick={() => {
               if (!isEditing) {
                 setIsEditing(true)
                 setTempName(username)
               }
             }}
          >
            <User size={14} />
            {isEditing ? (
              <input 
                type="text" 
                className="username-input"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={() => {
                  setIsEditing(false)
                  if (tempName.trim()) setUsername(tempName.trim())
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditing(false)
                    if (tempName.trim()) setUsername(tempName.trim())
                  }
                }}
                autoFocus
                maxLength={12}
              />
            ) : (
              <span>{username}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Layer: Config & Metrics */}
      <div className="header-main-row">
        <div className="header-left">
           {!testStarted && (
             <motion.div 
               initial={{ x: -20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               className="pb-box"
             >
                <Trophy size={14} className="trophy-icon" />
                <div className="pb-data">
                  <span className="pb-label">PERSONAL BEST</span>
                  <span className="pb-value">{pb} <small>WPM</small></span>
                </div>
             </motion.div>
           )}
        </div>

        <div className="header-center">
          {(!testStarted && activeTab === 'typing') && (
            <ConfigBar 
              testMode={testMode}
              setTestMode={setTestMode}
              testLimit={testLimit}
              setTestLimit={setTestLimit}
              theme={theme}
              openThemeModal={openThemeModal}
              isZenMode={isZenMode}
              setIsZenMode={setIsZenMode}
            />
          )}
        </div>

        <div className="header-right">
          <div className={`live-metric-card ${testStarted ? 'active' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.span 
                key={displayValue}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="metric-number"
              >
                {displayValue}
              </motion.span>
            </AnimatePresence>
            <span className="metric-unit">
              {testStarted ? (testMode === 'time' ? 'SECONDS' : 'WPM') : ''}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
