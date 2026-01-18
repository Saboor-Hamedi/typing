/**
 * Word Generation Tests
 * 
 * Tests for word generation utility
 */

import { describe, it, expect } from 'vitest'
import { generateWords } from '../utils/words'

describe('generateWords', () => {
  it('generates the correct number of words', () => {
    const words = generateWords(10)
    expect(words).toHaveLength(10)
  })

  it('generates words from the word list', () => {
    const words = generateWords(5)
    const wordList = [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i'
    ]
    
    words.forEach(word => {
      expect(wordList).toContain(word)
    })
  })

  it('handles zero count', () => {
    const words = generateWords(0)
    expect(words).toHaveLength(0)
  })

  it('handles large counts', () => {
    const words = generateWords(100)
    expect(words).toHaveLength(100)
  })
})
