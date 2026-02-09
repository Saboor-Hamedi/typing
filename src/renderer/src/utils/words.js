/**
 * words.js
 *
 * Standardized word lists inspired by top typing apps (Monkeytype).
 * Contains common English words for optimal flow and rhythm.
 */

import wordsData from '../assets/words.json'

// Helper to flatten tiered categories (e.g., intermediate: { nature: [...], tech: [...] })
const flattenTiers = (tiers) => {
  if (Array.isArray(tiers)) return tiers
  if (typeof tiers === 'object') return Object.values(tiers).flat()
  return []
}

// Extract and flatten words from the enhanced corpus
const beginnerWords = flattenTiers(wordsData.beginner)
const intermediateWords = flattenTiers(wordsData.intermediate)

// Extract specific sub-tiers from advanced
const advancedWords = flattenTiers(wordsData.advanced?.vocabulary)
const technicalWords = flattenTiers(wordsData.advanced?.technical)
const misspelledWords = flattenTiers(wordsData.advanced?.misspelled)

// Primary word pool for random generation
const ALL_WORDS = [
  ...beginnerWords,
  ...intermediateWords,
  ...advancedWords,
  ...technicalWords,
  ...misspelledWords
]

// Sentence pool with tiered fallback - KEEPING THEM SEPARATE to fix mixed-pool bug
const SENTENCES_BY_DIFF = {
  easy: flattenTiers(wordsData.sentences?.easy || []),
  medium: flattenTiers(wordsData.sentences?.medium || []),
  hard: flattenTiers(wordsData.sentences?.hard || [])
}

const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

// Symbols that can be attached to words for punctuation mode
const ATTACHABLE_PUNCTUATION = ['.', ',', '!', '?', ';', ':']

// Simple history to prevent rapid sentence repetition
let quoteHistory = []
const MAX_HISTORY = 15

/**
 * Generate a list of base words (without dynamic modifiers)
 */
