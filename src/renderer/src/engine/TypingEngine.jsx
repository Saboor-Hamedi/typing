/**
 * TypingEngine Component
 *
 * Interactive typing surface that renders words/letters, caret(s), captures input, and shows results.
 */
import React, { memo, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettings } from '../contexts/SettingsContext'
import { UI } from '../constants'
import { FastForward, Edit2, Ghost as GhostIcon } from 'lucide-react'
import ResultsView from '../components/Results/ResultsView'
import Loader from '../components/Common/Loader'
import './TypingEngine.css'

/**
 * Letter Component
 */
const Letter = memo(({ char, status, active, id, isKineticEnabled }) => {
  // If no kinetic effect or not active/correct, render simple span
  if (!isKineticEnabled || status !== 'correct') {
    return (
      <span 
        id={id} 
        className={`letter ${status || ''} ${active ? 'active' : ''}`} 
      >
        {char}
      </span>
    )
  }

  // Only use motion for kinetic effects on correct letters
  return (
    <motion.span 
      id={id} 
      className={`letter ${status} ${active ? 'active' : ''}`} 
      initial={{ scale: 1, y: 0 }}
      animate={{
        scale: [1, 1.12, 1],
        y: [0, -2, 0],
        filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
      }}
      transition={{ 
        duration: 0.15,
        times: [0, 0.4, 1],
        ease: "easeOut"
      }}
    >
      {char}
    </motion.span>
  )
}, (prev, next) => {
  // Custom equality check for performance
  return prev.status === next.status && 
         prev.active === next.active && 
         prev.char === next.char &&
         prev.isKineticEnabled === next.isKineticEnabled;
})
Letter.displayName = 'Letter'

