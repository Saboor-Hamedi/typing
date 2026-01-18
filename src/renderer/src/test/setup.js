/**
 * Test Setup
 * 
 * Global test configuration and mocks
 */

import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Electron APIs
global.window = global.window || {}
global.window.api = {
  data: {
    get: async (key) => {
      const store = {}
      return store[key] || null
    },
    set: async (key, value) => {
      const store = {}
      store[key] = value
      return true
    }
  },
  settings: {
    get: async (key) => {
      const store = {}
      return store[key] || null
    },
    set: async (key, value) => {
      const store = {}
      store[key] = value
      return true
    }
  }
}

// Mock Supabase
global.supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null })
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null })
  })
}

// Mock performance API
global.performance = {
  now: () => Date.now()
}

// Suppress console errors in tests (optional)
// global.console.error = () => {}
