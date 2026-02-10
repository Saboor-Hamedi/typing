/**
 * useEngine Hook
 *
 * Core typing game state machine and telemetry pipeline.
 * Manages typing state, word generation, input handling, timing, results calculation, and caret positioning.
 *
 * @param {string} testMode - Test mode: 'time' or 'words'
 * @param {number} testLimit - Test limit (seconds for time mode, word count for words mode)
 * @returns {Object} Engine state and actions
 * @returns {string[]} returns.words - Array of words to type
 * @returns {string} returns.userInput - Current user input
 * @returns {number|null} returns.startTime - Test start timestamp
 * @returns {boolean} returns.isFinished - Whether the test is finished
 * @returns {boolean} returns.isReplaying - Whether replay is active
 * @returns {Object} returns.results - Test results {wpm, rawWpm, accuracy, errors}
 * @returns {Array} returns.keystrokes - Keystroke history
 * @returns {Array} returns.testHistory - Test history array
 * @returns {Object} returns.caretPos - Caret position {left, top}
 * @returns {number} returns.pb - Personal best WPM
 * @returns {Array} returns.telemetry - Telemetry data array
 * @returns {React.RefObject} returns.wordContainerRef - Ref to word container
 * @returns {React.RefObject} returns.inputRef - Ref to hidden input
 * @returns {Function} returns.resetGame - Function to reset the game
 * @returns {Function} returns.handleInput - Function to handle input changes
 * @returns {Function} returns.runReplay - Function to run replay
 * @returns {Function} returns.clearAllData - Function to clear all data
 * @returns {number} returns.timeLeft - Remaining time (for time mode)
 * @returns {number} returns.elapsedTime - Elapsed time (for words mode)
 *
 * @example
 * ```jsx
 * const engine = useEngine('words', 25)
 * // Use engine.words, engine.userInput, engine.handleInput, etc.
 * ```
 */
import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react'
import { generateWords, generateBaseWords, applyModifiers } from '../utils/words'
import { soundEngine } from '../utils/SoundEngine'
import { supabase } from '../utils/supabase'
import { useGhostRacing } from '../hooks/useGhostRacing'
import { useSettings } from '../contexts/SettingsContext'
import { createCountdownTimer, createElapsedTimer } from '../utils/timer'
import { CircularBuffer } from '../utils/helpers'

