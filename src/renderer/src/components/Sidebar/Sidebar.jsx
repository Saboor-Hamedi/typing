import './Sidebar.css'
import { Keyboard, History, Settings, Info, Trophy, Command, Volume2, VolumeX, Ghost, LayoutDashboard, Zap, RefreshCw, ArrowUpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  testStarted, 
  isZenMode,
  isSoundEnabled,
  setIsSoundEnabled,
  isHallEffect,
  setIsHallEffect,
  isGhostEnabled,
  setIsGhostEnabled,
  onNotification
}) => {
  const [updateStatus, setUpdateStatus] = useState('idle') // idle, checking, avail, downloaded

  useEffect(() => {
    let cleanupAvailable = () => {}
    let cleanupNotAvailable = () => {}
    let cleanupDownloaded = () => {}

    if (window.api && window.api.update) {
      cleanupAvailable = window.api.update.onUpdateAvailable(() => setUpdateStatus('available'))
      
      cleanupNotAvailable = window.api.update.onUpdateNotAvailable(() => {
        setUpdateStatus('idle')
        if (onNotification) onNotification('You are on the latest version.', 'info')
      })
      
      cleanupDownloaded = window.api.update.onUpdateDownloaded(() => setUpdateStatus('downloaded'))
    }

    return () => {
      cleanupAvailable()
      cleanupNotAvailable()
      cleanupDownloaded()
    }
  }, [onNotification])

  const handleUpdateClick = () => {
    if (updateStatus === 'downloaded') {
      window.api.update.quitAndInstall()
    } else {
      setUpdateStatus('checking')
      window.api.update.checkForUpdates()
    }
  }

  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'typing', icon: <Keyboard size={20} />, label: 'Typing' },
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
        
        {/* Toggles grouped with nav */}
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
            className={`nav-item ${isGhostEnabled ? 'toggle-active' : ''}`} 
            onClick={() => setIsGhostEnabled(!isGhostEnabled)}
            title="Ghost Caret (Race PB)"
          >
            <Ghost size={20} />
          </div>
        </div>
        
        {/* Secondary Info Items pushed to top section as requested */}
        <div className="nav-item secondary" title="How to use">
          <Command size={20} />
        </div>
        <div className="nav-item secondary" title="About">
          <Info size={20} />
        </div>
      </nav>

      <div className="sidebar-bottom">

        {/* Bottom Group: Update & Settings with no gap */}
        <div className="bottom-group" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <div 
            className={`nav-item secondary ${updateStatus === 'checking' ? 'spin' : ''} ${updateStatus === 'downloaded' ? 'active-green' : ''}`}
            onClick={handleUpdateClick}
            title={updateStatus === 'downloaded' ? 'Restart to Update' : 'Check for Updates'}
          >
            {updateStatus === 'downloaded' ? <ArrowUpCircle size={20} /> : <RefreshCw size={20} />}
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
}

export default Sidebar
