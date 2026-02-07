import React, { useMemo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './BurstGauge.css'

const BurstGauge = ({ wpm, pb, isEnabled }) => {
  const normalizedWpm = Math.min(wpm, 200) // Caps at 200 for the visual
  const percentage = (normalizedWpm / 150) * 100 // 150 WPM as the "full" mark

  // Calculate rotation (from -90deg to 90deg)
  const rotation = (normalizedWpm / 150) * 180 - 90

  const heat = useMemo(() => {
    if (pb <= 0) return 0
    return Math.max(0, Math.min(1, (wpm - pb * 0.5) / (pb * 0.5)))
  }, [wpm, pb])

  // Get lag from CSS variable with throttling to avoid unnecessary re-renders
  const [lag, setLag] = useState(0)
  const lastLagRef = useRef(0)

  useEffect(() => {
    const updateLag = () => {
      const l = parseInt(document.documentElement.style.getPropertyValue('--ghost-lead')) || 0
      if (l !== lastLagRef.current) {
        setLag(l)
        lastLagRef.current = l
      }
    }
    const interval = setInterval(updateLag, 200) // Slightly slower polling
    return () => clearInterval(interval)
  }, [])

  if (!isEnabled) return null

  const isLosing = lag > 5

  return (
    <div className={`burst-gauge-container ${isLosing ? 'is-losing' : ''}`}>
      <div className="gauge-outer">
        <svg viewBox="0 0 100 55" className="gauge-svg">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="var(--sub-alt-color)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <motion.path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="var(--main-color)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{
              pathLength: Math.min(normalizedWpm / 150, 1),
              stroke: isLosing
                ? 'rgba(0, 200, 255, 0.8)'
                : heat > 0.8
                  ? 'var(--error-color)'
                  : 'var(--main-color)'
            }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
          />
        </svg>

        <div className="gauge-needle-wrapper">
          <motion.div
            className="gauge-needle"
            animate={{
              rotate: rotation,
              backgroundColor: isLosing ? 'rgba(0, 200, 255, 1)' : 'var(--main-color)'
            }}
            transition={{ type: 'spring', stiffness: 60, damping: 12 }}
          />
        </div>

        <div className="gauge-center">
          <motion.span
            className="wpm-value"
            animate={{
              color: isLosing
                ? 'rgba(0, 200, 255, 1)'
                : heat > 0.8
                  ? 'var(--error-color)'
                  : 'var(--main-color)',
              scale: heat > 0.9 ? [1, 1.1, 1] : 1
            }}
          >
            {wpm}
          </motion.span>
          <span className="wpm-label">wpm</span>
        </div>
      </div>

      <AnimatePresence>
        {isLosing && (
          <motion.div
            className="lag-warning"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            TRAILING GHOST ({lag} chars)
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {heat > 0.9 && !isLosing && (
          <motion.div
            className="speed-warning"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            MAX BURST
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BurstGauge
