import { motion } from 'framer-motion'
import { RotateCcw, Play } from 'lucide-react'
import TelemetryGraph from '../Analytics/TelemetryGraph'

const ResultsView = ({ results, telemetry, testMode, testLimit, onRestart, onReplay }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="results-view glass-panel"
    >
      <div className="results-top">
        <div className="results-grid">
          <div className="result-large">
            <span className="label">wpm</span>
            <span className="value">{results.wpm}</span>
          </div>
          <div className="result-large">
            <span className="label">acc</span>
            <span className="value">{results.accuracy}%</span>
          </div>
        </div>

        <TelemetryGraph data={telemetry} width={500} height={120} />
      </div>

      <div className="results-grid secondary">
        <div className="result-small">
          <span className="label">test type</span>
          <span className="value">{testMode} {testLimit}</span>
        </div>
        <div className="result-small">
          <span className="label">raw wpm</span>
          <span className="value">{results.rawWpm}</span>
        </div>
        <div className="result-small">
          <span className="label">errors</span>
          <span className="value" style={{ color: 'var(--error-color)' }}>{results.errors}</span>
        </div>
      </div>
      
      <div className="results-actions" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <button className="restart-btn" onClick={onReplay} title="Watch Replay">
          <Play size={20} />
        </button>
        <button className="restart-btn" onClick={onRestart} title="Restart">
          <RotateCcw size={20} />
        </button>
      </div>
    </motion.div>
  )
}

export default ResultsView
