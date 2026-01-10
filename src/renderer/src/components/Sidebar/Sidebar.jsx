import './Sidebar.css'
import { Keyboard, History, Settings, Info, Trophy, Command, Volume2, VolumeX, Ghost, LayoutDashboard, Zap, RefreshCw, ArrowUpCircle, Globe, MousePointer } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, memo } from 'react'
import { useSettings } from '../../contexts'

const Sidebar = memo(({ 
  activeTab, 
  setActiveTab, 
  testStarted, 
  isZenMode,
  isSoundEnabled,
  setIsSoundEnabled,
  isHallEffect,
  setIsHallEffect,
  onNotification
}) => {
  const { isSmoothCaret, setIsSmoothCaret, isGhostEnabled, setIsGhostEnabled } = useSettings()
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
    <motion.aside 
      className={`main-sidebar ${testStarted && isZenMode ? 'zen-active' : ''}`}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
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
            title={item.label}
          >
            <div className="icon-wrapper">
              {item.icon}
            </div>
            <AnimatePresence>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="active-indicator"
                  className="active-indicator"
                />
              )}
            </AnimatePresence>
          </div>
        ))}
        
        <div className="engine-controls">
          <div 
            className={`nav-item ${isSoundEnabled ? 'toggle-active' : ''}`} 
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            title="Toggle Sound"
          >
            {isSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </div>
          <div 
            className={`nav-item ${isHallEffect ? 'toggle-active' : ''}`} 
            onClick={() => setIsHallEffect(!isHallEffect)}
            title="Hall Effect"
          >
            <Zap size={20} />
          </div>
          <div 
            className={`nav-item ${isSmoothCaret ? 'toggle-active' : ''}`} 
            onClick={() => setIsSmoothCaret(!isSmoothCaret)}
            title="Smooth Caret"
          >
            <MousePointer size={20} />
          </div>
          <div 
            className={`nav-item ${isGhostEnabled ? 'toggle-active' : ''}`} 
            onClick={() => setIsGhostEnabled(!isGhostEnabled)}
            title="Ghost Caret (Race PB)"
          >
            <Ghost size={20} />
          </div>
        </div>
        
        <div className="nav-item secondary" title="Commands Help" onClick={() => onNotification('Press Ctrl + Shift + P for commands', 'info')}>
          <Command size={20} />
        </div>
        <div className="nav-item secondary" title="About TypingZone" onClick={() => onNotification('TypingZone v1.0.3 - Built for speed.', 'success')}>
          <Info size={20} />
        </div>
      </nav>

      <div className="sidebar-bottom">
        <div className="bottom-group" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <div 
            className={`nav-item secondary ${updateStatus === 'checking' ? 'spin' : ''} ${updateStatus === 'downloaded' ? 'active-green' : ''} ${updateStatus === 'downloading' ? 'downloading' : ''}`}
            onClick={handleUpdateClick}
            title={
              updateStatus === 'downloaded' ? 'Restart to Update' : 
              updateStatus === 'downloading' ? `Downloading... ${downloadProgress}%` : 
              'Check for Updates'
            }
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
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            title="Settings"
          >
            <Settings size={20} />
            <AnimatePresence>
              {activeTab === 'settings' && (
                <motion.div 
                  layoutId="active-indicator"
                  className="active-indicator"
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.aside>
  )
})

export default Sidebar
