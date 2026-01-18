/**
 * TimeDisplay Component
 * 
 * Purpose: Robust, stable time display that doesn't shake
 * - Uses memoization to prevent unnecessary re-renders
 * - Smooth formatting and display
 * - DRY and reusable
 */
import { memo } from 'react'
import './TimeDisplay.css'

/**
 * Displays time in a stable, performant way
 * @param {number} seconds - Time in seconds to display
 * @param {string} format - Display format ('s' for seconds, 'mm:ss' for minutes:seconds)
 */
const TimeDisplay = memo(({ seconds, format = 's' }) => {
  if (seconds == null || seconds < 0) {
    return <span className="time-display">—</span>
  }

  let displayText = ''
  
  if (format === 'mm:ss') {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    displayText = `${mins}:${String(secs).padStart(2, '0')}`
  } else {
    displayText = `${Math.round(seconds)}s`
  }

  return (
    <span className="time-display" data-seconds={seconds}>
      {displayText}
    </span>
  )
})

TimeDisplay.displayName = 'TimeDisplay'

export default TimeDisplay
