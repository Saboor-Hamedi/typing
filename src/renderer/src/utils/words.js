/**
 * words.js
 * 
 * Standardized word lists inspired by top typing apps (Monkeytype).
 * Contains common English words for optimal flow and rhythm.
 */

// Top 200-1000 common English words for a balanced "Advanced" experience
const ADVANCED_WORDS = [
  'the', 'be', 'of', 'and', 'a', 'to', 'in', 'he', 'have', 'it', 'that', 'for', 'they', 'with', 'as', 'not', 'on', 'she', 'at', 'by', 
  'this', 'we', 'you', 'do', 'but', 'from', 'or', 'which', 'one', 'would', 'all', 'will', 'there', 'say', 'who', 'make', 'when', 'can', 
  'more', 'if', 'no', 'man', 'out', 'other', 'so', 'what', 'time', 'up', 'go', 'about', 'than', 'into', 'could', 'state', 'only', 'new', 
  'year', 'some', 'take', 'come', 'these', 'know', 'see', 'use', 'get', 'like', 'then', 'first', 'any', 'work', 'now', 'may', 'such', 
  'give', 'over', 'think', 'most', 'even', 'find', 'day', 'also', 'after', 'way', 'many', 'must', 'look', 'before', 'great', 'back', 
  'through', 'long', 'where', 'much', 'should', 'well', 'people', 'down', 'own', 'just', 'because', 'good', 'each', 'those', 'feel', 
  'seem', 'how', 'high', 'too', 'place', 'little', 'world', 'very', 'still', 'nation', 'hand', 'old', 'life', 'tell', 'write', 'become', 
  'here', 'show', 'house', 'both', 'between', 'need', 'mean', 'call', 'develop', 'under', 'last', 'right', 'move', 'thing', 'general', 
  'school', 'never', 'same', 'another', 'begin', 'while', 'number', 'part', 'turn', 'real', 'leave', 'might', 'want', 'point', 'form', 
  'off', 'child', 'few', 'small', 'since', 'against', 'ask', 'late', 'home', 'interest', 'large', 'person', 'end', 'open', 'public', 
  'follow', 'during', 'present', 'without', 'again', 'hold', 'govern', 'around', 'possible', 'head', 'consider', 'word', 'program', 
  'problem', 'however', 'lead', 'system', 'set', 'order', 'eye', 'plan', 'run', 'keep', 'face', 'fact', 'group', 'play', 'stand', 
  'increase', 'early', 'course', 'change', 'help', 'line', 'city', 'put', 'close', 'case', 'force', 'meet', 'once', 'water', 'upon', 
  'war', 'build', 'hear', 'light', 'unite', 'live', 'every', 'country', 'bring', 'center', 'let', 'side', 'try', 'provide', 'continue', 
  'name', 'certain', 'power', 'pay', 'result', 'question', 'study', 'woman', 'member', 'until', 'far', 'night', 'always', 'service', 
  'away', 'report', 'something', 'company', 'week', 'church', 'toward', 'start', 'social', 'room', 'figure', 'nature', 'though', 'young', 
  'less', 'enough', 'almost', 'read', 'include', 'president', 'nothing', 'yet', 'better', 'big', 'boy', 'cost', 'business', 'value', 
  'second', 'why', 'clear', 'expect', 'family', 'complete', 'act', 'sense', 'mind', 'experience', 'art', 'next', 'near', 'direct', 
  'car', 'law', 'industry', 'important', 'girl', 'god', 'several', 'matter', 'usual', 'rather', 'per', 'often', 'kind', 'among', 
  'white', 'reason', 'action', 'return', 'foot', 'care', 'simple', 'within', 'love', 'human', 'along', 'appear', 'doctor', 'believe', 
  'speak', 'active', 'student', 'month', 'drive', 'concern', 'best', 'door', 'hope', 'example', 'inform', 'body', 'ever', 'least', 
  'probable', 'understand', 'reach', 'effect', 'different', 'idea', 'whole', 'control', 'condition', 'field', 'pass', 'fall', 'note', 
  'special', 'talk', 'particular', 'today', 'measure', 'walk', 'teach', 'low', 'hour', 'type', 'carry', 'rate', 'remain', 'full', 
  'street', 'easy', 'although', 'record', 'sit', 'determine', 'level', 'local', 'sure', 'receive', 'thus', 'moment', 'spirit', 'train', 
  'college', 'religion', 'perhaps', 'music', 'grow', 'free', 'cause', 'serve', 'age', 'book', 'board', 'recent', 'sound', 'office', 
  'cut', 'step', 'class', 'true', 'history', 'position', 'above', 'strong', 'friend', 'necessary', 'add', 'court', 'deal', 'tax', 
  'support', 'party', 'whether', 'land', 'occur', 'material', 'happen', 'education', 'death', 'agree', 'arm', 'mother', 'across', 
  'quite', 'anything', 'town', 'past', 'view', 'society', 'manage', 'answer', 'break', 'organize', 'half', 'fire', 'lose', 'money', 
  'stop', 'actual', 'already', 'effort', 'wait', 'department', 'able', 'political', 'learn', 'voice', 'vote', 'air', 'together', 
  'shall', 'cover', 'common', 'subject', 'draw', 'short', 'wife', 'treat', 'limit', 'road', 'letter', 'color', 'behind', 'produce', 
  'send', 'term', 'total', 'university', 'rise', 'century', 'success', 'minute', 'remember', 'purpose', 'test', 'fight', 'watch', 
  'situation', 'south', 'ago', 'difference', 'stage', 'father', 'table', 'rest', 'bear', 'entire', 'market', 'prepare', 'explain', 
  'offer', 'plant', 'charge', 'ground', 'west', 'picture', 'hard', 'front', 'lie', 'modern', 'dark', 'surface', 'rule', 'regard', 
  'dance', 'peace', 'observe', 'future', 'wall', 'farm', 'claim', 'firm', 'operation', 'further', 'pressure', 'property', 'morning', 
  'amount', 'top', 'outside', 'piece', 'sometimes', 'beauty', 'trade', 'fear', 'demand', 'wonder', 'list', 'accept', 'judge', 'paint', 
  'mile', 'soon', 'responsible', 'allow', 'secretary', 'heart', 'union', 'slow', 'island', 'enter', 'drink', 'story', 'experiment', 
  'stay', 'paper', 'space', 'apply', 'decide', 'share', 'desire', 'spend', 'sign', 'therefore', 'various', 'visit', 'supply', 
  'officer', 'doubt', 'private', 'immediate', 'wish', 'contain', 'feed', 'raise', 'describe', 'ready', 'horse', 'son', 'exist', 
  'north', 'suggest', 'station', 'effective', 'food', 'deep', 'wide', 'alone', 'character', 'english', 'happy', 'critic', 'unit', 
  'product', 'respect', 'drop', 'nor', 'fill', 'cold', 'represent', 'sudden', 'basic', 'kill', 'fine', 'trouble', 'mark', 'single', 
  'press', 'heavy', 'attempt', 'origin', 'standard', 'everything', 'committee', 'moral', 'black', 'red', 'bad', 'earth', 'accord', 
  'else', 'mere', 'die', 'remark', 'basis', 'various', 'except', 'struggle', 'myself', 'certainly', 'sweet', 'degree', 'landscape', 
  'market', 'careful', 'element', 'enjoy', 'master', 'past', 'block', 'quick', 'fun', 'crowd', 'write', 'succeed', 'bottom', 'check', 
  'sun', 'strange', 'news', 'dream', 'skill', 'search', 'pain', 'laugh', 'finger', 'edge', 'miss', 'connect', 'listen', 'fail', 
  'clean', 'please', 'vision', 'variety', 'teacher', 'trust', 'stone', 'surprise', 'handle', 'climb', 'breath', 'arrange', 'busy', 
  'match', 'seed', 'tone', 'radio', 'beam', 'game', 'planet', 'track', 'noise', 'level', 'safe', 'gather', 'sharp', 'suit', 
  'salt', 'nose', 'river', 'brain', 'shop', 'camp', 'symbol', 'sight', 'thin', 'soft', 'speak', 'weight', 'language', 'ocean'
];

