const API_KEYS = [
  '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',
  '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',
  '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',
  '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'
];

let currentKeyIndex = 0;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, messages, stream, temperature, max_tokens } = req.body;

    const requestBody = {
      model: model || 'openrouter/owl-alpha',
      messages,
      stream: stream || false,
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens || 2048
    };

    let lastError;
    for (let i = 0; i < API_KEYS.length; i++) {
      const keyIndex = (currentKeyIndex + i) % API_KEYS.length;
      const apiKey = API_KEYS[keyIndex];

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': req.headers.referer || 'https://app-builder-ide.vercel.app',
            'X-Title': 'App Builder IDE'
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          currentKeyIndex = keyIndex;
          
          if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(decoder.decode(value, { stream: true }));
            }
            res.end();
            return;
          } else {
            const data = await response.json();
            return res.json(data);
          }
        } else if (response.status === 429) {
          lastError = { status: 429, message: 'Rate limited' };
          continue;
        } else {
          const errorData = await response.json();
          lastError = { status: response.status, message: errorData.error?.message || 'Unknown error' };
        }
      } catch (error) {
        lastError = { message: error.message };
      }
    }

    res.status(lastError?.status || 500).json({ error: lastError?.message || 'All API keys exhausted' });
  } catch (error) {
    console.error('OpenRouter Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
};
