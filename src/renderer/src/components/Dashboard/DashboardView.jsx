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
import { Trophy, Zap, Target, Flame, TrendingUp, Calendar, Map, Activity, Trash2 } from 'lucide-react'
import ProgressGraph from '../Analytics/ProgressGraph'
import dashboardBg from '../../assets/dashboard_bg.png'
import { calculateLevel } from '../../utils/Leveling'
import { useState, useMemo } from 'react'
import { Lock, Check } from 'lucide-react'

// Avatar Registry
import { AVATAR_MAP, AVATAR_DEFS } from '../../assets/avatars'

const DashboardView = ({ stats, history = [], username, selectedAvatarId = 1, unlockedAvatars = [1], onUpdateAvatar, isLoggedIn, onDeleteAccount }) => {
  
  const { 
    experience, level, levelProgress, xpToNext 
  } = calculateLevel(history)

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
  
  return (
    <div className="dashboard-container">
      {/* Hero Section */}
      <div className="dashboard-hero" style={{ backgroundImage: `url(${dashboardBg})` }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <motion.div 
            className="profile-section"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <div className="avatar-wrapper">
              <img src={AVATAR_MAP[selectedAvatarId] || AVATAR_MAP[0]} alt="Profile" className="profile-img" />
              <div className="status-indicator online" />
            </div>
            <div className="profile-info">
              <h1>{username || 'Pro Typist'}</h1>
              <div className="level-badge">LEVEL {level}</div>
              <div className="level-progress-container">
                <div className="level-progress-bar" style={{ width: `${levelProgress}%` }} />
              </div>
              <p className="exp-text">{experience} XP • {xpToNext} XP to next level</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="dashboard-main-grid">
        {/* LEFT COLUMN: Deep Analytics & History */}
        <div className="dashboard-column primary">
          <section className="dashboard-card glass-panel section-graph">
            <div className="section-header-main">
              <Activity size={20} className="icon-main" />
              <h2>Performance Trend</h2>
            </div>
            <ProgressGraph data={history} />
          </section>

          <section className="dashboard-card glass-panel section-activity">
            <div className="section-header">
              <Calendar size={18} />
              <span>Activity Log</span>
            </div>
            <div className="activity-grid">
              {history.length > 0 ? history.slice(0, 10).map((test, i) => (
                <div key={i} className="session-card">
                  <div className="session-time">
                    <span className="date">{new Date(test.date).toLocaleDateString()}</span>
                    <span className="time">{new Date(test.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="session-main">
                    <div className="mode-badge">{test.mode} {test.limit || ''}</div>
                    <div className="stats-row">
                      <div className="stat-pill">
                        <span className="label">WPM</span>
                        <span className="value">{test.wpm}</span>
                      </div>
                      <div className="stat-pill">
                        <span className="label">ACC</span>
                        <span className="value">{test.accuracy}%</span>
                      </div>
                    </div>
                  </div>
                  <motion.div 
                    className="session-marker" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    style={{ background: test.wpm >= 100 ? 'var(--main-color)' : 'rgba(255,255,255,0.1)' }}
                  />
                </div>
              )) : (
                <div className="empty-state">No sessions recorded yet. Get typing!</div>
              )}
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
              <div className="icon-main-wrap"><Map size={18} /></div>
              <span>Wardrobe</span>
            </div>
            <div className="wardrobe-grid">
              {AVATAR_DEFS.map(av => {
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
                  >
                    <div className="img-container">
                      <img src={av.img} alt={av.name} />
                      {!isUnlocked && (
                        <div className="lock-overlay">
                          <Lock size={12} />
                        </div>
                      )}
                      {isSelected && (
                        <div className="selected-glow" />
                      )}
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
              <div className={`milestone-item ${statsCore.total > 0 ? 'achieved' : 'locked'}`}>
                <div className="m-icon"><Zap size={14} /></div>
                <div className="m-info">
                  <span className="m-title">First Blood</span>
                  <span className="m-desc">Complete your first test</span>
                </div>
              </div>
              <div className={`milestone-item ${bestWpm >= 80 ? 'achieved' : 'locked'}`}>
                <div className="m-icon"><Flame size={14} /></div>
                <div className="m-info">
                  <span className="m-title">Speed Demon</span>
                  <span className="m-desc">Reach 80 WPM</span>
                </div>
              </div>
              <div className={`milestone-item ${bestWpm >= 120 ? 'achieved' : 'locked'}`}>
                <div className="m-icon"><Flame size={14} /></div>
                <div className="m-info">
                  <span className="m-title">Elite</span>
                  <span className="m-desc">Reach 120 WPM</span>
                </div>
              </div>
              <div className={`milestone-item ${level >= 40 ? 'achieved' : 'locked'}`}>
                <div className="m-icon"><Activity size={14} /></div>
                <div className="m-info">
                  <span className="m-title">Cyber Ghost</span>
                  <span className="m-desc">Reach Level 40</span>
                </div>
              </div>
              <div className={`milestone-item ${level >= 60 ? 'achieved' : 'locked'}`}>
                <div className="m-icon"><Trophy size={14} /></div>
                <div className="m-info">
                  <span className="m-title">Ascended</span>
                  <span className="m-desc">Reach Level 60</span>
                </div>
              </div>
            </div>
          </section>

          {isLoggedIn && (
            <section className="dashboard-card glass-panel danger-card">
              <div className="danger-header">
                <Trash2 size={16} />
                <span>Danger Zone</span>
              </div>
              <p className="danger-text">Delete your cloud account and all synced data. This cannot be undone.</p>
              <button className="danger-btn" onClick={onDeleteAccount}>Delete Account</button>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardView
