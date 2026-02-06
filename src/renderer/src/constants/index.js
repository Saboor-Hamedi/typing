/**
 * constants/index
 *
 * Purpose:
 * - Centralized constants for performance, UI motion, game rules, progression, theming, and storage keys.
 *
 * Key Sections:
 * - PERFORMANCE/UI: Debounce intervals and Framer Motion spring profiles used across the app.
 * - GAME: Test modes/limits, WPM math, Chameleon thresholds, ghost speed range.
 * - PROGRESSION: Avatar unlock levels + defaults (selected/unlocked IDs).
 * - THEMES: Named palettes and hot color used by Chameleon Flow.
 * - STORAGE_KEYS: Keys for localStorage and Electron stores (settings/data) used by contexts and engine.
 */
/**
 * Application-wide constants and configuration values
 * Single source of truth for magic numbers and config
 */

// ============================================
// PERFORMANCE CONSTANTS
// ============================================

export const PERFORMANCE = {
  // Telemetry collection interval (ms)
  TELEMETRY_INTERVAL: 1000,

  // Ghost caret update frequency (ms)
  GHOST_UPDATE_INTERVAL: 50,

  // Chameleon color update debounce (ms)
  CHAMELEON_DEBOUNCE: 100,

  // Typing timeout for caret blink state (ms)
  TYPING_TIMEOUT: 500,

  // Toast auto-dismiss duration (ms)
  TOAST_DURATION: 4000,

  // Auth check delay on mount (ms)
  AUTH_CHECK_DELAY: 2000,

  // Logout cooldown period (ms)
  LOGOUT_COOLDOWN: 2500,
}

// ============================================
// UI CONSTANTS
// ============================================

export const UI = {
  // Scroll position for active line (0-1, where 0.4 = 40% from top)
  HORIZON_SCROLL_POSITION: 0.4,

  // Maximum history items to store locally
  MAX_HISTORY_ITEMS: 50,

  // Caret animation stiffness (smooth mode)
  // Fast and smooth: responsive enough to catch up with fast typing
  // High stiffness = very fast response, still smooth
  // Balanced damping = controlled, minimal oscillation
  // Low mass = light, snappy movement
  CARET_STIFFNESS_SMOOTH: 300,
  CARET_DAMPING_SMOOTH: 35,
  CARET_MASS_SMOOTH: 1.0,

  // Caret animation stiffness (instant mode)
  CARET_STIFFNESS_INSTANT: 1000,
  CARET_DAMPING_INSTANT: 28,
  CARET_MASS_INSTANT: 0.1,

  // Ghost caret animation
  GHOST_STIFFNESS: 700,
  GHOST_DAMPING: 30,
  GHOST_OPACITY: 0.2,

  // Page transition animation duration (s)
  PAGE_TRANSITION_DURATION: 0.3,

  // Zen mode transition duration (s)
  ZEN_TRANSITION_DURATION: 0.5,

  // Word dimming transition duration (s)
  WORD_DIM_TRANSITION_DURATION: 0.2,
}

// ============================================
// GAME MECHANICS
// ============================================

export const GAME = {
  // Default test modes
  DEFAULT_MODE: 'words',
  DEFAULT_LIMIT: 25,

  // Test mode options
  TIME_LIMITS: [15, 30, 60],
  WORD_LIMITS: [10, 25, 50],
  

  
  // Modifiers
  MODIFIERS: {
    PUNCTUATION: 'punctuation',
    NUMBERS: 'numbers',
    CAPS: 'caps',
  },

  // Word generation multiplier for time mode
  TIME_MODE_WORD_MULTIPLIER: 4,
  MIN_WORDS_FOR_TIME_MODE: 100,

  // WPM calculation
  CHARS_PER_WORD: 5,

  // Chameleon Flow heat calculation
  CHAMELEON_MIN_THRESHOLD: 0.6, // 60% of PB
  CHAMELEON_MAX_THRESHOLD: 1.1, // 110% of PB
  CHAMELEON_FALLBACK_TARGET: 100, // WPM when no PB exists

  // Ghost speed multiplier range
  GHOST_SPEED_MIN: 0.5,
  GHOST_SPEED_MAX: 2.0,
  GHOST_SPEED_DEFAULT: 1.0,
}

// ============================================
// LEVELING & PROGRESSION
// ============================================

export const PROGRESSION = {
  // Avatar unlock levels
  AVATAR_UNLOCK_LEVELS: [
    { id: 2, level: 5, name: 'The Pulse' },
    { id: 3, level: 10, name: 'Tactical Edge' },
    { id: 4, level: 20, name: 'Expert Shards' },
    { id: 5, level: 30, name: 'Dark Master' },
    { id: 6, level: 40, name: 'Neon Specter' },
    { id: 7, level: 50, name: 'Void Walker' },
    { id: 8, level: 60, name: 'Ascended Zero' },
  ],

  // Starting unlocked avatars
  DEFAULT_UNLOCKED_AVATARS: [0, 1],

  // Default selected avatar
  DEFAULT_AVATAR_ID: 1,
}

// ============================================
// AUDIO CONSTANTS
// ============================================

export const AUDIO = {
  // Sound profiles
  PROFILES: ['thocky', 'creamy', 'clicky'],
  DEFAULT_PROFILE: 'thocky',

  // Volume settings
  MASTER_GAIN: 1.8,
  VOLUME_JITTER: 0.1,

  // Reverb settings
  REVERB_LENGTH: 2.5, // seconds
  REVERB_GAIN: 0.2,

  // Pitch jitter for organic feel
  PITCH_JITTER: 0.05,

  // Noise buffer duration
  NOISE_BUFFER_DURATION: 0.08,
}

