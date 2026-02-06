import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
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
   * Pre-calculate initial position to prevent jumping
   */
  useLayoutEffect(() => {
    if (!isEnabled || isActive || words.length === 0 || !containerRef.current) return;

    const syncGhost = () => {
      const firstLetter = document.getElementById('char-0');
      if (firstLetter && containerRef.current) {
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const targetRect = firstLetter.getBoundingClientRect();
        
        const left = targetRect.left - containerRect.left + container.scrollLeft;
        const top_abs = targetRect.top - containerRect.top + container.scrollTop;
        const h = targetRect.height * 0.7;
        const top = top_abs + (targetRect.height - h) / 2;
        
        setGhostPos({
          left,
          top,
          width: targetRect.width,
          height: h
        });
      }
    };

    // Run once and on window resize to keep it aligned
    syncGhost();
    window.addEventListener('resize', syncGhost);
    return () => window.removeEventListener('resize', syncGhost);
  }, [isEnabled, isActive, words, containerRef]);

  /**
   * Update ghost position
   */
  const updateGhostPosition = useCallback(() => {
    if (!isEnabled || !isActive || !startTime || pb <= 0 || !containerRef.current) {
      return
    }

    const elapsed = performance.now() - startTime
    
    // Calculate ghost character progress (fractional)
    const charsPerMs = (pb * GAME.CHARS_PER_WORD * ghostSpeed) / 60000
    const progress = elapsed * charsPerMs
    const index = Math.floor(progress)
    const factor = progress - index // 0.0 to 1.0 within the character
    
    // Get total character count
    const totalChars = words.join(' ').length
    
    if (index >= totalChars - 1) {
      // Ghost at the very end
      const lastLetter = getElement(totalChars - 1)
      if (lastLetter) {
        const container = containerRef.current
        const containerRect = container.getBoundingClientRect()
        const targetRect = lastLetter.getBoundingClientRect()
        setGhostPos({
          left: targetRect.right - containerRect.left + container.scrollLeft,
          top: targetRect.top - containerRect.top + container.scrollTop + (targetRect.height - targetRect.height * 0.7) / 2,
          width: 2,
          height: targetRect.height * 0.7
        })
      }
      rafIdRef.current = requestAnimationFrame(updateGhostPosition)
      return
    }

    // Interpolation Logic
    const charA = getElement(index)
    const charB = getElement(index + 1)
    
    if (charA && charB) {
      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const rectA = charA.getBoundingClientRect()
      const rectB = charB.getBoundingClientRect()
      
      const topA = rectA.top - containerRect.top + container.scrollTop
      const topB = rectB.top - containerRect.top + container.scrollTop
      
      let left, top, height, opacity = 1;
      
      // If on same line, interpolate left smoothly
      if (Math.abs(topA - topB) < 5) {
        left = (rectA.left - containerRect.left + container.scrollLeft) + 
               ((rectB.left - rectA.left) * factor);
        height = rectA.height * 0.7;
        top = topA + (rectA.height - height) / 2;
        opacity = 1;
      } else {
        // Line break: Phasing Effect (Fade out -> Teleport -> Fade in)
        // This prevents the "ugly" sweep/jump across lines
        height = rectA.height * 0.7;
        if (factor < 0.5) {
          // Fade out at end of Line A
          const fadeFactor = 1 - (factor * 2);
          left = rectA.left - containerRect.left + container.scrollLeft;
          top = topA + (rectA.height - height) / 2;
          opacity = fadeFactor;
        } else {
          // Fade in at start of Line B
          const fadeFactor = (factor - 0.5) * 2;
          left = rectB.left - containerRect.left + container.scrollLeft;
          top = topB + (rectB.height - height) / 2;
          opacity = fadeFactor;
        }
      }

      setGhostPos({ left, top, width: 2, height, opacity })
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
      
      cachedElementsRef.current.clear()
      lastCharIndexRef.current = -1
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [isEnabled, isActive, startTime, pb, words, updateGhostPosition, containerRef])

  return ghostPos
}
