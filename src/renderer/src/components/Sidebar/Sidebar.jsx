import './Sidebar.css'
import { Keyboard, History, Settings, Info, Trophy, Command, Globe, ArrowUpCircle, RefreshCw } from 'lucide-react'
import { useState, useEffect, memo } from 'react'
import { AVATAR_MAP, AVATAR_DEFS } from '../../assets/avatars'
import UniversalAvatar from '../Common/UniversalAvatar'

const Sidebar = memo(({ 
  activeTab, 
  setActiveTab, 
  testStarted, 
  isZenMode,
  onNotification,
  selectedAvatarId,
  currentLevel,
  isLoggedIn,
  onProfileClick
}) => {
  const [updateStatus, setUpdateStatus] = useState('idle')
  const [downloadProgress, setDownloadProgress] = useState(0)

  useEffect(() => {
    let cleanups = []

    if (window.api && window.api.update) {
      if (window.api.update.onUpdateAvailable) {
        cleanups.push(window.api.update.onUpdateAvailable((info) => {
          setUpdateStatus('available')
          if (onNotification) onNotification(`Update Available: v${info.version}`, 'success')
        }))
      }
      
      if (window.api.update.onUpdateNotAvailable) {
        cleanups.push(window.api.update.onUpdateNotAvailable(() => {
          if (updateStatus === 'checking') {
            if (onNotification) onNotification('You are on the latest version.', 'info')
          }
          setUpdateStatus('idle')
        }))
      }
      
      if (window.api.update.onDownloadProgress) {
        cleanups.push(window.api.update.onDownloadProgress((percent) => {
          setUpdateStatus('downloading')
          setDownloadProgress(Math.round(percent))
        }))
      }
      
      if (window.api.update.onUpdateDownloaded) {
        cleanups.push(window.api.update.onUpdateDownloaded(() => {
          setUpdateStatus('downloaded')
          setDownloadProgress(0)
          if (onNotification) onNotification('Update ready! Restart to apply.', 'success')
        }))
      }
    }

    return () => cleanups.forEach(c => c())
  }, [onNotification, updateStatus])

  // Need AVATAR_MAP for profile button
  // We will trust the passed ID or fetch mapping appropriately.
  // Ideally importing AVATAR_MAP here is best practice.

  const handleUpdateClick = () => {
    if (updateStatus === 'downloaded') {
      window.api.update.quitAndInstall()
    } else if (updateStatus === 'idle') {
      setUpdateStatus('checking')
      window.api.update.checkForUpdates()
    }
  }

  const menuItems = [
    { id: 'typing', icon: <Keyboard size={20} />, label: 'Typing' },
    { id: 'leaderboard', icon: <Globe size={20} />, label: 'Global' },
    { id: 'history', icon: <History size={20} />, label: 'History' },
    { id: 'achievements', icon: <Trophy size={20} />, label: 'Awards' },
  ]

  return (
    <aside 
      className={`main-sidebar ${testStarted && isZenMode ? 'zen-active' : ''}`}
    >
      <div className="sidebar-top">
        <div className="sidebar-divider" />
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div 
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <div className="icon-wrapper">
              {item.icon}
            </div>
            {activeTab === item.id && (
              <div className="active-indicator" />
            )}
          </div>
        ))}
        <div className="nav-item secondary" onClick={() => onNotification('Press Ctrl + Shift + P for commands', 'info')}>
          <Command size={20} />
        </div>
        <div className="nav-item secondary" onClick={() => onNotification('TypingZone v1.0.3 - Built for speed.', 'success')}>
          <Info size={20} />
        </div>
      </nav>

      <div className="sidebar-bottom">
        <div className="bottom-group" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <div 
            className={`nav-item secondary ${updateStatus === 'checking' ? 'spin' : ''} ${updateStatus === 'downloaded' ? 'active-green' : ''} ${updateStatus === 'downloading' ? 'downloading' : ''}`}
            onClick={handleUpdateClick}
          >
            {updateStatus === 'downloaded' ? (
              <ArrowUpCircle size={20} />
            ) : updateStatus === 'downloading' ? (
              <span className="progress-text">{downloadProgress}%</span>
            ) : (
              <RefreshCw size={20} />
            )}
            {updateStatus === 'available' && <div className="notification-dot" />}
          </div>
          
          <div 
            className="profile-trigger"
            onClick={onProfileClick}
          >
             {/* We need the avatar image here. Since `UserDropdown` handles it via ID map, we should probably do same or pass src */}
             {/* Simplified: Rendering a div that will be filled by css or passed child */}
             <UniversalAvatar 
               avatarId={selectedAvatarId} 
               theme={AVATAR_DEFS.find(a => a.id === selectedAvatarId)?.theme}
               size={34}
               className="profile-img-sidebar" 
             />
             {currentLevel !== undefined && (
               <div className="sidebar-level-badge">
                 {currentLevel}
               </div>
             )}
             {/* Fallback icon if image fails */}
             <Settings size={20} className="fallback-icon" style={{position:'absolute', zIndex:-1}}/> 
          </div>
        </div>
      </div>
    </aside>
  )
})

Sidebar.displayName = 'Sidebar'

export default Sidebar
