import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { GAME } from '../constants'

/**
 * Optimized Ghost Racing Hook
 * Manages ghost caret position with RAF and cached DOM references
 */
export const useGhostRacing = (
  isEnabled,
  isActive,
  isFinished,
  startTime,
  pb,
  ghostSpeed,
  words,
  containerRef,
  userInputRef
) => {
  const [ghostPos, setGhostPos] = useState({ left: 0, top: 0 })
  const rafIdRef = useRef(null)
  const cachedElementsRef = useRef(new Map())
  const lastLeadRef = useRef(0)

  /**
   * Get or cache DOM element
   */
  const getElement = useCallback((charIndex) => {
    if (cachedElementsRef.current.has(charIndex)) {
      return cachedElementsRef.current.get(charIndex)
    }

    const element = document.getElementById(`char-${charIndex}`)
    if (element) {
      cachedElementsRef.current.set(charIndex, element)
    }
    return element
  }, [])

  /**
   * Pre-calculate initial position to prevent jumping
   */
  useLayoutEffect(() => {
    if (!isEnabled || isActive || words.length === 0 || !containerRef.current) return

    const syncGhost = () => {
      const firstLetter = document.getElementById('char-0')
      if (firstLetter && containerRef.current) {
        const container = containerRef.current
        const containerRect = container.getBoundingClientRect()
        const targetRect = firstLetter.getBoundingClientRect()

        const left = targetRect.left - containerRect.left + container.scrollLeft
        const top_abs = targetRect.top - containerRect.top + container.scrollTop
        const h = targetRect.height * 0.7
        const top = top_abs + (targetRect.height - h) / 2

        setGhostPos({
          left,
          top,
          width: targetRect.width,
          height: h
        })
      }
    }

    syncGhost()
    window.addEventListener('resize', syncGhost)
    return () => window.removeEventListener('resize', syncGhost)
  }, [isEnabled, isActive, words, containerRef])

  const progressRef = useRef(0)
  const lastUpdateRef = useRef(0)
  const lastRenderRef = useRef(0)

  /**
   * Update ghost position (throttled to 60fps)
   */
  const updateGhostPosition = useCallback(() => {
    if (!isEnabled || !isActive || !startTime || !containerRef.current || isFinished) {
      return
    }

    const now = performance.now()
    if (lastUpdateRef.current === 0) lastUpdateRef.current = now
    const deltaTime = now - lastUpdateRef.current
    lastUpdateRef.current = now

    // 1. Dynamic Speed Calculation (Rubber-Banding)
    let targetWpm = pb > 0 ? pb : 50

    // Calculate current lead
    const userIndex = userInputRef.current?.length || 0
    const currentLead = Math.floor(progressRef.current) - userIndex

    // Rubber-Band: Smoother interpolation for speed adjustment
    let speedAdjustment = 1.0
    if (currentLead > 5) {
      speedAdjustment = 1.0 - Math.min(0.3, (currentLead - 5) / 60)
    } else if (currentLead < -5) {
      speedAdjustment = 1.0 + Math.min(0.25, Math.abs(currentLead + 5) / 80)
    }

    const effectiveWpm = targetWpm * ghostSpeed * speedAdjustment
    const charsPerMs = (effectiveWpm * GAME.CHARS_PER_WORD) / 60000

    progressRef.current += deltaTime * charsPerMs
    const progress = progressRef.current
    const index = Math.floor(progress)
    const factor = progress - index

    const totalChars = words.join(' ').length

    // Update Lead CSS Variable for visual effects (throttled)
    if (currentLead !== lastLeadRef.current) {
      document.documentElement.style.setProperty('--ghost-lead', currentLead.toString())
      lastLeadRef.current = currentLead
    }

    // Schedule next frame FIRST to ensure continuous updates
    rafIdRef.current = requestAnimationFrame(updateGhostPosition)

    if (index >= totalChars - 1) {
      const lastLetter = getElement(totalChars - 1)
      if (lastLetter) {
        const container = containerRef.current
        const containerRect = container.getBoundingClientRect()
        const targetRect = lastLetter.getBoundingClientRect()

        // Throttle to 60fps
        const timeSinceLastRender = now - lastRenderRef.current
        if (timeSinceLastRender >= 16.67) {
          setGhostPos({
            left: targetRect.right - containerRect.left + container.scrollLeft,
            top:
              targetRect.top -
              containerRect.top +
              container.scrollTop +
              (targetRect.height - targetRect.height * 0.7) / 2,
            width: 0,
            height: targetRect.height * 0.7,
            opacity: 1,
            index: totalChars - 1
          })
          lastRenderRef.current = now
        }
      }
      return
    }

    const charA = getElement(index)
    const charB = getElement(index + 1)

    if (charA && charB) {
      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const rectA = charA.getBoundingClientRect()
      const rectB = charB.getBoundingClientRect()

      const topA = rectA.top - containerRect.top + container.scrollTop
      const topB = rectB.top - containerRect.top + container.scrollTop

      let left,
        top,
        height,
        opacity = 1

      if (Math.abs(topA - topB) < 5) {
        left =
          rectA.left -
          containerRect.left +
          container.scrollLeft +
          (rectB.left - rectA.left) * factor
        height = rectA.height * 0.7
        top = topA + (rectA.height - height) / 2
        opacity = 1
      } else {
        height = rectA.height * 0.7
        if (factor < 0.5) {
          const fadeFactor = 1 - factor * 2
          left = rectA.left - containerRect.left + container.scrollLeft
          top = topA + (rectA.height - height) / 2
          opacity = fadeFactor
        } else {
          const fadeFactor = (factor - 0.5) * 2
          left = rectB.left - containerRect.left + container.scrollLeft
          top = topB + (rectB.height - height) / 2
          opacity = fadeFactor
        }
      }

      // Throttle state updates to 60fps (16.67ms)
      const timeSinceLastRender = now - lastRenderRef.current
      if (timeSinceLastRender >= 16.67) {
        setGhostPos({ left, top, width: 2, height, opacity, index })
        lastRenderRef.current = now
      }
    }
  }, [
    isEnabled,
    isActive,
    startTime,
    pb,
    ghostSpeed,
    words,
    containerRef,
    isFinished,
    userInputRef
  ])

  /**
   * Start/stop ghost animation
   */
  useEffect(() => {
    if (isEnabled && isActive && startTime && !isFinished) {
      progressRef.current = 0
      lastUpdateRef.current = 0
      cachedElementsRef.current.clear()
      rafIdRef.current = requestAnimationFrame(updateGhostPosition)
    } else {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      cachedElementsRef.current.clear()
      document.documentElement.style.setProperty('--ghost-lead', '0')
      lastLeadRef.current = 0
    }

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      document.documentElement.style.setProperty('--ghost-lead', '0')
    }
  }, [isEnabled, isActive, startTime, words, updateGhostPosition, isFinished])

  return ghostPos
}
