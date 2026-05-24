const API_KEYS = [
  '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',
  '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',
  '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',
  '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'
];

const DEFAULT_MODEL = 'openrouter/owl-alpha';

const MODELS = {
  'openrouter/owl-alpha': { name: 'OWL Alpha', cost: 2, context: 32768 },
  'baidu/cobuddy:free': { name: 'Cobuddy', cost: 1, context: 8192 },
  'poolside/laguna-xs.2:free': { name: 'Laguna XS.2', cost: 1, context: 16384 },
  'nvidia/nemotron-3-super-120b-a12b:free': { name: 'Nemotron 3 Super', cost: 1, context: 65536 },
  'openai/gpt-oss-120b:free': { name: 'GPT-OSS 120B', cost: 1, context: 131072 },
  'qwen/qwen3-coder-next': { name: 'Qwen3 Coder Next', cost: 11, context: 131072 },
  'minimax/minimax-m2.5': { name: 'MiniMax M2.5', cost: 15, context: 131072 },
  'qwen/qwen3-coder': { name: 'Qwen3 Coder', cost: 22, context: 131072 }
};

class OpenRouterClient {
  constructor() {
    this.currentKeyIndex = 0;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.proxyURL = '/api/openrouter';
  }

  getModels() {
    return MODELS;
  }

  getModelInfo(modelId) {
    return MODELS[modelId] || MODELS[DEFAULT_MODEL];
  }

  calculateCost(modelId, promptTokens, completionTokens = 0) {
    const model = this.getModelInfo(modelId);
    return model.cost;
  }

  async chat(messages, options = {}) {
    const {
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxTokens = 2048,
      stream = false,
      onChunk = null
    } = options;

    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream
    };

    if (stream && onChunk) {
      return this.streamChat(requestBody, onChunk);
    }

    return this.simpleChat(requestBody);
  }

  async simpleChat(requestBody) {
    let lastError;

    for (let i = 0; i < API_KEYS.length; i++) {
      const keyIndex = (this.currentKeyIndex + i) % API_KEYS.length;
      const apiKey = API_KEYS[keyIndex];

      try {
        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'OWL IDE'
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          this.currentKeyIndex = keyIndex;
          return await response.json();
        }

        if (response.status === 429) {
          lastError = { status: 429, message: 'Rate limited' };
          continue;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      } catch (error) {
        if (error.status !== 429) {
          throw error;
        }
      }
    }

    throw new Error(lastError?.message || 'All API keys rate limited');
  }

  async streamChat(requestBody, onChunk) {
    let lastError;

    for (let i = 0; i < API_KEYS.length; i++) {
      const keyIndex = (this.currentKeyIndex + i) % API_KEYS.length;
      const apiKey = API_KEYS[keyIndex];

      try {
        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'OWL IDE'
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          this.currentKeyIndex = keyIndex;
          
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  onChunk(parsed);
                } catch (e) {
                  console.warn('Failed to parse chunk:', e);
                }
              }
            }
          }

          return;
        }

        if (response.status === 429) {
          lastError = { status: 429, message: 'Rate limited' };
          continue;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      } catch (error) {
        if (error.status !== 429) {
          throw error;
        }
      }
    }

    throw new Error(lastError?.message || 'All API keys rate limited');
  }

  async chatWithProxy(requestBody) {
    const response = await fetch(`${this.proxyURL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Proxy error: ${response.status}`);
    }

    return response.json();
  }

  getAvailableKeys() {
    return API_KEYS.length;
  }

  getKeyStatus() {
    return {
      current: this.currentKeyIndex,
      total: API_KEYS.length,
      keys: API_KEYS.map((key, i) => ({
        index: i,
        prefix: key.slice(0, 12) + '...',
        isCurrent: i === this.currentKeyIndex
      }))
    };
  }
}

const openRouterClient = new OpenRouterClient();

export { OpenRouterClient, openRouterClient, MODELS, DEFAULT_MODEL };

export async function sendMessage(messages, model = DEFAULT_MODEL, options = {}) {
  return openRouterClient.chat(messages, { model, ...options });
}

export async function sendMessageStreaming(messages, model = DEFAULT_MODEL, onChunk) {
  return openRouterClient.chat(messages, { model, stream: true, onChunk });
}

export function getModelCost(modelId) {
  return openRouterClient.getModelInfo(modelId)?.cost || 2;
}

export function getModelContextLimit(modelId) {
  return openRouterClient.getModelInfo(modelId)?.context || 32768;
}
