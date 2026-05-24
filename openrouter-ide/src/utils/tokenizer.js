const TIKTOKEN_VOCAB = {
  'cl100k_base': null
};

class SimpleTokenizer {
  constructor() {
    this.vocab = new Map();
    this.pattern = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;
  }

  estimateTokens(text) {
    if (!text) return 0;
    
    const matches = text.match(this.pattern) || [];
    let tokens = 0;
    
    for (const match of matches) {
      if (match.length <= 4) {
        tokens += 1;
      } else {
        tokens += Math.ceil(match.length / 4);
      }
    }
    
    return tokens;
  }

  encode(text) {
    const matches = text.match(this.pattern) || [];
    return matches.map((match, index) => ({
      id: index,
      text: match,
      start: text.indexOf(match),
      end: text.indexOf(match) + match.length
    }));
  }

  decode(tokens) {
    return tokens.map(t => t.text || '').join('');
  }

  countTokensForModel(text, model = 'gpt-3.5-turbo') {
    const baseCount = this.estimateTokens(text);
    
    const modelMultipliers = {
      'gpt-4': 1.0,
      'gpt-4-32k': 1.0,
      'gpt-3.5-turbo': 1.0,
      'gpt-3.5-turbo-16k': 1.0,
      'text-davinci-003': 1.2,
      'text-davinci-002': 1.2,
      'claude-2': 0.9,
      'claude-instant': 0.9,
      'openrouter/owl-alpha': 1.1,
      'baidu/cobuddy:free': 1.0,
      'poolside/laguna-xs.2:free': 1.0,
      'nvidia/nemotron-3-super-120b-a12b:free': 1.0,
      'openai/gpt-oss-120b:free': 1.0,
      'qwen/qwen3-coder-next': 0.95,
      'minimax/minimax-m2.5': 1.05,
      'qwen/qwen3-coder': 0.95
    };
    
    const multiplier = modelMultipliers[model] || 1.0;
    return Math.ceil(baseCount * multiplier);
  }
}

const tokenizer = new SimpleTokenizer();

export { tokenizer, SimpleTokenizer };

export function estimateFileTokens(file) {
  let tokens = 0;
  
  if (file.content) {
    tokens += tokenizer.countTokensForModel(file.content, file.model || 'gpt-3.5-turbo');
  }
  
  if (file.path) {
    tokens += tokenizer.countTokensForModel(file.path, 'gpt-3.5-turbo');
  }
  
  return tokens;
}

export function estimateTotalTokens(files, model = 'gpt-3.5-turbo') {
  let total = 0;
  
  files.forEach(file => {
    total += estimateFileTokens({ ...file, model });
  });
  
  return total;
}

export function checkContextLimit(files, model = 'gpt-3.5-turbo') {
  const contextLimits = {
    'gpt-4': 8192,
    'gpt-4-32k': 32768,
    'gpt-3.5-turbo': 4096,
    'gpt-3.5-turbo-16k': 16384,
    'openrouter/owl-alpha': 32768,
    'baidu/cobuddy:free': 8192,
    'poolside/laguna-xs.2:free': 16384,
    'nvidia/nemotron-3-super-120b-a12b:free': 65536,
    'openai/gpt-oss-120b:free': 131072,
    'qwen/qwen3-coder-next': 131072,
    'minimax/minimax-m2.5': 131072,
    'qwen/qwen3-coder': 131072
  };
  
  const limit = contextLimits[model] || 8192;
  const used = estimateTotalTokens(files, model);
  const remaining = limit - used;
  const percentage = (used / limit) * 100;
  
  return {
    limit,
    used,
    remaining,
    percentage,
    isWithinLimit: used <= limit,
    isWarning: percentage > 70,
    isCritical: percentage > 90
  };
}

export function getContextStatus(files, model = 'gpt-3.5-turbo') {
  const status = checkContextLimit(files, model);
  
  let type = 'ok';
  if (status.isCritical) type = 'critical';
  else if (status.isWarning) type = 'warning';
  else if (!status.isWithinLimit) type = 'exceeded';
  
  return {
    ...status,
    type
  };
}
