import React from 'react'
import { motion } from 'framer-motion'
import { MousePointer2 } from 'lucide-react'
import './FocusOverlay.css'

const FocusOverlay = ({ isVisible, onFocusRequest, isManual = false }) => {
  if (!isVisible) return null

  return (
    <motion.div
      className="focus-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onFocusRequest}
    >
      <motion.div
        className="focus-content"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', damping: 20 }}
      >
        <div className="focus-icon-wrapper">
          <MousePointer2 size={32} strokeWidth={1.5} />
        </div>
        <div className="focus-text">
          <h2>Click to Resume</h2>
          <p>{isManual ? 'Typing paused' : 'Typing paused • Focus lost'}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default FocusOverlay
