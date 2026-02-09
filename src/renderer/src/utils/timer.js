/**
 * Timer Utility
 *
 * Purpose: Robust, performant timer for typing tests
 * - Prevents UI shaking by using refs and requestAnimationFrame
 * - DRY, reusable, and optimized for performance
 * - Handles edge cases and cleanup properly
 */

/**
 * Creates a stable countdown timer that updates the UI smoothly
 * @param {number} initialSeconds - Initial countdown time in seconds
 * @param {Function} onTick - Callback called every second with (remainingSeconds, elapsedSeconds)
 * @param {Function} onFinish - Callback called when timer reaches 0
 * @returns {Object} Timer control methods
 */
export function createCountdownTimer(initialSeconds, onTick, onFinish) {
  let startTime = null
  let remainingSeconds = initialSeconds
  let animationFrameId = null
  let isRunning = false
  let isPaused = false
  let pausedAt = null
  let pausedRemaining = null

  const tick = () => {
    if (!isRunning || isPaused) return

    const now = performance.now()
    const elapsed = Math.floor((now - startTime) / 1000)
    const newRemaining = Math.max(0, initialSeconds - elapsed)

    // Only update if seconds changed to prevent unnecessary callbacks
    if (newRemaining !== remainingSeconds) {
      remainingSeconds = newRemaining

      if (onTick) {
        onTick(remainingSeconds, elapsed)
      }

      if (remainingSeconds <= 0) {
        stop()
        if (onFinish) {
          onFinish()
        }
        return
      }
    }

    // Use requestAnimationFrame for smooth updates
    animationFrameId = requestAnimationFrame(tick)
  }

  const start = () => {
    if (isRunning && !isPaused) return

    if (isPaused && pausedAt) {
      // Resume from pause
      startTime = performance.now() - (initialSeconds - pausedRemaining) * 1000
      isPaused = false
    } else {
      // Fresh start
      startTime = performance.now()
      remainingSeconds = initialSeconds
    }

    isRunning = true

    // Immediately call onTick with initial value to show time right away (synchronously)
    if (onTick && !isPaused) {
      onTick(remainingSeconds, 0)
    }

    // Start the animation frame loop
    animationFrameId = requestAnimationFrame(tick)
  }

  const pause = () => {
    if (!isRunning || isPaused) return

    isPaused = true
    pausedAt = performance.now()
    pausedRemaining = remainingSeconds

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  const resume = () => {
    if (!isPaused) return
    start()
  }

  const stop = () => {
    isRunning = false
    isPaused = false

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    startTime = null
    pausedAt = null
    pausedRemaining = null
  }

  const reset = (newInitialSeconds = initialSeconds) => {
    stop()
    initialSeconds = newInitialSeconds
    remainingSeconds = newInitialSeconds
  }

  const getRemaining = () => remainingSeconds
  const getElapsed = () => {
    if (!startTime) return 0
    return Math.floor((performance.now() - startTime) / 1000)
  }
  const isActive = () => isRunning && !isPaused

  return {
    start,
    pause,
    resume,
    stop,
    reset,
    getRemaining,
    getElapsed,
    isActive
  }
}

/**
 * Creates a stable elapsed timer (counts up)
 * @param {Function} onTick - Callback called every second with elapsedSeconds
 * @returns {Object} Timer control methods
 */
export function createElapsedTimer(onTick) {
  let startTime = null
  let animationFrameId = null
  let isRunning = false
  let isPaused = false
  let pausedTime = 0
  let lastSecond = 0

  const tick = () => {
    if (!isRunning || isPaused) return

    const now = performance.now()
    const elapsed = Math.floor((now - startTime) / 1000)

    // Only update if seconds changed
    if (elapsed !== lastSecond) {
      lastSecond = elapsed
      if (onTick) {
        onTick(elapsed)
      }
    }

    animationFrameId = requestAnimationFrame(tick)
  }

  const start = () => {
    if (isRunning && !isPaused) return

    if (isPaused) {
      startTime = performance.now() - pausedTime
      isPaused = false
    } else {
      startTime = performance.now()
      lastSecond = -1
    }

    isRunning = true
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    animationFrameId = requestAnimationFrame(tick)
  }

  const pause = () => {
    if (!isRunning || isPaused) return
    isPaused = true
    pausedTime = performance.now() - startTime
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  const resume = () => {
    if (!isPaused) return
    start()
  }

  const stop = () => {
    isRunning = false
    isPaused = false
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    startTime = null
    pausedTime = 0
  }

  const reset = () => {
    stop()
    lastSecond = 0
  }

  const getElapsed = () => {
    if (!startTime) return 0
    if (isPaused) return Math.floor(pausedTime / 1000)
    return Math.floor((performance.now() - startTime) / 1000)
  }

  return {
    start,
    pause,
    resume,
    stop,
    reset,
    getElapsed,
    isActive: () => isRunning && !isPaused
  }
}
