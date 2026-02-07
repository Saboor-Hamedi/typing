import { useState, useEffect, useRef, useCallback } from 'react'
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
  const [heat, setHeat] = useState(0)
  const rafIdRef = useRef(null)
  const lastUpdateRef = useRef(0)
  const lastColorRef = useRef('')

  /**
   * Update color with RAF throttling
   */
  const updateColor = useCallback(
    rafThrottle(() => {
      if (!isEnabled || !isActive) {
        setHeat(0)
        return
      }

      const baseColor = THEMES.COLORS[theme] || THEMES.COLORS[THEMES.DEFAULT]

      // Calculate target WPM (use PB or fallback)
      const targetWpm = pb > 0 ? pb : GAME.CHAMELEON_FALLBACK_TARGET

      // Calculate heat factor (0-1) - More sensitive thresholds
      const minThreshold = Math.min(10, targetWpm * 0.2) // Start subtle shift at 20% or 10 WPM (whichever is lower)
      const maxThreshold = targetWpm * 1.0 // Fully hot at PB

      let currentHeat = (liveWpm - minThreshold) / (maxThreshold - minThreshold)
      currentHeat = clamp(currentHeat, 0, 1.4) // Allow slightly "overheating" for extra glow

      setHeat(currentHeat)

      // Use a power curve for more dramatic visual shift
      const curveHeat = Math.pow(currentHeat, 1.2) // Less aggressive curve for more early visibility
      // Safe lookup for hot colors
      const themeHotColors = THEMES.HOT_COLORS || {}
      const hotColor = themeHotColors[theme] || themeHotColors[THEMES.DEFAULT] || [255, 0, 0]

      const interpolatedColor = lerpColor(baseColor, hotColor, curveHeat)

      // Update CSS variable on both html and body for maximum override dominance
      const colorStr = interpolatedColor.join(', ')

      // Optimization: Skip DOM update if color hasn't changed
      if (lastColorRef.current !== colorStr) {
        document.documentElement.style.setProperty('--main-color-rgb', colorStr)
        document.body.style.setProperty('--main-color-rgb', colorStr)
        lastColorRef.current = colorStr
      }

      lastUpdateRef.current = performance.now()
    }),
    [theme, pb, isEnabled, isActive, liveWpm]
  )

  /**
   * Reset to base theme color
   */
  const resetColor = useCallback(() => {
    setHeat(0)
    const baseColor = THEMES.COLORS[theme] || THEMES.COLORS[THEMES.DEFAULT]
    const colorStr = baseColor.join(', ')
    document.documentElement.style.setProperty('--main-color-rgb', colorStr)
    document.body.style.setProperty('--main-color-rgb', colorStr)
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

  return { heat }
}