// Short, punchy sentences for flow (used sparingly or if configured)
const SENTENCES = [
  "The quick brown fox jumps over the lazy dog.",
  "Pack my box with five dozen liquor jugs.",
  "Sphinx of black quartz, judge my vow.",
  "To be or not to be, that is the question.",
  "All the world's a stage, and all the men and women merely players.",
  "A journey of a thousand miles begins with a single step.",
  "Knowledge is power.",
  "Time waits for no one.",
  "Fortune favors the bold.",
  "Action speaks louder than words.",
  "Where there is a will, there is a way.",
  "Keep your face always toward the sunshine and shadows will fall behind you.",
  "Be the change that you wish to see in the world.",
  "In three words I can sum up everything I've learned about life: it goes on.",
  "If you tell the truth, you don't have to remember anything.",
  "A friend to all is a friend to none.",
  "Life differs from the play only in this... it has no plot, all is random, no cause and effect.",
  "Simplicity is the ultimate sophistication.",
  "Whatever you are, be a good one.",
  "If you're going through hell, keep going.",
  "Every moment is a fresh beginning.",
  "Change the world by being yourself.",
  "Die with memories, not dreams.",
  "Everything you can imagine is real.",
  "Tough times never last but tough people do.",
  "Problems are not stop signs, they are guidelines.",
  "One day the people that didn't believe in you will tell everyone how they met you.",
  "Impossible is just an opinion.",
  "Your time is limited, so don't waste it living someone else's life.",
  "Believe you can and you're halfway there."
];

