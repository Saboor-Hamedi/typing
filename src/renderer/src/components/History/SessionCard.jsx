import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

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
        <div className="mode-tag">{mode} {limit || ''}</div>
        <div className="session-timestamp">
          <Clock size={12} />
          <span>{new Date(date).toLocaleDateString()} • {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="session-card-body">
        <div className="main-stats">
          <div className="stat-item">
            <span className="stat-label">SPEED</span>
            <div className="stat-val-group">
              <span className="stat-value">{wpm}</span>
              <span className="stat-unit">WPM</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-label">ACCURACY</span>
            <div className="stat-val-group">
              <span className="stat-value">{accuracy}</span>
              <span className="stat-unit">%</span>
            </div>
          </div>
        </div>
        
        <div className="session-visual-marker" style={{ background: wpm >= 100 ? 'var(--main-color)' : 'rgba(255,255,255,0.05)' }} />
      </div>
    </motion.div>
  )
}

export default SessionCard
