import './HistoryView.css'
import { motion } from 'framer-motion'
import { Calendar, Zap, Target } from 'lucide-react'

const HistoryView = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="history-empty glass-panel">
         <p>No tests completed yet. Start typing to see your history!</p>
      </div>
    )
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>Activity Log</h1>
        <p>Your last {data.length} sessions</p>
      </div>

      <div className="history-list">
        {data.map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="history-item glass-panel"
          >
            <div className="history-main">
              <div className="history-wpm">
                <span className="value">{item.wpm}</span>
                <span className="label">WPM</span>
              </div>
              <div className="history-acc">
                <Target size={14} />
                <span>{item.accuracy}%</span>
              </div>
            </div>

            <div className="history-details">
              <div className="detail">
                <Zap size={12} />
                <span>{item.mode} {item.limit}</span>
              </div>
              <div className="detail">
                <Calendar size={12} />
                <span>{new Date(item.date).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default HistoryView
