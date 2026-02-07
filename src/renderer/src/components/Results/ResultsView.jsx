import { useEffect, useMemo, useState } from 'react'
import {
  RotateCcw,
  RefreshCw,
  Play,
  TrendingUp,
  Target,
  Clock,
  AlertCircle,
  BarChart3
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import TelemetryGraph from '../Analytics/TelemetryGraph'
import './ResultsView.css'

// Animated Counter Component for a "living" UI
const AnimatedCounter = ({ value, duration = 1.5, suffix = '' }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime
    const animate = (now) => {
      if (!startTime) startTime = now
      const progress = Math.min((now - startTime) / (duration * 1000), 1)
      setCount(Math.floor(progress * value))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <span>
      {count}
      {suffix}
    </span>
  )
}

const ResultsView = ({
  results,
  telemetry,
  testMode,
  testLimit,
  onRestart,
  onRepeat,
  onReplay
}) => {
  // Format duration
  const formattedDuration = useMemo(() => {
    if (!results.duration) return '0s'
    const mins = Math.floor(results.duration / 60)
    const secs = results.duration % 60
    return mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${results.duration}s`
  }, [results.duration])

  const stats = useMemo(() => {
    if (!telemetry || telemetry.length === 0)
      return { consistency: 0, bestSecond: 0, averageWpm: 0 }
    const values = telemetry.map((t) => t.wpm).filter((w) => w > 0)
    if (values.length === 0) return { consistency: 0, bestSecond: 0, averageWpm: 0 }

    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    const best = Math.max(...values)
    const variance = values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    const cons = avg > 0 ? Math.max(0, Math.round(100 - (stdDev / avg) * 100)) : 0

    return { consistency: cons, bestSecond: best, averageWpm: avg }
  }, [telemetry])

  return (
    <motion.div
      className="results-container glass-panel"
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="results-content">
        <div className="results-metrics-main">
          <div className="metric-group-large">
            <motion.div
              className="metric-card main-stat"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="label-with-icon">
                <TrendingUp size={14} />
                <span className="label">wpm</span>
                {results.isNewPb && (
                  <motion.span
                    className="pb-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
                    transition={{ delay: 1, duration: 0.5 }}
                  >
                    New PB!
                  </motion.span>
                )}
              </div>
              <span className="value-large">
                <AnimatedCounter value={results.wpm} />
              </span>
            </motion.div>

            <motion.div
              className="metric-card main-stat accent"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="label-with-icon">
                <Target size={14} />
                <span className="label">accuracy</span>
              </div>
              <span className="value-large">
                <AnimatedCounter value={results.accuracy} suffix="%" />
              </span>
            </motion.div>
          </div>

          <motion.div
            className="results-graph-wrapper secondary-glass"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="graph-header">
              <BarChart3 size={14} />
              <span>Performance Graph</span>
            </div>
            <TelemetryGraph data={telemetry} width={800} height={120} />
          </motion.div>
        </div>

        <motion.div
          className="results-stats-bar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {[
            { label: 'test type', val: `${testMode} ${testLimit}`, icon: <TrendingUp size={12} /> },
            { label: 'time', val: formattedDuration, icon: <Clock size={12} /> },
            { label: 'raw wpm', val: results.rawWpm },
            {
              label: 'errors',
              val: results.errors,
              isError: true,
              icon: <AlertCircle size={12} />
            },
            { label: 'consistency', val: `${stats.consistency}%`, hide: !stats.consistency }
          ].map(
            (item, idx) =>
              !item.hide && (
                <motion.div
                  key={idx}
                  className="stat-pill-modern"
                  whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                >
                  <span className="label">{item.label}</span>
                  <span className={`val ${item.isError ? 'error' : ''}`}>{item.val}</span>
                </motion.div>
              )
          )}
        </motion.div>
      </div>

      <motion.div
        className="results-actions"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <button
          className="action-btn-modern secondary"
          onClick={(e) => {
            e.stopPropagation()
            onRepeat()
          }}
        >
          <RefreshCw size={16} />
          <span>Repeat Test</span>
        </button>
        <button
          className="action-btn-modern secondary"
          onClick={(e) => {
            e.stopPropagation()
            onReplay()
          }}
        >
          <Play size={16} />
          <span>Watch Replay</span>
        </button>
        <button
          className="action-btn-modern primary"
          onClick={(e) => {
            e.stopPropagation()
            onRestart()
          }}
        >
          <RotateCcw size={16} />
          <span>Next Test</span>
        </button>
      </motion.div>
    </motion.div>
  )
}

export default ResultsView
