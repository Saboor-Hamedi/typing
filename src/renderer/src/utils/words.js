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
 * Generate a list of base words (without dynamic modifiers)
 */
export const generateBaseWords = (count = 50, isSentenceMode = false) => {
  const result = [];
  let currentWordCount = 0;
  
  // Reduced sentence frequency for more standard flow
  const useSentenceChance = 0.15;

  while (currentWordCount < count) {
    if (isSentenceMode) {
      // Sentence Mode: Pick quotes
      const sentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
      const wordsInSentence = sentence.split(/\s+/);
      for (const w of wordsInSentence) {
        if (!w || currentWordCount >= count) break;
        result.push({ text: w, type: 'quote' }); // Tag as quote
        currentWordCount++;
      }
      if (currentWordCount >= count) break;
      continue;
    }

    // Standard Mode
    // Occasional sentence injection
    if (Math.random() < useSentenceChance) {
      const sentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
      const wordsInSentence = sentence.split(/\s+/);
      for (const w of wordsInSentence) {
        if (!w || currentWordCount >= count) break;
        // Strip punctuation/quotes for standard mode base
        const cleanW = w.replace(/[",]/g, ''); 
        result.push({ text: cleanW, type: 'quote' });
        currentWordCount++;
      }
      continue;
    }

    // Random Words
    let word = ADVANCED_WORDS[Math.floor(Math.random() * ADVANCED_WORDS.length)];
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
    if (hasNumbers && Math.random() > 0.85) {
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
       // If Quote, apply settings (Stripping/Lowercasing)
       if (!hasCaps) {
         word = word.toLowerCase();
       }
       // If standard mode, we might want to strip all punc if hasPunctuation is false
       // If sentence mode, we might respect the quote's punc unless explicitly disabled
       if (!hasPunctuation) {
          word = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s{2,}/g, " ");
       }
       
       result.push(word);
       
       // Handle number injection (User requested numbers allowed in sentence mode)
       tryAddNumber();
       
       // Update sentence state based on THIS word's punc (for next word if mixed)
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
    if (hasPunctuation && Math.random() > 0.85) {
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
