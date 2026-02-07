/**
 * Utility helper functions
 * Reusable utilities for performance and DRY code
 */

/**
 * Debounce function - delays execution until after wait time
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function - limits execution to once per wait time
 * @param {Function} func - Function to throttle
 * @param {number} wait - Minimum time between executions
 * @returns {Function} Throttled function
 */
export const throttle = (func, wait) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), wait)
    }
  }
}

/**
 * Request animation frame throttle - limits to 60fps
 * @param {Function} func - Function to throttle
 * @returns {Function} RAF-throttled function
 */
export const rafThrottle = (func) => {
  let rafId = null
  return function executedFunction(...args) {
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
      func(...args)
      rafId = null
    })
  }
}

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max)
}

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export const lerp = (start, end, t) => {
  return start + (end - start) * clamp(t, 0, 1)
}

/**
 * Interpolate RGB color values
 * @param {number[]} color1 - RGB array [r, g, b]
 * @param {number[]} color2 - RGB array [r, g, b]
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number[]} Interpolated RGB array
 */
export const lerpColor = (color1, color2, t) => {
  return color1.map((c, i) => Math.round(lerp(c, color2[i], t)))
}

/**
 * Format timestamp to relative time
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

/**
 * Calculate WPM from character count and duration
 * @param {number} chars - Number of characters typed
 * @param {number} durationMs - Duration in milliseconds
 * @param {number} charsPerWord - Characters per word (default 5)
 * @returns {number} WPM rounded to nearest integer
 */
export const calculateWPM = (chars, durationMs, charsPerWord = 5) => {
  if (durationMs <= 0) return 0
  const durationMin = durationMs / 60000
  return Math.max(0, Math.round(chars / charsPerWord / durationMin))
}

/**
 * Calculate accuracy percentage
 * @param {number} correct - Correct characters
 * @param {number} total - Total characters
 * @returns {number} Accuracy percentage (0-100)
 */
export const calculateAccuracy = (correct, total) => {
  if (total === 0) return 100
  return Math.round((correct / total) * 100)
}

/**
 * Safe JSON parse with fallback
 * @param {string} str - JSON string to parse
 * @param {*} fallback - Fallback value if parse fails
 * @returns {*} Parsed value or fallback
 */
export const safeJSONParse = (str, fallback = null) => {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

/**
 * Check if user prefers reduced motion
 * @returns {boolean} True if reduced motion is preferred
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get animation duration based on reduced motion preference
 * @param {number} normalDuration - Normal duration in seconds
 * @param {number} reducedDuration - Reduced duration in seconds
 * @returns {number} Appropriate duration
 */
export const getAnimationDuration = (normalDuration, reducedDuration = 0.01) => {
  return prefersReducedMotion() ? reducedDuration : normalDuration
}

/**
 * Circular buffer implementation for efficient array operations
 */
export class CircularBuffer {
  constructor(capacity) {
    this.capacity = capacity
    this.buffer = new Array(capacity)
    this.head = 0
    this.tail = 0
    this.size = 0
  }

  push(item) {
    this.buffer[this.tail] = item
    this.tail = (this.tail + 1) % this.capacity

    if (this.size < this.capacity) {
      this.size++
    } else {
      this.head = (this.head + 1) % this.capacity
    }
  }

  toArray() {
    const result = []
    for (let i = 0; i < this.size; i++) {
      result.push(this.buffer[(this.head + i) % this.capacity])
    }
    return result
  }

  clear() {
    this.head = 0
    this.tail = 0
    this.size = 0
  }

  get length() {
    return this.size
  }
}

/**
 * Check if device is online
 * @returns {boolean} True if online
 */
export const isOnline = () => {
  return navigator.onLine
}

/**
 * Wait for specified milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
export const wait = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelay - Base delay in ms
 * @returns {Promise} Result of function or throws error
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await wait(baseDelay * Math.pow(2, i))
    }
  }
}
