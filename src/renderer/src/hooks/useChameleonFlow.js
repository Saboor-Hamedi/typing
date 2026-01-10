import { useEffect, useRef, useCallback } from 'react'
import { useTheme } from '../contexts'
import { THEMES, GAME, PERFORMANCE } from '../constants'
import { lerpColor, clamp, rafThrottle } from '../utils/helpers'

/**
 * Optimized Chameleon Flow Hook
 * Manages dynamic color interpolation based on WPM performance
 * Uses RAF throttling and debouncing for optimal performance
 * 
 * @param {number} liveWpm - Current WPM
 * @param {number} pb - Personal best WPM
 * @param {boolean} isActive - Whether test is active
 * @param {boolean} isEnabled - Whether chameleon is enabled
 */
export const useChameleonFlow = (liveWpm, pb, isActive, isEnabled) => {
  const { theme } = useTheme()
  const rafIdRef = useRef(null)
  const lastUpdateRef = useRef(0)

  /**
   * Update color with RAF throttling
   */
  const updateColor = useCallback(rafThrottle(() => {
    if (!isEnabled || !isActive) return

    const baseColor = THEMES.COLORS[theme] || THEMES.COLORS[THEMES.DEFAULT]
    const hotColor = THEMES.HOT_COLOR
    
    // Calculate target WPM (use PB or fallback)
    const targetWpm = pb > 0 ? pb : GAME.CHAMELEON_FALLBACK_TARGET
    
    // Calculate heat factor (0-1)
    const minThreshold = targetWpm * GAME.CHAMELEON_MIN_THRESHOLD
    const maxThreshold = targetWpm * GAME.CHAMELEON_MAX_THRESHOLD
    
    let heat = (liveWpm - minThreshold) / (maxThreshold - minThreshold)
    heat = clamp(heat, 0, 1)
    
    // Interpolate color
    const interpolatedColor = lerpColor(baseColor, hotColor, heat)
    
    // Update CSS variable
    document.documentElement.style.setProperty(
      '--main-color-rgb',
      interpolatedColor.join(', ')
    )
    
    lastUpdateRef.current = performance.now()
  }), [theme, pb, isEnabled, isActive])

  /**
   * Reset to base theme color
   */
  const resetColor = useCallback(() => {
    const baseColor = THEMES.COLORS[theme] || THEMES.COLORS[THEMES.DEFAULT]
    document.documentElement.style.setProperty(
      '--main-color-rgb',
      baseColor.join(', ')
    )
  }, [theme])

  // Update color when WPM changes
  useEffect(() => {
    if (isEnabled && isActive) {
      updateColor()
    } else {
      resetColor()
    }
  }, [liveWpm, isEnabled, isActive, updateColor, resetColor])

  // Reset on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
      resetColor()
    }
  }, [resetColor])
}
