/**
 * Test Helpers
 * 
 * Utility functions for testing TypingZone components and hooks
 * 
 * @module testHelpers
 */

/**
 * Creates a mock engine object for testing
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Mock engine object
 */
export function createMockEngine(overrides = {}) {
  return {
    words: ['hello', 'world', 'test'],
    userInput: '',
    startTime: null,
    isFinished: false,
    isReplaying: false,
    results: { wpm: 0, rawWpm: 0, accuracy: 0, errors: 0 },
    keystrokes: [],
    testHistory: [],
    caretPos: { left: 0, top: 0 },
    pb: 0,
    telemetry: [],
    wordContainerRef: { current: null },
    inputRef: { current: null },
    resetGame: jest.fn(),
    handleInput: jest.fn(),
    runReplay: jest.fn(),
    clearAllData: jest.fn(),
    timeLeft: 60,
    elapsedTime: 0,
    isGhostEnabled: false,
    ghostPos: { left: 0, top: 0 },
    isTyping: false,
    ...overrides
  }
}

/**
 * Creates a mock settings context value
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Mock settings object
 */
export function createMockSettings(overrides = {}) {
  return {
    testMode: 'words',
    setTestMode: jest.fn(),
    testLimit: 25,
    setTestLimit: jest.fn(),
    isZenMode: false,
    setIsZenMode: jest.fn(),
    isSmoothCaret: true,
    setIsSmoothCaret: jest.fn(),
    theme: 'dark',
    ...overrides
  }
}

/**
 * Waits for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the delay
 */
export function wait(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fires a keyboard event
 * @param {HTMLElement} element - Element to fire event on
 * @param {string} key - Key to press
 * @param {Object} options - Additional event options
 */
export function fireKeyDown(element, key, options = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options
  })
  element.dispatchEvent(event)
}

/**
 * Fires an input change event
 * @param {HTMLInputElement} input - Input element
 * @param {string} value - New value
 */
export function fireInputChange(input, value) {
  input.value = value
  const event = new Event('input', { bubbles: true })
  input.dispatchEvent(event)
}
