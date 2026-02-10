import React, { useMemo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './BurstGauge.css'

const BurstGauge = ({ wpm, pb, isEnabled }) => {
  const normalizedWpm = Math.min(wpm, 300)
  const maxScale = 250
  const lastWpmRef = useRef(wpm)
  const [justOvertook, setJustOvertook] = useState(false)

  // Calculate current rotation (from -90deg to 90deg)
  const rotation = (normalizedWpm / maxScale) * 180 - 90

  // Calculate PB rotation for the ghost marker
  const pbRotation = pb > 0 ? (Math.min(pb, maxScale) / maxScale) * 180 - 90 : null

  const heat = useMemo(() => {
    if (pb <= 0) return 0
    return Math.max(0, Math.min(1, (wpm - pb * 0.4) / (pb * 0.6)))
  }, [wpm, pb])

  // Overtake effect logic
  useEffect(() => {
    if (wpm > pb && lastWpmRef.current <= pb && pb > 0) {
      setJustOvertook(true)
      const t = setTimeout(() => setJustOvertook(false), 1000)
      return () => clearTimeout(t)
    }
    lastWpmRef.current = wpm
  }, [wpm, pb])

  // Get lag from CSS variable
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
    const interval = setInterval(updateLag, 200)
    return () => clearInterval(interval)
  }, [])

  if (!isEnabled) return null

  const isLosing = lag > 5
  const isRedlining = wpm > pb && pb > 0
  const intensity = Math.max(0, (wpm - pb) / 50)

  return (
    <div
      className={`burst-gauge-container ${isLosing ? 'is-losing' : ''} ${justOvertook ? 'overtake-flash' : ''}`}
      style={{
        transform: `translateX(-50%) scale(${1 + heat * 0.15})`, // Kinetic Swell
        filter: isRedlining ? `drop-shadow(0 0 ${10 + intensity * 20}px var(--main-color))` : 'none'
      }}
    >
      <div className="gauge-outer">
        {/* PB Ghost Marker & Ghost Needle */}
        {pbRotation !== null && (
          <>
            <div
              className="pb-marker"
              style={{ transform: `translateX(-50%) rotate(${pbRotation}deg)` }}
            />
            <div
              className="ghost-needle"
              style={{ transform: `translateX(-50%) rotate(${pbRotation}deg)` }}
            />
          </>
        )}

        <svg viewBox="0 0 100 55" className="gauge-svg">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="var(--sub-alt-color)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <motion.path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="var(--main-color)"
            strokeWidth="10"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{
              pathLength: Math.min(normalizedWpm / maxScale, 1),
              stroke: isLosing
                ? 'rgba(0, 200, 255, 0.8)'
                : heat > 0.85
                  ? 'var(--error-color)'
                  : 'var(--main-color)'
            }}
            transition={{ type: 'spring', stiffness: 40, damping: 12 }}
          />
        </svg>

        <div className="gauge-needle-wrapper">
          <motion.div
            className={`gauge-needle ${isRedlining ? 'redlining' : ''}`}
            animate={{
              rotate: rotation,
              backgroundColor: isLosing
                ? 'rgba(0, 200, 255, 1)'
                : heat > 0.85
                  ? 'var(--error-color)'
                  : 'var(--main-color)'
            }}
            transition={{ type: 'spring', stiffness: 70, damping: 10 }}
          >
            {/* Speed Glow */}
            {heat > 0.5 && (
              <div
                className="needle-glow"
                style={{
                  opacity: (heat - 0.5) * 2,
                  boxShadow: `0 0 ${20 * heat}px var(--main-color)`
                }}
              />
            )}

            {/* Redline Sparks */}
            {isRedlining &&
              Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="gauge-spark"
                  animate={{
                    y: [-10, -40 - Math.random() * 20],
                    x: [0, (Math.random() - 0.5) * 30],
                    opacity: [1, 0],
                    scale: [1, 0]
                  }}
                  transition={{
                    duration: 0.3 + Math.random() * 0.2,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                />
              ))}
          </motion.div>
        </div>

        <div className="gauge-center">
          <motion.span
            className="wpm-value"
            animate={{
              color: isLosing
                ? 'rgba(0, 210, 255, 1)'
                : heat > 0.85
                  ? 'var(--error-color)'
                  : 'var(--main-color)',
              scale: isRedlining ? [1, 1.05, 1] : 1
            }}
            transition={isRedlining ? { repeat: Infinity, duration: 0.2 } : {}}
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
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            TRAILING GHOST ({lag} ch)
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {justOvertook && (
          <motion.div
            className="speed-warning overtake"
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: -45, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1.5, filter: 'blur(10px)' }}
          >
            OVERTAKE!
          </motion.div>
        )}
        {heat > 0.95 && !isLosing && !justOvertook && (
          <motion.div
            className="speed-warning limit-break"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, y: -10 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            LIMIT BREAK
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BurstGauge
