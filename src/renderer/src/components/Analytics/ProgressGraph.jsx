import { useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './ProgressGraph.css'

const ProgressGraph = ({ data = [], height = 240 }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const containerRef = useRef(null)

  // 1. Process Data: Reverse to show oldest -> newest (left -> right)
  const chronologicalData = useMemo(() => {
    return [...data].reverse().slice(-50) // Show last 50 tests for a "robust" history
  }, [data])

  if (chronologicalData.length < 2) {
    return (
      <div className="progress-graph-empty">
        <p>Complete more tests to see your full performance timeline.</p>
      </div>
    )
  }

  const values = chronologicalData.map(d => d.wpm)
  const accValues = chronologicalData.map(d => d.accuracy)
  
  const maxWpm = Math.max(...values, 60)
  const minWpm = 0
  const range = maxWpm - minWpm || 1

  const width = 800 // Fixed width for SVG scaling
  const points = chronologicalData.map((d, i) => {
    const x = (i / (chronologicalData.length - 1)) * width
    const y = height - ((d.wpm - minWpm) / range) * height
    const yAcc = height - ((d.accuracy - 0) / 100) * height // Accuracy is 0-100%
    return { x, y, yAcc, ...d }
  })

  const pathData = points.reduce((acc, p, i) => 
    i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`, 
  "")

  const accPathData = points.reduce((acc, p, i) => 
    i === 0 ? `M ${p.x},${p.yAcc}` : `${acc} L ${p.x},${p.yAcc}`, 
  "")

  const areaData = `${pathData} L ${width},${height} L 0,${height} Z`

  return (
    <div className="progress-graph-wrapper" ref={containerRef}>
      <div className="graph-header-meta">
        <div className="meta-item">
          <span className="label">PEAK SPEED</span>
          <span className="value">{Math.max(...values)} <small>WPM</small></span>
        </div>
        <div className="meta-item">
          <span className="label">AVG SPEED</span>
          <span className="value">{Math.round(values.reduce((a, b) => a + b, 0) / values.length)} <small>WPM</small></span>
        </div>
        <div className="meta-item">
           <span className="label">AVG ACCURACY</span>
           <span className="value">{Math.round(accValues.reduce((a, b) => a + b, 0) / accValues.length)}%</span>
        </div>
      </div>

      <div className="svg-container">
        <svg 
            width="100%" 
            height={height} 
            viewBox={`0 0 ${width} ${height}`} 
            preserveAspectRatio="none"
            onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="prog-gradient-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--main-color)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="var(--main-color)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid Lines (Vertical for Dates) */}
          {points.filter((_, idx) => idx % Math.ceil(points.length / 5) === 0).map((p, i) => (
            <line 
                key={i}
                x1={p.x} y1="0" 
                x2={p.x} y2={height} 
                stroke="rgba(255,255,255,0.02)" 
                strokeWidth="1" 
            />
          ))}

          {/* Accuracy Line (Subtle) */}
          <motion.path 
            d={accPathData}
            fill="none"
            stroke="var(--sub-color)"
            strokeWidth="1"
            strokeOpacity="0.2"
            strokeDasharray="5 5"
          />

          {/* Area */}
          <motion.path 
            d={areaData}
            fill="url(#prog-gradient-area)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          {/* Line */}
          <motion.path 
            d={pathData}
            fill="none"
            stroke="var(--main-color)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* Interactive Marker line */}
          {hoveredIndex !== null && (
            <line 
              x1={points[hoveredIndex].x} y1={0} 
              x2={points[hoveredIndex].x} y2={height} 
              stroke="var(--main-color)" 
              strokeOpacity="0.2" 
            />
          )}

          {/* Dots */}
          {points.map((p, i) => (
            <g key={i} onMouseEnter={() => setHoveredIndex(i)}>
              <circle 
                cx={p.x} 
                cy={p.y} 
                r={hoveredIndex === i ? "5" : "0"} 
                fill="var(--main-color)"
                style={{ transition: 'r 0.2s' }}
              />
              <rect 
                x={p.x - 10} 
                y={0} 
                width={20} 
                height={height} 
                fill="transparent" 
                style={{ cursor: 'pointer' }}
              />
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredIndex !== null && (
            <motion.div 
              className="graph-tooltip-robust"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                left: `${(hoveredIndex / (chronologicalData.length - 1)) * 100}%`
              }}
              exit={{ opacity: 0 }}
              style={{ 
                 position: 'absolute', 
                 bottom: height + 15, 
                 transform: 'translateX(-50%)',
                 minWidth: '120px'
              }}
            >
              <div className="tt-date">{new Date(points[hoveredIndex].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              <div className="tt-main">
                 <div className="tt-stat">
                    <span className="label">wpm</span>
                    <span className="val">{points[hoveredIndex].wpm}</span>
                 </div>
                 <div className="tt-stat">
                    <span className="label">acc</span>
                    <span className="val">{points[hoveredIndex].accuracy}%</span>
                 </div>
              </div>
              <div className="tt-mode">{points[hoveredIndex].mode}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="graph-x-axis">
        <span>Earlier</span>
        <span>Progress Timeline</span>
        <span>Latest</span>
      </div>
    </div>
  )
}

export default ProgressGraph
