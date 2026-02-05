/**
 * words.js
 * 
 * Robust word generation system with difficulty-based tiers 
 * and complexity modifiers (punctuation, numbers, caps).
 */

const BEGINNER_WORDS = [
  'the', 'be', 'to', 'of', 'and', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'person', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
  'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'
];

const INTERMEDIATE_WORDS = [
  'people', 'should', 'public', 'system', 'through', 'school', 'against', 'government', 'become', 'between', 'another', 'student', 'program', 'problem', 'however', 'without', 
  'business', 'company', 'during', 'present', 'without', 'under', 'general', 'interest', 'against', 'follow', 'around', 'possible', 'house', 'again', 'problem', 'state', 'point',
  'child', 'world', 'school', 'still', 'must', 'last', 'mean', 'keep', 'leave', 'right', 'write', 'place', 'under', 'where', 'after', 'never', 'while', 'family', 'group', 'always',
  'large', 'number', 'often', 'enough', 'second', 'follow', 'until', 'social', 'called', 'think', 'around', 'small', 'every', 'found', 'might', 'night', 'least', 'better', 'water',
  'called', 'white', 'almost', 'young', 'though', 'things', 'public', 'others', 'within', 'around', 'looked', 'course', 'system', 'better', 'during', 'another', 'second', 'rather'
];

const ADVANCED_WORDS = [
  'experience', 'everything', 'knowledge', 'understand', 'information', 'development', 'opportunity', 'performance', 'probability', 'relationship', 'environment', 
  'consciousness', 'experimental', 'architecture', 'intelligence', 'perspective', 'celebration', 'significant', 'professional', 'improvement', 'possibility', 'infrastructure',
  'administrative', 'characteristic', 'communication', 'comprehensive', 'consideration', 'construction', 'contribution', 'demonstration', 'distribution', 'effectiveness',
  'entertainment', 'international', 'introduction', 'investigation', 'manufacturer', 'neighborhood', 'organization', 'participation', 'philosophical', 'psychological',
  'recommendation', 'relationship', 'representative', 'satisfaction', 'transformation', 'understanding', 'university', 'alternative', 'application', 'assignment', 
  'assistance', 'assumption', 'background', 'collection', 'commission', 'comparison', 'completely', 'conclusion', 'conference', 'connection', 'consequent', 'consistent',
  'definition', 'department', 'difference', 'difficulty', 'discussion', 'expression', 'foundation', 'generation', 'historical', 'hypothesis', 'importance', 'impossible',
  'individual', 'industrial', 'instrument', 'investment', 'management', 'membership', 'percentage', 'population', 'possession', 'preference', 'production', 'profession',
  'protection', 'reasonable', 'reflection', 'resolution', 'scientific', 'television', 'temperature', 'tradition', 'transition'
];

/**
 * Coherent Sentences for Intermediate and Advanced modes 
 * used to make the typing experience feel more human and structured.
 */
const SENTENCES = [
  "the only way to do great work is to love what you do",
  "believe you can and you are halfway there",
  "your time is limited so do not waste it living someone else's life",
  "it always seems impossible until it is done",
  "success is not final failure is not fatal it is the courage to continue that counts",
  "if you can dream it you can do it",
  "hardships often prepare ordinary people for an extraordinary destiny",
  "it does not matter how slowly you go as long as you do not stop",
  "everything you have ever wanted is on the other side of fear",
  "the future belongs to those who believe in the beauty of their dreams",
  "strive not to be a success but rather to be of value",
  "you miss one hundred percent of the shots you do not take",
  "the best way to predict your future is to create it",
  "do what you can with what you have where you are",
  "happiness is not something ready made it comes from your own actions",
  "the only limit to our realization of tomorrow will be our doubts of today",
  "what lies behind us and what lies before us are tiny matters compared to what lies within us",
  "it is during our darkest moments that we must focus to see the light",
  "change your thoughts and you change your world",
  "the purpose of our lives is to be happy",
  "life is what happens when you are busy making other plans",
  "get busy living or get busy dying",
  "you only live once but if you do it right once is enough",
  "never let the fear of striking out keep you from playing the game",
  "money and success don't change people they merely amplify what is already there",
  "your time is limited so don't waste it living someone else's life",
  "not how long but how well you have lived is the main thing",
  "if life were predictable it would cease to be life and be without flavor",
  "the whole secret of a successful life is to find out what is one's destiny to do and then do it",
  "in order to write about life first you must live it"
];

const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Symbols that can be attached to words
const ATTACHABLE_PUNCTUATION = ['.', ',', '!', '?', ';', ':', '#', '@'];

/**
 * Generate a list of words based on configuration
 */
