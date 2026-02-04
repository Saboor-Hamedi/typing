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
import { generateWords } from '../utils/words';
import { soundEngine } from '../utils/SoundEngine';
import { supabase } from '../utils/supabase';
import { useGhostRacing } from '../hooks/useGhostRacing';
import { useSettings } from '../contexts';
import { createCountdownTimer, createElapsedTimer } from '../utils/timer';
import { CircularBuffer } from '../utils/helpers';

export function useEngine(testMode, testLimit) {
  const [words, setWords] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const replayTimeoutRef = useRef(null);
  const [results, setResults] = useState({ wpm: 0, rawWpm: 0, accuracy: 0, errors: 0, duration: 0 });
  const [keystrokes, setKeystrokes] = useState([]);
  const [testHistory, setTestHistory] = useState([]);
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0 });
  const [pb, setPb] = useState(0);
  const [telemetry, setTelemetry] = useState([]);
  const telemetryBufferRef = useRef(new CircularBuffer(50)); // Optimized circular buffer
  const wordContainerRef = useRef(null);
  const inputRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(testLimit);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
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
    difficulty,
    hasPunctuation,
    hasNumbers,
    hasCaps
  } = useSettings();
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

      setResults({ wpm, rawWpm, accuracy, errors, duration: durationSeconds });
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
          // Continue - results are still displayed
        }
      }

      // Sync to cloud (non-blocking, works offline)
      try {
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

        if (isOnline) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            if (import.meta.env.DEV) {
              console.warn('Session check failed:', sessionError);
            }
            return; // Exit early if session check fails
          }

          if (session?.user) {
            const payload = {
              user_id: session.user.id,
              wpm,
              accuracy,
              mode: testMode,
              test_limit: testLimit,
            };

            const { error: insertError } = await supabase.from('scores').insert(payload);

            if (insertError) {
              // Fallback with different mode format
              const fallbackPayload = {
                user_id: session.user.id,
                wpm,
                accuracy,
                mode: `${testMode} ${testLimit}`,
              };
              const { error: fallbackError } = await supabase.from('scores').insert(fallbackPayload);

              if (fallbackError && import.meta.env.DEV) {
                console.warn('Failed to sync score to cloud:', fallbackError);
              }
            }
          }
        }
        // If offline, data is already saved locally - will sync when online
      } catch (syncError) {
        // Silently fail - data is already saved locally
        // User experience is not affected
        if (import.meta.env.DEV) {
          console.warn('Cloud sync failed (non-critical):', syncError);
        }
      }
    } catch (error) {
      console.error('Error finishing test:', error);
      // Still mark as finished and show results even if calculation fails
      setIsFinished(true);
    }
  }, [startTime, words, stopTimer, testMode, testLimit]);
  const clearAllData = useCallback(async () => {
    if (window.api && window.api.data) {
      await window.api.data.set('pb', 0);
      await window.api.data.set('history', []);
      setPb(0);
      setTestHistory([]);
    }
  }, []);
  const resetGame = useCallback(() => {
    // Robust reset that works online and offline
    stopTimer();

    // Clear all timers and timeouts
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Generate new words with robustness (tier-based + complexity meta)
    const wordCount = testMode === 'words' ? testLimit : Math.max(100, testLimit * 4);
    setWords(generateWords(wordCount, {
      difficulty,
      hasPunctuation,
      hasNumbers,
      hasCaps
    }));

    // Reset all state synchronously (no async operations)
    setUserInput('');
    setStartTime(null);
    startTimeRef.current = null;
    setTimeLeft(testLimit);
    setElapsedTime(0);
    setIsFinished(false);
    setIsReplaying(false);
    setKeystrokes([]);
    telemetryBufferRef.current.clear();
    setTelemetry([]);
    setResults({ wpm: 0, rawWpm: 0, accuracy: 0, errors: 0, duration: 0 });
    setIsTyping(false);

    // Reset timers
    if (countdownTimerRef.current) {
      countdownTimerRef.current.reset(testLimit);
    }
    if (elapsedTimerRef.current) {
      elapsedTimerRef.current.reset();
    }

    // Reset caret position
    setCaretPos({ left: 0, top: 0 });
    lastLineTop.current = -1;

    // Scroll to top
    if (wordContainerRef.current) {
      wordContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Focus input (works offline)
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.value = ''; // Ensure input is cleared
        inputRef.current.focus();
      }
    });
  }, [testMode, testLimit, stopTimer, difficulty, hasPunctuation, hasNumbers, hasCaps]);
  useEffect(() => {
    resetGame();
  }, [resetGame]);
  const handleInput = useCallback((e) => {
    const value = e.target.value;
    if (isFinished || isReplaying) return;
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

      // Create robust countdown timer for time mode
      if (testMode === 'time') {
        // Set initial time immediately
        setTimeLeft(testLimit);

        countdownTimerRef.current = createCountdownTimer(
          testLimit,
          (remaining, elapsed) => {
            // Update time display only when value changes (prevents shaking)
            setTimeLeft(remaining);

            // Calculate telemetry (only if elapsed > 0 to avoid division by zero)
            if (elapsed > 0) {
              const durationInMin = elapsed / 60;
              const currentInput = inputRef.current?.value || '';
              const currentRaw = Math.round((currentInput.length / 5) / durationInMin) || 0;

              // Calculate Net WPM live
              const targetText = words.join(' ');
              let correctChars = 0;
              for (let i = 0; i < currentInput.length; i++) {
                if (currentInput[i] === targetText[i]) correctChars++;
              }
              const currentWpm = Math.round((correctChars / 5) / durationInMin) || 0;
              // Use circular buffer for efficient telemetry updates
              telemetryBufferRef.current.push({ sec: elapsed, wpm: currentWpm, raw: currentRaw });
              setTelemetry(telemetryBufferRef.current.toArray());
            }
          },
          () => {
            // Timer finished
            finishTest(inputRef.current?.value || '', performance.now());
          }
        );
        countdownTimerRef.current.start();
      }

      // Create elapsed timer for words mode and telemetry
      elapsedTimerRef.current = createElapsedTimer((elapsed) => {
        // Update elapsed time for display
        setElapsedTime(elapsed);

        const durationInMin = elapsed / 60;
        const currentInput = inputRef.current?.value || '';
        const currentRaw = Math.round((currentInput.length / 5) / durationInMin) || 0;

        // Calculate Net WPM live
        const targetText = words.join(' ');
        let correctChars = 0;
        for (let i = 0; i < currentInput.length; i++) {
          if (currentInput[i] === targetText[i]) correctChars++;
        }
        const currentWpm = Math.round((correctChars / 5) / durationInMin) || 0;
        // Use circular buffer for efficient telemetry updates
        telemetryBufferRef.current.push({ sec: elapsed, wpm: currentWpm, raw: currentRaw });
        setTelemetry(telemetryBufferRef.current.toArray());
      });
      elapsedTimerRef.current.start();

      // Legacy interval for backward compatibility (can be removed later)
      timerRef.current = setInterval(() => {
        const elapsedSec = Math.round((performance.now() - startTimeRef.current) / 1000);
        if (elapsedSec <= 0) return;

        // Only update telemetry if not using new timer
        if (testMode !== 'time' && elapsedTimerRef.current) {
          // Already handled by elapsedTimerRef
          return;
        }
      }, 1000);
    }
    setKeystrokes(prev => [...prev, { value, timestamp: now }]);
    if (testMode === 'words') {
      const totalRequired = words.join(' ').length;
      if (value.length >= totalRequired) {
        finishTest(value, now);
      }
    }
    setUserInput(value);
  }, [isFinished, isReplaying, startTime, testMode, words, finishTest, testLimit, isSoundEnabled]);

  const skipReplay = useCallback(() => {
    if (!isReplaying) return;
    if (replayTimeoutRef.current) {
      clearTimeout(replayTimeoutRef.current);
      replayTimeoutRef.current = null;
    }
    setIsReplaying(false);
    setIsFinished(true);
    // Set user input to the final value
    if (keystrokes.length > 0) {
      setUserInput(keystrokes[keystrokes.length - 1].value);
    }
  }, [isReplaying, keystrokes]);

  const runReplay = useCallback(() => {
    if (keystrokes.length === 0) return;
    stopTimer();
    setIsReplaying(true);
    setUserInput('');
    setIsFinished(false);
    let i = 0;
    const playNext = () => {
      if (i >= keystrokes.length) {
        setIsReplaying(false);
        setIsFinished(true);
        return;
      }
      const val = keystrokes[i].value;
      setUserInput(val);
      if (isSoundEnabled) {
        soundEngine.playKeySound(val[val.length - 1] === ' ' ? 'space' : 'key');
      }
      if (i < keystrokes.length - 1) {
        const delay = keystrokes[i+1].timestamp - keystrokes[i].timestamp;
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
  }, [keystrokes, stopTimer, isSoundEnabled]);
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

    const updateCaret = () => {
      const charIndex = userInput.length;
      const target = document.getElementById(`char-${charIndex}`);
      
      if (target) {
        // use offset properties for better performance (no layout thrashing)
        const left = target.offsetLeft;
        const top_offset = target.offsetTop;
        const targetHeight = target.offsetHeight;
        const targetWidth = target.offsetWidth;

        const h = targetHeight * 0.7;
        const top = top_offset + (targetHeight - h) / 2;

        setCaretPos({ 
          left, 
          top,
          width: targetWidth,
          height: h
        });
        
        // Scrolling logic
        if (Math.abs(top - lastLineTop.current) > 2) {
          const containerHeight = container.clientHeight;
          const wordWrapper = target.closest('.word-wrapper');
          if (wordWrapper) {
            const absoluteTop = wordWrapper.offsetTop + top;
            
            if (isCenteredScrolling) {
              const targetScroll = absoluteTop - (containerHeight / 2) + (targetHeight / 2);
              container.scrollTo({ top: targetScroll, behavior: 'smooth' });
            } else {
              container.scrollTo({ top: absoluteTop - (containerHeight * 0.4), behavior: 'smooth' });
            }
            lastLineTop.current = top;
          }
        }
      } else if (charIndex > 0) {
        const lastTarget = document.getElementById(`char-${charIndex - 1}`);
        if (lastTarget) {
          const left = lastTarget.offsetLeft + lastTarget.offsetWidth;
          const top_offset = lastTarget.offsetTop;
          const h = lastTarget.offsetHeight * 0.7;
          const top = top_offset + (lastTarget.offsetHeight - h) / 2;

          setCaretPos({
            left,
            top,
            width: 2,
            height: h
          });
        }
      }
 else if (retryCount < 20) {
        retryCount++;
        setTimeout(updateCaret, 20);
      }
    };

    // Run IMMEDIATELY to avoid the (0,0) jump
    updateCaret();

    // Also run in a frame to catch flexbox settling
    const frame = requestAnimationFrame(updateCaret);
    
    return () => cancelAnimationFrame(frame);
  }, [userInput, isFinished, words]);
  const liveWpm = useMemo(() => {
    if (!startTime || isFinished || isReplaying) return results.wpm;
    const now = performance.now();
    const diff = (now - startTime) / 60000;
    if (diff <= 0) return 0;
    return Math.round((userInput.length / 5) / diff);
  }, [userInput, startTime, isFinished, isReplaying, results.wpm]);
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
    setGhostSpeed
  }), [
    words, userInput, startTime, isFinished, isReplaying, results, caretPos,
    timeLeft, elapsedTime, resetGame, handleInput, runReplay, skipReplay, liveWpm, pb,
    isSoundEnabled, soundProfile, isHallEffect, telemetry,
    isGhostEnabled, ghostPos, isTyping, testHistory, clearAllData,
    ghostSpeed
  ]);
}