export const generateBaseWords = async (
  count = 50,
  isSentenceMode = false,
  difficulty = 'intermediate'
) => {
  const result = []
  let currentWordCount = 0

  // Select word pool based on difficulty
  let activeWordPool = intermediateWords
  if (difficulty === 'beginner') {
    activeWordPool = beginnerWords
  } else if (difficulty === 'advanced') {
    activeWordPool = [...advancedWords, ...technicalWords, ...misspelledWords]
  }

  // Helper to get a random sentence while avoiding history
  const getRandomSentence = async (targetLength = null) => {
    const dbDifficulty =
      difficulty === 'beginner' ? 'easy' : difficulty === 'advanced' ? 'hard' : 'medium'

    // 1. Strictly use SQLite DB if available
    if (window.api?.db) {
      try {
        const dbSentence = await window.api.db.getRandomSentence(dbDifficulty)
        if (dbSentence) return dbSentence
        console.warn('DB Sentence fetch returned null, using local fallback.')
      } catch (e) {
        console.warn('DB Fetch failed:', e)
      }
    }

    // 2. Fallback to Local Pool (FIXED: Use tier-specific pool instead of mixed ALL_SENTENCES)
    const pool = SENTENCES_BY_DIFF[dbDifficulty] || SENTENCES_BY_DIFF.medium

    if (!pool || pool.length === 0) return 'The quick brown fox jumps over the lazy dog.'

    // If a target length is provided, try to find a sentence close to it
    let filteredPool = pool.filter((s) => s && !quoteHistory.includes(s))
    if (filteredPool.length === 0) filteredPool = pool

    if (targetLength) {
      const sortedPool = [...filteredPool].sort((a, b) => {
        const lenA = (a || '').split(/\s+/).length
        const lenB = (b || '').split(/\s+/).length
        return Math.abs(lenA - targetLength) - Math.abs(lenB - targetLength)
      })
      const bestFits = sortedPool.slice(0, 3)
      const picked = bestFits[Math.floor(Math.random() * bestFits.length)] || filteredPool[0]

      quoteHistory.push(picked)
      if (quoteHistory.length > MAX_HISTORY) quoteHistory.shift()
      return picked
    }

    const picked = filteredPool[Math.floor(Math.random() * filteredPool.length)] || pool[0]
    quoteHistory.push(picked)
    if (quoteHistory.length > MAX_HISTORY) quoteHistory.shift()
    return picked
  }

  // Reduced sentence frequency for more standard flow
  const useSentenceChance = 0.12

  if (isSentenceMode) {
    const usedInThisBatch = new Set()

    // NEW LOGIC: Fetch exactly ONE sentence from the database/pool.
    // This allows the specific character limits of each difficulty (100/130/150)
    // to naturally define the length of the test.
    const maxSentences = 1
    let sentenceCount = 0

    // Fetch exactly one sentence
    while (sentenceCount < maxSentences) {
      let sentence = null

      // Try up to 3 times to get a unique sentence
      for (let attempt = 0; attempt < 3; attempt++) {
        const candidate = await getRandomSentence(count - currentWordCount)
        if (candidate && !usedInThisBatch.has(candidate)) {
          sentence = candidate
          break
        }
      }

      // If we failed to find a unique one, just take whatever
      if (!sentence) {
        sentence = await getRandomSentence(count - currentWordCount)
        if (!sentence) break
      }

      usedInThisBatch.add(sentence)

      const wordsInSentence = sentence.split(/\s+/).filter(Boolean)
      if (wordsInSentence.length === 0) break

      for (let i = 0; i < wordsInSentence.length; i++) {
        result.push({
          text: wordsInSentence[i],
          type: 'quote',
          isStart: i === 0,
          isEnd: i === wordsInSentence.length - 1
        })
        currentWordCount++
      }

      sentenceCount++
      // If we've already satisfied a reasonable length for the requested count,
      // AND we have at least one sentence, we can stop for Easy.
      if (difficulty === 'beginner' && sentenceCount >= 1) break
    }
    return result
  }

  // Standard Mode Logic
  while (currentWordCount < count) {
    const canInject = count - currentWordCount > 12
    const alreadyHasQuote = result.some((item) => item.type === 'quote')

    if (!alreadyHasQuote && canInject && Math.random() < useSentenceChance) {
      const sentence = await getRandomSentence(Math.min(25, count - currentWordCount))
      if (sentence) {
        const wordsInSentence = sentence.split(/\s+/).filter(Boolean)

        for (let i = 0; i < wordsInSentence.length; i++) {
          const w = wordsInSentence[i]
          const cleanW = w.replace(/[",]/g, '')
          result.push({
            text: cleanW,
            type: 'quote',
            isStart: i === 0,
            isEnd: i === wordsInSentence.length - 1
          })
          currentWordCount++
        }
        continue
      }
    }

    const pool = activeWordPool && activeWordPool.length > 0 ? activeWordPool : beginnerWords
    let word = pool[Math.floor(Math.random() * pool.length)] || 'typing'
    result.push({ text: word, type: 'word' })
    currentWordCount++
  }
  return result
}

/**
 * Apply modifiers (Punc, Caps, Numbers) to base words
 */
export const applyModifiers = (baseWords, settings) => {
  const { hasPunctuation = false, hasNumbers = false, hasCaps = false } = settings

  const result = []

  // Helper to inject numbers
  const tryAddNumber = () => {
    if (hasNumbers && Math.random() > 0.8) {
      if (result.length >= baseWords.length) return

      const len = Math.floor(Math.random() * 2) + 1
      let numStr = ''
      for (let i = 0; i < len; i++) {
        numStr += NUMBERS[Math.floor(Math.random() * NUMBERS.length)]
      }
      result.push(numStr)
    }
  }

  let isNextWordStartOfSentence = true

  for (let i = 0; i < baseWords.length; i++) {
    if (result.length >= baseWords.length) break

    const item = baseWords[i]
    let word = item.text
    const isQuote = item.type === 'quote'

    if (isQuote) {
      // 1. Handle Capitalization
      if (hasCaps) {
        // Preserve original case if it's a quote, but ensure sentence start is capped
        if (item.isStart || isNextWordStartOfSentence) {
          word = word.charAt(0).toUpperCase() + word.slice(1)
        }
      } else {
        word = word.toLowerCase()
      }

      // 2. Handle Punctuation
      if (!hasPunctuation) {
        word = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"'?]/g, '')
      }

      result.push(word)
      tryAddNumber()

      // Determine if next word should be capped (if it's a quote and we hit a terminator)
      const lastChar = word.slice(-1)
      isNextWordStartOfSentence = ['.', '!', '?'].includes(lastChar)
      continue
    }

    // Standard Random Word Logic
    tryAddNumber()

    // Caps Logic for random words
    let shouldCap = false
    if (hasCaps) {
      if (hasPunctuation) {
        shouldCap = isNextWordStartOfSentence
      } else {
        shouldCap = Math.random() > 0.92 || i === 0
      }
    }

    if (shouldCap) {
      word = word.charAt(0).toUpperCase() + word.slice(1)
    } else if (!hasCaps) {
      word = word.toLowerCase()
    }

    // Punctuation Logic for random words
    if (hasPunctuation && Math.random() > 0.85) {
      const punc = ATTACHABLE_PUNCTUATION[Math.floor(Math.random() * ATTACHABLE_PUNCTUATION.length)]
      // Avoid double punctuation if the word somehow has it
      if (!/[.,!?;:]/.test(word.slice(-1))) {
        word = word + punc
      }
      isNextWordStartOfSentence = ['.', '!', '?'].includes(punc)
    } else {
      isNextWordStartOfSentence = false
    }

    result.push(word)
  }

  return result
}

export const generateWords = async (count, settings = {}) => {
  // If count is not provided, fallback to settings.testLimit, then default 25
  const limit = count || settings.testLimit || 25

  // 1. Generate the base words (raw text)
  const base = await generateBaseWords(limit, settings.isSentenceMode, settings.difficulty)

  // 2. Apply modifiers (and trim result if modifiers add extra items)
  const modified = applyModifiers(base, settings)

  // 3. Strict final slice to guarantee exact count
  return modified.slice(0, limit)
}
