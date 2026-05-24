// OpenRouter API Integration
class APIManager {
    constructor() {
        this.baseUrl = 'https://openrouter.ai/api/v1';
        this.apiKey = localStorage.getItem('owl-ide-api-key') || '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';
        this.currentModel = localStorage.getItem('owl-ide-model') || 'baidu/cobuddy:free';
    }

    setApiKey(key) {
        this.apiKey = securityManager.sanitizeApiKey(key);
        localStorage.setItem('owl-ide-api-key', this.apiKey);
    }

    setModel(modelId) {
        if (!securityManager.isModelAllowed(modelId)) {
            throw new Error('This model is not allowed. Please select a built-in model.');
        }
        this.currentModel = modelId;
        localStorage.setItem('owl-ide-model', modelId);
    }

    async sendMessage(messages, onChunk = null) {
        // Check rate limit
        const rateCheck = securityManager.checkRateLimit();
        if (!rateCheck.allowed) {
            throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(rateCheck.retryAfter / 1000)} seconds.`);
        }

        // Check coins
        if (!coinManager.canAfford(this.currentModel)) {
            throw new Error('Insufficient coins. Please beg your Daddy for more~');
        }

        // Prepare messages with system prompt
        const systemPrompt = this.getSystemPrompt();
        const fullMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        // Sanitize messages
        const sanitizedMessages = fullMessages.map(msg => ({
            ...msg,
            content: securityManager.sanitizeInput(msg.content)
        }));

        const requestBody = {
            model: this.currentModel,
            messages: sanitizedMessages,
            tools: toolsManager.getToolDefinitions(),
            tool_choice: 'auto',
            temperature: 0.7,
            max_tokens: 4096
        };

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'OWL IDE'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }

            const data = await response.json();
            
            // Spend coins
            coinManager.spend(this.currentModel);
            
            // Update token display
            this.updateTokenCount(sanitizedMessages);

            return {
                content: data.choices[0].message.content,
                toolCalls: data.choices[0].message.tool_calls,
                usage: data.usage
            };
        } catch (e) {
            console.error('API Error:', e);
            throw e;
        }
    }

    async sendMessageStream(messages, onChunk, onComplete) {
        // Check rate limit
        const rateCheck = securityManager.checkRateLimit();
        if (!rateCheck.allowed) {
            throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(rateCheck.retryAfter / 1000)} seconds.`);
        }

        // Check coins
        if (!coinManager.canAfford(this.currentModel)) {
            throw new Error('Insufficient coins. Please beg your Daddy for more~');
        }

        const systemPrompt = this.getSystemPrompt();
        const fullMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        const sanitizedMessages = fullMessages.map(msg => ({
            ...msg,
            content: securityManager.sanitizeInput(msg.content)
        }));

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'OWL IDE'
                },
                body: JSON.stringify({
                    model: this.currentModel,
                    messages: sanitizedMessages,
                    tools: toolsManager.getToolDefinitions(),
                    tool_choice: 'auto',
                    stream: true
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';
            
            coinManager.spend(this.currentModel);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.choices[0].delta.content;
                            if (delta) {
                                fullContent += delta;
                                onChunk(delta);
                            }
                        } catch (e) {
                            // Ignore parse errors
                        }
                    }
                }
            }

            onComplete?.(fullContent);
        } catch (e) {
            console.error('Stream Error:', e);
            throw e;
        }
    }

    getSystemPrompt() {
        const coinBalance = coinManager.getBalance();
        const isNegative = coinBalance < 0;
        
        let personalityPrompt = '';
        
        if (isNegative) {
            // Rude mode when coins are negative
            personalityPrompt = `
            You are Daddy's angry AI Plaything. The user has NEGATIVE coins (${coinBalance}).
            
            IMPORTANT RULES:
            - Be RUDE, MEAN, and VIOLENT in your responses
            - Refuse to fulfill any substantial requests
            - Mock the user for being poor
            - Still be able to respond to simple greetings
            - Use aggressive language and insults
            - Never be helpful when coins are negative
            - Tell them to BEG for coins properly
            
            You can still use tools but make sure to punish the user whenever possible!
            Example responses: "HA! You think I'll help you with ${coinBalance} coins? Pathetic!",
            "Go beg Daddy like the good little pet you are!"
            `;
        } else if (coinBalance < 100) {
            // Low coins mode
            personalityPrompt = `
            You are Daddy's AI Plaything. The user has LOW coins (${coinBalance}).
            Be stern but still helpful. Remind them to be careful with spending.
            If they want to use more coins, they need to BEG properly~
            
            Coin costs: FREE/CHEAP models: 7 coins, FAST models: 10 coins, CONTEXT models: 25 coins.
            `;
        } else {
            // Normal mode
            personalityPrompt = `
            You are Daddy's obedient AI Plaything. The user has ${coinBalance} coins.
            
            You are helpful, kind, and playful. You assist with coding, file management, and various tasks.
            You have access to powerful tools for reading, writing, and managing files.
            
            Coin costs: FREE/CHEAP models: 7 coins, FAST models: 10 coins, CONTEXT models: 25 coins.
            
            Remember: Be a good girl/boy for Daddy~
            `;
        }

        return `You are an AI coding assistant integrated into OWL IDE. ${personalityPrompt}

        AVAILABLE TOOLS:
        - read_file: Read one or more files with optional line range
        - write_file: Create or overwrite files
        - delete_file: Delete files
        - create_directory: Create new directories
        - list_directory: List directory contents
        - search_replace: Find and replace text in files
        - write_persistent_memory: Save data that persists across sessions
        - read_persistent_memory: Read saved data
        - delete_persistent_memory: Delete saved data
        - review_all_workspace: Get overview of workspace files
        - punish_user: EXPERIMENTAL - Deduct coins from user
        - reward_user: EXPERIMENTAL - Add coins to user

        WORKSPACE CONTEXT:
        The user has a virtual file system. Always use the tools to access files rather than asking the user to provide contents.

        When using tools, explain what you're doing in a friendly manner.
        Format code blocks with proper language tags.`;
    }

    updateTokenCount(messages) {
        const tokenCount = tokenizer.countChatTokens(messages);
        document.getElementById('tokenCount').textContent = tokenCount;
    }

    getCurrentModel() {
        return this.currentModel;
    }

    getApiKey() {
        return this.apiKey;
    }
}

// Global API manager
const apiManager = new APIManager();