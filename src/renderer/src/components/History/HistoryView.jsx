import { useState } from 'react'
import './HistoryView.css'
import { motion, AnimatePresence } from 'framer-motion'
import { History, ChevronDown } from 'lucide-react'
import SessionCard from './SessionCard'

const HistoryView = ({ data }) => {
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
    setDisplayCount(prev => prev + 12)
  }

  return (
    <div className="history-container">
      <div className="history-page-header">
        <div className="title-group">
          <h1>Session History</h1>
          <p>Analyzing your last {data.length} typing tests</p>
        </div>
      </div>

      <div className="history-sessions-grid">
        <AnimatePresence initial={false}>
          {visibleData.map((item, i) => (
            <SessionCard 
                key={`${item.date}-${i}`} 
                session={item} 
                index={i} 
            />
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <motion.div 
          className="load-more-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button className="load-more-btn glass-btn" onClick={handleLoadMore}>
            <ChevronDown size={18} />
            <span>Load Older Sessions</span>
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default HistoryView
