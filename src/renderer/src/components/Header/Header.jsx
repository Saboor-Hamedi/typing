import { memo } from 'react'
import { useSettings } from '../../contexts'
import UserDropdown from './UserDropdown'
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
  liveWpm
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
        <div className="header-top-row">
          <div className="header-actions">
             <UserDropdown 
                username={safeUsername}
                isLoggedIn={isLoggedIn}
                setUsername={safeSetUsername}
                openLoginModal={safeOpenLoginModal}
                onLogoutRequest={safeOnLogoutRequest}
                selectedAvatarId={safeSelectedAvatarId}
                onNavigateDashboard={safeOnNavigateDashboard}
                wpm={testStarted && liveWpm !== undefined ? liveWpm : undefined}
             />
          </div>
        </div>
      </div>
    </header>
  )
})

Header.displayName = 'Header'

export default Header
