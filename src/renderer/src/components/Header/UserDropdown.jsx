import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, ChevronDown, Wifi, Activity, LogOut } from 'lucide-react'

const UserDropdown = ({ username, isLoggedIn, setUsername, openLoginModal, onLogoutRequest }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState('')

  return (
    <div className="dropdown-container">
      <motion.div 
        className={`user-trigger ${isDropdownOpen ? 'active' : ''}`}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <User size={16} />
        <span className="trigger-name">{username}</span>
        <motion.div 
          animate={{ rotate: isDropdownOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} style={{ opacity: 0.5, marginLeft: '4px' }} />
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        {isDropdownOpen && (
          <>
            <div className="dropdown-overlay" onClick={() => setIsDropdownOpen(false)} />
            <motion.div 
              className="user-dropdown glass-panel"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <div className="dropdown-header">
                <span className="dropdown-title">Account & Status</span>
              </div>

              <div className="dropdown-section">
                <div className="dropdown-item profile-setting">
                  <div className="item-icon"><User size={14} /></div>
                  <div className="item-content">
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
                      <div className="name-wrapper" onClick={() => { setIsEditing(true); setTempName(username); }}>
                        <div className="name-row">
                          <span className="name-text">{username}</span>
                          <span className={`identity-badge ${isLoggedIn ? 'cloud' : 'local'}`}>
                            {isLoggedIn ? 'Cloud' : 'Local'}
                          </span>
                        </div>
                        <span className="edit-hint">Click to edit</span>
                      </div>
                    )}
                  </div>
                </div>

                <div 
                  className={`dropdown-item ${!isLoggedIn ? 'clickable' : ''}`}
                  onClick={() => !isLoggedIn && openLoginModal()}
                >
                  <div className="item-icon">
                    <Wifi size={14} className={isLoggedIn ? "connected" : ""} />
                  </div>
                  <div className="item-content">
                    <span className="label">Cloud Sync</span>
                    <span className="status-text">{isLoggedIn ? 'Active' : 'Offline (Click to login)'}</span>
                  </div>
                </div>

                <div className="dropdown-item">
                  <div className="item-icon"><Activity size={14} className="pulse" /></div>
                  <div className="item-content">
                    <span className="label">Engine State</span>
                    <span className="status-text">Blazing Fast</span>
                  </div>
                </div>
              </div>

              <div className="dropdown-footer">
                {isLoggedIn ? (
                  <button className="logout-btn" onClick={() => { onLogoutRequest(); setIsDropdownOpen(false); }}>
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button className="login-btn-dropdown" onClick={() => { openLoginModal(); setIsDropdownOpen(false); }}>
                    <LogOut size={14} style={{ transform: 'rotate(180deg)' }} />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UserDropdown