const Word = memo(({ word, chunk, isCurrent, startIndex, isErrorFeedbackEnabled, isKineticEnabled, activeLineTop }) => {
  const wordRef = useRef(null)
  // Word dimming logic: 
  // - Past words (above current line): Dimmed
  // - Current/Future words: Bright
  const [isDimmed, setIsDimmed] = useState(false)

  // Memoize letter map creation to simply splitting only when word changes
  const letters = useMemo(() => word.split(''), [word]);

  useLayoutEffect(() => {
    if (wordRef.current && activeLineTop !== undefined) {
       const myTop = wordRef.current.offsetTop
       // ONLY dim if word is significantly ABOVE the active line (past words)
       // This prevents the "typing into the dark" feeling
       const shouldDim = myTop < activeLineTop - 10;
       
       if (isDimmed !== shouldDim) {
         setIsDimmed(shouldDim);
       }
    }
  }, [activeLineTop, isDimmed])

  return (
    <div 
      ref={wordRef}
      className={`word ${isCurrent ? 'current' : ''} ${isDimmed ? 'dimmed' : ''}`} 
    >
      {letters.map((letter, i) => {
        const charIndex = startIndex + i;
        // Logic to determine status moved inline to avoid mapped array overhead
        let status = '';
        if (i < chunk.length) {
            status = chunk[i] === letter ? 'correct' : 'incorrect';
        }
        const isActive = isCurrent && chunk.length === i;
        
        return (
            <Letter
                key={charIndex}
                id={`char-${charIndex}`}
                char={letter}
                status={status}
                active={isActive}
                isKineticEnabled={isKineticEnabled}
            />
        )
      })}
      <Letter
        id={`char-${startIndex + word.length}`}
        char={' '}
        status={chunk.length > word.length ? (chunk[word.length] === ' ' ? 'correct' : 'incorrect') : ''}
        active={isCurrent && chunk.length === word.length}
        isKineticEnabled={isKineticEnabled}
      />
    </div>
  )
}, (prev, next) => {
    // Critical Optimization: ONLY re-render if:
    // 1. This is the CURRENT word (input changing)
    // 2. This was the PREVIOUS word (status changing/finalizing)
    // 3. Global settings changed (kinetic/feedback)
    // 4. Listing position changed (activeLineTop) - though we can debouce this
    
    // If neither is current, and both have same chunk (likely empty or full), skipping render is safe
    if (!prev.isCurrent && !next.isCurrent && prev.chunk === next.chunk && 
        prev.activeLineTop === next.activeLineTop && 
        prev.isKineticEnabled === next.isKineticEnabled) {
        return true;
    }
    return false;
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
    isFireCaretEnabled,
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
    caretRef,
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

        <AnimatePresence>
          {testMode === 'words' && !isFinished && engine.wordProgress && (
            <motion.div 
              key="word-progress"
              className="live-progress-counter"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              <span>{engine.wordProgress.typed}</span><span className="remaining">/{engine.wordProgress.total}</span>
            </motion.div>
          )}
          

        </AnimatePresence>
        {!isFinished ? (
          <>
            {isGhostEnabled && startTime && !isFinished && (
              <motion.div
                className="caret ghost"
                initial={{ x: ghostPos.left, y: ghostPos.top }}
                animate={{ x: ghostPos.left, y: ghostPos.top }}
                transition={{ 
                  x: { type: 'spring', stiffness: 300, damping: 35 },
                  y: { type: 'tween', ease: "easeInOut", duration: 0.12 }
                }}
                style={{ 
                  position: 'absolute', 
                  left: -10, // Center the ghost icon on the caret position
                  top: -5,
                  zIndex: 1,
                  pointerEvents: 'none'
                }}
              >
                <div className="ghost-icon">
                  <GhostIcon size={20} />
                </div>
              </motion.div>
            )}
            
            {smoothCaretEnabled ? (
              <motion.div
                className={`caret blinking ${isTyping ? 'typing' : ''} style-${caretStyle} ${isFireCaretEnabled ? 'style-fire' : ''}`}
                animate={{ 
                  x: engine.caretPos?.left || 0, 
                  y: engine.caretPos?.top || 0,
                  height: engine.caretPos?.height || '1.2em',
                  width: engine.caretPos?.width || (caretStyle === 'block' ? 7 : 2)
                }}
                transition={{
                  type: 'spring',
                  stiffness: UI.CARET_STIFFNESS_SMOOTH,
                  damping: UI.CARET_DAMPING_SMOOTH,
                  mass: UI.CARET_MASS_SMOOTH
                }}
                style={{ 
                  position: 'absolute',
                  left: 0, 
                  top: 0,
                  zIndex: 10,
                  mixBlendMode: caretStyle === 'block' ? 'exclusion' : 'normal',
                  borderRadius: caretStyle === 'block' ? '2px' : '1px'
                }}
              />
            ) : (
              <div
                ref={caretRef}
                className={`caret blinking ${isTyping ? 'typing' : ''} style-${caretStyle} ${isFireCaretEnabled ? 'style-fire' : ''}`}
                style={{ 
                  position: 'absolute',
                  left: 0, 
                  top: 0,
                  zIndex: 10,
                  mixBlendMode: caretStyle === 'block' ? 'exclusion' : 'normal',
                  borderRadius: caretStyle === 'block' ? '2px' : '1px',
                  width: caretStyle === 'block' ? 7 : 2,
                  height: '1.2em'
                }}
              />
            )}

            <div className="word-wrapper">
              <AnimatePresence>
                {isReplaying && (
                  <motion.button
                    className="skip-replay-btn"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={skipReplay}
                    style={{ 
                      position: 'absolute', 
                      top: '-1.5rem', 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      zIndex: 100
                    }}
                  >
                    <FastForward size={16} />
                    <span>Skip Replay <span style={{ opacity: 0.6, fontSize: '0.8em' }}>(Esc / Tab)</span></span>
                  </motion.button>
                )}
              </AnimatePresence>

              {(() => {
                let currentIndex = 0;
                return words.map((wordWithN, i) => {
                  const hasNewline = wordWithN.includes('\n');
                  const word = wordWithN.replace('\n', '');
                  
                  const startIndex = currentIndex;
                  const isCurrent = userInput.length >= startIndex && userInput.length <= startIndex + word.length;
                  const chunk = userInput.length >= startIndex 
                    ? userInput.slice(startIndex, startIndex + word.length + 1)
                    : '';
                  
                  // Update index for next word (word + space)
                  currentIndex += word.length + 1;

                  return (
                    <React.Fragment key={i}>
                      <Word
                        word={word}
                        chunk={chunk}
                        isCurrent={isCurrent}
                        startIndex={startIndex}
                        isErrorFeedbackEnabled={isErrorFeedbackEnabled}
                        isKineticEnabled={isKineticEnabled}
                        activeLineTop={engine.activeLineTop}
                      />
                      {hasNewline && <div style={{ flexBasis: '100%', height: 0 }} />}
                    </React.Fragment>
                  );
                });
              })()}
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
        <AnimatePresence>
          {engine.isLoading && (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                height: '2px',
                width: '100%',
                maxWidth: '600px',
                background: 'var(--bg-color)', 
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                overflow: 'hidden',
                borderRadius: '1px',
                zIndex: 50
              }}
            >
               <motion.div 
                 style={{ 
                   position: 'absolute',
                   top: 0,
                   left: 0,
                   height: '100%',
                   width: '100%',
                   background: 'linear-gradient(90deg, transparent, var(--main-color), transparent)',
                   transform: 'translateX(-100%)'
                 }}
                 animate={{ transform: 'translateX(100%)' }}
                 transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
               />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
 
    </div>
  )
}

export default TypingEngine
