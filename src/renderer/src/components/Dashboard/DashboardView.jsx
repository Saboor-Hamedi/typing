/**
 * DashboardView
 *
 * Purpose:
 * - Presents profile summary (avatar, level, PB), analytics graph, recent activity, and wardrobe.
 *
 * Highlights:
 * - Leveling: derives `experience`, `level`, and progress via `calculateLevel(history)`.
 * - Wardrobe: shows `AVATAR_DEFS` with lock overlay based on `unlockedAvatars`, and calls
 *   `onUpdateAvatar` when selecting an unlocked, non-selected avatar.
 * - Activity: renders recent sessions with WPM/ACC badges and visual markers.
 */
import './DashboardView.css'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Zap,
  Target,
  Flame,
  TrendingUp,
  Calendar,
  Map,
  Activity,
  Trash2,
  Settings,
  LogOut,
  Edit2,
  User,
  ShieldAlert,
  Plus
} from 'lucide-react'
import DangerZone from '../Common/DangerZone'
import ProgressGraph from '../Analytics/ProgressGraph'
import dashboardBg from '../../assets/dashboard_bg.png'
import { calculateLevel } from '../../utils/Leveling'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Lock, Check, Database, Search as SearchIcon } from 'lucide-react'
import DatabaseModal from '../Database/DatabaseModal'

// Avatar Registry
import { AVATAR_MAP, AVATAR_DEFS } from '../../assets/avatars'
import UniversalAvatar from '../Common/UniversalAvatar'
import { HighlightedText } from '../Common'

