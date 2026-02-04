/**
 * TypingEngine Component
 *
 * Interactive typing surface that renders words/letters, caret(s), captures input, and shows results.
 */
import { memo, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettings } from '../contexts'
import { UI } from '../constants'
import { FastForward } from 'lucide-react'
import ResultsView from '../components/Results/ResultsView'
import './TypingEngine.css'

/**
 * Letter Component
 */
const Letter = memo(({ char, status, active, id, feedbackDisabled, isKineticEnabled }) => {
  const displayStatus = (status === 'incorrect' && feedbackDisabled) ? '' : status
  
  return (
    <motion.span 
      id={id} 
      className={`letter ${displayStatus} ${active ? 'active' : ''}`} 
      aria-label={active ? 'Current typing position' : undefined}
      animate={isKineticEnabled && status === 'correct' ? {
        scale: [1, 1.15, 1],
        y: [0, -4, 0],
        filter: ["brightness(1)", "brightness(2)", "brightness(1)"],
        textShadow: [
          "0 0 0px var(--main-color)",
          "0 0 12px var(--main-color)",
          "0 0 0px var(--main-color)"
        ]
      } : {}}
      transition={{ 
        duration: 0.15,
        times: [0, 0.2, 1],
        ease: "easeOut"
      }}
    >
      {char}
    </motion.span>
  )
})
Letter.displayName = 'Letter'

/**
 * Word Component
 */
const Word = memo(({ word, chunk, isCurrent, startIndex, isErrorFeedbackEnabled, isKineticEnabled }) => {
  const letterStatuses = useMemo(() => {
    return word.split('').map((letter, i) => {
      let status = ''
      if (i < chunk.length && i < word.length) {
        status = chunk[i] === letter ? 'correct' : 'incorrect'
      }
      return { 
        letter, 
        status, 
        charIndex: startIndex + i, 
        isActive: isCurrent && chunk.length === i 
      }
    })
  }, [word, chunk, isCurrent, startIndex])

  const spaceStatus = useMemo(() => {
    if (chunk.length > word.length) {
      return chunk[word.length] === ' ' ? 'correct' : 'incorrect'
    }
    return ''
  }, [chunk, word.length])

  const isSpaceActive = useMemo(() => {
    return isCurrent && chunk.length === word.length
  }, [isCurrent, chunk.length, word.length])

  return (
    <div className={`word ${isCurrent ? 'current' : ''}`} role="text">
      {letterStatuses.map(({ letter, status, charIndex, isActive }, i) => (
        <Letter
          key={i}
          id={`char-${charIndex}`}
          char={letter}
          status={status}
          active={isActive}
          feedbackDisabled={!isErrorFeedbackEnabled}
          isKineticEnabled={isKineticEnabled}
        />
      ))}
      <Letter
        id={`char-${startIndex + word.length}`}
        char={' '}
        status={spaceStatus}
        active={isSpaceActive}
        feedbackDisabled={!isErrorFeedbackEnabled}
        isKineticEnabled={isKineticEnabled}
      />
    </div>
  )
})
Word.displayName = 'Word'

const TypingEngine = ({ 
  engine, 
  testMode, 
  testLimit, 
  isSmoothCaret, 
  isOverlayActive 
}) => {
  const { 
    isSmoothCaret: ctxSmoothCaret, 
    caretStyle, 
    isErrorFeedbackEnabled,
    isKineticEnabled 
  } = useSettings()
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
    skipReplay,
    startTime
  } = engine

  // Focus management
  useEffect(() => {
    if (isOverlayActive) return

    const focusTimer = setTimeout(() => {
      inputRef.current?.focus()
    }, 100)

    const handleGlobalKeyDown = (e) => {
      if (isOverlayActive || e.ctrlKey || e.metaKey || e.altKey) return
      const active = document.activeElement
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
      if (active !== inputRef.current && !isInput) {
        if (e.key.length === 1 || e.key === 'Backspace') {
          inputRef.current?.focus()
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      clearTimeout(focusTimer)
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [isOverlayActive, words])

  // Replay shortcuts
  useEffect(() => {
    if (!isReplaying) return
    const handleReplayKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        skipReplay()
      }
    }
    window.addEventListener('keydown', handleReplayKeyDown)
    return () => window.removeEventListener('keydown', handleReplayKeyDown)
  }, [isReplaying, skipReplay])

  return (
    <div className="typing-canvas" onClick={() => !isOverlayActive && inputRef.current?.focus()}>
      <input
        ref={inputRef}
        type="text"
        className="hidden-input"
        value={userInput}
        onChange={handleInput}
        disabled={isReplaying}
        autoFocus
      />

      <div
        className={`typing-container ${testMode === 'time' ? 'time-mode' : 'words-mode'}`}
        ref={wordContainerRef}
      >
        {!isFinished ? (
          <>
            <AnimatePresence>
              {isReplaying && (
                <motion.button
                  className="skip-replay-btn"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={skipReplay}
                >
                  <FastForward size={16} />
                  <span>Skip Replay</span>
                </motion.button>
              )}
            </AnimatePresence>

            <div className="word-wrapper">
              {isGhostEnabled && startTime && !isFinished && (
                <motion.div
                  className={`caret ghost blinking ${isTyping ? 'typing' : ''}`}
                  animate={{ x: ghostPos.left, y: ghostPos.top }}
                  transition={{ type: 'spring', stiffness: 700, damping: 30 }}
                  style={{ opacity: 0.2, background: 'var(--sub-color)', left: 0, top: 0, height: ghostPos.height, width: ghostPos.width }}
                />
              )}
              
              <motion.div
                className={`caret blinking ${isTyping ? 'typing' : ''}`}
                animate={{
                  x: caretPos.left,
                  y: caretPos.top,
                  height: caretPos.height,
                  width: caretStyle === 'block' ? 7 : 2,
                  opacity: 1
                }}
                transition={smoothCaretEnabled ? {
                  type: 'spring',
                  stiffness: UI.CARET_STIFFNESS_SMOOTH,
                  damping: UI.CARET_DAMPING_SMOOTH,
                  mass: UI.CARET_MASS_SMOOTH,
                  restDelta: 0.1,
                  restSpeed: 10
                } : {
                  duration: 0
                }}
                style={{ 
                  left: 0, 
                  top: 0,
                  mixBlendMode: caretStyle === 'block' ? 'exclusion' : 'normal',
                  borderRadius: caretStyle === 'block' ? '2px' : '1px'
                }}
              />

              {words.map((word, i) => {
                const startIndex = i === 0 
                  ? 0 
                  : words.slice(0, i).join(' ').length + 1
                const isCurrent = userInput.length >= startIndex && userInput.length <= startIndex + word.length
                const chunk = userInput.slice(startIndex, Math.min(startIndex + word.length + 1, userInput.length))
                
                return (
                  <Word
                    key={i}
                    word={word}
                    chunk={chunk}
                    isCurrent={isCurrent}
                    startIndex={startIndex}
                    isErrorFeedbackEnabled={isErrorFeedbackEnabled}
                    isKineticEnabled={isKineticEnabled}
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
