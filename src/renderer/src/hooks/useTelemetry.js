import { useState, useEffect, useRef, useCallback } from 'react'
import { CircularBuffer } from '../utils/helpers'
import { PERFORMANCE, GAME, UI } from '../constants'

/**
 * Optimized Telemetry Hook
 * Collects WPM data over time using circular buffer for efficiency
 * 
 * @param {boolean} isActive - Whether test is active
 * @param {number} startTime - Test start timestamp
 * @param {string} userInput - Current user input
 * @param {Array} words - Word array
 * @param {string} testMode - Test mode ('time' or 'words')
 * @returns {Object} { telemetry, addDataPoint, clearTelemetry }
 */
export const useTelemetry = (isActive, startTime, userInput, words, testMode) => {
  const [telemetry, setTelemetry] = useState([])
  const bufferRef = useRef(new CircularBuffer(UI.MAX_HISTORY_ITEMS))
  const intervalRef = useRef(null)
  const lastSecondRef = useRef(0)

  /**
   * Calculate current WPM
   */
  const calculateCurrentWPM = useCallback(() => {
    if (!startTime) return 0

    const elapsedMs = performance.now() - startTime
    const elapsedMin = elapsedMs / 60000

    if (elapsedMin <= 0) return 0

    // Calculate net WPM (correct characters only)
    const targetText = words.join(' ')
    let correctChars = 0
    
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === targetText[i]) {
        correctChars++
      }
    }

    return Math.round((correctChars / GAME.CHARS_PER_WORD) / elapsedMin) || 0
  }, [startTime, userInput, words])

  /**
   * Calculate raw WPM
   */
  const calculateRawWPM = useCallback(() => {
    if (!startTime) return 0

    const elapsedMs = performance.now() - startTime
    const elapsedMin = elapsedMs / 60000

    if (elapsedMin <= 0) return 0

    return Math.round((userInput.length / GAME.CHARS_PER_WORD) / elapsedMin) || 0
  }, [startTime, userInput])

  /**
   * Add data point to telemetry
   */
  const addDataPoint = useCallback(() => {
    const elapsedSec = Math.round((performance.now() - startTime) / 1000)
    
    // Only add one point per second
    if (elapsedSec <= lastSecondRef.current) return
    
    lastSecondRef.current = elapsedSec

    const dataPoint = {
      sec: elapsedSec,
      wpm: calculateCurrentWPM(),
      raw: calculateRawWPM(),
    }

    // Add to circular buffer
    bufferRef.current.push(dataPoint)
    
    // Update state (convert buffer to array)
    setTelemetry(bufferRef.current.toArray())
  }, [startTime, calculateCurrentWPM, calculateRawWPM])

  /**
   * Clear telemetry data
   */
  const clearTelemetry = useCallback(() => {
    bufferRef.current.clear()
    setTelemetry([])
    lastSecondRef.current = 0
  }, [])

  /**
   * Start/stop telemetry collection
   */
  useEffect(() => {
    if (isActive && startTime) {
      // Start interval
      intervalRef.current = setInterval(() => {
        addDataPoint()
      }, PERFORMANCE.TELEMETRY_INTERVAL)
    } else {
      // Stop interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, startTime, addDataPoint])

  /**
   * Clear on test reset
   */
  useEffect(() => {
    if (!isActive && !startTime) {
      clearTelemetry()
    }
  }, [isActive, startTime, clearTelemetry])

  return {
    telemetry,
    addDataPoint,
    clearTelemetry
  }
}