const DashboardView = ({
  stats,
  history = [],
  username,
  selectedAvatarId = 1,
  unlockedAvatars = [1],
  currentLevel,
  progression,
  onUpdateAvatar,
  setUsername,
  isLoggedIn,
  onDeleteAccount,
  onLogout,
  onSettings,
  openLoginModal,
  addToast
}) => {
  const [isAddContentOpen, setIsAddContentOpen] = useState(false)
  const [activitySearch, setActivitySearch] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState(username)
  const activitySearchRef = useRef(null)

  // Global shortcut for focusing search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        activitySearchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const { experience, level, levelProgress, xpToNext } = progression || calculateLevel(history)

  const statsCore = useMemo(() => {
    if (history.length === 0) return { avgWpm: 0, avgAcc: 0, total: 0 }

    const sumWpm = history.reduce((acc, curr) => acc + curr.wpm, 0)
    const sumAcc = history.reduce((acc, curr) => acc + curr.accuracy, 0)

    return {
      avgWpm: Math.round(sumWpm / history.length),
      avgAcc: Math.round(sumAcc / history.length),
      total: history.length
    }
  }, [history])

  const bestWpm = stats.pb || 0

  const filteredHistory = useMemo(() => {
    if (!activitySearch.trim()) return history.slice(0, 10)
    const q = activitySearch.toLowerCase()
    return history.filter(
      (h) =>
        h.mode.toLowerCase().includes(q) ||
        h.wpm.toString().includes(q) ||
        h.accuracy.toString().includes(q)
    )
  }, [history, activitySearch])

  return (
    <div className="dashboard-container">
      {/* Facebook-style Cover & Profile Section */}
      <div className="profile-header-container">
        <div className="profile-cover" style={{ backgroundImage: `url(${dashboardBg})` }}>
          <div className="cover-overlay" />
          <div className="hero-actions">
            {!isLoggedIn && (
              <button className="hero-btn join" onClick={openLoginModal} title="Join TypingZone">
                <User size={18} />
              </button>
            )}
            <button
              className="hero-btn"
              onClick={() => setIsAddContentOpen(true)}
              title="Add Content"
            >
              <Plus size={18} />
            </button>
            <button className="hero-btn" onClick={onSettings} title="Settings">
              <Settings size={18} />
            </button>
            {isLoggedIn && (
              <button className="hero-btn logout" onClick={onLogout} title="Sign Out">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="profile-main-info-row">
          <motion.div
            className="profile-avatar-section"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="avatar-wrapper-fb">
              <UniversalAvatar
                avatarId={selectedAvatarId}
                theme={AVATAR_DEFS.find((a) => a.id === selectedAvatarId)?.theme}
                size={100}
                className="profile-img-fb"
              />
              <div className="status-indicator online" />
            </div>
          </motion.div>

          <div className="profile-text-section">
            <div className="name-and-badges">
              {isEditingName ? (
                <input
                  type="text"
                  className="username-input-fb"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={() => {
                    if (tempName.trim() && tempName.trim() !== username)
                      setUsername(tempName.trim())
                    setIsEditingName(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (tempName.trim() && tempName.trim() !== username)
                        setUsername(tempName.trim())
                      setIsEditingName(false)
                    } else if (e.key === 'Escape') {
                      setIsEditingName(false)
                      setTempName(username)
                    }
                  }}
                  autoFocus
                  maxLength={12}
                />
              ) : (
                <div
                  className="name-display-row-fb"
                  onClick={() => {
                    setIsEditingName(true)
                    setTempName(username)
                  }}
                >
                  <h1>{username || 'Pro Typist'}</h1>
                  <Edit2 size={16} className="edit-icon-fb" />
                </div>
              )}
            </div>

            <div className="profile-xp-stats">
              <div className="xp-info-mini">
                <div className="xp-top-row">
                  <span className="exp-text-fb">{experience} XP</span>
                  <div className="rank-and-level">
                    <span className="rank-text-fb">
                      {AVATAR_DEFS.findLast((a) => level >= a.level)?.name || 'Novice'}
                    </span>
                    <span className="lv-text-fb">LVL {level}</span>
                  </div>
                </div>
                <div className="level-progress-container-fb">
                  <div className="level-progress-bar-fb" style={{ width: `${levelProgress}%` }} />
                </div>
                <span className="xp-remaining-fb">{xpToNext} XP to next level</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-main-grid">
        {/* LEFT COLUMN: Deep Analytics & History */}
        <div className="dashboard-column primary">
          <section className="dashboard-card glass-panel section-graph">
            <div className="section-header">
              <Activity size={18} />
              <span>Performance Trend</span>
            </div>
            <ProgressGraph data={history} />
          </section>

          <section className="dashboard-card glass-panel section-activity">
            <div className="section-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={18} />
                <span>Activity Log</span>
              </div>
              <div className="activity-search-wrap">
                <SearchIcon size={14} className="search-icon" />
                <input
                  ref={activitySearchRef}
                  type="text"
                  placeholder="Search activity... (Ctrl+K)"
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  className="activity-search-input"
                />
              </div>
            </div>
            <div className="activity-grid">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((test, i) => (
                    <motion.div
                      key={test.id || test.date || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      layout
                      className={`session-card ${test.wpm >= 100 ? 'tier-high' : test.wpm >= 60 ? 'tier-mid' : 'tier-base'}`}
                    >
                      <div className="session-icon">
                        {test.mode === 'time' ? <Calendar size={18} /> : <TrendingUp size={18} />}
                      </div>
                      <div className="session-time">
                        <span className="date">{new Date(test.date).toLocaleDateString()}</span>
                        <span className="time">
                          {new Date(test.date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="session-main">
                        <div className="mode-badge">
                          <HighlightedText
                            text={`${test.mode} ${test.limit || ''}`}
                            query={activitySearch}
                          />
                        </div>
                        <div className="stats-row">
                          <div className="stat-pill wpm">
                            <span className="value">
                              <HighlightedText
                                text={test.wpm.toString()}
                                query={activitySearch}
                              />
                            </span>
                            <span className="label">WPM</span>
                          </div>
                          <div className="stat-pill acc">
                            <span className="value">
                              <HighlightedText
                                text={`${test.accuracy}%`}
                                query={activitySearch}
                              />
                            </span>
                            <span className="label">ACC</span>
                          </div>
                        </div>
                      </div>
                      <div className="session-marker" />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="empty-state"
                  >
                    <Search
                      size={32}
                      style={{ opacity: 0.2, marginBottom: '1rem' }}
                      strokeWidth={1.5}
                    />
                    <span>
                      {activitySearch
                        ? `No results for "${activitySearch}"`
                        : 'No sessions recorded yet. Get typing!'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Quick Stats & Milestones */}
        <div className="dashboard-column secondary">
          <div className="sidebar-stats-stack">
            <motion.div className="mini-stat-card glass-panel" whileHover={{ x: 5 }}>
              <div className="m-header">
                <TrendingUp size={16} />
                <span>AVG SPEED</span>
              </div>
              <div className="m-body">
                <span className="val">{statsCore.avgWpm}</span>
                <span className="unit">WPM</span>
              </div>
            </motion.div>

            <motion.div className="mini-stat-card glass-panel" whileHover={{ x: 5 }}>
              <div className="m-header">
                <Target size={16} />
                <span>ACCURACY</span>
              </div>
              <div className="m-body">
                <span className="val">{statsCore.avgAcc}</span>
                <span className="unit">%</span>
              </div>
            </motion.div>

            <motion.div className="mini-stat-card glass-panel" whileHover={{ x: 5 }}>
              <div className="m-header">
                <Zap size={16} />
                <span>TOTAL RUNS</span>
              </div>
              <div className="m-body">
                <span className="val">{statsCore.total}</span>
                <span className="unit">TESTS</span>
              </div>
            </motion.div>
          </div>

          <section className="dashboard-card glass-panel section-wardrobe">
            <div className="section-header">
              <Map size={18} />
              <span>Wardrobe</span>
            </div>
            <div className="wardrobe-grid">
              {AVATAR_DEFS.map((av) => {
                const isUnlocked = unlockedAvatars.includes(av.id)
                const isSelected = selectedAvatarId === av.id

                return (
                  <div
                    key={av.id}
                    className={`wardrobe-item ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (isUnlocked && !isSelected) {
                        onUpdateAvatar(av.id)
                      }
                    }}
                    title={isUnlocked ? av.name : `${av.name} (Unlocks at Lvl ${av.level})`}
                  >
                    <div className="img-container">
                      <UniversalAvatar
                        avatarId={av.id}
                        theme={av.theme}
                        className="wardrobe-avatar-img"
                      />
                      {!isUnlocked && (
                        <div className="lock-overlay">
                          <Lock size={12} />
                          <span className="unlock-lv">LV{av.level}</span>
                        </div>
                      )}
                      {isSelected && <div className="selected-glow" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="dashboard-card glass-panel section-milestones">
            <div className="section-header">
              <Trophy size={18} />
              <span>Milestones</span>
            </div>
            <div className="milestones-list">
              <div
                className={`milestone-item m-zap ${statsCore.total > 0 ? 'achieved' : 'locked'}`}
              >
                <div className="m-icon">
                  <Zap size={14} />
                </div>
                <div className="m-info">
                  <span className="m-title">First Blood</span>
                  <span className="m-desc">Complete your first test</span>
                </div>
              </div>
              <div className={`milestone-item m-speed ${bestWpm >= 80 ? 'achieved' : 'locked'}`}>
                <div className="m-icon">
                  <Flame size={14} />
                </div>
                <div className="m-info">
                  <span className="m-title">Speed Demon</span>
                  <span className="m-desc">Reach 80 WPM</span>
                </div>
              </div>
              <div className={`milestone-item m-flame ${bestWpm >= 120 ? 'achieved' : 'locked'}`}>
                <div className="m-icon">
                  <Flame size={14} />
                </div>
                <div className="m-info">
                  <span className="m-title">Elite</span>
                  <span className="m-desc">Reach 120 WPM</span>
                </div>
              </div>
              <div className={`milestone-item m-cyber ${level >= 40 ? 'achieved' : 'locked'}`}>
                <div className="m-icon">
                  <Activity size={14} />
                </div>
                <div className="m-info">
                  <span className="m-title">Cyber Ghost</span>
                  <span className="m-desc">Reach Level 40</span>
                </div>
              </div>
              <div className={`milestone-item m-trophy ${level >= 60 ? 'achieved' : 'locked'}`}>
                <div className="m-icon">
                  <Trophy size={14} />
                </div>
                <div className="m-info">
                  <span className="m-title">Ascended</span>
                  <span className="m-desc">Reach Level 60</span>
                </div>
              </div>
            </div>
          </section>

          {isLoggedIn && (
            <div style={{ marginTop: '1.5rem' }}>
              <DangerZone
                title="Account Termination"
                description="Delete your cloud account and all synced data. This action is permanent and cannot be reversed."
                buttonText="Delete My Account"
                onAction={onDeleteAccount}
                icon={ShieldAlert}
              />
            </div>
          )}
        </div>
      </div>
      <DatabaseModal
        isOpen={isAddContentOpen}
        onClose={() => setIsAddContentOpen(false)}
        onSave={() => setIsAddContentOpen(false)}
        addToast={addToast}
      />
    </div>
  )
}

export default DashboardView