const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Symbols that can be attached to words for punctuation mode
const ATTACHABLE_PUNCTUATION = ['.', ',', '!', '?', ';', ':'];

/**
 * Generate a list of words based on configuration
 */
export const generateWords = (count = 50, settings = {}) => {
  const {
    hasPunctuation = false,
    hasNumbers = false,
    hasCaps = false,
    isSentenceMode = false
  } = settings;

  // Use the standard Monkeytype-style list (mostly lowercase common words)
  const source = [...ADVANCED_WORDS];
  
  const result = [];
  let currentWordCount = 0;

  // Reduced sentence frequency for more standard flow
  // Only use sentences 15% of the time, and NEVER if numbers are enabled (keeps it clean)
  const useSentenceChance = 0.15; 

  while (currentWordCount < count) {
    // SENTENCE MODE LOGIC: Force coherent sentences or structured random words
    if (isSentenceMode && !hasNumbers) {
      // Pick a real sentence
      const sentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
      // Always keep punctuation/caps for Sentence Mode (it's "Real" text)
      const wordsInSentence = sentence.split(/\s+/);
      
      for (const w of wordsInSentence) {
        if (!w || currentWordCount >= count) break;
        result.push(w);
        currentWordCount++;
      }
      // If we filled the count, stop
      if (currentWordCount >= count) break;
      continue;
    }

    // ... standard logic ...
    const isFirstInTest = result.length === 0;

    // OPTIONAL: Inject a coherent sentence occasionally for variety (Standard Mode)
    if (!isSentenceMode && !hasNumbers && Math.random() < useSentenceChance) {
      const sentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
      // Remove trailing punctuation from sentence if punctuation mode is OFF, 
      // otherwise keep it naturally.
      let cleanSentence = sentence;
      if (!hasPunctuation) {
        cleanSentence = sentence.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s{2,}/g, " ");
      }
      
      if (!hasCaps) {
        cleanSentence = cleanSentence.toLowerCase();
      }

      const wordsInSentence = cleanSentence.split(/\s+/);
      
      for (const w of wordsInSentence) {
        if (!w || currentWordCount >= count) break;
        result.push(w);
        currentWordCount++;
      }
      continue;
    }

    // STANDARD RANDOM WORD GENERATION
    
    // 1. Numbers Mode
    if (hasNumbers && !isFirstInTest && Math.random() > 0.85) {
      // Generate a random number string (1-3 digits) for realistic number typing
      const len = Math.floor(Math.random() * 3) + 1;
      let numStr = '';
      for(let i=0; i<len; i++) {
        numStr += NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
      }
      result.push(numStr);
      currentWordCount++;
      continue;
    }

    // 2. Standard Word
    let word = source[Math.floor(Math.random() * source.length)];

    // 3. Apply Modifiers (Only if not in Sentence Mode, or if mixing)
    if (hasCaps) {
      // Capitalize first letter randomly
      if (Math.random() > 0.8 || isFirstInTest) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
    }

    if (hasPunctuation && !isFirstInTest && Math.random() > 0.85) {
      const punc = ATTACHABLE_PUNCTUATION[Math.floor(Math.random() * ATTACHABLE_PUNCTUATION.length)];
      word = word + punc;
    }

    result.push(word);
    currentWordCount++;
  }

  // Ensure no immediate repeats
  for (let i = 1; i < result.length; i++) {
    if (result[i] === result[i-1]) {
      let newWord;
      do {
        newWord = source[Math.floor(Math.random() * source.length)];
      } while (newWord === result[i-1]);
      result[i] = newWord;
    }
  }

  return result;
};
