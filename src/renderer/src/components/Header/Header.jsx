import { useState, useEffect, memo } from 'react'
import { Zap, Trophy } from 'lucide-react'
import { useSettings } from '../../contexts'
import ConfigBar from './ConfigBar'
import UserDropdown from './UserDropdown'
import './Header.css'

const Header = memo(({ 
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
  selectedAvatarId,
  onNavigateDashboard
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
      <div className="header-inner">
        {/* Top Layer: Branding & User Dropdown */}
        <div className="header-top-row">
          <div className="branding" onClick={onReload}>
            <div className="logo-box">
              <Zap size={18} fill="var(--main-color)" />
            </div>
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
               onNavigateDashboard={onNavigateDashboard}
             />
          </div>
        </div>

        {/* Main Layer: Config & Metrics (hide on dashboard) */}
        {activeTab !== 'dashboard' && (
        <div className="header-main-row">
          <div className="header-left">
             {!testStarted && activeTab !== 'dashboard' && (
               <div className="pb-box">
                  <Trophy size={14} className="trophy-icon" />
                  <div className="pb-data">
                    <span className="pb-label">PERSONAL BEST</span>
                    <span className="pb-value">{pb} <small>WPM</small></span>
                  </div>
               </div>
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
              <span className="metric-number">
                {displayValue}
              </span>
              <span className="metric-unit">
                {testStarted ? (testMode === 'time' ? 'SECONDS' : 'WPM') : ''}
              </span>
            </div>
          </div>
        </div>
        )}
      </div>
    </header>
  )
})

Header.displayName = 'Header'

export default Header
