import { useEffect } from 'react'
import { RotateCcw, Play } from 'lucide-react'
import TelemetryGraph from '../Analytics/TelemetryGraph'
import './ResultsView.css'

const ResultsView = ({ results, telemetry, testMode, testLimit, onRestart, onReplay }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        onRestart()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onRestart])

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
            <span className="label">raw wpm</span>
            <span className="val">{results.rawWpm}</span>
          </div>
          <div className="stat-pill">
            <span className="label">errors</span>
            <span className="val error">{results.errors}</span>
          </div>
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
