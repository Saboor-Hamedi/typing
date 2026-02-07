import { memo } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import ConfigBar from './ConfigBar'
import './Header.css'

const Header = memo(({ 
  testStarted = false, 
  username = 'Guest',
  isLoggedIn = false,
  setUsername,
  openLoginModal,
  onLogoutRequest,
  selectedAvatarId = 1,
  onNavigateDashboard,
  liveWpm,
  openThemeModal,
  resetGame
}) => {
  const { isZenMode } = useSettings()

  // Defensive checks
  const safeUsername = username || 'Guest'
  const safeSelectedAvatarId = selectedAvatarId || 1
  const safeOpenLoginModal = openLoginModal || (() => {})
  const safeOnLogoutRequest = onLogoutRequest || (() => {})
  const safeSetUsername = setUsername || (() => {})
  const safeOnNavigateDashboard = onNavigateDashboard || (() => {})

  return (
    <header className={`main-header ${testStarted && isZenMode ? 'zen-active' : ''}`}>
      <div className="header-inner">
        <div className="header-left">
           {/* Profile now in sidebar. Left side reserved for future use or branding if needed. */}
        </div>

        <div className="header-center">
          {/* Center now reserved for primary metrics or title if needed */}
        </div>
        
        <div className="header-right">
          {!testStarted && (
            <ConfigBar 
              openThemeModal={openThemeModal} 
              resetGame={resetGame}
            />
          )}
        </div>
      </div>
    </header>
  )
})

Header.displayName = 'Header'

export default Header
