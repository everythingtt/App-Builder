// Client-side GPT Tokenizer
// Uses a simplified BPE-like tokenization for estimation
class GPTTokenizer {
    constructor() {
        this.vocabSize = 100256; // GPT-4 vocab size
        this.tokenCache = new Map();
    }

    // Estimate token count (approximate, ~20% accuracy for most text)
    estimateTokens(text) {
        if (!text) return 0;
        
        // Check cache
        if (this.tokenCache.has(text)) {
            return this.tokenCache.get(text);
        }

        // Simple estimation: ~4 chars per token for English
        // ~1.5 chars per token for CJK
        // ~3-4 chars per token for code
        let tokenCount = 0;
        
        // Count by character types
        const asciiChars = (text.match(/[\x00-\x7F]/g) || []).length;
        const nonAsciiChars = (text.match(/[^\x00-\x7F]/g) || []).length;
        
        tokenCount = Math.ceil(asciiChars / 4) + Math.ceil(nonAsciiChars / 1.5);

        // Account for special tokens and formatting
        const newlines = (text.match(/\n/g) || []).length;
        const spaces = (text.match(/\s+/g) || []).length;
        tokenCount += Math.ceil(newlines * 0.5) + Math.ceil(spaces * 0.25);

        // Cache result (limit cache size)
        if (this.tokenCache.size < 10000) {
            this.tokenCache.set(text, tokenCount);
        }

        return Math.max(1, tokenCount);
    }

    // More accurate tokenization using regex patterns
    tokenize(text) {
        if (!text) return [];
        
        // GPT-4 tokenization patterns
        const patterns = [
            /'(?:[sd]|ll|re|ve|m|t)/gi,  // Contractions
            /\b\w+(?:['-]\w+)*\b/g,     // Words with hyphens/apostrophes
            /\d+(?:\.\d+)?/g,            // Numbers
            /[^\w\s]/g,                   // Punctuation
            /\s+/g                        // Whitespace
        ];

        let tokens = [];
        let remaining = text;

        for (const pattern of patterns) {
            const matches = remaining.match(pattern) || [];
            tokens = tokens.concat(matches);
        }

        return tokens.filter(t => t.length > 0);
    }

    // Count tokens in chat messages
    countChatTokens(messages) {
        let totalTokens = 0;
        
        for (const msg of messages) {
            // Add role tokens (~3 tokens per role)
            totalTokens += 3;
            
            if (typeof msg.content === 'string') {
                totalTokens += this.estimateTokens(msg.content);
            } else if (Array.isArray(msg.content)) {
                for (const part of msg.content) {
                    if (part.type === 'text') {
                        totalTokens += this.estimateTokens(part.text);
                    } else if (part.type === 'image_url') {
                        totalTokens += 85; // Image token estimate
                    }
                }
            }
            
            // Add tool call tokens if present
            if (msg.tool_calls) {
                totalTokens += this.estimateTokens(JSON.stringify(msg.tool_calls));
            }
        }
        
        return totalTokens;
    }
}

// Global tokenizer instance
const tokenizer = new GPTTokenizer();