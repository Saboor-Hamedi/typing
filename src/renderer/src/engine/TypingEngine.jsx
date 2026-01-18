/**
 * TypingEngine Component
 *
 * Interactive typing surface that renders words/letters, caret(s), captures input, and shows results.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.engine - Engine state and actions from useEngine hook
 * @param {string[]} props.engine.words - Array of words to type
 * @param {string} props.engine.userInput - Current user input
 * @param {boolean} props.engine.isFinished - Whether the test is finished
 * @param {boolean} props.engine.isReplaying - Whether replay is active
 * @param {Object} props.engine.results - Test results (wpm, accuracy, errors)
 * @param {Object} props.engine.caretPos - Caret position {left, top}
 * @param {React.RefObject} props.engine.wordContainerRef - Ref to word container
 * @param {React.RefObject} props.engine.inputRef - Ref to hidden input
 * @param {Function} props.engine.resetGame - Function to reset the game
 * @param {Function} props.engine.handleInput - Function to handle input changes
 * @param {Function} props.engine.runReplay - Function to run replay
 * @param {Array} props.engine.telemetry - Telemetry data array
 * @param {boolean} props.engine.isGhostEnabled - Whether ghost caret is enabled
 * @param {Object} props.engine.ghostPos - Ghost caret position {left, top}
 * @param {boolean} props.engine.isTyping - Whether user is currently typing
 * @param {number|null} props.engine.startTime - Test start timestamp
 * @param {string} props.testMode - Test mode: 'time' or 'words'
 * @param {number} props.testLimit - Test limit (seconds or word count)
 * @param {boolean} [props.isSmoothCaret] - Enable smooth caret animation (optional)
 * @param {boolean} [props.isOverlayActive] - Whether a modal/overlay is active (optional)
 *
 * @example
 * ```jsx
 * <TypingEngine
 *   engine={engineState}
 *   testMode="words"
 *   testLimit={25}
 *   isOverlayActive={false}
 * />
 * ```
 */
import { memo, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useSettings } from '../contexts'
import { UI } from '../constants'
import ResultsView from '../components/Results/ResultsView'
import './TypingEngine.css'

/**
 * Letter Component
 * Renders a single character with visual feedback for typing status
 * @param {Object} props - Component props
 * @param {string} props.char - The character to display
 * @param {string} props.status - Status: 'correct', 'incorrect', or ''
 * @param {boolean} props.active - Whether this is the active caret position
 * @param {string} props.id - Unique DOM ID for caret positioning
 */
const Letter = memo(({ char, status, active, id }) => (
  <span id={id} className={`letter ${status} ${active ? 'active' : ''}`} aria-label={active ? 'Current typing position' : undefined}>
    {char}
  </span>
))
Letter.displayName = 'Letter'

/**
 * Word Component
 * Renders a word with individual letter feedback and space character
 * @param {Object} props - Component props
 * @param {string} props.word - The target word to display
 * @param {string} props.chunk - User input for this word (may include trailing space)
 * @param {boolean} props.isCurrent - Whether this is the currently active word
 * @param {number} props.startIndex - Starting character index in the full text
 */
const Word = memo(({ word, chunk, isCurrent, startIndex }) => {
  // Memoize letter statuses to avoid recalculation
  const letterStatuses = useMemo(() => {
    return word.split('').map((letter, i) => {
      let status = ''
      if (i < chunk.length && i < word.length) {
        status = chunk[i] === letter ? 'correct' : 'incorrect'
      }
      return { letter, status, charIndex: startIndex + i, isActive: isCurrent && chunk.length === i }
    })
  }, [word, chunk, isCurrent, startIndex])

  // Memoize space status
  const spaceStatus = useMemo(() => {
    if (chunk.length > word.length) {
      return chunk[word.length] === ' ' ? 'correct' : 'incorrect'
    }
    return ''
  }, [chunk, word.length])

  const isSpaceActive = useMemo(() => {
    return isCurrent && chunk.length === word.length + 1 && chunk[word.length] === ' '
  }, [isCurrent, chunk.length, word.length, chunk])

  return (
    <div className={`word ${isCurrent ? 'current' : ''}`} role="text" aria-label={isCurrent ? `Current word: ${word}` : undefined}>
      {letterStatuses.map(({ letter, status, charIndex, isActive }, i) => (
        <Letter
          key={i}
          id={`char-${charIndex}`}
          char={letter}
          status={status}
          active={isActive}
        />
      ))}
      <Letter
        id={`char-${startIndex + word.length}`}
        char={' '}
        status={spaceStatus}
        active={isSpaceActive}
      />
    </div>
  )
})
Word.displayName = 'Word'

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
        aria-label="Typing input field"
        aria-live="polite"
        aria-atomic="true"
      />

      <div
        className={`typing-container ${testMode === 'time' ? 'time-mode' : 'words-mode'}`}
        ref={wordContainerRef}
        role="textbox"
        aria-label={`Typing test: ${testMode} mode, ${testLimit} ${testMode === 'time' ? 'seconds' : 'words'}`}
        aria-live="polite"
      >
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
                restDelta: 0.005, // Finer precision for smoother settling
                velocity: 0 // Start from rest for smoother initial movement
              } : {
                duration: 0
              }}
              style={{ left: 0, top: 0 }}
            />
            <div className="word-wrapper">
              <span id="char--1" style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, pointerEvents: 'none'}} />
              {words.map((word, i) => {
                // Calculate startIndex: sum of previous words + spaces between them
                const startIndex = i === 0
                  ? 0
                  : words.slice(0, i).join(' ').length + 1
                const isCurrent = userInput.length >= startIndex && userInput.length <= startIndex + word.length + 1
                // Extract the chunk for this word (word + space)
                const chunk = userInput.slice(startIndex, Math.min(startIndex + word.length + 1, userInput.length))
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
