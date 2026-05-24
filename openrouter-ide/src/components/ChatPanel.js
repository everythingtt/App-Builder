class ChatPanel {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.getElementById(container)
      : container;

    this.options = {
      onSendMessage: options.onSendMessage || (() => {}),
      onModelChange: options.onModelChange || (() => {}),
      onApiKeyChange: options.onApiKeyChange || (() => {}),
      ...options
    };

    this.state = {
      messages: [],
      selectedModel: 'openrouter/owl-alpha',
      apiKey: '',
      isTyping: false,
      tokenBalance: 100
    };

    this.models = {
      'openrouter/owl-alpha': { name: 'OWL Alpha', cost: 2 },
      'baidu/cobuddy:free': { name: 'Cobuddy', cost: 1 },
      'poolside/laguna-xs.2:free': { name: 'Laguna XS.2', cost: 1 },
      'nvidia/nemotron-3-super-120b-a12b:free': { name: 'Nemotron 3 Super', cost: 1 },
      'openai/gpt-oss-120b:free': { name: 'GPT-OSS 120B', cost: 1 },
      'qwen/qwen3-coder-next': { name: 'Qwen3 Coder Next', cost: 11 },
      'minimax/minimax-m2.5': { name: 'MiniMax M2.5', cost: 15 },
      'qwen/qwen3-coder': { name: 'Qwen3 Coder', cost: 22 }
    };

    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="agent-panel">
        <div class="agent-header">
          <div class="agent-title">
            <span class="icon">🦉</span>
            <span>OWL Assistant</span>
          </div>
        </div>
        
        <div class="model-selector">
          <label>Model</label>
          <select id="modelSelect">
            ${Object.entries(this.models).map(([id, model]) => 
              `<option value="${id}" ${this.state.selectedModel === id ? 'selected' : ''}>
                ${model.name} (${model.cost} tokens)
              </option>`
            ).join('')}
          </select>
        </div>
        
        <div class="api-key-section">
          <label>OpenRouter API Key</label>
          <input 
            type="password" 
            id="apiKeyInput" 
            placeholder="sk-or-v1-..."
            value="${this.state.apiKey}"
          />
          <div class="key-status ${this.state.apiKey ? 'active' : ''}">
            <span class="dot"></span>
            ${this.state.apiKey ? 'API Key configured' : 'No API Key'}
          </div>
        </div>
        
        <div class="chat-container">
          <div class="chat-messages" id="chatMessages">
            ${this.state.messages.length === 0 ? this.renderEmptyState() : ''}
          </div>
          
          <div class="chat-input-container">
            <div class="chat-input-wrapper">
              <textarea 
                class="chat-input" 
                id="chatInput"
                placeholder="Ask OWL anything about your code..."
                rows="1"
              ></textarea>
              <button class="chat-send" id="sendBtn" title="Send (Enter)">➤</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="icon">🦉</div>
        <div class="title">OWL is ready</div>
        <div class="description">Ask me to help you write, debug, or explain your code</div>
      </div>
    `;
  }

  renderMessages() {
    const container = this.container.querySelector('#chatMessages');
    
    if (this.state.messages.length === 0) {
      container.innerHTML = this.renderEmptyState();
      return;
    }

    container.innerHTML = this.state.messages.map(message => this.renderMessage(message)).join('');
    container.scrollTop = container.scrollHeight;
  }

  renderMessage(message) {
    const avatar = message.role === 'user' ? '👤' : '🦉';
    const time = new Date(message.timestamp).toLocaleTimeString();
    const formattedContent = this.formatContent(message.content);

    return `
      <div class="message ${message.role}">
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-role">${message.role === 'user' ? 'You' : 'OWL'}</span>
            <span class="message-time">${time}</span>
          </div>
          <div class="message-text">${formattedContent}</div>
        </div>
      </div>
    `;
  }

  formatContent(content) {
    let formatted = this.escapeHtml(content);
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    return formatted;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setupEventListeners() {
    const modelSelect = this.container.querySelector('#modelSelect');
    modelSelect.addEventListener('change', (e) => {
      this.state.selectedModel = e.target.value;
      this.options.onModelChange(e.target.value);
    });

    const apiKeyInput = this.container.querySelector('#apiKeyInput');
    apiKeyInput.addEventListener('change', (e) => {
      this.state.apiKey = e.target.value;
      this.updateKeyStatus();
      this.options.onApiKeyChange(e.target.value);
    });

    const chatInput = this.container.querySelector('#chatInput');
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    const sendBtn = this.container.querySelector('#sendBtn');
    sendBtn.addEventListener('click', () => this.sendMessage());
  }

  async sendMessage() {
    const input = this.container.querySelector('#chatInput');
    const message = input.value.trim();
    
    if (!message || this.state.isTyping) return;

    const model = this.models[this.state.selectedModel];
    if (this.state.tokenBalance < model.cost) {
      this.showError('Insufficient tokens. Please add more tokens to continue.');
      return;
    }

    input.value = '';
    input.style.height = 'auto';

    this.addMessage('user', message);
    this.setTyping(true);

    try {
      await this.options.onSendMessage(message, this.state.selectedModel);
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.setTyping(false);
    }
  }

  addMessage(role, content) {
    const message = {
      role,
      content,
      timestamp: Date.now()
    };

    this.state.messages.push(message);
    this.renderMessages();
  }

  setTyping(isTyping) {
    this.state.isTyping = isTyping;
    const sendBtn = this.container.querySelector('#sendBtn');
    const input = this.container.querySelector('#chatInput');

    sendBtn.disabled = isTyping;
    input.disabled = isTyping;

    if (isTyping) {
      sendBtn.innerHTML = '<div class="loading-spinner"></div>';
    } else {
      sendBtn.innerHTML = '➤';
    }
  }

  showError(message) {
    const container = this.container.querySelector('#chatMessages');
    const errorEl = document.createElement('div');
    errorEl.className = 'message error';
    errorEl.innerHTML = `
      <div class="message-avatar">⚠️</div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-role">Error</span>
        </div>
        <div class="message-text">${this.escapeHtml(message)}</div>
      </div>
    `;
    container.appendChild(errorEl);
    container.scrollTop = container.scrollHeight;
  }

  updateKeyStatus() {
    const status = this.container.querySelector('.key-status');
    if (this.state.apiKey) {
      status.className = 'key-status active';
      status.innerHTML = '<span class="dot"></span> API Key configured';
    } else {
      status.className = 'key-status';
      status.innerHTML = '<span class="dot"></span> No API Key';
    }
  }

  updateTokenBalance(balance) {
    this.state.tokenBalance = balance;
  }

  getMessages() {
    return this.state.messages;
  }

  setMessages(messages) {
    this.state.messages = messages;
    this.renderMessages();
  }

  clearMessages() {
    this.state.messages = [];
    this.renderMessages();
  }
}

export { ChatPanel };
