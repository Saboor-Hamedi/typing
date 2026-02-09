import { motion, AnimatePresence } from 'framer-motion'
import { Settings, LogOut, LogIn, Plus } from 'lucide-react'
import UniversalAvatar from '../Common/UniversalAvatar'
import { AVATAR_DEFS } from '../../assets/avatars'
import './ProfileMenu.css'

/**
 * ProfileMenu Component
 * Refined to be more subtle and perfectly aligned.
 */
const ProfileMenu = ({
  isOpen,
  onClose,
  isLoggedIn,
  onAction,
  username,
  currentLevel,
  selectedAvatarId
}) => {
  const avatarTheme = AVATAR_DEFS.find((a) => a.id === (selectedAvatarId || 0))?.theme

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Transparent overlay to catch clicks outside */}
          <div className="profile-menu-overlay" onClick={onClose} />

          <motion.div
            className="profile-menu-container"
            initial={{ opacity: 0, scale: 0.95, x: -5, y: 5 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -5, y: 5 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className="profile-menu-header">
              <div className="profile-name">{isLoggedIn ? username : 'Guest User'}</div>
            </div>

            <div className="profile-menu-divider" />

            <div className="profile-menu-list">
              <button
                className="profile-menu-item"
                onClick={() => {
                  onAction('dashboard')
                  onClose()
                }}
              >
                <div className="item-icon">
                  <UniversalAvatar avatarId={selectedAvatarId || 0} theme={avatarTheme} size={16} />
                </div>
                <span>View Profile</span>
              </button>

              <button
                className="profile-menu-item"
                onClick={() => {
                  onAction('settings')
                  onClose()
                }}
              >
                <div className="item-icon">
                  <Settings size={14} />
                </div>
                <span>Settings</span>
              </button>

              <div className="profile-menu-divider" />

              {isLoggedIn ? (
                <button
                  className="profile-menu-item logout"
                  onClick={() => {
                    onClose()
                    setTimeout(() => onAction('logout'), 50)
                  }}
                >
                  <div className="item-icon">
                    <LogOut size={14} />
                  </div>
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  className="profile-menu-item login"
                  onClick={() => {
                    onClose()
                    setTimeout(() => onAction('login'), 50)
                  }}
                >
                  <div className="item-icon">
                    <LogIn size={14} />
                  </div>
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ProfileMenu
