import { useState, useEffect } from 'react'
import { Zap, Trophy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettings } from '../../contexts'
import ConfigBar from './ConfigBar'
import UserDropdown from './UserDropdown'
import './Header.css'

const Header = ({ 
  testStarted, 
  displayValue,
  pb,
  username,
  isLoggedIn,
  setUsername,
  onReload,
  openThemeModal,
  openLoginModal,
  onLogoutRequest,
  activeTab,
  selectedAvatarId
}) => {
  const [version, setVersion] = useState('0.0.0')
  const { isZenMode, testMode } = useSettings()

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
      {/* Top Layer: Branding & User Dropdown */}
      <div className="header-top-row">
        <div className="branding" onClick={onReload}>
          <motion.div 
            className="logo-box"
            whileHover={{ rotate: 15, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Zap size={18} fill="var(--main-color)" />
          </motion.div>
          <div className="logo-text-group">
            <span className="logo-main">TYPINGZONE</span>
            <span className="logo-version">v{version}</span>
          </div>
        </div>

        <div className="header-actions">
           <UserDropdown 
              username={username}
              isLoggedIn={isLoggedIn}
              setUsername={setUsername}
              openLoginModal={openLoginModal}
              onLogoutRequest={onLogoutRequest}
              selectedAvatarId={selectedAvatarId}
           />
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
              openThemeModal={openThemeModal}
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