// ============================================
// THEME CONSTANTS
// ============================================

export const THEMES = {
  AVAILABLE: ['carbon', 'nord', 'dracula', 'serika_blue', 'matrix', 'lavender', 'rose_pine', 'cyberpunk', 'synthwave'],
  DEFAULT: 'carbon',

  // RGB values for Chameleon Flow
  COLORS: {
    carbon: [226, 183, 20],
    nord: [226, 183, 20],
    dracula: [189, 147, 249],
    serika_blue: [88, 166, 255],
    matrix: [255, 255, 255],
    lavender: [203, 166, 247],
    rose_pine: [235, 188, 186],
    cyberpunk: [246, 1, 157],
    synthwave: [255, 126, 219],
  },

  // Theme-specific hot colors for Chameleon Flow
  HOT_COLORS: {
    carbon: [255, 78, 0],       // Deep Orange
    nord: [255, 78, 0],         // Deep Orange
    dracula: [255, 121, 198],    // Pink
    serika_blue: [255, 255, 255], // Pure White
    matrix: [0, 255, 65],       // Matrix Green
    lavender: [255, 255, 255],   // White
    rose_pine: [235, 111, 146],  // Love (Pink)
    cyberpunk: [0, 255, 255],    // Cyan
    synthwave: [254, 231, 21],   // Yellow
  },
}

// ============================================
// VALIDATION CONSTANTS
// ============================================

export const VALIDATION = {
  // Username constraints
  USERNAME_MIN_LENGTH: 1,
  USERNAME_MAX_LENGTH: 30,
  USERNAME_PATTERN: /^[a-zA-Z0-9_-\s]+$/,

  // Email pattern (basic)
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Default values
  DEFAULT_USERNAME: 'Guest',
}

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  // LocalStorage keys
  THEME: 'theme',
  TEST_MODE: 'testMode',
  TEST_LIMIT: 'testLimit',
  ACTIVE_TAB: 'activeTab',
  USERNAME: 'username',
  LOCAL_USERNAME: 'localUsername',
  CHAMELEON_ENABLED: 'isChameleonEnabled',
  KINETIC_ENABLED: 'isKineticEnabled',
  SMOOTH_CARET: 'isSmoothCaret',
  SOUND_PROFILE: 'soundProfile',
  CENTERED_SCROLLING: 'isCenteredScrolling',

  HAS_PUNCTUATION: 'hasPunctuation',
  HAS_NUMBERS: 'hasNumbers',
  HAS_CAPS: 'hasCaps',
  MANUAL_LOGOUT: 'typingzone-manual-logout',

  // Electron store keys (settings.json)
  SETTINGS: {
    THEME: 'theme',
    TEST_MODE: 'testMode',
    TEST_LIMIT: 'testLimit',
    CHAMELEON: 'isChameleonEnabled',
    KINETIC: 'isKineticEnabled',
    SMOOTH_CARET: 'isSmoothCaret',
    LOCAL_USERNAME: 'localUsername',
    AVATAR_ID: 'selectedAvatarId',
    UNLOCKED_AVATARS: 'unlockedAvatars',
    GHOST_ENABLED: 'isGhostEnabled',
    SOUND_ENABLED: 'isSoundEnabled',
    HALL_EFFECT: 'isHallEffect',
    SOUND_PROFILE: 'soundProfile',
    CENTERED_SCROLLING: 'isCenteredScrolling',

    HAS_PUNCTUATION: 'hasPunctuation',
    HAS_NUMBERS: 'hasNumbers',
    HAS_CAPS: 'hasCaps',
    GHOST_SPEED: 'ghostSpeed',

  },

  // Electron store keys (data.json)
  DATA: {
    PB: 'pb',
    HISTORY: 'history',
    XP: 'xp',
  },
}

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Network error. Please check your connection.',
  OFFLINE: 'You are currently offline.',

  // Auth errors
  AUTH_FAILED: 'Authentication failed. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',

  // Validation errors
  INVALID_USERNAME: 'Username can only contain letters, numbers, spaces, hyphens, and underscores.',
  USERNAME_TOO_SHORT: 'Username must be at least 1 character.',
  USERNAME_TOO_LONG: 'Username cannot exceed 30 characters.',
  INVALID_EMAIL: 'Please enter a valid email address.',

  // Data errors
  SAVE_FAILED: 'Failed to save data. Please try again.',
  LOAD_FAILED: 'Failed to load data.',
  SYNC_FAILED: 'Cloud sync failed. Your data is saved locally.',

  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred.',
}

// ============================================
// SUCCESS MESSAGES
// ============================================

export const SUCCESS_MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Welcome back',
  LOGOUT_SUCCESS: 'Signed out successfully',
  BROWSER_AUTH_SUCCESS: 'Authenticated via browser!',

  // Data
  SYNC_SUCCESS: 'Synced successfully!',
  PROFILE_UPDATED: 'Profile updated',
  LOCAL_NICKNAME_SAVED: 'Local nickname saved',

  // Settings
  THEME_CHANGED: 'Theme switched to',
  DATA_CLEARED: 'History and PBs cleared',

  // Progression
  AVATAR_UNLOCKED: 'New Avatar',
}


// ============================================
// ACCESSIBILITY
// ============================================

export const A11Y = {
  // Focus visible outline
  FOCUS_OUTLINE: '2px solid var(--main-color)',
  FOCUS_OFFSET: '2px',

  // Minimum touch target size (px)
  MIN_TOUCH_TARGET: 44,

  // Animation duration for reduced motion (s)
  REDUCED_MOTION_DURATION: 0.01,
}

// ============================================
// BREAKPOINTS
// ============================================

export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 900,
  DESKTOP: 1200,
}
