import './DashboardView.css'
import { motion } from 'framer-motion'
import { Trophy, Zap, Target, Flame, TrendingUp, Calendar, Map } from 'lucide-react'
import dashboardBg from '../../assets/dashboard_bg.png'
import avatar from '../../assets/avatar.png'

const DashboardView = ({ stats, history = [], username }) => {
  const latestWpm = history.length > 0 ? history[0].wpm : 0
  const avgWpm = history.length > 0 
    ? Math.round(history.reduce((acc, curr) => acc + curr.wpm, 0) / history.length) 
    : 0
  const bestWpm = stats.pb || 0
  const totalTests = history.length
  
  // Calculate Level (Experience points based on tests and WPM)
  const totalWpm = history.reduce((acc, curr) => acc + curr.wpm, 0)
  const experience = (totalWpm * 10) + (totalTests * 100)
  const level = Math.floor(Math.sqrt(experience / 100)) || 1
  const levelProgress = (experience % 1000) / 10
  
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
              <img src={avatar} alt="Profile" className="profile-img" />
              <div className="status-indicator online" />
            </div>
            <div className="profile-info">
              <h1>{username || 'Pro Typist'}</h1>
              <div className="level-badge">LEVEL {level}</div>
              <div className="level-progress-container">
                <div className="level-progress-bar" style={{ width: `${levelProgress}%` }} />
              </div>
              <p className="exp-text">{experience} XP • {1000 - (experience % 1000)} XP to next level</p>
            </div>
          </motion.div>
          
          <div className="hero-stats">
            <div className="hero-stat-card">
              <span className="label">PERSONAL BEST</span>
              <motion.span 
                className="value"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              >
                {bestWpm} <small>WPM</small>
              </motion.span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <motion.div className="stat-card glass-panel" whileHover={{ y: -5 }}>
          <div className="stat-header">
            <TrendingUp size={18} className="icon-main" />
            <span>Average Speed</span>
          </div>
          <div className="stat-body">
            <span className="number">{avgWpm}</span>
            <span className="unit">WPM</span>
          </div>
          <div className="stat-sparkline">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none">
              <path 
                d="M0,25 Q10,15 20,20 T40,10 T60,22 T80,18 L100,5" 
                fill="none" 
                stroke="var(--main-color)" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>
          </div>
        </motion.div>

        <motion.div className="stat-card glass-panel" whileHover={{ y: -5 }}>
          <div className="stat-header">
            <Flame size={18} className="icon-main" />
            <span>Daily Streak</span>
          </div>
          <div className="stat-body">
            <span className="number">7</span>
            <span className="unit">DAYS</span>
          </div>
          <div className="progress-mini">
            <div className="dot active" /><div className="dot active" /><div className="dot active" />
            <div className="dot active" /><div className="dot active" /><div className="dot active" />
            <div className="dot active" />
          </div>
        </motion.div>

        <motion.div className="stat-card glass-panel" whileHover={{ y: -5 }}>
          <div className="stat-header">
            <Target size={18} className="icon-main" />
            <span>Best Accuracy</span>
          </div>
          <div className="stat-body">
            <span className="number">99</span>
            <span className="unit">%</span>
          </div>
          <div className="stat-footer">Top 5% of all users</div>
        </motion.div>

        <motion.div className="stat-card glass-panel" whileHover={{ y: -5 }}>
          <div className="stat-header">
            <Zap size={18} className="icon-main" />
            <span>Total Tests</span>
          </div>
          <div className="stat-body">
            <span className="number">{totalTests}</span>
            <span className="unit">RUNS</span>
          </div>
          <div className="stat-footer">{Math.round(totalTests * 0.5)} mins typed</div>
        </motion.div>
      </div>

      <div className="dashboard-grid-secondary">
        {/* Activity Section */}
        <section className="dashboard-section glass-panel">
          <div className="section-header">
            <Calendar size={18} />
            <span>Recent Activity</span>
          </div>
          <div className="activity-list">
            {history.length > 0 ? history.slice(0, 1).map((test, i) => (
              <div key={i} className="activity-row">
                <div className="activity-icon"><Zap size={14} /></div>
                <div className="activity-info">
                  <span className="activity-mode">{test.mode} {test.limit}</span>
                  <span className="activity-date">{new Date(test.date).toLocaleDateString()} • {new Date(test.date).toLocaleTimeString()}</span>
                </div>
                <div className="activity-result">
                  <span className="res-wpm">{test.wpm} WPM</span>
                  <span className="res-acc">{test.accuracy}%</span>
                </div>
              </div>
            )) : (
              <div className="empty-state">No tests completed yet. Start typing!</div>
            )}
          </div>
        </section>

        {/* Achievements Section */}
        <section className="dashboard-section glass-panel">
          <div className="section-header">
            <Trophy size={18} />
            <span>Milestones</span>
          </div>
          <div className="milestones-list">
            <div className="milestone-item achieved">
              <div className="m-icon"><Zap size={14} /></div>
              <div className="m-info">
                <span className="m-title">First Blood</span>
                <span className="m-desc">Complete your first test</span>
              </div>
            </div>
            <div className={`milestone-item ${bestWpm >= 100 ? 'achieved' : 'locked'}`}>
              <div className="m-icon"><Flame size={14} /></div>
              <div className="m-info">
                <span className="m-title">Century Club</span>
                <span className="m-desc">Reach 100 WPM speed</span>
              </div>
            </div>
            <div className="milestone-item locked">
              <div className="m-icon"><Target size={14} /></div>
              <div className="m-info">
                <span className="m-title">Sniper</span>
                <span className="m-desc">100% accuracy on 50+ words</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default DashboardView
