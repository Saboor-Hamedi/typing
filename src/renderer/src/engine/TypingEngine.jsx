/**
 * TypingEngine
 *
 * Purpose:
 * - Interactive typing surface: renders words/letters, caret(s), captures input, and shows results.
 *
 * Key Mechanics:
 * - Hidden input field receives keystrokes; focus is auto-managed (window focus + keydown guards).
 * - Letters are rendered as addressable spans (`#char-{index}`) to compute caret coordinates.
 * - Caret animation uses Framer Motion:
 *   - Smooth mode: spring params defined in UI constants for buttery motion.
 *   - Instant mode: `duration: 0` to avoid bounce or lag.
 * - Ghost caret (optional) replays PB pace for racing, with reduced opacity.
 * - GPU Hint: `.caret` uses `will-change` to improve transform/opacity performance.
 *
 * Props:
 * - `engine`: reactive state/actions from `useEngine` (positions, results, telemetry, etc.).
 * - `isSmoothCaret`: UX toggle; also read from Settings context as a safe fallback.
 * - `isOverlayActive`: disables focus stealing when modals are open.
 */
import { useRef, memo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSettings } from '../contexts'
import { UI } from '../constants'
import ResultsView from '../components/Results/ResultsView'
import './TypingEngine.css'

const Letter = memo(({ char, status, active, id }) => (
  <span id={id} className={`letter ${status} ${active ? 'active' : ''}`}>
    {char}
  </span>
))

const Word = memo(({ word, chunk, isCurrent, startIndex }) => {
  return (
    <div className={`word ${isCurrent ? 'current' : ''}`}>
      {word.split('').map((letter, i) => {
        const charIndex = startIndex + i
        let status = ''
        if (i < chunk.length) {
          status = chunk[i] === letter ? 'correct' : 'incorrect'
        }
        return (
          <Letter
            key={i}
            id={`char-${charIndex}`}
            char={letter}
            status={status}
            active={isCurrent && chunk.length === i}
          />
        )
      })}
      <Letter
        id={`char-${startIndex + word.length}`}
        char={' '}
        status={chunk.length > word.length ?
          (chunk[word.length] === ' ' ? 'correct' : 'incorrect') : ''}
        active={isCurrent && chunk.length === word.length}
      />
    </div>
  )
})

const TypingEngine = ({ engine, testMode, testLimit, isSmoothCaret, isOverlayActive }) => {
  // Fallback to context in case prop wiring fails
  const { isSmoothCaret: ctxSmoothCaret } = useSettings()
  const smoothCaretEnabled = typeof isSmoothCaret === 'boolean' ? isSmoothCaret : ctxSmoothCaret
  const {
    words,
    userInput,
    isFinished,
    isReplaying,
    results,
    caretPos,
    wordContainerRef,
    inputRef,
    resetGame,
    handleInput,
    runReplay,
    telemetry,
    isGhostEnabled,
    setIsGhostEnabled,
    ghostPos,
    isTyping,
    startTime
  } = engine

  // Auto-focus logic to ensure user can type immediately
  useEffect(() => {
    if (isOverlayActive) return // Don't steal focus if a modal is open

    const focusTimer = setTimeout(() => {
      inputRef.current?.focus()
    }, 100)

    // Also focus when the window regained focus
    const handleWindowFocus = () => {
      if (!isOverlayActive) inputRef.current?.focus()
    }
    window.addEventListener('focus', handleWindowFocus)

    // Robust focus: if any key is pressed and not in an input, focus the typing input
    const handleGlobalKeyDown = (e) => {
      if (isOverlayActive) return // Don't steal focus if modal is open

      // Don't intercept if user is trying to use command palette or other shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) return

      // If we're not focused on the input, and it's a typing key, focus it
      const active = document.activeElement
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')

      if (active !== inputRef.current && !isInput) {
        // Simple check for "printable" characters or start typing
        if (e.key.length === 1 || e.key === 'Backspace') {
          inputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)

    return () => {
      clearTimeout(focusTimer)
      window.removeEventListener('focus', handleWindowFocus)
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [testMode, testLimit, words, isFinished, isOverlayActive])

  // --- FIX: Place invisible char--1 span absolutely at the left of the first letter ---
  // Find the first word's first letter span after render and align char--1 to its left/top
  // This ensures caret is visually before the first letter, not at (0,0)
  useEffect(() => {
    const firstLetter = document.getElementById('char-0');
    const startSpan = document.getElementById('char--1');
    if (firstLetter && startSpan) {
      startSpan.style.left = firstLetter.offsetLeft + 'px';
      startSpan.style.top = firstLetter.offsetTop + 'px';
    }
  }, [words]);

  return (
    <div
      className="typing-canvas"
      onClick={() => {
        if (!isOverlayActive) inputRef.current?.focus()
      }}
    >
      <input
        ref={inputRef}
        type="text"
        className="hidden-input"
        value={userInput}
        onChange={handleInput}
        disabled={isReplaying}
        autoFocus
      />

      <div className="typing-container" ref={wordContainerRef}>
        {!isFinished ? (
          <>
            {isGhostEnabled && startTime && !isFinished && (
               <motion.div
                 className={`caret ghost blinking ${isTyping ? 'typing' : ''}`}
                 animate={{ x: ghostPos.left, y: ghostPos.top }}
                  transition={{
                    type: 'spring',
                    stiffness: 700,
                    damping: 30
                  }}
                 style={{ opacity: 0.2, background: 'var(--sub-color)', left: 0, top: 0 }}
               />
            )}
            <motion.div
              className={`caret blinking ${isTyping ? 'typing' : ''}`}
              initial={{ opacity: 0 }}
              animate={{
                x: caretPos.left,
                y: caretPos.top,
                opacity: 1
              }}
              transition={smoothCaretEnabled ? {
                type: 'spring',
                stiffness: UI.CARET_STIFFNESS_SMOOTH,
                damping: UI.CARET_DAMPING_SMOOTH,
                mass: UI.CARET_MASS_SMOOTH,
                restDelta: 0.01
              } : {
                duration: 0
              }}
              style={{ left: 0, top: 0 }}
            />
            <div className="word-wrapper">
              <span id="char--1" style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, pointerEvents: 'none'}} />
              {words.map((word, i) => {
                const startIndex = words.slice(0, i).join(' ').length + (i > 0 ? 1 : 0)
                const isCurrent = userInput.length >= startIndex && userInput.length <= startIndex + word.length + 1
                const chunk = userInput.slice(startIndex, startIndex + word.length + 1)
                return (
                  <Word
                    key={i}
                    word={word}
                    chunk={chunk}
                    isCurrent={isCurrent}
                    startIndex={startIndex}
                  />
                )
              })}
            </div>
          </>
        ) : (
          <ResultsView
            results={results}
            telemetry={telemetry}
            testMode={testMode}
            testLimit={testLimit}
            onRestart={resetGame}
            onReplay={runReplay}
          />
        )}
      </div>
    </div>
  )
}

export default TypingEngine
