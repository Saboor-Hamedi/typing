import './TelemetryGraph.css'
import { motion } from 'framer-motion'

const TelemetryGraph = ({ data, width = 600, height = 150 }) => {
  if (data.length < 2) return null;

  const maxWpm = Math.max(...data.map(d => d.wpm), 60);
  const minWpm = Math.min(...data.map(d => d.wpm), 0);
  const range = maxWpm - minWpm || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.wpm - minWpm) / range) * height;
    return { x, y };
  });

  const pathData = points.reduce((acc, p, i) => 
    i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`, 
  "");

  const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;

  return (
    <div className="telemetry-graph-container" style={{ width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="telemetry-svg">
        <defs>
          <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--main-color)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--main-color)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* The Area */}
        <motion.path 
          d={areaData}
          fill="url(#gradient-area)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* The Line */}
        <motion.path 
          d={pathData}
          fill="none"
          stroke="var(--main-color)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        {/* Data Points */}
        {points.map((p, i) => (
          <circle 
            key={i} 
            cx={p.x} 
            cy={p.y} 
            r="2" 
            fill="var(--main-color)" 
            className="graph-dot" 
          />
        ))}
      </svg>
      
      <div className="graph-axes">
         <span className="axis-label top">{maxWpm}</span>
         <span className="axis-label bottom">{minWpm}</span>
      </div>
    </div>
  );
};

export default TelemetryGraph;
