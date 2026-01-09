import { useRef, memo, useEffect } from 'react'
import { motion } from 'framer-motion'
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

const TypingEngine = ({ engine, testMode, testLimit, isSmoothCaret }) => {
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
    isTyping
  } = engine

  // Auto-focus on mount or test start
  useEffect(() => {
    inputRef.current?.focus()
  }, [testMode, testLimit])

  return (
    <div className="typing-canvas" onClick={() => inputRef.current?.focus()}>
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
            {isGhostEnabled && ghostPos.left > 0 && !isFinished && (
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
              animate={{ x: caretPos.left, y: caretPos.top }}
              transition={isSmoothCaret ? { 
                type: 'spring',
                stiffness: 150,
                damping: 20,
                mass: 0.5
              } : { 
                type: 'spring',
                stiffness: 1000,
                damping: 28,
                mass: 0.1
              }}
              style={{ left: 0, top: 0 }}
            />
            <div className="word-wrapper">
              {words.map((word, i) => {
                const startIndex = words.slice(0, i).join(' ').length + (i > 0 ? 1 : 0)
                const isCurrent = userInput.length >= startIndex && userInput.length <= startIndex + word.length
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
