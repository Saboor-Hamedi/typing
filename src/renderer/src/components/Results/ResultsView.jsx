import { useEffect, useMemo } from 'react'
import { RotateCcw, Play } from 'lucide-react'
import TelemetryGraph from '../Analytics/TelemetryGraph'
import './ResultsView.css'

const ResultsView = ({ results, telemetry, testMode, testLimit, onRestart, onReplay }) => {
  // Format duration for display
  const formattedDuration = useMemo(() => {
    if (!results.duration) return '0s'
    const mins = Math.floor(results.duration / 60)
    const secs = results.duration % 60
    if (mins > 0) {
      return `${mins}:${String(secs).padStart(2, '0')}`
    }
    return `${results.duration}s`
  }, [results.duration])

  // Calculate additional statistics
  const stats = useMemo(() => {
    if (!telemetry || telemetry.length === 0) {
      return {
        consistency: 0,
        bestSecond: 0,
        worstSecond: 0,
        averageWpm: 0
      }
    }

    const wpmValues = telemetry.map(t => t.wpm).filter(w => w > 0)
    if (wpmValues.length === 0) {
      return {
        consistency: 0,
        bestSecond: 0,
        worstSecond: 0,
        averageWpm: 0
      }
    }

    const averageWpm = Math.round(wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length)
    const bestSecond = Math.max(...wpmValues)
    const worstSecond = Math.min(...wpmValues)
    
    // Consistency: standard deviation as percentage of average
    const variance = wpmValues.reduce((acc, wpm) => acc + Math.pow(wpm - averageWpm, 2), 0) / wpmValues.length
    const stdDev = Math.sqrt(variance)
    const consistency = averageWpm > 0 ? Math.max(0, Math.round(100 - (stdDev / averageWpm) * 100)) : 0

    return {
      consistency,
      bestSecond,
      worstSecond,
      averageWpm
    }
  }, [telemetry])

  // Screen reader announcement
  useEffect(() => {
    const announcement = `Test completed in ${formattedDuration}. ${results.wpm} words per minute, ${results.accuracy}% accuracy, ${results.errors} errors.`
    const announcer = document.getElementById('sr-announcer')
    if (announcer) {
      announcer.textContent = announcement
    }
  }, [results, formattedDuration])

  return (
    <div className="results-container glass-panel">
      <div className="results-content">
        <div className="results-metrics-main">
          <div className="metric-group-large">
            <div className="metric-item">
              <span className="label">wpm</span>
              <span className="value-large">{results.wpm}</span>
            </div>
            <div className="metric-item">
              <span className="label">acc</span>
              <span className="value-large">{results.accuracy}%</span>
            </div>
          </div>

          <div className="results-graph-wrapper">
            <TelemetryGraph data={telemetry} width={800} height={120} />
          </div>
        </div>

        <div className="results-stats-bar">
          <div className="stat-pill">
            <span className="label">test type</span>
            <span className="val">{testMode} {testLimit}</span>
          </div>
          <div className="stat-pill">
            <span className="label">time</span>
            <span className="val">{formattedDuration}</span>
          </div>
          <div className="stat-pill">
            <span className="label">raw wpm</span>
            <span className="val">{results.rawWpm}</span>
          </div>
          <div className="stat-pill">
            <span className="label">errors</span>
            <span className="val error">{results.errors}</span>
          </div>
          {stats.consistency > 0 && (
            <>
              <div className="stat-pill">
                <span className="label">consistency</span>
                <span className="val">{stats.consistency}%</span>
              </div>
              <div className="stat-pill">
                <span className="label">best</span>
                <span className="val">{stats.bestSecond} wpm</span>
              </div>
              <div className="stat-pill">
                <span className="label">avg</span>
                <span className="val">{stats.averageWpm} wpm</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="results-actions">
        <button className="action-btn secondary" onClick={onReplay} title="Watch Replay">
          <Play size={20} />
          <span>Replay</span>
        </button>
        <button className="action-btn primary" onClick={onRestart} title="Restart (Enter)">
          <RotateCcw size={20} />
          <span>Next Test</span>
        </button>
      </div>
    </div>
  )
}

export default ResultsView
