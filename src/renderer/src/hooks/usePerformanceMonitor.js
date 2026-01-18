/**
 * usePerformanceMonitor Hook
 * 
 * Monitors React component performance using React DevTools Profiler API
 * 
 * @param {string} componentName - Name of the component being monitored
 * @param {boolean} enabled - Whether monitoring is enabled
 * @returns {Object} Performance metrics
 */
import { useEffect, useRef, useState } from 'react'

export const usePerformanceMonitor = (componentName, enabled = false) => {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0
  })
  const renderTimesRef = useRef([])
  const renderStartRef = useRef(null)

  useEffect(() => {
    if (!enabled || import.meta.env.PROD) return

    renderStartRef.current = performance.now()

    return () => {
      if (renderStartRef.current) {
        const renderTime = performance.now() - renderStartRef.current
        
        renderTimesRef.current.push(renderTime)
        if (renderTimesRef.current.length > 100) {
          renderTimesRef.current.shift() // Keep only last 100 renders
        }

        const average = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length

        setMetrics({
          renderCount: renderTimesRef.current.length,
          averageRenderTime: Math.round(average * 100) / 100,
          lastRenderTime: Math.round(renderTime * 100) / 100
        })

        if (import.meta.env.DEV && renderTime > 16) {
          // Warn if render takes longer than one frame (16ms)
          console.warn(`[Performance] ${componentName} render took ${Math.round(renderTime)}ms`)
        }
      }
    }
  })

  return metrics
}
