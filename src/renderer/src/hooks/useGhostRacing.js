import { useState, useEffect, useRef, useCallback } from 'react'
import { GAME } from '../constants'

/**
 * Optimized Ghost Racing Hook
 * Manages ghost caret position with RAF and cached DOM references
 * 
 * @param {boolean} isEnabled - Whether ghost racing is enabled
 * @param {boolean} isActive - Whether test is active
 * @param {number} startTime - Test start timestamp
 * @param {number} pb - Personal best WPM
 * @param {number} ghostSpeed - Speed multiplier
 * @param {Array} words - Word array
 * @param {Object} containerRef - Ref to word container
 * @returns {Object} Ghost position {left, top}
 */
export const useGhostRacing = (
  isEnabled,
  isActive,
  startTime,
  pb,
  ghostSpeed,
  words,
  containerRef
) => {
  const [ghostPos, setGhostPos] = useState({ left: 0, top: 0 })
  const rafIdRef = useRef(null)
  const cachedElementsRef = useRef(new Map())
  const lastCharIndexRef = useRef(-1)

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
   * Update ghost position
   */
  const updateGhostPosition = useCallback(() => {
    if (!isEnabled || !isActive || !startTime || pb <= 0 || !containerRef.current) {
      return
    }

    const elapsed = performance.now() - startTime
    
    // Calculate ghost character index
    // Formula: (PB WPM × 5 chars/word × speed multiplier) / 60000 ms/min
    const charsPerMs = (pb * GAME.CHARS_PER_WORD * ghostSpeed) / 60000
    const ghostCharIndex = Math.floor(elapsed * charsPerMs)
    
    // Only update if character changed
    if (ghostCharIndex === lastCharIndexRef.current) {
      rafIdRef.current = requestAnimationFrame(updateGhostPosition)
      return
    }
    
    lastCharIndexRef.current = ghostCharIndex
    
    // Get total character count
    const totalChars = words.join(' ').length
    
    if (ghostCharIndex >= totalChars) {
      // Ghost finished
      cancelAnimationFrame(rafIdRef.current)
      return
    }

    // Get element (cached or fresh)
    const ghostLetter = getElement(ghostCharIndex)
    
    if (ghostLetter) {
      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const targetRect = ghostLetter.getBoundingClientRect()
      
      // Calculate absolute position within the scrollable content
      const left = targetRect.left - containerRect.left + container.scrollLeft;
      const top_abs = targetRect.top - containerRect.top + container.scrollTop;
      const h = targetRect.height * 0.7;
      const top = top_abs + (targetRect.height - h) / 2;

      setGhostPos({
        left,
        top,
        width: targetRect.width,
        height: h
      })
    }

    // Schedule next frame
    rafIdRef.current = requestAnimationFrame(updateGhostPosition)
  }, [isEnabled, isActive, startTime, pb, ghostSpeed, words, containerRef, getElement])

  /**
   * Start/stop ghost animation
   */
  useEffect(() => {
    if (isEnabled && isActive && startTime && pb > 0) {
      // Clear cache on new test
      cachedElementsRef.current.clear()
      lastCharIndexRef.current = -1
      
      // Start animation loop
      rafIdRef.current = requestAnimationFrame(updateGhostPosition)
    } else {
      // Stop animation
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      setGhostPos({ left: 0, top: 0 })
      cachedElementsRef.current.clear()
      lastCharIndexRef.current = -1
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [isEnabled, isActive, startTime, pb, updateGhostPosition])

  return ghostPos
}