export function useEngine(testMode, testLimit, activeTab) {
  // 1. ALL STATES
  const [words, setWords] = useState([])
  const [baseWords, setBaseWords] = useState([])
  const [userInput, setUserInput] = useState('')
  const [startTime, setStartTime] = useState(null)
  const [isFinished, setIsFinished] = useState(false)
  const [isReplaying, setIsReplaying] = useState(false)
  const [results, setResults] = useState({ wpm: 0, rawWpm: 0, accuracy: 0, errors: 0, duration: 0 })
  const [testHistory, setTestHistory] = useState([])
  const [caretPos, setCaretPos] = useState(null)
  const [pb, setPb] = useState(0)
  const [telemetry, setTelemetry] = useState([])
  const [timeLeft, setTimeLeft] = useState(testLimit)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [activeLineTop, setActiveLineTop] = useState(0)
  const [isStoreLoaded, setIsStoreLoaded] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const [wordSetId, setWordSetId] = useState(Date.now())
  const [isTimeUp, setIsTimeUp] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isManuallyPaused, setIsManuallyPaused] = useState(false)

  const {
    isGhostEnabled,
    setIsGhostEnabled,
    ghostSpeed,
    setGhostSpeed,
    isSoundEnabled,
    setIsSoundEnabled,
    isHallEffect,
    setIsHallEffect,
    soundProfile,
    setSoundProfile,
    isCenteredScrolling,
    setIsCenteredScrolling,
    hasPunctuation,
    hasNumbers,
    hasCaps,
    isSentenceMode,
    difficulty,
    setDifficulty,
    caretStyle,
    setCaretStyle,
    isFireCaretEnabled,
    setIsFireCaretEnabled,
    isSettingsLoaded
  } = useSettings()

  const [isLoading, setIsLoading] = useState(!isSettingsLoaded)

  // 2. ALL REFS
  const replayTimeoutRef = useRef(null)
  const keystrokesRef = useRef([])
  const telemetryBufferRef = useRef(new CircularBuffer(1000))
  const wordContainerRef = useRef(null)
  const inputRef = useRef(null)
  const caretRef = useRef(null)
  const startTimeRef = useRef(null)
  const timerRef = useRef(null)
  const countdownTimerRef = useRef(null)
  const elapsedTimerRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const resetOverridesRef = useRef(null)
  const lastLineTop = useRef(-1)
  const latestUserInputRef = useRef('')
  const wordsRef = useRef([])
  const pauseStartTimeRef = useRef(null)

  const settingsRef = useRef({
    testMode,
    testLimit,
    hasPunctuation,
    hasNumbers,
    hasCaps,
    isSentenceMode,
    difficulty
  })

  // 3. INTERNAL UTILITY HOOKS
  const ghostPos = useGhostRacing(
    isGhostEnabled,
    !!startTime && !isFinished,
    isFinished,
    startTime,
    pb,
    ghostSpeed,
    words,
    wordContainerRef,
    latestUserInputRef
  )
  useEffect(() => {
    soundEngine.setProfile(soundProfile)
    soundEngine.setHallEffect(isHallEffect)
  }, [soundProfile, isHallEffect])

  useEffect(() => {
    wordsRef.current = words
  }, [words])
  useEffect(() => {
    const loadPb = async () => {
      try {
        if (window.api && (window.api.settings || window.api.data)) {
          const savedPb = (await window.api.data.get('pb')) || 0
          setPb(savedPb)
          const savedHistory = (await window.api.data.get('history')) || []
          setTestHistory(savedHistory)
          setIsStoreLoaded(true)
        }
      } catch {
        setIsStoreLoaded(true)
      }
    }
    loadPb()
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (countdownTimerRef.current) {
      countdownTimerRef.current.stop()
      countdownTimerRef.current = null
    }
    if (elapsedTimerRef.current) {
      elapsedTimerRef.current.stop()
      elapsedTimerRef.current = null
    }
    setIsPaused(false)
    setIsManuallyPaused(false)
    pauseStartTimeRef.current = null
  }, [])

  const pauseGame = useCallback(
    (manual = false) => {
      if (!startTimeRef.current || isFinished || isPaused) {
        if (manual && !isFinished) setIsManuallyPaused(true)
        return
      }

      setIsPaused(true)
      if (manual) setIsManuallyPaused(true)
      pauseStartTimeRef.current = performance.now()

      if (countdownTimerRef.current) countdownTimerRef.current.pause()
      if (elapsedTimerRef.current) elapsedTimerRef.current.pause()
    },
    [isFinished, isPaused]
  )

  const resumeGame = useCallback(() => {
    if (!isPaused || !pauseStartTimeRef.current) {
      setIsManuallyPaused(false)
      return
    }

    const pauseDuration = performance.now() - pauseStartTimeRef.current

    // Shift the start times forward by the pause duration
    if (startTimeRef.current) startTimeRef.current += pauseDuration
    setStartTime((prev) => (prev ? prev + pauseDuration : prev))

    setIsPaused(false)
    setIsManuallyPaused(false)
    pauseStartTimeRef.current = null

    if (countdownTimerRef.current) countdownTimerRef.current.resume()
    if (elapsedTimerRef.current) elapsedTimerRef.current.resume()
  }, [isPaused])

  const updateTelemetry = useCallback((sec, finalInput = null) => {
    if (sec < 0.1) return // Ignore extremely small durations to avoid spikes
    const durationInMin = sec / 60

    const currentInput = finalInput !== null ? finalInput : latestUserInputRef.current
    const targetText = wordsRef.current.join(' ')

    let correctChars = 0
    for (let i = 0; i < Math.min(currentInput.length, targetText.length); i++) {
      if (currentInput[i] === targetText[i]) correctChars++
    }

    const currentWpm = Math.round(correctChars / 5 / durationInMin) || 0
    const currentRaw = Math.round(currentInput.length / 5 / durationInMin) || 0

    // Only push if different from last to avoid duplication
    const arr = telemetryBufferRef.current.toArray()
    const last = arr[arr.length - 1]
    if (last && last.sec === Math.round(sec * 10) / 10) return

    telemetryBufferRef.current.push({
      sec: Math.round(sec * 10) / 10,
      wpm: currentWpm,
      raw: currentRaw
    })
    setTelemetry(telemetryBufferRef.current.toArray())
  }, [])

  /**
   * Finishes the typing test and calculates results
   * @param {string} finalInput - Final user input
   * @param {number} endTime - End timestamp
   */
  const finishTest = useCallback(
    async (finalInput, endTime) => {
      try {
        stopTimer()
        const finalStartTime = startTimeRef.current || startTime

        if (!finalStartTime || endTime <= finalStartTime) {
          console.warn('Invalid timing data, using fallback')
          return
        }

        const durationSeconds = (endTime - finalStartTime) / 1000
        updateTelemetry(durationSeconds, finalInput)

        const durationInMinutes = durationSeconds / 60
        const targetText = words.join(' ')
        let correctChars = 0
        let errors = 0

        for (let i = 0; i < Math.min(finalInput.length, targetText.length); i++) {
          if (finalInput[i] === targetText[i]) {
            correctChars++
          } else {
            errors++
          }
        }

        // Add errors for missing chars if any
        if (finalInput.length < targetText.length && testMode === 'words') {
          errors += targetText.length - finalInput.length
        }

        const wpm = Math.max(0, Math.round(correctChars / 5 / durationInMinutes))
        const rawWpm = Math.max(0, Math.round(finalInput.length / 5 / durationInMinutes))
        const accuracy =
          finalInput.length > 0 ? Math.round((correctChars / finalInput.length) * 100) : 100
        const finalDurationSeconds = Math.round(durationSeconds)

        const isNewPb = wpm > pb
        setResults({ wpm, rawWpm, accuracy, errors, duration: finalDurationSeconds, isNewPb })
        setIsFinished(true)

        // Save to local storage
        if (window.api && window.api.data) {
          try {
            const currentPb = (await window.api.data.get('pb')) || 0
            if (wpm > currentPb) {
              await window.api.data.set('pb', wpm)
              setPb(wpm)
            }
            const currentHistory = (await window.api.data.get('history')) || []
            const newEntry = {
              wpm,
              accuracy,
              mode: testMode,
              limit: testLimit,
              date: new Date().toISOString()
            }
            const updatedHistory = [newEntry, ...currentHistory].slice(0, 50)
            await window.api.data.set('history', updatedHistory)
            setTestHistory(updatedHistory)
          } catch (storageError) {
            console.error('Failed to save test results locally:', storageError)
          }
        }

        // Sync to cloud (non-blocking, works offline)
        try {
          const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

          if (isOnline) {
            const {
              data: { session },
              error: sessionError
            } = await supabase.auth.getSession()

            if (!sessionError && session?.user) {
              const payload = {
                user_id: session.user.id,
                wpm,
                accuracy,
                mode: testMode,
                test_limit: testLimit
              }

              const { error: insertError } = await supabase.from('scores').insert(payload)

              if (insertError) {
                const fallbackPayload = {
                  user_id: session.user.id,
                  wpm,
                  accuracy,
                  mode: `${testMode} ${testLimit}`
                }
                await supabase.from('scores').insert(fallbackPayload)
              }
            }
          }
        } catch (syncError) {
          if (import.meta.env.DEV) {
            console.warn('Cloud sync failed (non-critical):', syncError)
          }
        }

        // Signal that test is no longer active
        startTimeRef.current = null
      } catch (error) {
        console.error('Error finishing test:', error)
        setIsFinished(true)
        startTimeRef.current = null
      }
    },
    [startTime, words, stopTimer, updateTelemetry, testMode, testLimit, pb]
  )

  const clearAllData = useCallback(async () => {
    if (window.api && window.api.data) {
      await window.api.data.set('pb', 0)
      await window.api.data.set('history', [])
      setPb(0)
      setTestHistory([])
    }
  }, [])

  const resetGame = useCallback((overrides = null) => {
    // Better manual trigger detection
    const isEvent = overrides && (overrides.nativeEvent || overrides instanceof Event)
    const manualData = isEvent || !overrides ? {} : overrides

    resetOverridesRef.current = manualData
    setResetSignal((prev) => prev + 1)
  }, [])

  // Centralized Word Generation Effect
  useEffect(() => {
    if (!isSettingsLoaded) return

    const overrides = resetOverridesRef.current
    const isManual = overrides !== null
    const isInactive = !startTimeRef.current || isFinished
    const hasNotStarted = userInput === ''

    if (!isManual && !isInactive && !hasNotStarted) {
      return
    }

    stopTimer()
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    const s = {
      testMode,
      testLimit,
      hasPunctuation,
      hasNumbers,
      hasCaps,
      isSentenceMode,
      difficulty,
      ...(overrides || {})
    }

    // POLISH: Generate adequate words for the mode.
    // Time mode needs many more words.
    let wordCount = s.testMode === 'words' ? s.testLimit : 100
    // Sentence mode now handles its own difficulty-based counts in words.js

    let ignore = false

    const fetchWords = async () => {
      const newWords =
        s.words ||
        (await generateWords(wordCount, {
          testLimit: wordCount,
          hasPunctuation: s.hasPunctuation,
          hasNumbers: s.hasNumbers,
          hasCaps: s.hasCaps,
          isSentenceMode: s.isSentenceMode,
          difficulty: s.difficulty
        }))

      if (!ignore) {
        setWords([...newWords])
        setWordSetId(Date.now())
        setIsLoading(false)
      }
    }

    setUserInput('')
    setStartTime(null)
    startTimeRef.current = null
    setTimeLeft(s.testLimit)
    setElapsedTime(0)
    setIsFinished(false)
    setIsReplaying(false)
    setIsTimeUp(false)
    keystrokesRef.current = []
    telemetryBufferRef.current.clear()
    setTelemetry([])
    setResults({ wpm: 0, rawWpm: 0, accuracy: 0, errors: 0, duration: 0 })
    setIsTyping(false)

    if (elapsedTimerRef.current) elapsedTimerRef.current.reset()
    lastLineTop.current = -1

    if (wordContainerRef.current) {
      wordContainerRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }

    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.value = ''
        inputRef.current.focus()
      }
    })

    setIsLoading(true)
    fetchWords()

    resetOverridesRef.current = null
    return () => {
      ignore = true
    }
  }, [resetSignal, isSettingsLoaded])

  useEffect(() => {
    latestUserInputRef.current = userInput
  }, [userInput])

  // Auto-reset when mode-level settings change
  useEffect(() => {
    if (!isSettingsLoaded) return
    if (startTimeRef.current !== null) return
    if (userInput !== '') return
    if (isFinished || isReplaying) return

    resetGame()
  }, [testMode, hasPunctuation, hasNumbers, hasCaps, isSentenceMode, difficulty])

  // PRE-CALCULATED WORD MAP (Optimization for Burst Typing)
  const wordMap = useMemo(() => {
    const cleanWords = words.map((w) => w.replace(/[\r\n]/g, ''))
    const targetText = cleanWords.join(' ')
    const wordsArrayTokenized = targetText.split(' ')

    const map = {} // Use object instead of array to avoid Infinity length issue
    let currentPos = 0
    for (let i = 0; i < wordsArrayTokenized.length; i++) {
      const w = wordsArrayTokenized[i]
      const start = currentPos
      const end = start + w.length
      const nextWordStart = i < wordsArrayTokenized.length - 1 ? end + 1 : end + 1 // Use end+1 instead of Infinity

      const info = { index: i, start, end, word: w }
      // Fill map for every character position in this word's range
      for (let p = start; p < nextWordStart; p++) {
        map[p] = info
      }
      currentPos = nextWordStart
    }
    return { map, targetText, wordsArray: wordsArrayTokenized }
  }, [words])

  const handleInput = useCallback(
    (e) => {
      const value = e.target.value
      latestUserInputRef.current = value

      if (isFinished || isReplaying || isPaused) return

      /* Time Mode Soft Finish Logic */
      if (isTimeUp) {
        // If time is up, we wait for the user to finish the current word (space or EOL)
        const lastChar = value[value.length - 1]
        const isWordComplete = lastChar === ' '

        // Also finish if they typed everything
        const totalRequired = words.join(' ').length
        const isAllTyped = value.length >= totalRequired

        if (isWordComplete || isAllTyped) {
          finishTest(value, performance.now())
          return
        }
        // If not complete, LET THEM TYPE (update state below)
      }

      if (isSoundEnabled) {
        const lastChar = value[value.length - 1]
        soundEngine.playKeySound(lastChar === ' ' ? 'space' : 'key')
      }
      setIsTyping(true)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 500)

      const now = performance.now()
      if (!startTime) {
        setStartTime(now)
        startTimeRef.current = now

        // START ELAPSED TIMER (Always needed for telemetry/WPM calculation)
        // Both modes now use an elapsed timer (stopwatch) to ensure the game only ends when typed.
        elapsedTimerRef.current = createElapsedTimer((el) => {
          setElapsedTime(el)
          updateTelemetry(el)
          if (testMode === 'time') {
            // Provide a visual "countdown" for the UI if needed, but no auto-finish
            setTimeLeft(Math.max(0, testLimit - el))
          }
        })

        // Capture initial telemetry immediately
        updateTelemetry(0.001)
        elapsedTimerRef.current.start()
      }

      let finalValue = value
      const nativeEvent = e.nativeEvent
      const isBackspace =
        (nativeEvent && nativeEvent.inputType === 'deleteContentBackward') ||
        value.length < userInput.length
      const lastChar = value[value.length - 1]

      const getWordInfo = (pos) => wordMap.map[pos] || null
      const targetText = wordMap.targetText
      const wordsArray = wordMap.wordsArray

      // 1. BACKSPACE JUMP BACK LOGIC (Req 3, 5 & Caret Precision)
      if (isBackspace) {
        const oldPos = userInput.length
        const info = getWordInfo(oldPos)

        if (info && oldPos === info.start && info.index > 0) {
          const prevIdx = info.index - 1
          const prevWord = wordsArray[prevIdx]
          let prevStart = 0
          for (let k = 0; k < prevIdx; k++) prevStart += wordsArray[k].length + 1

          const typedIncludingPadding = userInput.slice(prevStart, info.start - 1)
          const typedClean = typedIncludingPadding.trimEnd()

          let firstErrorOffset = -1
          const maxCompare = Math.max(typedClean.length, prevWord.length)
          for (let j = 0; j < maxCompare; j++) {
            if (typedClean[j] !== prevWord[j]) {
              firstErrorOffset = j
              break
            }
          }

          const hasMistake = firstErrorOffset !== -1
          const isPadded = typedIncludingPadding.length > prevWord.length

          if (hasMistake || isPadded) {
            // Jump exactly to the first error index + 1 (to be to its right for backspacing)
            // or to the end of the word if no error but padded
            const errorIdx = firstErrorOffset === -1 ? prevWord.length : firstErrorOffset
            const jumpToPos = prevStart + errorIdx + 1

            // Truncate to keep mistakes visible but limit length
            finalValue = userInput.slice(0, Math.min(userInput.length, jumpToPos))

            if (inputRef.current) {
              const el = inputRef.current
              el.value = finalValue
              // Use double-tick to ensure caret is placed correctly after DOM updates
              requestAnimationFrame(() => {
                el.setSelectionRange(jumpToPos, jumpToPos)
              })
            }
          }
        }
      }

      // 2. SPACE SKIPS WRONG WORD LOGIC + WORD COMPLETE SOUND
      if (!isBackspace && lastChar === ' ') {
        const info = getWordInfo(userInput.length)
        
        if (info) {
          const wordTyped = value.slice(info.start, userInput.length)
          const targetWord = info.word

          // Check if word is correct (trim to exclude the space we just typed)
          const isCorrect = wordTyped.trim() === targetWord

          if (wordTyped.length > 0 && !isCorrect) {
            // Word is wrong - pad and skip
            const nextWordStart = info.end + 1
            if (nextWordStart <= targetText.length) {
              const paddedContent = wordTyped
                .slice(0, targetWord.length)
                .padEnd(targetWord.length, ' ')
              finalValue = userInput.slice(0, info.start) + paddedContent + ' '
              if (inputRef.current) {
                inputRef.current.value = finalValue
              }
            }
          } else if (isCorrect) {
            // Word completed correctly!
            soundEngine.playWordCompleteSound()
          }
        }
      }

      keystrokesRef.current.push({ value: finalValue, timestamp: now })

      const totalRequired = words.join(' ').length
      if (finalValue.length >= totalRequired) {
        finishTest(finalValue, now)
      }
      setUserInput(finalValue)
    },
    [
      isFinished,
      isReplaying,
      startTime,
      testMode,
      words,
      userInput,
      finishTest,
      testLimit,
      isSoundEnabled,
      isTimeUp
    ]
  )

  const skipReplay = useCallback(() => {
    if (!isReplaying) return
    if (replayTimeoutRef.current) {
      clearTimeout(replayTimeoutRef.current)
      replayTimeoutRef.current = null
    }
    setIsReplaying(false)
    setIsFinished(true)
    // Set user input to the final value
    if (keystrokesRef.current.length > 0) {
      setUserInput(keystrokesRef.current[keystrokesRef.current.length - 1].value)
    }
  }, [isReplaying])

  const runReplay = useCallback(() => {
    if (keystrokesRef.current.length === 0) return
    stopTimer()
    setIsReplaying(true)
    setUserInput('')
    setIsFinished(false)
    let i = 0
    const playNext = () => {
      const currentKeystrokes = keystrokesRef.current
      if (i >= currentKeystrokes.length) {
        setIsReplaying(false)
        setIsFinished(true)
        return
      }
      const val = currentKeystrokes[i].value
      const prevVal = i > 0 ? currentKeystrokes[i - 1].value : ''

      setUserInput(val)
      if (isSoundEnabled) {
        if (val.length < prevVal.length) {
          soundEngine.playKeySound('backspace')
        } else if (val[val.length - 1] === ' ') {
          soundEngine.playKeySound('space')
        } else {
          soundEngine.playKeySound('key')
        }
      }
      if (i < currentKeystrokes.length - 1) {
        const delay = currentKeystrokes[i + 1].timestamp - currentKeystrokes[i].timestamp
        i++
        replayTimeoutRef.current = setTimeout(playNext, Math.min(delay, 500))
      } else {
        replayTimeoutRef.current = setTimeout(() => {
          setIsReplaying(false)
          setIsFinished(true)
        }, 500)
      }
    }
    playNext()
  }, [stopTimer, isSoundEnabled])

  useEffect(() => {
    const handleKeyDown = (e) => {
      // PRO POLISH: Dont allow typing shortcuts when in Dashboard or Settings
      if (activeTab !== 'typing') return

      const active = document.activeElement
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
      const isOurInput = active === inputRef.current

      // 1. Handle Replay skipping
      if (isReplaying) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault()
          e.stopPropagation()
          skipReplay()
          return
        }
      }

      // 2. Handle Tab for Restart
      if (e.key === 'Tab') {
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
        if (isInput && !isOurInput) return

        e.preventDefault()
        e.stopPropagation()
        console.log('Tab restart')
        resetGame({})
        return
      }

      // 3. Handle ResultsView shortcuts (only if finished and not replaying)
      if (isFinished && !isReplaying) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          resetGame({})
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [resetGame, isReplaying, isFinished, skipReplay, inputRef, activeTab])
  useLayoutEffect(() => {
    if (isFinished) return
    if (!wordContainerRef.current) return

    const container = wordContainerRef.current
    let retryCount = 0
    let retryTimer

    const updateCaret = () => {
      const charIndex = userInput.length
      const target = document.getElementById(`char-${charIndex}`)
      const caret = caretRef.current

      // Ensure target is valid and has actual dimensions before calculating
      if (target && container && target.getBoundingClientRect().width > 0) {
        const containerRect = container.getBoundingClientRect()
        const wordWrapper = container.querySelector('.word-wrapper')
        const targetRect = target.getBoundingClientRect()

        if (!wordWrapper) return
        const wordWrapperRect = wordWrapper.getBoundingClientRect()

        const left = targetRect.left - containerRect.left + container.scrollLeft
        const top_abs = targetRect.top - containerRect.top + container.scrollTop
        const top_rel = targetRect.top - wordWrapperRect.top

        const targetWidth = targetRect.width
        const targetHeight = targetRect.height
        // Increase height slightly and adjust centering to favor the bottom/baseline
        const h = targetHeight * 0.92
        const caretY = top_abs + (targetHeight - h) * 0.8

        const caretWidth = caretStyle === 'block' ? 7 : 2
        const roundedTop = Math.round(top_rel)
        const roundedLeft = Math.round(left)
        const roundedCaretY = Math.round(caretY)
        // Correcting the "above the line" feeling by ensuring we don't snap to sub-pixels
        // and adding a 1px downward nudge to align better with font baselines.
        const finalizedTop = roundedCaretY - 1
        const roundedH = Math.round(h) + 2

        setCaretPos({ left: roundedLeft, top: finalizedTop, height: roundedH, width: caretWidth })

        // Use a much larger buffer and rounded values to prevent line-jitter
        if (Math.abs(roundedTop - activeLineTop) > 20) {
          setActiveLineTop(roundedTop)
          const containerHeight = container.clientHeight
          const containerScrollTop = Math.round(top_abs)

          if (isCenteredScrolling) {
            const targetScroll = containerScrollTop - containerHeight / 2 + targetHeight / 2
            container.scrollTo({ top: targetScroll, behavior: 'auto' })
          } else {
            container.scrollTo({
              top: containerScrollTop - containerHeight * 0.4,
              behavior: 'auto'
            })
          }
        }
      } else if (retryCount < 60) {
        // Increase retry span (1s total) to catch slow mounts or loading states
        retryCount++
        retryTimer = setTimeout(updateCaret, 16)
      }
    }

    // Run IMMEDIATELY to avoid the (0,0) jump
    updateCaret()

    return () => {
      clearTimeout(retryTimer)
    }
  }, [userInput, isFinished, words, caretStyle, isFireCaretEnabled, isCenteredScrolling])
  const liveWpm = useMemo(() => {
    if (!startTime || isFinished || isReplaying) return results.wpm
    const now =
      isPaused && pauseStartTimeRef.current ? pauseStartTimeRef.current : performance.now()
    const diff = (now - startTime) / 60000
    // Don't show WPM for the first 0.5s to avoid erratic jumps
    if (diff < 0.008) return 0
    return Math.round(userInput.length / 5 / diff)
  }, [userInput, startTime, isFinished, isReplaying, isPaused, results.wpm])

  const wordProgress = useMemo(() => {
    // Both modes are now word-mode based
    if (testMode !== 'words' && testMode !== 'time') return null

    let typed = 0
    let charCount = 0

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const isLastWord = i === words.length - 1
      // Word is actively typed if we have enough chars
      const requiredLen = charCount + word.length + (isLastWord ? 0 : 1)

      if (userInput.length >= requiredLen) {
        typed++
        charCount += word.length + 1
      } else {
        break
      }
    }

    return {
      typed,
      total: words.length,
      remaining: Math.max(0, words.length - typed)
    }
  }, [userInput, words, testMode, testLimit])

  return useMemo(
    () => ({
      words,
      userInput,
      startTime,
      isFinished,
      isReplaying,
      results,
      caretRef,
      wordContainerRef,
      inputRef,
      timeLeft,
      elapsedTime,
      resetGame,
      handleInput,
      runReplay,
      liveWpm,
      pb,
      isSoundEnabled,
      setIsSoundEnabled,
      soundProfile,
      setSoundProfile,
      isHallEffect,
      setIsHallEffect,
      telemetry,
      isGhostEnabled,
      setIsGhostEnabled,
      ghostPos,
      isTyping,
      skipReplay,
      testHistory,
      clearAllData,
      ghostSpeed,
      setGhostSpeed,
      wordProgress,
      isLoading,
      activeLineTop,
      caretPos,
      isPaused,
      isManuallyPaused,
      pauseGame,
      resumeGame,
      wordSetId
    }),
    [
      words,
      userInput,
      startTime,
      isFinished,
      isReplaying,
      results,
      timeLeft,
      elapsedTime,
      resetGame,
      handleInput,
      runReplay,
      skipReplay,
      liveWpm,
      pb,
      isSoundEnabled,
      soundProfile,
      isHallEffect,
      telemetry,
      isGhostEnabled,
      ghostPos,
      isTyping,
      testHistory,
      clearAllData,
      ghostSpeed,
      wordProgress,
      isLoading,
      activeLineTop,
      caretPos,
      isPaused,
      isManuallyPaused,
      pauseGame,
      resumeGame,
      wordSetId
    ]
  )
}
