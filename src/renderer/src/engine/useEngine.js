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
import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { generateWords, generateBaseWords, applyModifiers } from '../utils/words';
import { soundEngine } from '../utils/SoundEngine';
import { supabase } from '../utils/supabase';
import { useGhostRacing } from '../hooks/useGhostRacing';
import { useSettings } from '../contexts/SettingsContext';
import { createCountdownTimer, createElapsedTimer } from '../utils/timer';
import { CircularBuffer } from '../utils/helpers';

export function useEngine(testMode, testLimit) {
  const [words, setWords] = useState([]);
  const [baseWords, setBaseWords] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const replayTimeoutRef = useRef(null);
  const [results, setResults] = useState({ wpm: 0, rawWpm: 0, accuracy: 0, errors: 0, duration: 0 });
  const keystrokesRef = useRef([]); // Optimized: Use ref instead of state to avoid re-renders
  const [testHistory, setTestHistory] = useState([]);
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0 });
  const [pb, setPb] = useState(0);
  const [telemetry, setTelemetry] = useState([]);
  const telemetryBufferRef = useRef(new CircularBuffer(50)); // Optimized circular buffer
  const wordContainerRef = useRef(null);
  const inputRef = useRef(null);
  const caretRef = useRef(null); // Ref for direct DOM manipulation of caret position
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(testLimit);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [activeLineTop, setActiveLineTop] = useState(0);
  const [isStoreLoaded, setIsStoreLoaded] = useState(false);


  const typingTimeoutRef = useRef(null);
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
    caretStyle,
    setCaretStyle,
    isFireCaretEnabled,
    setIsFireCaretEnabled,
    isSettingsLoaded
  } = useSettings();

  /* 
   * CRITICAL: Initialize isLoading state based on settings load status.
   * prevents "shuffling" by blocking UI until settings are fully applied.
   */
  const [isLoading, setIsLoading] = useState(!isSettingsLoaded);

  // Time Mode Soft Finish State
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    if (!isSettingsLoaded) {
      setIsLoading(true);
    }
  }, [isSettingsLoaded]);

  const ghostPos = useGhostRacing(
    isGhostEnabled,
    !!startTime && !isFinished,
    startTime,
    pb,
    ghostSpeed,
    words,
    wordContainerRef
  );
  useEffect(() => {
    soundEngine.setProfile(soundProfile);
    soundEngine.setHallEffect(isHallEffect);
  }, [soundProfile, isHallEffect]);
  useEffect(() => {
    const loadPb = async () => {
      try {
        if (window.api && (window.api.settings || window.api.data)) {
          const savedPb = await window.api.data.get('pb') || 0;
          setPb(savedPb);
          const savedHistory = await window.api.data.get('history') || [];
          setTestHistory(savedHistory);
          setIsStoreLoaded(true);
        }
      } catch {
        setIsStoreLoaded(true);
      }
    };
    loadPb();
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownTimerRef.current) {
      countdownTimerRef.current.stop();
      countdownTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      elapsedTimerRef.current.stop();
      elapsedTimerRef.current = null;
    }
  }, []);

  /**
   * Finishes the typing test and calculates results
   * @param {string} finalInput - Final user input
   * @param {number} endTime - End timestamp
   */
  const finishTest = useCallback(async (finalInput, endTime) => {
    try {
      stopTimer();
      const finalStartTime = startTimeRef.current || startTime;

      if (!finalStartTime || endTime <= finalStartTime) {
        console.warn('Invalid timing data, using fallback');
        return;
      }

      const durationInMinutes = (endTime - finalStartTime) / 60000;
      const targetText = words.join(' ');
      let correctChars = 0;
      let errors = 0;

      for (let i = 0; i < finalInput.length; i++) {
        if (finalInput[i] === targetText[i]) {
          correctChars++;
        } else {
          errors++;
        }
      }

      const wpm = Math.max(0, Math.round((correctChars / 5) / durationInMinutes));
      const rawWpm = Math.max(0, Math.round((finalInput.length / 5) / durationInMinutes));
      const accuracy = finalInput.length > 0 ? Math.round((correctChars / finalInput.length) * 100) : 100;
      const durationSeconds = Math.round((endTime - finalStartTime) / 1000);

      const isNewPb = wpm > pb;
      setResults({ wpm, rawWpm, accuracy, errors, duration: durationSeconds, isNewPb });
      setIsFinished(true);

      // Save to local storage
      if (window.api && window.api.data) {
        try {
          const currentPb = (await window.api.data.get('pb')) || 0;
          if (wpm > currentPb) {
            await window.api.data.set('pb', wpm);
            setPb(wpm);
          }
          const currentHistory = (await window.api.data.get('history')) || [];
          const newEntry = { wpm, accuracy, mode: testMode, limit: testLimit, date: new Date().toISOString() };
          const updatedHistory = [newEntry, ...currentHistory].slice(0, 50);
          await window.api.data.set('history', updatedHistory);
          setTestHistory(updatedHistory);
        } catch (storageError) {
          console.error('Failed to save test results locally:', storageError);
        }
      }

      // Sync to cloud (non-blocking, works offline)
      try {
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

        if (isOnline) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (!sessionError && session?.user) {
            const payload = {
              user_id: session.user.id,
              wpm,
              accuracy,
              mode: testMode,
              test_limit: testLimit,
            };

            const { error: insertError } = await supabase.from('scores').insert(payload);

            if (insertError) {
              const fallbackPayload = {
                user_id: session.user.id,
                wpm,
                accuracy,
                mode: `${testMode} ${testLimit}`,
              };
              await supabase.from('scores').insert(fallbackPayload);
            }
          }
        }
      } catch (syncError) {
        if (import.meta.env.DEV) {
          console.warn('Cloud sync failed (non-critical):', syncError);
        }
      }
    } catch (error) {
      console.error('Error finishing test:', error);
      setIsFinished(true);
    }
  }, [startTime, words, stopTimer, testMode, testLimit, pb]);

  const clearAllData = useCallback(async () => {
    if (window.api && window.api.data) {
      await window.api.data.set('pb', 0);
      await window.api.data.set('history', []);
      setPb(0);
      setTestHistory([]);
    }
  }, []);

  const resetGame = useCallback(() => {
    console.log('resetGame called'); 
    stopTimer();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Increase buffer for Time Mode to ensure we don't run out of text
    const wordCount = testMode === 'words' ? testLimit : 50;
    
    try {
      // Always generate new words (Full Reset as requested)
      setWords(generateWords(wordCount, {
        hasPunctuation,
        hasNumbers,
        hasCaps,
        isSentenceMode
      }));
    } catch (err) {
      console.error('Word generation failed:', err);
      setWords(['system', 'error', 'please', 'check', 'settings']);
    }

    setUserInput('');
    setStartTime(null);
    startTimeRef.current = null;
    setTimeLeft(testLimit);
    setElapsedTime(0);
    setIsFinished(false);
    setIsReplaying(false);
    setIsTimeUp(false); // Reset soft finish flag
    keystrokesRef.current = [];
    telemetryBufferRef.current.clear();
    setTelemetry([]);
    setResults({ wpm: 0, rawWpm: 0, accuracy: 0, errors: 0, duration: 0 });
    setIsTyping(false);

    if (countdownTimerRef.current) {
      countdownTimerRef.current.reset(testLimit);
    }
    if (elapsedTimerRef.current) {
      elapsedTimerRef.current.reset();
    }
    
    // ... (rest of reset logic) ...
    lastLineTop.current = -1;

    if (wordContainerRef.current) {
      wordContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }

    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.value = ''; 
        inputRef.current.focus();
      }
    });

    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 400);
  }, [testMode, testLimit, stopTimer, hasPunctuation, hasNumbers, hasCaps, isSentenceMode]);

  const latestUserInputRef = useRef('');

  useEffect(() => {
    latestUserInputRef.current = userInput;
  }, [userInput]);

  useEffect(() => {
    // HARDENED AUTO-RESET
    
    if (!isSettingsLoaded) return;
    if (startTimeRef.current !== null) return;
    if (latestUserInputRef.current !== '') return;
    if (isFinished || isReplaying) return;

    // Full reset on any dependency change
    console.log('Safe Auto-reset triggered');
    resetGame();
  }, [
    isSettingsLoaded, 
    testMode, 
    testLimit, 
    hasPunctuation, 
    hasNumbers, 
    hasCaps,
    isSentenceMode
  ]);

  const handleInput = useCallback((e) => {
    const value = e.target.value;
    latestUserInputRef.current = value;

    if (isFinished || isReplaying) return;
    
    /* Time Mode Soft Finish Logic */
    if (isTimeUp) {
       // If time is up, we wait for the user to finish the current word (space or EOL)
       const lastChar = value[value.length - 1];
       const isWordComplete = lastChar === ' ';
       
       // Also finish if they typed everything
       const totalRequired = words.join(' ').length;
       const isAllTyped = value.length >= totalRequired;

       if (isWordComplete || isAllTyped) {
          finishTest(value, performance.now());
          return;
       }
       // If not complete, LET THEM TYPE (update state below)
    }

    if (isSoundEnabled) {
      const lastChar = value[value.length - 1];
      soundEngine.playKeySound(lastChar === ' ' ? 'space' : 'key');
    }
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 500);
    
    const now = performance.now();
    if (!startTime) {
      setStartTime(now);
      startTimeRef.current = now;

      if (testMode === 'time') {
        setTimeLeft(testLimit);
        setIsTimeUp(false);

        countdownTimerRef.current = createCountdownTimer(
          testLimit,
          (remaining, elapsed) => {
            setTimeLeft(remaining);
            // ... telemetry ...
            if (elapsed > 0) {
                 const durationInMin = elapsed / 60;
                 const currentInput = inputRef.current?.value || '';
                 const currentRaw = Math.round((currentInput.length / 5) / durationInMin) || 0;
                 const targetText = words.join(' ');
                 let correctChars = 0;
                 for (let i = 0; i < currentInput.length; i++) {
                   if (currentInput[i] === targetText[i]) correctChars++;
                 }
                 const currentWpm = Math.round((correctChars / 5) / durationInMin) || 0;
                 telemetryBufferRef.current.push({ sec: elapsed, wpm: currentWpm, raw: currentRaw });
                 setTelemetry(telemetryBufferRef.current.toArray());
            }
          },
          () => {
            // Timer Finished Callback
            // DO NOT finishTest immediately. Set flags.
            setIsTimeUp(true);
            
            // OPTIONAL: If user is IDLE (not typing), finish immediately?
            // For now, simple logic: Set Time Up, wait for input check.
            
            // Actually, if the user stops typing exactly when time is up, we might never finish?
            // We should check if the last char was a space?
            // Or just check if we should finish NOW.
            
            const currentVal = inputRef.current?.value || '';
            const lastChar = currentVal[currentVal.length - 1];
            if (lastChar === ' ' || currentVal.length === 0) {
               finishTest(currentVal, performance.now());
            }
          }
        );
        countdownTimerRef.current.start();
      }

      // ... (elapsed timer) ...
      elapsedTimerRef.current = createElapsedTimer((elapsed) => {
          setElapsedTime(elapsed);
          // ... telemetry (same) ...
          const durationInMin = elapsed / 60;
          const currentInput = inputRef.current?.value || '';
          const currentRaw = Math.round((currentInput.length / 5) / durationInMin) || 0;
          const targetText = words.join(' ');
          let correctChars = 0;
          for (let i = 0; i < currentInput.length; i++) {
             if (currentInput[i] === targetText[i]) correctChars++;
          }
          const currentWpm = Math.round((correctChars / 5) / durationInMin) || 0;
          telemetryBufferRef.current.push({ sec: elapsed, wpm: currentWpm, raw: currentRaw });
          setTelemetry(telemetryBufferRef.current.toArray());
      });
      elapsedTimerRef.current.start();
    }
    
    keystrokesRef.current.push({ value, timestamp: now });
    
    if (testMode === 'words') {
      const totalRequired = words.join(' ').length;
      if (value.length >= totalRequired) {
        finishTest(value, now);
      }
    }
    setUserInput(value);
  }, [isFinished, isReplaying, startTime, testMode, words, finishTest, testLimit, isSoundEnabled, isTimeUp]);

  const skipReplay = useCallback(() => {
    if (!isReplaying) return;
    if (replayTimeoutRef.current) {
      clearTimeout(replayTimeoutRef.current);
      replayTimeoutRef.current = null;
    }
    setIsReplaying(false);
    setIsFinished(true);
    // Set user input to the final value
    if (keystrokesRef.current.length > 0) {
      setUserInput(keystrokesRef.current[keystrokesRef.current.length - 1].value);
    }
  }, [isReplaying]);

  const runReplay = useCallback(() => {
    if (keystrokesRef.current.length === 0) return;
    stopTimer();
    setIsReplaying(true);
    setUserInput('');
    setIsFinished(false);
    let i = 0;
    const playNext = () => {
      const currentKeystrokes = keystrokesRef.current;
      if (i >= currentKeystrokes.length) {
        setIsReplaying(false);
        setIsFinished(true);
        return;
      }
      const val = currentKeystrokes[i].value;
      setUserInput(val);
      if (isSoundEnabled) {
        soundEngine.playKeySound(val[val.length - 1] === ' ' ? 'space' : 'key');
      }
      if (i < currentKeystrokes.length - 1) {
        const delay = currentKeystrokes[i+1].timestamp - currentKeystrokes[i].timestamp;
        i++;
        replayTimeoutRef.current = setTimeout(playNext, Math.min(delay, 500));
      } else {
        replayTimeoutRef.current = setTimeout(() => {
          setIsReplaying(false);
          setIsFinished(true);
        }, 500);
      }
    };
    playNext();
  }, [stopTimer, isSoundEnabled]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
      const isOurInput = active === inputRef.current;

      // 1. Handle Replay skipping
      if (isReplaying) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          e.stopPropagation();
          skipReplay();
          return;
        }
      }

      // 2. Handle Tab for Restart
      if (e.key === 'Tab') {
        // Don't restart if modifiers are held (e.g. Alt+Tab, Ctrl+Tab)
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

        // Don't restart if user is typing in a different input (like theme search)
        if (isInput && !isOurInput) return;
        
        e.preventDefault();
        e.stopPropagation();
        resetGame();
        return;
      }

      // 3. Handle ResultsView shortcuts (only if finished and not replaying)
      if (isFinished && !isReplaying) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          resetGame();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Use capture to handle it before others
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [resetGame, isReplaying, isFinished, skipReplay]);
  const lastLineTop = useRef(-1);
  useLayoutEffect(() => {
    if (isFinished) return;
    if (!wordContainerRef.current) return;

    const container = wordContainerRef.current;
    let retryCount = 0;
    let retryTimer;

    const updateCaret = () => {
      const charIndex = userInput.length;
      const target = document.getElementById(`char-${charIndex}`);
      const caret = caretRef.current;
      
      if (target && container) {
        const containerRect = container.getBoundingClientRect();
        const wordWrapper = container.querySelector('.word-wrapper');
        const targetRect = target.getBoundingClientRect();
        
        if (!wordWrapper) return;
        const wordWrapperRect = wordWrapper.getBoundingClientRect();
        
        const left = targetRect.left - containerRect.left + container.scrollLeft;
        const top_abs = targetRect.top - containerRect.top + container.scrollTop;
        const top_rel = targetRect.top - wordWrapperRect.top;
        
        const targetWidth = targetRect.width;
        const targetHeight = targetRect.height;
        const h = targetHeight * 0.85; 
        const caretY = top_abs + (targetHeight - h) / 2;
        
        const caretWidth = caretStyle === 'block' ? 7 : 2;
        const roundedTop = Math.round(top_rel);
        const roundedLeft = Math.round(left);
        const roundedCaretY = Math.round(caretY);
        const roundedH = Math.round(h);

        setCaretPos({ left: roundedLeft, top: roundedCaretY, height: roundedH, width: caretWidth });

        if (caret) {
          caret.style.transform = `translate3d(${roundedLeft}px, ${roundedCaretY}px, 0)`;
          caret.style.height = `${roundedH}px`;
          caret.style.width = `${caretWidth}px`;
        }
        
        // Use a much larger buffer and rounded values to prevent line-jitter
        if (Math.abs(roundedTop - activeLineTop) > 25) { 
          setActiveLineTop(roundedTop);
          const containerHeight = container.clientHeight;
          const containerScrollTop = Math.round(top_abs);
          
          if (isCenteredScrolling) {
            const targetScroll = containerScrollTop - (containerHeight / 2) + (targetHeight / 2);
            container.scrollTo({ top: targetScroll, behavior: 'auto' });
          } else {
            container.scrollTo({ top: containerScrollTop - (containerHeight * 0.4), behavior: 'auto' });
          }
        }
      } else if (retryCount < 30) {
        // Retry logic: If target isn't found, it might be due to a reset or rapid line wrap.
        // We avoid snap-resetting to (0,0) by doing nothing and retrying.
        retryCount++;
        retryTimer = setTimeout(updateCaret, 16);
      }
    };

    // Run IMMEDIATELY to avoid the (0,0) jump
    updateCaret();

    // Also run in a frame to catch flexbox settling
    const frame = requestAnimationFrame(updateCaret);
    
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(retryTimer);
    };
  }, [userInput, isFinished, words, caretStyle, isFireCaretEnabled, isCenteredScrolling]);
  const liveWpm = useMemo(() => {
    if (!startTime || isFinished || isReplaying) return results.wpm;
    const now = performance.now();
    const diff = (now - startTime) / 60000;
    if (diff <= 0) return 0;
    return Math.round((userInput.length / 5) / diff);
  }, [userInput, startTime, isFinished, isReplaying, results.wpm]);

  const wordProgress = useMemo(() => {
    if (testMode !== 'words') return { typed: 0, remaining: 0, total: 0 };
    
    let typed = 0;
    let charCount = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const isLastWord = i === words.length - 1;
      // Word is actively typed if we have enough chars
      const requiredLen = charCount + word.length + (isLastWord ? 0 : 1);
      
      if (userInput.length >= requiredLen) {
        typed++;
        charCount += word.length + 1;
      } else {
        break;
      }
    }

    return {
      typed,
      total: words.length,
      remaining: Math.max(0, words.length - typed)
    };
  }, [userInput, words, testMode, testLimit]);

  return useMemo(() => ({
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
    caretPos
  }), [
    words, userInput, startTime, isFinished, isReplaying, results, 
    timeLeft, elapsedTime, resetGame, handleInput, runReplay, skipReplay, liveWpm, pb,
    isSoundEnabled, soundProfile, isHallEffect, telemetry,
    isGhostEnabled, ghostPos, isTyping, testHistory, clearAllData,
    ghostSpeed, wordProgress, isLoading, activeLineTop, caretPos
  ]);
}
