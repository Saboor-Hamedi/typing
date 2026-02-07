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
  const rafIdRef = useRef(null)
  const lastColorRef = useRef('')
  const lastHeatRef = useRef(-1)

  /**
   * Update color and heat with direct DOM manipulation to avoid re-renders
   */
  const updateChameleon = useCallback(() => {
    if (!isEnabled || !isActive) {
      return
    }

    const baseColor = THEMES.COLORS[theme] || THEMES.COLORS[THEMES.DEFAULT]
    const targetWpm = pb > 0 ? pb : GAME.CHAMELEON_FALLBACK_TARGET

    // Calculate heat factor (0-1)
    const minThreshold = Math.min(10, targetWpm * 0.2)
    const maxThreshold = targetWpm * 1.0

    let currentHeat = (liveWpm - minThreshold) / (maxThreshold - minThreshold)

    // Ghost Lead Penalty: If ghost is ahead, reduce heat to turn UI "Cold"
    // and desaturate the colors.
    const lead = parseInt(document.documentElement.style.getPropertyValue('--ghost-lead')) || 0
    if (lead > 5) {
      const penalty = Math.min(1.2, lead / 20)
      currentHeat -= penalty
    }

    currentHeat = clamp(currentHeat, -1.5, 1.4)

    // 1. Update Heat CSS Variable
    if (Math.abs(lastHeatRef.current - currentHeat) > 0.01) {
      document.documentElement.style.setProperty('--chameleon-heat', currentHeat.toFixed(3))
      lastHeatRef.current = currentHeat
    }

    // 2. Update Color CSS Variable
    // For negative heat (lagging), we interpolate towards a cold Cyan [0, 200, 255]
    const coldColor = [0, 200, 255]
    const themeHotColors = THEMES.HOT_COLORS || {}
    const hotColor = themeHotColors[theme] || themeHotColors[THEMES.DEFAULT] || [255, 0, 0]

    let interpolatedColor
    if (currentHeat >= 0) {
      const curveHeat = Math.pow(currentHeat, 1.2)
      interpolatedColor = lerpColor(baseColor, hotColor, curveHeat)
    } else {
      // Lagging: interpolate towards cold cyan
      const lagIntensity = Math.abs(currentHeat)
      interpolatedColor = lerpColor(baseColor, coldColor, Math.min(1, lagIntensity))
    }
    const colorStr = interpolatedColor.join(', ')

    if (lastColorRef.current !== colorStr) {
      document.documentElement.style.setProperty('--main-color-rgb', colorStr)
      lastColorRef.current = colorStr
    }
  }, [theme, pb, isEnabled, isActive, liveWpm])

  /**
   * Reset all chameleon variables
   */
  const resetChameleon = useCallback(() => {
    const baseColor = THEMES.COLORS[theme] || THEMES.COLORS[THEMES.DEFAULT]
    const colorStr = baseColor.join(', ')
    document.documentElement.style.setProperty('--main-color-rgb', colorStr)
    document.documentElement.style.setProperty('--chameleon-heat', '0')
    lastHeatRef.current = 0
    lastColorRef.current = colorStr
  }, [theme])

  // Update when WPM or state changes
  useEffect(() => {
    if (isEnabled && isActive) {
      updateChameleon()
    } else {
      resetChameleon()
    }
  }, [liveWpm, isEnabled, isActive, updateChameleon, resetChameleon])

  // Cleanup
  useEffect(() => {
    return () => resetChameleon()
  }, [resetChameleon])

  return null // No longer returning state to trigger re-renders
}
