// Chat Manager
class ChatManager {
    constructor() {
        this.messages = [];
        this.isProcessing = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadChatHistory();
        this.updateCoinDisplay();
    }

    setupEventListeners() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        const clearBtn = document.getElementById('clearChatBtn');
        const exportBtn = document.getElementById('exportChatBtn');

        sendBtn.addEventListener('click', () => this.sendMessage());
        
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Update token count on input
        chatInput.addEventListener('input', () => {
            this.updateInputTokenCount();
        });

        clearBtn.addEventListener('click', () => this.clearChat());
        exportBtn.addEventListener('click', () => this.exportChat());
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message || this.isProcessing) return;

        // Add user message
        this.addMessage('user', message);
        input.value = '';
        this.updateInputTokenCount();

        // Show typing indicator
        this.showTypingIndicator();
        this.isProcessing = true;

        try {
            // Prepare messages for API
            const apiMessages = this.messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await apiManager.sendMessage(apiMessages);

            // Remove typing indicator
            this.hideTypingIndicator();

            // Handle tool calls
            if (response.toolCalls && response.toolCalls.length > 0) {
                await this.handleToolCalls(response.toolCalls, apiMessages);
            } else {
                // Regular response
                this.addMessage('assistant', response.content);
            }

            // Update coin display
            this.updateCoinDisplay();

            // Check coin thresholds
            this.checkCoinThresholds();

        } catch (e) {
            this.hideTypingIndicator();
            this.addMessage('system', `Error: ${e.message}`);
            console.error('Chat error:', e);
        } finally {
            this.isProcessing = false;
        }
    }

    async handleToolCalls(toolCalls, conversationHistory) {
        // Add assistant message with tool calls
        this.addMessage('assistant', null, toolCalls);

        // Execute each tool call
        for (const toolCall of toolCalls) {
            const toolCallDiv = this.createToolCallElement(toolCall);
            document.getElementById('chatMessages').appendChild(toolCallDiv);

            try {
                const result = await toolsManager.executeTool(
                    toolCall.function.name,
                    JSON.parse(toolCall.function.arguments)
                );

                // Update tool call with result
                toolCallDiv.querySelector('.tool-call-result').textContent = JSON.stringify(result, null, 2);
                toolCallDiv.querySelector('.tool-call-header').innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    ${toolCall.function.name} (completed)
                `;

                // Add tool result to conversation
                const toolResultMessage = {
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result)
                };

                conversationHistory.push({
                    role: 'assistant',
                    content: null,
                    tool_calls: toolCalls
                });
                conversationHistory.push(toolResultMessage);

            } catch (e) {
                toolCallDiv.querySelector('.tool-call-result').textContent = `Error: ${e.message}`;
                toolCallDiv.querySelector('.tool-call-header').innerHTML = `
                    <i class="fas fa-times-circle"></i>
                    ${toolCall.function.name} (failed)
                `;
            }
        }

        // Get AI response after tool execution
        continueConversation(conversationHistory);
    }

    async continueConversation(history) {
        this.showTypingIndicator();

        try {
            const response = await apiManager.sendMessage(history);
            this.hideTypingIndicator();

            if (response.toolCalls && response.toolCalls.length > 0) {
                await this.handleToolCalls(response.toolCalls, history);
            } else {
                this.addMessage('assistant', response.content);
            }

            this.updateCoinDisplay();
            this.checkCoinThresholds();

        } catch (e) {
            this.hideTypingIndicator();
            this.addMessage('system', `Error: ${e.message}`);
        }
    }

    addMessage(role, content, toolCalls = null) {
        const message = {
            role,
            content,
            tool_calls: toolCalls,
            timestamp: Date.now()
        };

        this.messages.push(message);
        this.renderMessage(message);
        this.saveChatHistory();
        this.scrollToBottom();
    }

    createToolCallElement(toolCall) {
        const div = document.createElement('div');
        div.className = 'tool-call';
        div.innerHTML = `
            <div class="tool-call-header">
                <i class="fas fa-cog fa-spin"></i>
                ${toolCall.function.name}
            </div>
            <div class="tool-call-body">
                ${this.escapeHtml(toolCall.function.arguments)}
            </div>
            <div class="tool-call-result">Executing...</div>
        `;
        return div;
    }

    renderMessage(message) {
        const container = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        
        let className = `message ${message.role}`;
        if (message.role === 'assistant' && coinManager.getBalance() < 0) {
            className += ' rude';
        }
        messageDiv.className = className;

        if (message.role === 'system') {
            messageDiv.innerHTML = `
                <div class="message-content">${this.escapeHtml(message.content)}</div>
            `;
        } else if (message.role === 'tool') {
            // Tool results are rendered separately
            return;
        } else {
            const headerIcon = message.role === 'user' ? 'fa-user' : 'fa-robot';
            messageDiv.innerHTML = `
                <div class="message-header">
                    <i class="fas ${headerIcon}"></i>
                    ${message.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div class="message-content">${this.formatContent(message.content)}</div>
            `;
        }

        container.appendChild(messageDiv);
    }

    formatContent(content) {
        if (!content) return '';
        
        // Escape HTML
        let formatted = this.escapeHtml(content);
        
        // Format code blocks
        formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
        
        // Format inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Format line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    showTypingIndicator() {
        const container = document.getElementById('chatMessages');
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(indicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }

    scrollToBottom() {
        const container = document.getElementById('chatMessages');
        container.scrollTop = container.scrollHeight;
    }

    updateInputTokenCount() {
        const input = document.getElementById('chatInput');
        const tokens = tokenizer.estimateTokens(input.value);
        document.getElementById('tokenCount').textContent = tokens;
    }

    updateCoinDisplay() {
        coinManager.updateUI();
    }

    checkCoinThresholds() {
        const status = coinManager.checkThresholds();
        
        if (status === 'rude') {
            window.modalManager.show('rudeModeModal');
        } else if (status === 'low') {
            window.modalManager.show('lowCoinsModal');
        }
    }

    clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            this.messages = [];
            document.getElementById('chatMessages').innerHTML = '';
            chatHistoryManager.newSession();
        }
    }

    exportChat() {
        const chatData = JSON.stringify(this.messages, null, 2);
        const blob = new Blob([chatData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    saveChatHistory() {
        chatHistoryManager.addMessage(
            chatHistoryManager.currentSession,
            'user',
            this.messages[this.messages.length - 1]?.content || ''
        );
    }

    loadChatHistory() {
        const history = chatHistoryManager.getCurrentSession();
        if (history.length > 0) {
            history.forEach(msg => {
                if (msg.role === 'user' || msg.role === 'assistant') {
                    this.addMessage(msg.role, msg.content, msg.tool_calls);
                }
            });
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global chat manager
const chatManager = new ChatManager();