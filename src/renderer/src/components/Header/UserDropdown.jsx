import { useState, useEffect, useRef, memo } from 'react'
import { User, Activity, LogOut, LayoutDashboard } from 'lucide-react'
import { AVATAR_MAP } from '../../assets/avatars'

const UserDropdown = memo(({ username, isLoggedIn, setUsername, openLoginModal, onLogoutRequest, selectedAvatarId = 1, onNavigateDashboard, wpm }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState('')
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isDropdownOpen) return
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (!isDropdownOpen) return
      if (e.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isDropdownOpen])

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      <div 
        className={`user-trigger ${isDropdownOpen ? 'active' : ''}`}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="trigger-avatar">
          <img src={AVATAR_MAP[selectedAvatarId]} alt="User" />
          {isLoggedIn && <div className="online-indicator" />}
        </div>
      </div>

      {isDropdownOpen && (
        <>
          <div className="dropdown-overlay" onClick={() => setIsDropdownOpen(false)} />
          <div className="user-dropdown glass-panel">
              <div className="dropdown-header">
                <div className="user-info-section">
                   <div className="name-row">
                      <span className="name-text">{username}</span>
                      <span className={`identity-badge ${isLoggedIn ? 'cloud' : 'local'}`}>
                         {isLoggedIn ? 'Logged In' : 'Guest'}
                      </span>
                   </div>
                   <span className="dropdown-subtitle">Status & Account</span>
                </div>
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
                          if (tempName.trim() && tempName.trim() !== username) {
                            setUsername(tempName.trim())
                          }
                          setIsEditing(false)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (tempName.trim() && tempName.trim() !== username) {
                               setUsername(tempName.trim())
                            }
                            setIsEditing(false)
                          }
                        }}
                        autoFocus
                        maxLength={12}
                      />
                    ) : (
                      <div className="name-wrapper" onClick={() => { setIsEditing(true); setTempName(username); }}>
                        <div className="name-row">
                          <span className="name-text-sm">{username}</span>
                        </div>
                        <span className="edit-hint">Click to change nickname</span>
                      </div>
                    )}
                  </div>
                </div>
                {wpm !== undefined && (
                  <div className="dropdown-item">
                    <div className="item-icon"><Activity size={14} /></div>
                    <div className="item-content">
                      <span className="label">Typing Speed</span>
                      <span className="status-text">{wpm} WPM</span>
                    </div>
                  </div>
                )}
                {typeof onNavigateDashboard === 'function' && (
                  <div 
                    className="dropdown-item clickable"
                    onClick={() => { onNavigateDashboard(); setIsDropdownOpen(false); }}
                  >
                    <div className="item-icon"><LayoutDashboard size={14} /></div>
                    <div className="item-content">
                      <span className="label">Dashboard</span>
                      <span className="status-text">View profile & stats</span>
                    </div>
                  </div>
                )}
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
          </div>
        </>
      )}
    </div>
  )
})

UserDropdown.displayName = 'UserDropdown'

export default UserDropdown
