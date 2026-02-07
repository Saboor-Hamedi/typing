/**
 * Error Handler Utility
 *
 * Purpose: Centralized error handling with proper logging and user feedback
 * - DRY error handling patterns
 * - Production-safe error logging
 * - User-friendly error messages
 * - Error recovery strategies
 */

import { ERROR_MESSAGES } from '../constants'

/**
 * Error types for categorization
 */
export const ErrorType = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  DATA: 'DATA',
  UNKNOWN: 'UNKNOWN'
}

/**
 * Determines error type from error object
 * @param {Error} error - Error object
 * @returns {string} Error type
 */
export function getErrorType(error) {
  if (!error) return ErrorType.UNKNOWN

  const message = error.message?.toLowerCase() || ''
  const code = error.code?.toLowerCase() || ''

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('offline') ||
    code === 'network_error'
  ) {
    return ErrorType.NETWORK
  }
  if (
    message.includes('auth') ||
    message.includes('session') ||
    message.includes('login') ||
    code.includes('auth')
  ) {
    return ErrorType.AUTH
  }
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required')
  ) {
    return ErrorType.VALIDATION
  }
  if (
    message.includes('save') ||
    message.includes('load') ||
    message.includes('data') ||
    message.includes('storage')
  ) {
    return ErrorType.DATA
  }

  return ErrorType.UNKNOWN
}

/**
 * Gets user-friendly error message
 * @param {Error} error - Error object
 * @param {string} fallback - Fallback message
 * @returns {string} User-friendly message
 */
export function getErrorMessage(error, fallback = ERROR_MESSAGES.UNKNOWN_ERROR) {
  if (!error) return fallback

  const type = getErrorType(error)
  const message = error.message || ''

  switch (type) {
    case ErrorType.NETWORK:
      return navigator.onLine ? ERROR_MESSAGES.NETWORK_ERROR : ERROR_MESSAGES.OFFLINE
    case ErrorType.AUTH:
      if (message.includes('session') || message.includes('expired')) {
        return ERROR_MESSAGES.SESSION_EXPIRED
      }
      if (message.includes('invalid') || message.includes('credentials')) {
        return ERROR_MESSAGES.INVALID_CREDENTIALS
      }
      return ERROR_MESSAGES.AUTH_FAILED
    case ErrorType.VALIDATION:
      if (message.includes('username')) {
        if (message.includes('short')) return ERROR_MESSAGES.USERNAME_TOO_SHORT
        if (message.includes('long')) return ERROR_MESSAGES.USERNAME_TOO_LONG
        return ERROR_MESSAGES.INVALID_USERNAME
      }
      if (message.includes('email')) {
        return ERROR_MESSAGES.INVALID_EMAIL
      }
      return message || fallback
    case ErrorType.DATA:
      if (message.includes('save')) return ERROR_MESSAGES.SAVE_FAILED
      if (message.includes('load')) return ERROR_MESSAGES.LOAD_FAILED
      if (message.includes('sync')) return ERROR_MESSAGES.SYNC_FAILED
      return ERROR_MESSAGES.SAVE_FAILED
    default:
      return message || fallback
  }
}

/**
 * Safely executes async function with error handling
 * @param {Function} fn - Async function to execute
 * @param {Function} onError - Error callback
 * @param {Function} onSuccess - Success callback
 * @returns {Promise} Result or null on error
 */
export async function safeAsync(fn, onError, onSuccess) {
  try {
    const result = await fn()
    if (onSuccess) onSuccess(result)
    return result
  } catch (error) {
    const errorMessage = getErrorMessage(error)

    if (import.meta.env.DEV) {
      console.error('Safe async error:', error)
    }

    if (onError) {
      onError(error, errorMessage)
    }

    return null
  }
}

/**
 * Retries async operation with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelay - Base delay in ms
 * @returns {Promise} Result or throws error
 */
export async function retryOperation(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (i === maxRetries - 1) {
        throw error
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, i)
      await new Promise((resolve) => setTimeout(resolve, delay))

      if (import.meta.env.DEV) {
        console.warn(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms`)
      }
    }
  }

  throw lastError
}

/**
 * Handles storage errors gracefully
 * @param {Function} storageFn - Storage operation function
 * @param {*} fallbackValue - Value to return on error
 * @returns {Promise<*>} Result or fallback
 */
export async function safeStorage(storageFn, fallbackValue = null) {
  try {
    return await storageFn()
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Storage error:', error)
    }
    return fallbackValue
  }
}