export const generateWords = (count = 50, settings = {}) => {
  const {
    difficulty = 'beginner',
    hasPunctuation = false,
    hasNumbers = false,
    hasCaps = false,
    customSentences = []
  } = settings;

  // 1. SELECT BASE WORD SOURCE
  let baseList = [...BEGINNER_WORDS];
  if (difficulty === 'intermediate') {
    baseList = [...BEGINNER_WORDS, ...INTERMEDIATE_WORDS];
  } else if (difficulty === 'advanced') {
    baseList = [...BEGINNER_WORDS, ...INTERMEDIATE_WORDS, ...ADVANCED_WORDS];
  }

  // Final filter to remove single characters from the alpha list for standalone picks
  const source = baseList.filter(w => w.length > 1);

  const result = [];
  let currentWordCount = 0;

  // 2. BUILD THE LIST
  while (currentWordCount < count) {
    const isFirstInTest = result.length === 0;

    // Use coherent sentences for intermediate/advanced/custom to make it feel human
    const useSentence = (difficulty === 'intermediate' || difficulty === 'advanced' || difficulty === 'custom') && 
                        (difficulty === 'custom' ? true : Math.random() > 0.4);

    if (useSentence && !hasNumbers) {
      let sentencePool = difficulty === 'custom' ? [...customSentences] : [...SENTENCES, ...customSentences];
      
      // Safety fallback for custom mode if empty
      if (difficulty === 'custom' && sentencePool.length === 0) {
        sentencePool = ["Please add custom sentences in settings to use this mode."];
      }
      
      if (sentencePool.length === 0) return result; 

      // For custom mode, try to avoid repeating the same sentence immediately if possible
      let sentence;
      if (difficulty === 'custom' && sentencePool.length === 1) {
          // If there's only one sentence, we have to use it.
          sentence = sentencePool[0];
      } else {
          // Randomly pick effectively
          sentence = sentencePool[Math.floor(Math.random() * sentencePool.length)];
      }

      const sentenceWords = sentence.split(' ');
      
      // Add words from sentence
      for (const word of sentenceWords) {
        // If we have satisfied the requested count, we can stop, 
        // BUT for custom mode, it feels better to finish the current sentence so it doesn't cut off.
        // However, standard logic is strict on count.
        // Let's soft-break: if over count, stop.
        if (currentWordCount >= count) break;
        
        let modifiedWord = word;
        
        // Standard Behavior: START
        if (hasCaps && (currentWordCount === 0 || Math.random() > 0.9)) {
          modifiedWord = modifiedWord.charAt(0).toUpperCase() + modifiedWord.slice(1);
        }
        // Standard Behavior: END

        // Apply internal punctuation naturally (already lowercase/clean in SENTENCES)
        // We can add random dots/commas if punctuation is on
        if (hasPunctuation && Math.random() > 0.9) {
          const punc = ATTACHABLE_PUNCTUATION[Math.floor(Math.random() * ATTACHABLE_PUNCTUATION.length)];
          modifiedWord = modifiedWord + punc;
        }

        result.push(modifiedWord);
        currentWordCount++;
      }
      
      // If we are in purely custom mode and we just finished a sentence,
      // and we have basically reached or exceeded the target count (or are close),
      // let's STOP to prevent repeating the same sentence 25 times if the user only added one.
      // This makes "Custom Mode" act more like "Type these specific sentences".
      if (difficulty === 'custom' && currentWordCount >= sentenceWords.length) {
         // Optimization: If the user provides a custom sentence, they likely just want to type THAT sentence once
         // or cycle through their list once.
         // If we have just finished adding a full sentence, let's break the main loop 
         // so we don't repeat it immediately unless the count is huge.
         // Effectively, for custom mode, "Word Count" becomes "Max Words".
         break;
      }

      continue;
    }

    // FALLBACK TO RANDOM WORDS (Mode functionality)
    // 3. Determine if we should insert a standalone number
    if (hasNumbers && !isFirstInTest && Math.random() > 0.88) {
      result.push(NUMBERS[Math.floor(Math.random() * NUMBERS.length)]);
      currentWordCount++;
      continue;
    }

    // 4. Pick a base word randomly
    let word = source[Math.floor(Math.random() * source.length)];

    // 5. Apply Capitalization
    if (hasCaps) {
        if (isFirstInTest || Math.random() > 0.8) {
            word = word.charAt(0).toUpperCase() + word.slice(1);
        }
    }

    // 6. Apply Punctuation
    if (hasPunctuation && !isFirstInTest && Math.random() > 0.85) {
      const punc = ATTACHABLE_PUNCTUATION[Math.floor(Math.random() * ATTACHABLE_PUNCTUATION.length)];
      word = word + punc;
    }

    result.push(word);
    currentWordCount++;
  }

  // 7. FINAL POLISH
  // Advanced sentence logic: optionally add a period to the very last word if punctuation is on
  if (hasPunctuation && result.length > 0) {
    const lastIdx = result.length - 1;
    if (typeof result[lastIdx] === 'string' && !result[lastIdx].endsWith('.') && !NUMBERS.includes(result[lastIdx])) {
        result[lastIdx] = result[lastIdx].replace(/[.,!?]$/, '') + '.';
    }
  }

  // Final check to ensure no immediate repeats (only for random words)
  for (let i = 1; i < result.length; i++) {
    if (result[i] === result[i-1] && !NUMBERS.includes(result[i])) {
      let newWord;
      do {
        newWord = source[Math.floor(Math.random() * source.length)];
      } while (newWord === result[i-1]);
      
      if (hasCaps && Math.random() > 0.8) {
          newWord = newWord.charAt(0).toUpperCase() + newWord.slice(1);
      }
      result[i] = newWord;
    }
  }

  return result;
};
