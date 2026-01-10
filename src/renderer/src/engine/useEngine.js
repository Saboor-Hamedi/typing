/**
 * useEngine
 *
 * Purpose:
 * - Core typing game state machine and telemetry pipeline.
 *
 * State & Persistence:
 * - Tracks words, userInput, timings, caretPos, PB, history, telemetry.
 * - Loads/saves PB and history via Electron stores (`data`), and feature toggles via `settings`.
 * - Saves each finished test to local history and inserts to Supabase when logged in.
 *
 * Caret & Scrolling:
 * - Computes caret coordinates by measuring active letter spans.
 * - Maintains a "horizon" scroll (≈40% of container height) when changing lines.
 * - When the current target is a space, caret snaps to the previous glyph edge to avoid a visible gap.
 *
 * Returns:
 * - A memoized bag with reactive fields and actions consumed by TypingEngine and UI.
 */
import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react'
import { generateWords } from '../utils/words'
import { soundEngine } from '../utils/SoundEngine'
import { supabase } from '../utils/supabase'
import { useGhostRacing } from '../hooks/useGhostRacing'
import { useSettings } from '../contexts'

export const useEngine = (testMode, testLimit) => {
  const [words, setWords] = useState([])
  const [userInput, setUserInput] = useState('')
  const [startTime, setStartTime] = useState(null)
  const [isFinished, setIsFinished] = useState(false)
  const [isReplaying, setIsReplaying] = useState(false)
  const [results, setResults] = useState({ wpm: 0, rawWpm: 0, accuracy: 0, errors: 0 })
  const [keystrokes, setKeystrokes] = useState([])
  const [testHistory, setTestHistory] = useState([])
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0 })
  const [pb, setPb] = useState(0)
  const [telemetry, setTelemetry] = useState([]) // [{ sec, wpm, raw, errors }]

  const wordContainerRef = useRef(null)
  const inputRef = useRef(null)
  const startTimeRef = useRef(null)
  const timerRef = useRef(null)
  const [timeLeft, setTimeLeft] = useState(testLimit)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [soundProfile, setSoundProfile] = useState('thocky')
  const [isHallEffect, setIsHallEffect] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [isStoreLoaded, setIsStoreLoaded] = useState(false)
  const typingTimeoutRef = useRef(null)

  // Get ghost settings from context
  const { isGhostEnabled, setIsGhostEnabled, ghostSpeed, setGhostSpeed } = useSettings()

  // Use optimized ghost racing hook
  const ghostPos = useGhostRacing(
    isGhostEnabled,
    !!startTime && !isFinished,
    startTime,
    pb,
    ghostSpeed,
    words,
    wordContainerRef
  )

  // Sync and Persistent Savings
  useEffect(() => {
    soundEngine.setProfile(soundProfile)
    soundEngine.setHallEffect(isHallEffect)
    
    // Only save to store IF we have already loaded the initial values
    // This prevents overwriting user settings with defaults on boot
    if (window.api && window.api.settings && isStoreLoaded) {
      window.api.settings.set('isGhostEnabled', isGhostEnabled)
      window.api.settings.set('isSoundEnabled', isSoundEnabled)
      window.api.settings.set('isHallEffect', isHallEffect)
      window.api.settings.set('ghostSpeed', ghostSpeed)
    }
  }, [soundProfile, isHallEffect, isGhostEnabled, isSoundEnabled, isStoreLoaded, ghostSpeed])

  // Load PB on mount
  useEffect(() => {
    const loadPb = async () => {
      try {
        if (window.api && (window.api.settings || window.api.data)) {
          // Load from Data Store (PB, History)
          const savedPb = await window.api.data.get('pb') || 0
          setPb(savedPb)
          
          const savedHistory = await window.api.data.get('history') || []
          setTestHistory(savedHistory)

          // Load from Settings Store (Toggles)
          const savedGhost = await window.api.settings.get('isGhostEnabled')
          if (savedGhost !== undefined) setIsGhostEnabled(savedGhost)

          const savedSound = await window.api.settings.get('isSoundEnabled')
          if (savedSound !== undefined) setIsSoundEnabled(savedSound)

          const savedHall = await window.api.settings.get('isHallEffect')
          if (savedHall !== undefined) setIsHallEffect(savedHall)

          const savedSpeed = await window.api.settings.get('ghostSpeed')
          if (savedSpeed !== undefined) setGhostSpeed(savedSpeed)

          setIsStoreLoaded(true)
        }
      } catch (err) {
        console.warn('Failed to load PB from store:', err)
        setIsStoreLoaded(true) // Set to true anyway so we can start saving
      }
    }
    loadPb()
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const finishTest = useCallback(async (finalInput, endTime) => {
    stopTimer()
    const finalStartTime = startTimeRef.current || startTime
    const durationInMinutes = (endTime - finalStartTime) / 60000
    const targetText = words.join(' ')
    let correctChars = 0
    let errors = 0
    
    for (let i = 0; i < finalInput.length; i++) {
       if (finalInput[i] === targetText[i]) {
         correctChars++
       } else {
         errors++
       }
    }

    const wpm = Math.max(0, Math.round((correctChars / 5) / durationInMinutes))
    const rawWpm = Math.max(0, Math.round((finalInput.length / 5) / durationInMinutes))
    const accuracy = finalInput.length > 0 ? Math.round((correctChars / finalInput.length) * 100) : 100

    setResults({ wpm, rawWpm, accuracy, errors })
    setIsFinished(true)

    // Check and save PB & History to DATA store
    if (window.api && window.api.data) {
      const currentPb = await window.api.data.get('pb') || 0
      if (wpm > currentPb) {
        window.api.data.set('pb', wpm)
        setPb(wpm)
      }

      // Save to History
      const currentHistory = await window.api.data.get('history') || []
      const newEntry = { wpm, accuracy, mode: testMode, limit: testLimit, date: new Date().toISOString() }
      const updatedHistory = [newEntry, ...currentHistory].slice(0, 50)
      window.api.data.set('history', updatedHistory)
      setTestHistory(updatedHistory)
    }

    // CLOUD SYNC: Save to Supabase if logged in
    try {
      // Use getSession().session.user for a non-blocking check
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Prefer normalized columns: mode ('time'|'words') + test_limit (number)
        const payload = {
          user_id: session.user.id,
          wpm,
          accuracy,
          mode: testMode,
          test_limit: testLimit,
        }

        let insertError = null
        const { error } = await supabase.from('scores').insert(payload)
        insertError = error

        // Fallback for legacy schemas without `test_limit` column
        if (insertError) {
          console.warn('Primary cloud save failed, attempting legacy fallback:', insertError.message)
          await supabase.from('scores').insert({
            user_id: session.user.id,
            wpm,
            accuracy,
            // Encode limit into mode string for older tables (e.g., "time 60")
            mode: `${testMode} ${testLimit}`,
          })
        }
      }
    } catch (err) {
      console.warn('Cloud save skipped/failed (Offline or Sess Expired)');
    }
  }, [startTime, words, stopTimer, testMode, testLimit])

  const clearAllData = useCallback(async () => {
    if (window.api && window.api.data) {
      await window.api.data.set('pb', 0)
      await window.api.data.set('history', [])
      setPb(0)
      setTestHistory([])
    }
  }, [])

  const resetGame = useCallback(() => {
    stopTimer()
    const wordCount = testMode === 'words' ? testLimit : Math.max(100, testLimit * 4)
    setWords(generateWords(wordCount))
    setUserInput('')
    setStartTime(null)
    startTimeRef.current = null
    setTimeLeft(testLimit)
    setIsFinished(false)
    setIsReplaying(false)
    setKeystrokes([])
    setTelemetry([])
    setResults({ wpm: 0, rawWpm: 0, accuracy: 0, errors: 0 })
    if (inputRef.current) inputRef.current.focus()
  }, [testMode, testLimit, stopTimer])

  useEffect(() => {
    resetGame()
  }, [resetGame])

  const handleInput = useCallback((e) => {
    const value = e.target.value
    if (isFinished || isReplaying) return

    // Play Sound
    if (isSoundEnabled) {
      const lastChar = value[value.length - 1]
      soundEngine.playKeySound(lastChar === ' ' ? 'space' : 'key')
    }

    // Handle Typing State (for caret solid visibility)
    setIsTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 500)

    const now = performance.now()
    if (!startTime) {
      setStartTime(now)
      startTimeRef.current = now
      
      timerRef.current = setInterval(() => {
        const elapsedSec = Math.round((performance.now() - startTimeRef.current) / 1000)
        if (elapsedSec <= 0) return

        const durationInMin = elapsedSec / 60
        const currentInput = inputRef.current?.value || ''
        const currentRaw = Math.round((currentInput.length / 5) / durationInMin) || 0
        
        // Calculate Net WPM live
        const targetText = words.join(' ')
        let correctChars = 0
        for (let i = 0; i < currentInput.length; i++) {
           if (currentInput[i] === targetText[i]) correctChars++
        }
        const currentWpm = Math.round((correctChars / 5) / durationInMin) || 0

        setTelemetry(t => [...t, { sec: elapsedSec, wpm: currentWpm, raw: currentRaw }])

        if (testMode === 'time') {
          setTimeLeft(prev => {
            if (prev <= 1) {
              finishTest(inputRef.current?.value || '', performance.now())
              return 0
            }
            return prev - 1
          })
        }
      }, 1000)
    }

    setKeystrokes(prev => [...prev, { value, timestamp: now }])

    if (testMode === 'words') {
      const totalRequired = words.join(' ').length
      if (value.length >= totalRequired) {
        finishTest(value, now)
      }
    }

    setUserInput(value)
  }, [isFinished, isReplaying, startTime, testMode, words, finishTest, testLimit, isSoundEnabled])

  const runReplay = useCallback(() => {
    if (keystrokes.length === 0) return
    stopTimer()
    setIsReplaying(true)
    setUserInput('')
    setIsFinished(false)
    
    let i = 0
    const playNext = () => {
      if (i >= keystrokes.length) {
        setIsReplaying(false)
        setIsFinished(true)
        return
      }
      
      const val = keystrokes[i].value
      setUserInput(val)
      
      // Play sound in replay too!
      if (isSoundEnabled) {
        soundEngine.playKeySound(val[val.length - 1] === ' ' ? 'space' : 'key')
      }
      
      if (i < keystrokes.length - 1) {
        const delay = keystrokes[i+1].timestamp - keystrokes[i].timestamp
        i++
        setTimeout(playNext, Math.min(delay, 500))
      } else {
        setTimeout(() => {
          setIsReplaying(false)
          setIsFinished(true)
        }, 500)
      }
    }
    
    playNext()
  }, [keystrokes, stopTimer, isSoundEnabled])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        // PROTECTION: Don't intercept Tab if user is typing in a modal or other input
        const active = document.activeElement
        const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
        const isOurInput = active === inputRef.current
        
        if (isInput && !isOurInput) return

        e.preventDefault()
        resetGame()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [resetGame])

  // Position & Scroll Logic (Synchronous for zero-latency feel)
  const lastLineTop = useRef(-1)
  
  // Initial position mount or word refresh
  useLayoutEffect(() => {
    if (words.length > 0 && userInput.length === 0) {
      const activeLetter = document.getElementById('char-0')
      if (activeLetter) {
        setCaretPos({ left: activeLetter.offsetLeft, top: activeLetter.offsetTop })
      }
    }
  }, [words])

  useLayoutEffect(() => {
    if (isFinished) return
    const charIndex = userInput.length
    const activeLetter = document.getElementById(`char-${charIndex}`)
    
    if (activeLetter && wordContainerRef.current) {
      // Prefer placing caret flush against the previous character
      // when the current target is a space. This avoids a visible gap
      // that looks like an extra space to the user.
      let top
      let left
      if (activeLetter.textContent === ' ' && charIndex > 0) {
        const prev = document.getElementById(`char-${charIndex - 1}`)
        if (prev) {
          top = prev.offsetTop
          // Place caret flush to the previous glyph's trailing edge to visually ignore the space
          left = prev.offsetLeft + prev.offsetWidth - 1
        } else {
          top = activeLetter.offsetTop
          left = activeLetter.offsetLeft
        }
      } else {
        // INTRINSIC COORDINATES (Zero lag, scroll-stable)
        top = activeLetter.offsetTop
        left = activeLetter.offsetLeft
      }
      
      const newPos = { left, top }
      setCaretPos(newPos)

      // SMOOTH LINE-BY-LINE HORIZON LOCK
      if (top !== lastLineTop.current) {
        const container = wordContainerRef.current
        const containerHeight = container.clientHeight
        
        // Target: Keep the current line at a comfortable 40% "Horizon"
        const targetScroll = top - (containerHeight * 0.4)
        
        container.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        })
        
        lastLineTop.current = top
      }
    } else if (userInput.length === 0 && wordContainerRef.current) {
      wordContainerRef.current.scrollTo({ top: 0, behavior: 'instant' })
      lastLineTop.current = -1
    }
  }, [userInput, isFinished])

  const liveWpm = useMemo(() => {
    if (!startTime || isFinished || isReplaying) return results.wpm
    const now = performance.now()
    const diff = (now - startTime) / 60000
    if (diff <= 0) return 0
    return Math.round((userInput.length / 5) / diff)
  }, [userInput, startTime, isFinished, isReplaying, results.wpm])

  return useMemo(() => ({
    words,
    userInput,
    startTime,
    isFinished,
    isReplaying,
    results,
    caretPos,
    wordContainerRef,
    inputRef,
    timeLeft,
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
    setIsGhostEnabled, // From context
    ghostPos,
    isTyping,
    testHistory,
    clearAllData,
    ghostSpeed,
    setGhostSpeed
  }), [
    words, userInput, startTime, isFinished, isReplaying, results, caretPos, 
    timeLeft, resetGame, handleInput, runReplay, liveWpm, pb, 
    isSoundEnabled, soundProfile, isHallEffect, telemetry, 
    isGhostEnabled, ghostPos, isTyping, testHistory, clearAllData,
    ghostSpeed
  ])
}
