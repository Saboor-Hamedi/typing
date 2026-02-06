/**
 * words.js
 * 
 * Standardized word lists inspired by top typing apps (Monkeytype).
 * Contains common English words for optimal flow and rhythm.
 */

import wordsData from '../assets/words.json';

// Combine all word tiers for a rich vocabulary
const ALL_WORDS = [
  ...wordsData.beginner,
  ...wordsData.intermediate,
  ...wordsData.advanced
];

const SENTENCES = wordsData.sentences;

const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Symbols that can be attached to words for punctuation mode
const ATTACHABLE_PUNCTUATION = ['.', ',', '!', '?', ';', ':'];

/**
 * Generate a list of base words (without dynamic modifiers)
 */
export const generateBaseWords = (count = 50, isSentenceMode = false) => {
  const result = [];
  let currentWordCount = 0;
  
  // Reduced sentence frequency for more standard flow
  const useSentenceChance = 0.15;

  while (currentWordCount < count) {
    if (isSentenceMode) {
      // Sentence Mode: Pick quotes and ALWAYS finish them
      const sentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
      const wordsInSentence = sentence.split(/\s+/).filter(Boolean);
      for (let i = 0; i < wordsInSentence.length; i++) {
        const w = wordsInSentence[i];
        result.push({ 
          text: w, 
          type: 'quote', 
          isStart: i === 0, 
          isEnd: i === wordsInSentence.length - 1 
        });
        currentWordCount++;
      }
      continue;
    }

    // Standard Mode
    // Occasional sentence injection - ALWAYS finish the sentence
    if (Math.random() < useSentenceChance) {
      const sentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
      const wordsInSentence = sentence.split(/\s+/).filter(Boolean);
      for (let i = 0; i < wordsInSentence.length; i++) {
        const w = wordsInSentence[i];
        const cleanW = w.replace(/[",]/g, ''); 
        result.push({ 
          text: cleanW, 
          type: 'quote', 
          isStart: i === 0, 
          isEnd: i === wordsInSentence.length - 1 
        });
        currentWordCount++;
      }
      continue;
    }

    // Random Words
    let word = ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)];
    result.push({ text: word, type: 'word' });
    currentWordCount++;
  }
  return result;
};

/**
 * Apply modifiers (Punc, Caps, Numbers) to base words
 */
export const applyModifiers = (baseWords, settings) => {
  const {
    hasPunctuation = false,
    hasNumbers = false,
    hasCaps = false,
    isSentenceMode = false
  } = settings;

  const result = [];
  
  // Helper to inject numbers
  const tryAddNumber = () => {
    // Increased frequency for numbers (15% -> 25%)
    if (hasNumbers && Math.random() > 0.75) {
       const len = Math.floor(Math.random() * 3) + 1;
       let numStr = '';
       for(let i=0; i<len; i++) {
         numStr += NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
       }
       result.push(numStr);
    }
  };


  // State for caps flow
  let sentenceStart = true;

  for (let i = 0; i < baseWords.length; i++) {
    const item = baseWords[i];
    let word = item.text;
    const isQuote = item.type === 'quote';

    // 1. Handling Quote Words (Sentence Mode or Injected)
    if (isQuote) {
       // If Quote start, handle capitalization
       if (hasCaps && item.isStart) {
         word = word.charAt(0).toUpperCase() + word.slice(1);
       } else if (!hasCaps) {
         word = word.toLowerCase();
       }

       // Handle punctuation
       if (!hasPunctuation) {
          // Force strip everything if punc is OFF
          word = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s{2,}/g, " ");
       } else if (item.isEnd) {
          // If punc is ON and it's the end of a sentence, ensure a period exists
          const lastChar = word.slice(-1);
          if (!['.', '!', '?', ';', ':'].includes(lastChar)) {
            word = word + '.';
          }
       }
       
       result.push(word);
       
       // Handle number injection
       tryAddNumber();
       
       // Update sentence state for next word
       const lastChar = word.slice(-1);
       sentenceStart = ['.', '!', '?'].includes(lastChar);
       continue;
    }

    // 2. Handling Standard Random Words
    
    // Numbers injection
    tryAddNumber();

    // Caps Logic
    let shouldCap = false;
    if (hasCaps) {
       if (hasPunctuation) {
         // Strict Flow
         shouldCap = sentenceStart;
       } else {
         // Random Caps
         shouldCap = Math.random() > 0.8 || i === 0;
       }
    }

    if (shouldCap) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    } else if (!hasCaps) {
      word = word.toLowerCase();
    }

    // Punctuation Logic
    // Increased frequency (15% -> 30%)
    if (hasPunctuation && Math.random() > 0.70) {
      const punc = ATTACHABLE_PUNCTUATION[Math.floor(Math.random() * ATTACHABLE_PUNCTUATION.length)];
      word = word + punc;
      
      if (['.', '!', '?'].includes(punc)) {
         sentenceStart = true;
      } else {
         sentenceStart = false; 
      }
    } else {
       sentenceStart = false; 
    }

    result.push(word);
  }

  return result;
};

export const generateWords = (count = 50, settings = {}) => {
  const base = generateBaseWords(count, settings.isSentenceMode);
  return applyModifiers(base, settings);
};
