import { VALIDATION, ERROR_MESSAGES } from '../constants'

/**
 * Input Validation Utilities
 * Centralized validation logic with consistent error messages
 */

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export const validateUsername = (username) => {
  const trimmed = username.trim()

  if (!trimmed) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.USERNAME_TOO_SHORT
    }
  }

  if (trimmed.length < VALIDATION.USERNAME_MIN_LENGTH) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.USERNAME_TOO_SHORT
    }
  }

  if (trimmed.length > VALIDATION.USERNAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.USERNAME_TOO_LONG
    }
  }

  if (!VALIDATION.USERNAME_PATTERN.test(trimmed)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_USERNAME
    }
  }

  return {
    isValid: true,
    error: null
  }
}

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export const validateEmail = (email) => {
  const trimmed = email.trim()

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Email is required'
    }
  }

  if (!VALIDATION.EMAIL_PATTERN.test(trimmed)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_EMAIL
    }
  }

  return {
    isValid: true,
    error: null
  }
}

/**
 * Sanitize username (remove invalid characters)
 * @param {string} username - Username to sanitize
 * @returns {string} Sanitized username
 */
export const sanitizeUsername = (username) => {
  return username
    .trim()
    .slice(0, VALIDATION.USERNAME_MAX_LENGTH)
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { isValid: boolean, error: string|null, strength: string }
 */
export const validatePassword = (password) => {
  if (!password) {
    return {
      isValid: false,
      error: 'Password is required',
      strength: 'none'
    }
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters',
      strength: 'weak'
    }
  }

  // Check strength
  let strength = 'weak'
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  const criteriaCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length

  if (criteriaCount >= 3 && password.length >= 12) {
    strength = 'strong'
  } else if (criteriaCount >= 2 && password.length >= 8) {
    strength = 'medium'
  }

  return {
    isValid: true,
    error: null,
    strength
  }
}

/**
 * Validate number input
 * @param {string|number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Object} { isValid: boolean, error: string|null, value: number }
 */
export const validateNumber = (value, min = -Infinity, max = Infinity) => {
  const num = Number(value)

  if (isNaN(num)) {
    return {
      isValid: false,
      error: 'Must be a valid number',
      value: null
    }
  }

  if (num < min) {
    return {
      isValid: false,
      error: `Must be at least ${min}`,
      value: num
    }
  }

  if (num > max) {
    return {
      isValid: false,
      error: `Must be at most ${max}`,
      value: num
    }
  }

  return {
    isValid: true,
    error: null,
    value: num
  }
}

/**
 * Validate required field
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '') {
    return {
      isValid: false,
      error: `${fieldName} is required`
    }
  }

  if (typeof value === 'string' && !value.trim()) {
    return {
      isValid: false,
      error: `${fieldName} cannot be empty`
    }
  }

  return {
    isValid: true,
    error: null
  }
}
