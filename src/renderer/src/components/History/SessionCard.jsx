import { motion } from 'framer-motion'
import { Clock, Calendar, Zap, Target } from 'lucide-react'

const SessionCard = ({ session, index }) => {
  const { mode, limit, date, wpm, accuracy } = session

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      className="history-session-card glass-panel"
    >
      <div className="session-card-header">
        <div className="mode-pill">
          <span className="mode-name">{mode}</span>
          <span className="mode-limit">{limit}</span>
        </div>
        <div className="session-date-group">
          <div className="session-timestamp">
            <Calendar size={12} />
            <span>{new Date(date).toLocaleDateString()}</span>
          </div>
          <div className="session-timestamp">
            <Clock size={12} />
            <span>
              {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <div className="session-card-content">
        <div className="main-metrics">
          <div className="metric">
            <div className="metric-icon wpm">
              <Zap size={14} />
            </div>
            <div className="metric-info">
              <span className="val">{wpm}</span>
              <span className="lbl">WPM</span>
            </div>
          </div>
          <div className="metric">
            <div className="metric-icon acc">
              <Target size={14} />
            </div>
            <div className="metric-info">
              <span className="val">{accuracy}%</span>
              <span className="lbl">Accuracy</span>
            </div>
          </div>
        </div>

        <div className="session-rank-indicator">
          <div
            className="rank-bar"
            style={{
              width: `${Math.min(100, (wpm / 150) * 100)}%`,
              background: wpm >= 100 ? 'var(--main-color)' : 'var(--sub-color)'
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export default SessionCard
