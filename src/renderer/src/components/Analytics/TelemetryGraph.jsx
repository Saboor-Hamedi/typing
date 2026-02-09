import { useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './TelemetryGraph.css'

const TelemetryGraph = ({ data = [], width = 500, height = 120 }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const plotData = useMemo(() => {
    if (data.length === 0) return []
    if (data.length === 1) {
      // Create a small horizontal segment for single-point visibility
      return [
        { ...data[0], sec: 0 },
        { ...data[0], sec: data[0].sec || 0.1 }
      ]
    }
    return data
  }, [data])

  if (plotData.length < 2) {
    return (
      <div className="telemetry-placeholder anim-pulse" style={{ width: '100%', height }}>
        <span>Analyzing performance...</span>
      </div>
    )
  }

  const maxWpm = Math.max(...plotData.map((d) => d.raw || d.wpm), 60)
  const minWpm = 0
  const range = maxWpm - minWpm || 1

  const points = plotData.map((d, i) => {
    const x = (i / (plotData.length - 1)) * width
    const yWpm = height - ((d.wpm - minWpm) / range) * height
    const yRaw = d.raw ? height - ((d.raw - minWpm) / range) * height : yWpm
    return { x, yWpm, yRaw, ...d }
  })

  // Ensure path starts exactly at coordinates
  const wpmPath =
    `M ${points[0].x},${points[0].yWpm} ` +
    points
      .slice(1)
      .map((p) => `L ${p.x},${p.yWpm}`)
      .join(' ')
  const rawPath =
    `M ${points[0].x},${points[0].yRaw} ` +
    points
      .slice(1)
      .map((p) => `L ${p.x},${p.yRaw}`)
      .join(' ')

  const areaData = `${wpmPath} L ${width},${height} L 0,${height} Z`

  return (
    <div className="telemetry-container-robust">
      <div className="telemetry-meta-header">
        <div className="legend">
          <div className="legend-item">
            <span className="legend-dot net" /> <span>wpm</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot raw" /> <span>raw</span>
          </div>
        </div>
      </div>

      <div className="telemetry-svg-wrapper">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="telemetry-svg"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="gradient-area-tele" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--main-color)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="var(--main-color)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((v) => (
            <line
              key={v}
              x1="0"
              y1={height * v}
              x2={width}
              y2={height * v}
              stroke="var(--sub-alt-color)"
              strokeDasharray="4 4"
            />
          ))}

          {/* Raw Line (Subtle) */}
          <path
            d={rawPath}
            fill="none"
            stroke="var(--sub-color)"
            strokeWidth="1.5"
            strokeOpacity="0.3"
            strokeDasharray="4 2"
          />

          {/* Net WPM Line (Bold) */}
          <path
            d={wpmPath}
            fill="none"
            stroke="var(--main-color)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Interaction Area */}
          {points.map((p, i) => (
            <rect
              key={i}
              x={p.x - 5}
              y={0}
              width={10}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(i)}
              style={{ cursor: 'crosshair' }}
            />
          ))}

          {/* Hover Marker */}
          {hoveredIndex !== null && (
            <motion.line
              x1={points[hoveredIndex].x}
              y1={0}
              x2={points[hoveredIndex].x}
              y2={height}
              stroke="var(--main-color)"
              strokeWidth="1"
              strokeOpacity="0.5"
            />
          )}
        </svg>

        <AnimatePresence>
          {hoveredIndex !== null && (
            <motion.div
              className="telemetry-tooltip"
              initial={{ opacity: 0, y: 5 }}
              animate={{
                opacity: 1,
                y: 0,
                left:
                  points[hoveredIndex].x > width - 120
                    ? points[hoveredIndex].x - 120
                    : points[hoveredIndex].x + 15
              }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: '10%'
              }}
            >
              <div className="tooltip-row">
                <span className="label">wpm</span>
                <span className="val">{points[hoveredIndex].wpm}</span>
              </div>
              {points[hoveredIndex].raw && (
                <div className="tooltip-row">
                  <span className="label">raw</span>
                  <span className="val">{points[hoveredIndex].raw}</span>
                </div>
              )}
              <div className="tooltip-row secondary">
                <span className="label">time</span>
                <span className="val">{points[hoveredIndex].sec}s</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default TelemetryGraph
