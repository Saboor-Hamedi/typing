import { useState } from 'react'
import './HistoryView.css'
import { History, ChevronDown, Trophy, Target, Zap } from 'lucide-react'
import SessionCard from './SessionCard'
import UniversalAvatar from '../Common/UniversalAvatar'

const HistoryView = ({ data, username, avatarId }) => {
  const [displayCount, setDisplayCount] = useState(12)

  if (!data || data.length === 0) {
    return (
      <div className="history-empty glass-panel section-card">
        <div className="empty-content">
          <History size={48} className="empty-icon" />
          <p>No typing sessions recorded yet.</p>
          <span>Complete a test to see your performance history here.</span>
        </div>
      </div>
    )
  }

  const visibleData = data.slice(0, displayCount)
  const hasMore = displayCount < data.length

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 12)
  }

  // Calculate some quick lifetime stats for the header
  const avgWpm = Math.round(data.reduce((acc, curr) => acc + curr.wpm, 0) / data.length)
  const avgAcc = Math.round(data.reduce((acc, curr) => acc + curr.accuracy, 0) / data.length)
  const bestWpm = Math.max(...data.map((d) => d.wpm))

  return (
    <div className="history-container">
      <div className="history-profile-hero glass-panel">
        <div className="hero-profile-info">
          <div className="hero-avatar-wrapper">
            <UniversalAvatar avatarId={avatarId || 0} size={80} />
          </div>
          <div className="hero-text">
            <h2>{username || 'Guest'}</h2>
            <div className="hero-badges">
              <span className="hero-badge">
                <Trophy size={12} /> {bestWpm} Peak WPM
              </span>
              <span className="hero-badge">
                <Zap size={12} /> {avgWpm} Avg
              </span>
              <span className="hero-badge">
                <Target size={12} /> {avgAcc}% Acc
              </span>
            </div>
          </div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat-card">
            <span className="val">{data.length}</span>
            <span className="label">Tests</span>
          </div>
        </div>
      </div>

      <div className="history-page-header">
        <div className="title-group">
          <h1>Recent Activity</h1>
        </div>
      </div>

      <div className="history-sessions-grid">
        {visibleData.map((item, i) => (
          <SessionCard key={`${item.date}-${i}`} session={item} index={i} />
        ))}
      </div>

      {hasMore && (
        <div className="load-more-container">
          <button className="load-more-btn glass-btn" onClick={handleLoadMore}>
            <ChevronDown size={18} />
            <span>Load Older Sessions</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default HistoryView
