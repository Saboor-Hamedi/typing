import { useState } from 'react'
import './SettingsView.css'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Volume2,
  CloudRain,
  Trash2,
  ShieldCheck,
  Github,
  Zap,
  Palette,
  Type,
  AlertCircle,
  Play,
  Hash,
  CaseSensitive,
  Quote,
  Flame,
  ShieldAlert,
  AlertTriangle,
  LogOut
} from 'lucide-react'
import { useSettings } from '../../contexts/SettingsContext'
import { useUser } from '../../contexts/UserContext'
import DangerZone from '../Common/DangerZone'

/**
 * Settings View Component
 * Allows users to customize app behavior and appearance
 */
const SettingsView = ({ onClearHistory, openThemeModal }) => {
  const {
    isGhostEnabled,
    setIsGhostEnabled,
    isSoundEnabled,
    setIsSoundEnabled,
    isHallEffect,
    setIsHallEffect,
    isChameleonEnabled,
    setIsChameleonEnabled,
    isKineticEnabled,
    setIsKineticEnabled,
    isSmoothCaret,
    setIsSmoothCaret,
    ghostSpeed,
    setGhostSpeed,
    caretStyle,
    setCaretStyle,
    isFireCaretEnabled,
    setIsFireCaretEnabled,
    isErrorFeedbackEnabled,
    setIsErrorFeedbackEnabled,
    isZenMode,
    setIsZenMode,
    soundProfile,
    setSoundProfile,
    isCenteredScrolling,
    setIsCenteredScrolling,
    hasPunctuation,
    setHasPunctuation,
    hasNumbers,
    setHasNumbers,
    hasCaps,
    setHasCaps
  } = useSettings()

  const { isLoggedIn, handleLogout } = useUser()

  const [activeTab, setActiveTab] = useState('appearance')

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
    { id: 'audio', label: 'Audio', icon: <Volume2 size={16} /> },
    { id: 'gameplay', label: 'Gameplay', icon: <ShieldCheck size={16} /> },
    { id: 'content', label: 'Content', icon: <Hash size={16} /> },
    { id: 'account', label: 'Account', icon: <Trash2 size={16} /> }
  ]

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Your workspace, your rules.</p>
      </div>

      <div className="settings-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div className="tab-active-pill" layoutId="active-pill" />
            )}
          </button>
        ))}
      </div>

      <div className="settings-content-wrapper">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="settings-sections"
          >
            {activeTab === 'appearance' && (
              <section className="settings-section glass-panel">
                <div className="section-title">
                  <Palette size={16} />
                  <span>Appearance</span>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Application Theme</div>
                    <p className="setting-description">
                      Change the overall look and feel of TypingZone.
                    </p>
                  </div>
                  <button className="settings-action-btn" onClick={openThemeModal}>
                    Select Theme
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">
                      <Type size={16} />
                      <span>Line Caret (2px)</span>
                    </div>
                    <p className="setting-description">Standard vertical bar for precision.</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={caretStyle === 'bar'}
                      onChange={() => setCaretStyle('bar')}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">
                      <Type size={16} />
                      <span>Thick Block (7px)</span>
                    </div>
                    <p className="setting-description">
                      High-visibility block that inverts background text.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={caretStyle === 'block'}
                      onChange={() => setCaretStyle('block')}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">
                      <Flame size={16} color="#ff4500" />
                      <span>Fire Effect</span>
                    </div>
                    <p className="setting-description">
                      Add an animated flame aura to the caret (GPU accelerated).
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isFireCaretEnabled}
                      onChange={() => setIsFireCaretEnabled(!isFireCaretEnabled)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">
                      <Zap size={16} />
                      <span>Chameleon Flow</span>
                    </div>
                    <p className="setting-description">
                      UI colors react to your speed. "Heat up" as you approach your PB.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isChameleonEnabled}
                      onChange={() => setIsChameleonEnabled(!isChameleonEnabled)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">
                      <Zap size={16} className="kinetic-accent" />
                      <span className="kinetic-accent">Kinetic Popping</span>
                    </div>
                    <p className="setting-description">
                      Letters "pop" and glow with kinetic energy when typed correctly.
                    </p>
                  </div>
                  <label className="toggle-switch specialized">
                    <input
                      type="checkbox"
                      checked={isKineticEnabled}
                      onChange={() => setIsKineticEnabled(!isKineticEnabled)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">
                      <Zap size={16} />
                      <span>Smooth Caret</span>
                    </div>
                    <p className="setting-description">
                      Enable smooth animation for the typing caret movement.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isSmoothCaret}
                      onChange={() => setIsSmoothCaret(!isSmoothCaret)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">
                      <Play size={16} />
                      <span>Zen Mode</span>
                    </div>
                    <p className="setting-description">
                      Hide unnecessary UI elements while typing for maximum focus.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isZenMode}
                      onChange={() => setIsZenMode(!isZenMode)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </section>
            )}

            {activeTab === 'audio' && (
              <section className="settings-section glass-panel">
                <div className="section-title">
                  <Volume2 size={16} />
                  <span>Acoustics</span>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">
                      <Volume2 size={16} />
                      <span>Mechanical Sound</span>
                    </div>
                    <p className="setting-description">
                      Enable or disable high-fidelity mechanical switch feedback.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isSoundEnabled}
                      onChange={() => setIsSoundEnabled(!isSoundEnabled)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item-column">
                  <div className="setting-info" style={{ marginBottom: '1rem' }}>
                    <div className="setting-label">
                      <Volume2 size={16} />
                      <span>Sound Profile</span>
                    </div>
                    <p className="setting-description">
                      Choose your preferred mechanical switch acoustic profile.
                    </p>
                  </div>

                  <div className="sound-profile-grid">
                    {[
                      { id: 'thocky', name: 'Thocky', desc: 'Deep & satisfying' },
                      { id: 'creamy', name: 'Creamy', desc: 'Smooth & marble-like' },
                      { id: 'clicky', name: 'Clicky', desc: 'Sharp & responsive' },
                      { id: 'raindrop', name: 'Raindrop', desc: 'Soft & damp' },
                      { id: 'wood', name: 'Wood', desc: 'Warm & organic' },
                      { id: 'asmr', name: 'ASMR', desc: 'Soft & relaxing' }
                    ].map((profile) => (
                      <motion.div
                        key={profile.id}
                        className={`profile-card ${soundProfile === profile.id ? 'active' : ''}`}
                        onClick={() => setSoundProfile(profile.id)}
                        whileHover={{
                          y: -4,
                          backgroundColor: 'rgba(var(--main-color-rgb), 0.05)'
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="profile-info">
                          <span className="profile-name">{profile.name}</span>
                          <span className="profile-desc">{profile.desc}</span>
                        </div>
                        <button
                          className="preview-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            const old = soundProfile
                            setSoundProfile(profile.id)
                            setTimeout(() => {
                              import('../../utils/SoundEngine').then(({ soundEngine }) => {
                                soundEngine.playKeySound('space')
                              })
                            }, 10)
                          }}
                        >
                          <Play size={12} fill="currentColor" />
                        </button>
                        {soundProfile === profile.id && (
                          <motion.div className="active-dot" layoutId="soundActive" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">
                      <CloudRain size={16} />
                      <span>Hall Reverb Effect</span>
                    </div>
                    <p className="setting-description">
                      Add a spacious hall-like atmosphere to the keyboard sounds.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isHallEffect}
                      onChange={() => setIsHallEffect(!isHallEffect)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </section>
            )}

            {activeTab === 'gameplay' && (
              <section className="settings-section glass-panel">
                <div className="section-title">
                  <ShieldCheck size={16} />
                  <span>Gameplay</span>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">
                      <Trophy size={16} />
                      <span>Ghost Caret (PB Race)</span>
                    </div>
                    <p className="setting-description">
                      Race against your personal best speed during the test.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isGhostEnabled}
                      onChange={() => setIsGhostEnabled(!isGhostEnabled)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <motion.div
                  initial={false}
                  animate={{ height: isGhostEnabled ? 'auto' : 0, opacity: isGhostEnabled ? 1 : 0 }}
                  className="setting-sub-item"
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    className="slider-container"
                    style={{
                      padding: '10px 0 10px 20px',
                      borderLeft: '2px solid var(--sub-alt-color)',
                      marginTop: '10px'
                    }}
                  >
                    <div
                      className="slider-header"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        fontSize: '0.85rem'
                      }}
                    >
                      <span style={{ color: 'var(--sub-color)' }}>Ghost Intensity</span>
                      <span style={{ color: 'var(--main-color)', fontWeight: 'bold' }}>
                        {Math.round(ghostSpeed * 100)}% of PB
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={ghostSpeed}
                      onChange={(e) => setGhostSpeed(parseFloat(e.target.value))}
                      style={{
                        width: '100%',
                        accentColor: 'var(--main-color)',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </motion.div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">
                      <ShieldCheck size={16} />
                      <span>Centered Line Scrolling</span>
                    </div>
                    <p className="setting-description">
                      Keep the active line locked in the vertical center for better focus.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isCenteredScrolling}
                      onChange={() => setIsCenteredScrolling(!isCenteredScrolling)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">
                      <AlertCircle size={16} />
                      <span>Error Feedback</span>
                    </div>
                    <p className="setting-description">
                      Visual red glow and shake animation when you mistype.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isErrorFeedbackEnabled}
                      onChange={() => setIsErrorFeedbackEnabled(!isErrorFeedbackEnabled)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </section>
            )}

            {activeTab === 'content' && (
              <section className="settings-section glass-panel">
                <div className="section-title">
                  <Hash size={16} />
                  <span>Complexity & Training</span>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">
                      <Quote size={16} />
                      <span>Punctuation</span>
                    </div>
                    <p className="setting-description">
                      Inject periods, commas, and question marks.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={hasPunctuation}
                      onChange={() => setHasPunctuation(!hasPunctuation)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">
                      <Hash size={16} />
                      <span>Numbers</span>
                    </div>
                    <p className="setting-description">Add numerals 0-9 to the word stream.</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={hasNumbers}
                      onChange={() => setHasNumbers(!hasNumbers)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">
                      <CaseSensitive size={16} />
                      <span>Capitalization</span>
                    </div>
                    <p className="setting-description">Practice using the SHIFT key (Aa).</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={hasCaps}
                      onChange={() => setHasCaps(!hasCaps)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </section>
            )}

            {activeTab === 'account' && (
              <div className="account-tab-content">
                {isLoggedIn && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <DangerZone
                      title="Active Session"
                      description="You are currently signed in. Singing out will pause cloud synchronization."
                      buttonText="Sign Out Now"
                      onAction={handleLogout}
                      icon={LogOut}
                    />
                  </div>
                )}

                <DangerZone
                  title="Local Data Cleanup"
                  description="Permanently delete all your local test history and PBs. This action only affects this device."
                  buttonText="Clear Local History"
                  onAction={onClearHistory}
                  icon={Trash2}
                />

                <section className="settings-section links" style={{ marginTop: '1.5rem' }}>
                  <a
                    href="https://github.com/Saboor-Hamedi"
                    target="_blank"
                    rel="noreferrer"
                    className="link-item"
                  >
                    <Github size={16} />
                    <span>View on GitHub</span>
                  </a>
                </section>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default SettingsView
