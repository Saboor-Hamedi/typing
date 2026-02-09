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

// Simplified Results View without heavy animations or transparency

const ResultsView = ({
  results,
  telemetry,
  testMode,
  testLimit,
  onRestart,
  onRepeat,
  onReplay,
  addToast
}) => {
  const [isCopying, setIsCopying] = useState(false)

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

  const handleCopyResult = () => {
    const text = `TypingZone Result: ${results.wpm} WPM | ${results.accuracy}% Accuracy | ${testMode} ${testLimit}`
    navigator.clipboard.writeText(text)
    setIsCopying(true)
    if (addToast)
      addToast({ title: 'Success', message: 'Result copied to clipboard!', type: 'success' })
    setTimeout(() => setIsCopying(false), 2000)
  }

  return (
    <div className="results-container">
      <div className="results-content">
        <div className="results-metrics-main">
          <div className="metric-group-large">
            <div className="metric-card main-stat">
              <div className="label-with-icon">
                <TrendingUp size={16} />
                <span className="label">wpm</span>
                {results.isNewPb && <span className="pb-badge">New PB!</span>}
              </div>
              <span className="value-large">{results.wpm}</span>
            </div>

            <div className="metric-card main-stat accent">
              <div className="label-with-icon">
                <Target size={16} />
                <span className="label">accuracy</span>
              </div>
              <span className="value-large">{results.accuracy}%</span>
            </div>
          </div>

          <div className="results-graph-wrapper secondary-glass">
            <div className="graph-header">
              <BarChart3 size={16} />
              <span>Session Performance Analytics</span>
            </div>
            <div style={{ flex: 1, minHeight: '180px' }}>
              <TelemetryGraph data={telemetry} width={850} height={180} />
            </div>
          </div>
        </div>

        <div className="results-stats-bar">
          {[
            { label: 'test type', val: `${testMode} ${testLimit}`, icon: <TrendingUp size={12} /> },
            { label: 'time', val: formattedDuration, icon: <Clock size={12} /> },
            { label: 'raw wpm', val: results.rawWpm, icon: <BarChart3 size={12} /> },
            {
              label: 'errors',
              val: results.errors,
              isError: true,
              icon: <AlertCircle size={12} />
            },
            {
              label: 'consistency',
              val: `${stats.consistency}%`,
              icon: <Target size={12} />,
              hide: !stats.consistency
            }
          ].map(
            (item, idx) =>
              !item.hide && (
                <div key={idx} className="stat-pill-modern">
                  <div className="label-with-icon" style={{ opacity: 0.6, fontSize: '0.6rem' }}>
                    {item.icon}
                    <span className="label">{item.label}</span>
                  </div>
                  <span className={`val ${item.isError ? 'error' : ''}`}>{item.val}</span>
                </div>
              )
          )}
        </div>
      </div>

      <div className="results-actions">
        <button
          className="action-btn-modern secondary"
          onClick={(e) => {
            e.stopPropagation()
            handleCopyResult()
          }}
        >
          <TrendingUp size={18} />
          <span>{isCopying ? 'Copied!' : 'Copy Results'}</span>
        </button>
        <button
          className="action-btn-modern secondary"
          onClick={(e) => {
            e.stopPropagation()
            onRepeat()
          }}
        >
          <RefreshCw size={18} />
          <span>Repeat Test</span>
        </button>
        <button
          className="action-btn-modern secondary"
          onClick={(e) => {
            e.stopPropagation()
            onReplay()
          }}
        >
          <Play size={18} />
          <span>Watch Replay</span>
        </button>
        <button
          className="action-btn-modern primary"
          onClick={(e) => {
            e.stopPropagation()
            onRestart()
          }}
        >
          <RotateCcw size={18} />
          <span>Next Test</span>
        </button>
      </div>
    </div>
  )
}

export default ResultsView
