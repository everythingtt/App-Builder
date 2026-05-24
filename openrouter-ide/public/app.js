class OWLApp {
  constructor() {
    this.state = {
      files: new Map(),
      activeFile: null,
      openTabs: [],
      tokenBalance: 100,
      selectedModel: 'openrouter/owl-alpha',
      apiKey: '',
      isAuthenticated: false,
      user: null,
      messages: [],
      directoryMap: new Map()
    };

    this.models = {
      'openrouter/owl-alpha': { name: 'OWL Alpha', tokens: 2 },
      'baidu/cobuddy:free': { name: 'Cobuddy', tokens: 1 },
      'poolside/laguna-xs.2:free': { name: 'Laguna XS.2', tokens: 1 },
      'nvidia/nemotron-3-super-120b-a12b:free': { name: 'Nemotron 3 Super', tokens: 1 },
      'openai/gpt-oss-120b:free': { name: 'GPT-OSS 120B', tokens: 1 },
      'qwen/qwen3-coder-next': { name: 'Qwen3 Coder Next', tokens: 11 },
      'minimax/minimax-m2.5': { name: 'MiniMax M2.5', tokens: 15 },
      'qwen/qwen3-coder': { name: 'Qwen3 Coder', tokens: 22 }
    };

    this.contextLimits = {
      'openrouter/owl-alpha': 32768,
      'baidu/cobuddy:free': 8192,
      'poolside/laguna-xs.2:free': 16384,
      'nvidia/nemotron-3-super-120b-a12b:free': 65536,
      'openai/gpt-oss-120b:free': 131072,
      'qwen/qwen3-coder-next': 131072,
      'minimax/minimax-m2.5': 131072,
      'qwen/qwen3-coder': 131072
    };

    this.init();
  }

  init() {
    this.loadFromStorage();
    this.setupEventListeners();
    this.renderFileExplorer();
    this.updateTokenDisplay();
    this.setupRouting();
  }

  loadFromStorage() {
    const saved = localStorage.getItem('owl-ide-state');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.state.tokenBalance = data.tokenBalance ?? 100;
        this.state.selectedModel = data.selectedModel ?? 'openrouter/owl-alpha';
        this.state.apiKey = data.apiKey ?? '';
        this.state.files = new Map(data.files || []);
        this.state.messages = data.messages || [];
        this.state.directoryMap = new Map(data.directoryMap || []);
      } catch (e) {
        console.error('Failed to load state:', e);
      }
    }
  }

  saveToStorage() {
    const data = {
      tokenBalance: this.state.tokenBalance,
      selectedModel: this.state.selectedModel,
      apiKey: this.state.apiKey,
      files: Array.from(this.state.files.entries()),
      messages: this.state.messages,
      directoryMap: Array.from(this.state.directoryMap.entries())
    };
    localStorage.setItem('owl-ide-state', JSON.stringify(data));
  }

  setupEventListeners() {
    document.getElementById('newFileBtn').addEventListener('click', () => this.showNewFileModal());
    document.getElementById('newFolderBtn').addEventListener('click', () => this.showNewFolderModal());
    document.getElementById('uploadBtn').addEventListener('click', () => this.showUploadModal());
    document.getElementById('saveBtn').addEventListener('click', () => this.saveToGitHub());
    document.getElementById('loadBtn').addEventListener('click', () => this.loadFromGitHub());
    document.getElementById('loginBtn').addEventListener('click', () => this.initiateGitHubLogin());
    document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

    document.getElementById('modelSelect').addEventListener('change', (e) => {
      this.state.selectedModel = e.target.value;
      this.saveToStorage();
    });

    document.getElementById('apiKeyInput').addEventListener('change', (e) => {
      this.state.apiKey = e.target.value;
      this.saveToStorage();
      this.updateKeyStatus();
    });

    document.getElementById('chatInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveToGitHub();
      }
    });
  }

  setupRouting() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const parts = hash.split('/').filter(Boolean);

    if (parts[0] === 'file' && parts[1]) {
      const filePath = parts.slice(1).join('/');
      this.openFile(filePath);
    }
  }

  renderFileExplorer() {
    const container = document.getElementById('fileExplorer');
    container.innerHTML = '';

    const rootFiles = Array.from(this.state.files.entries())
      .filter(([path]) => !path.includes('/'))
      .sort((a, b) => {
        const aIsFolder = this.isDirectory(a[0]);
        const bIsFolder = this.isDirectory(b[0]);
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return a[0].localeCompare(b[0]);
      });

    rootFiles.forEach(([path, file]) => {
      container.appendChild(this.createFileItem(path, file));
    });
  }

  isDirectory(path) {
    return this.state.directoryMap.has(path) || 
           Array.from(this.state.files.keys()).some(p => p.startsWith(path + '/'));
  }

  createFileItem(path, file) {
    const item = document.createElement('div');
    item.className = `file-item ${this.isDirectory(path) ? 'folder' : ''} ${this.state.activeFile === path ? 'active' : ''}`;
    item.dataset.path = path;

    const icon = this.isDirectory(path) ? '📁' : this.getFileIcon(path);
    const name = path.split('/').pop();

    item.innerHTML = `
      <span class="icon">${icon}</span>
      <span class="name">${name}</span>
      <div class="actions">
        <button class="rename-btn" title="Rename">✏️</button>
        <button class="delete-btn" title="Delete">🗑️</button>
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.actions')) return;
      if (this.isDirectory(path)) {
        item.classList.toggle('expanded');
      } else {
        this.openFile(path);
      }
    });

    item.querySelector('.rename-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.showRenameModal(path);
    });

    item.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteFile(path);
    });

    if (this.isDirectory(path)) {
      const children = document.createElement('div');
      children.className = 'file-children';
      
      const childFiles = Array.from(this.state.files.entries())
        .filter(([p]) => p.startsWith(path + '/') && p.split('/').length === path.split('/').length + 1)
        .sort((a, b) => a[0].localeCompare(b[0]));

      childFiles.forEach(([childPath, childFile]) => {
        children.appendChild(this.createFileItem(childPath, childFile));
      });

      item.appendChild(children);
    }

    return item;
  }

  getFileIcon(path) {
    const ext = path.split('.').pop()?.toLowerCase();
    const icons = {
      js: '📜', ts: '📘', jsx: '⚛️', tsx: '⚛️',
      html: '🌐', css: '🎨', scss: '🎨', json: '📋',
      md: '📝', txt: '📄', png: '🖼️', jpg: '🖼️', svg: '🖼️',
      gif: '🖼️', mp4: '🎬', mp3: '🎵', wav: '🎵',
      zip: '📦', tar: '📦', gz: '📦',
      py: '🐍', rb: '💎', go: '🔵', rust: '🦀',
      java: '☕', c: '©️', cpp: '➕', h: '📐',
      php: '🐘', sql: '🗃️', yaml: '📄', yml: '📄',
      xml: '📄', env: '🔒', gitignore: '👁️'
    };
    return icons[ext] || '📄';
  }

  openFile(path) {
    const file = this.state.files.get(path);
    if (!file) return;

    this.state.activeFile = path;
    window.location.hash = `/file/${path}`;

    if (!this.state.openTabs.includes(path)) {
      this.state.openTabs.push(path);
    }

    this.renderTabs();
    this.renderEditor();
    this.renderPreview();
    this.renderFileExplorer();
  }

  renderTabs() {
    const container = document.getElementById('tabsContainer');
    container.innerHTML = '';

    this.state.openTabs.forEach(path => {
      const tab = document.createElement('div');
      tab.className = `tab ${this.state.activeFile === path ? 'active' : ''}`;
      tab.innerHTML = `
        <span>${this.getFileIcon(path)}</span>
        <span>${path.split('/').pop()}</span>
        <button class="close">×</button>
      `;

      tab.addEventListener('click', (e) => {
        if (e.target.classList.contains('close')) {
          this.closeTab(path);
        } else {
          this.openFile(path);
        }
      });

      container.appendChild(tab);
    });
  }

  closeTab(path) {
    const index = this.state.openTabs.indexOf(path);
    this.state.openTabs = this.state.openTabs.filter(p => p !== path);

    if (this.state.activeFile === path) {
      this.state.activeFile = this.state.openTabs[Math.max(0, index - 1)] || null;
      if (this.state.activeFile) {
        window.location.hash = `/file/${this.state.activeFile}`;
      } else {
        window.location.hash = '/';
      }
    }

    this.renderTabs();
    this.renderEditor();
    this.renderPreview();
  }

  renderEditor() {
    const container = document.getElementById('editorContent');
    
    if (!this.state.activeFile) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📂</div>
          <div class="title">No file selected</div>
          <div class="description">Select a file from the explorer to start editing</div>
        </div>
      `;
      return;
    }

    const file = this.state.files.get(this.state.activeFile);
    const isEditable = this.isEditableFile(this.state.activeFile);

    document.getElementById('editorPath').textContent = this.state.activeFile;

    if (isEditable) {
      container.innerHTML = `<textarea id="codeEditor" spellcheck="false">${this.escapeHtml(file.content)}</textarea>`;
      const textarea = document.getElementById('codeEditor');
      textarea.addEventListener('input', () => {
        this.state.files.set(this.state.activeFile, {
          ...file,
          content: textarea.value
        });
        this.saveToStorage();
        this.updateContextBar();
      });
    } else {
      container.innerHTML = `<pre>${this.escapeHtml(file.content)}</pre>`;
    }

    this.updateContextBar();
  }

  isEditableFile(path) {
    const ext = path.split('.').pop()?.toLowerCase();
    const editableExts = ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'md', 'txt', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'php', 'sql', 'yaml', 'yml', 'xml', 'env', 'gitignore'];
    return editableExts.includes(ext);
  }

  renderPreview() {
    const container = document.getElementById('previewContent');
    
    if (!this.state.activeFile) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">👁️</div>
          <div class="title">No preview available</div>
          <div class="description">Select an HTML file to see a live preview</div>
        </div>
      `;
      return;
    }

    const file = this.state.files.get(this.state.activeFile);
    const ext = this.state.activeFile.split('.').pop()?.toLowerCase();

    if (ext === 'html') {
      const blob = new Blob([file.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      container.innerHTML = `<iframe src="${url}" sandbox="allow-scripts"></iframe>`;
    } else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
      const base64 = btoa(file.content);
      container.innerHTML = `<img src="data:${mimeType};base64,${base64}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">`;
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📄</div>
          <div class="title">Preview not available</div>
          <div class="description">This file type doesn't support live preview</div>
        </div>
      `;
    }
  }

  updateContextBar() {
    const container = document.getElementById('contextBar');
    const model = this.state.selectedModel;
    const contextLimit = this.contextLimits[model] || 8192;
    
    let totalTokens = 0;
    this.state.files.forEach((file) => {
      totalTokens += this.estimateTokens(file.content);
    });

    const percentage = (totalTokens / contextLimit) * 100;
    const isWarning = percentage > 70;
    const isError = percentage > 90;

    container.innerHTML = `
      <span class="label">Context:</span>
      <span class="value ${isError ? 'error' : isWarning ? 'warning' : ''}">
        ${totalTokens.toLocaleString()} / ${contextLimit.toLocaleString()} tokens (${percentage.toFixed(1)}%)
      </span>
    `;
  }

  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  updateTokenDisplay() {
    document.getElementById('tokenCount').textContent = this.state.tokenBalance;
  }

  updateKeyStatus() {
    const status = document.getElementById('keyStatus');
    if (this.state.apiKey) {
      status.className = 'key-status active';
      status.innerHTML = '<span class="dot"></span> API Key configured';
    } else {
      status.className = 'key-status';
      status.innerHTML = '<span class="dot"></span> No API Key';
    }
  }

  showNewFileModal() {
    const modal = document.getElementById('newFileModal');
    const input = document.getElementById('newFileName');
    const folderSelect = document.getElementById('newFileFolder');

    folderSelect.innerHTML = '<option value="">Root</option>';
    this.state.directoryMap.forEach((_, path) => {
      folderSelect.innerHTML += `<option value="${path}">${path}</option>`;
    });

    input.value = '';
    modal.classList.add('active');
    input.focus();
  }

  showNewFolderModal() {
    const modal = document.getElementById('newFolderModal');
    const input = document.getElementById('newFolderName');
    input.value = '';
    modal.classList.add('active');
    input.focus();
  }

  showUploadModal() {
    const modal = document.getElementById('uploadModal');
    modal.classList.add('active');
  }

  showRenameModal(path) {
    const modal = document.getElementById('renameModal');
    const input = document.getElementById('renameInput');
    input.value = path.split('/').pop();
    modal.dataset.path = path;
    modal.classList.add('active');
    input.focus();
  }

  createFile(name, folder = '') {
    const path = folder ? `${folder}/${name}` : name;
    
    if (this.state.files.has(path)) {
      this.showToast('Error', 'File already exists', 'error');
      return;
    }

    this.state.files.set(path, {
      content: '',
      type: 'file',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    this.saveToStorage();
    this.renderFileExplorer();
    this.openFile(path);
    this.showToast('Success', `Created ${name}`, 'success');
  }

  createFolder(name) {
    if (this.state.directoryMap.has(name)) {
      this.showToast('Error', 'Folder already exists', 'error');
      return;
    }

    this.state.directoryMap.set(name, {
      type: 'folder',
      createdAt: Date.now()
    });

    this.saveToStorage();
    this.renderFileExplorer();
    this.showToast('Success', `Created folder ${name}`, 'success');
  }

  deleteFile(path) {
    if (!confirm(`Are you sure you want to delete "${path}"?`)) return;

    if (this.isDirectory(path)) {
      const filesToDelete = Array.from(this.state.files.keys()).filter(p => p.startsWith(path + '/'));
      filesToDelete.forEach(p => this.state.files.delete(p));
      this.state.directoryMap.delete(path);
    } else {
      this.state.files.delete(path);
    }

    this.state.openTabs = this.state.openTabs.filter(p => p !== path && !p.startsWith(path + '/'));
    
    if (this.state.activeFile === path || this.state.activeFile?.startsWith(path + '/')) {
      this.state.activeFile = this.state.openTabs[0] || null;
      window.location.hash = this.state.activeFile ? `/file/${this.state.activeFile}` : '/';
    }

    this.saveToStorage();
    this.renderFileExplorer();
    this.renderTabs();
    this.renderEditor();
    this.renderPreview();
    this.showToast('Success', `Deleted ${path}`, 'success');
  }

  renameFile(oldPath, newName) {
    const parts = oldPath.split('/');
    parts[parts.length - 1] = newName;
    const newPath = parts.join('/');

    if (this.state.files.has(newPath)) {
      this.showToast('Error', 'A file with this name already exists', 'error');
      return;
    }

    const file = this.state.files.get(oldPath);
    this.state.files.delete(oldPath);
    this.state.files.set(newPath, file);

    const tabIndex = this.state.openTabs.indexOf(oldPath);
    if (tabIndex !== -1) {
      this.state.openTabs[tabIndex] = newPath;
    }

    if (this.state.activeFile === oldPath) {
      this.state.activeFile = newPath;
      window.location.hash = `/file/${newPath}`;
    }

    this.saveToStorage();
    this.renderFileExplorer();
    this.renderTabs();
    this.showToast('Success', `Renamed to ${newName}`, 'success');
  }

  async uploadFiles(files) {
    const model = this.state.selectedModel;
    const contextLimit = this.contextLimits[model] || 8192;
    let currentTokens = 0;
    
    this.state.files.forEach((file) => {
      currentTokens += this.estimateTokens(file.content);
    });

    for (const file of files) {
      const content = await this.readFileContent(file);
      const fileTokens = this.estimateTokens(content);
      
      if (currentTokens + fileTokens > contextLimit) {
        this.showToast('Error', `Uploading "${file.name}" would exceed the context limit for ${this.models[model].name}`, 'error');
        return;
      }

      const path = file.webkitRelativePath || file.name;
      this.state.files.set(path, {
        content,
        type: 'file',
        size: file.size,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      currentTokens += fileTokens;
    }

    this.saveToStorage();
    this.renderFileExplorer();
    this.updateContextBar();
    this.showToast('Success', `Uploaded ${files.length} file(s)`, 'success');
  }

  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  async sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;

    if (!this.state.apiKey) {
      this.showToast('Error', 'Please configure your OpenRouter API key', 'error');
      return;
    }

    const model = this.state.selectedModel;
    const modelInfo = this.models[model];
    
    if (this.state.tokenBalance < modelInfo.tokens) {
      this.showToast('Error', 'Insufficient tokens. Please add more tokens to continue.', 'error');
      return;
    }

    this.addMessage('user', message);
    input.value = '';

    this.state.tokenBalance -= modelInfo.tokens;
    this.updateTokenDisplay();
    this.saveToStorage();

    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<div class="loading-spinner"></div>';

    try {
      const context = this.buildContext();
      const messages = [
        { role: 'system', content: this.getSystemPrompt() },
        ...this.state.messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: `${context}\n\nUser: ${message}` }
      ];

      const response = await fetch('/api/openrouter/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || 'No response received';
      
      this.addMessage('assistant', assistantMessage);
    } catch (error) {
      console.error('Chat error:', error);
      this.addMessage('assistant', `Error: ${error.message}. Please check your API key and try again.`);
      this.state.tokenBalance += modelInfo.tokens;
      this.updateTokenDisplay();
      this.saveToStorage();
    } finally {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '➤';
    }
  }

  buildContext() {
    let context = 'Current project files:\n\n';
    
    this.state.files.forEach((file, path) => {
      context += `File: ${path}\n`;
      context += '```\n';
      context += file.content.slice(0, 1000);
      if (file.content.length > 1000) context += '\n... (truncated)';
      context += '\n```\n\n';
    });

    return context;
  }

  getSystemPrompt() {
    return `You are OWL, an expert AI coding assistant integrated into a web-based IDE. You help users build web applications by:

1. Writing clean, modern, and efficient code
2. Explaining your reasoning and suggesting best practices
3. Helping debug issues and optimize performance
4. Providing helpful context about the user's project

The user is working on a web project with the files shown in the context. When suggesting changes, be specific about which files to modify and provide complete, working code.

Always prioritize:
- Security best practices
- Modern web standards
- Accessibility
- Performance
- Clean, maintainable code`;
  }

  addMessage(role, content) {
    const message = {
      role,
      content,
      timestamp: Date.now()
    };

    this.state.messages.push(message);
    this.saveToStorage();
    this.renderMessages();
  }

  renderMessages() {
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';

    this.state.messages.forEach(message => {
      const messageEl = document.createElement('div');
      messageEl.className = `message ${message.role}`;
      
      const avatar = message.role === 'user' ? '👤' : '🦉';
      const time = new Date(message.timestamp).toLocaleTimeString();
      
      messageEl.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-role">${message.role === 'user' ? 'You' : 'OWL'}</span>
            <span class="message-time">${time}</span>
          </div>
          <div class="message-text">${this.formatMessage(message.content)}</div>
        </div>
      `;

      container.appendChild(messageEl);
    });

    container.scrollTop = container.scrollHeight;
  }

  formatMessage(content) {
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

  async initiateGitHubLogin() {
    const clientId = 'YOUR_GITHUB_APP_CLIENT_ID';
    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
    const scope = 'repo';
    
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  }

  async handleGitHubCallback(code) {
    try {
      const response = await fetch('/api/github/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();
      
      if (data.access_token) {
        this.state.isAuthenticated = true;
        this.state.user = data;
        localStorage.setItem('github_token', data.access_token);
        this.showToast('Success', 'Logged in with GitHub', 'success');
        this.updateAuthUI();
      }
    } catch (error) {
      this.showToast('Error', 'Failed to authenticate with GitHub', 'error');
    }
  }

  async saveToGitHub() {
    if (!this.state.isAuthenticated) {
      this.showToast('Error', 'Please login with GitHub first', 'error');
      return;
    }

    const token = localStorage.getItem('github_token');
    const path = `users/${this.state.user.login}/ide-state.json`;

    try {
      const response = await fetch('/api/github/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          path,
          content: {
            files: Array.from(this.state.files.entries()),
            directoryMap: Array.from(this.state.directoryMap.entries()),
            messages: this.state.messages
          },
          message: 'Save IDE state from OWL IDE'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.showToast('Success', 'Project saved to GitHub', 'success');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      this.showToast('Error', `Failed to save: ${error.message}`, 'error');
    }
  }

  async loadFromGitHub() {
    if (!this.state.isAuthenticated) {
      this.showToast('Error', 'Please login with GitHub first', 'error');
      return;
    }

    const token = localStorage.getItem('github_token');
    const path = `users/${this.state.user.login}/ide-state.json`;

    try {
      const response = await fetch('/api/github/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, path })
      });

      const data = await response.json();
      
      if (data.success && data.content) {
        this.state.files = new Map(data.content.files || []);
        this.state.directoryMap = new Map(data.content.directoryMap || []);
        this.state.messages = data.content.messages || [];
        
        this.saveToStorage();
        this.renderFileExplorer();
        this.renderMessages();
        this.showToast('Success', 'Project loaded from GitHub', 'success');
      } else {
        throw new Error(data.error || 'No saved data found');
      }
    } catch (error) {
      this.showToast('Error', `Failed to load: ${error.message}`, 'error');
    }
  }

  logout() {
    this.state.isAuthenticated = false;
    this.state.user = null;
    localStorage.removeItem('github_token');
    this.updateAuthUI();
    this.showToast('Success', 'Logged out', 'success');
  }

  updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userDisplay = document.getElementById('userDisplay');

    if (this.state.isAuthenticated) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-flex';
      userDisplay.textContent = this.state.user?.login || 'User';
      userDisplay.style.display = 'inline';
    } else {
      loginBtn.style.display = 'inline-flex';
      logoutBtn.style.display = 'none';
      userDisplay.style.display = 'none';
    }
  }

  showToast(title, message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">×</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new OWLApp();
});

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function confirmNewFile() {
  const name = document.getElementById('newFileName').value.trim();
  const folder = document.getElementById('newFileFolder').value;
  
  if (!name) {
    window.app.showToast('Error', 'Please enter a file name', 'error');
    return;
  }

  window.app.createFile(name, folder);
  closeModal('newFileModal');
}

function confirmNewFolder() {
  const name = document.getElementById('newFolderName').value.trim();
  
  if (!name) {
    window.app.showToast('Error', 'Please enter a folder name', 'error');
    return;
  }

  window.app.createFolder(name);
  closeModal('newFolderModal');
}

function confirmRename() {
  const modal = document.getElementById('renameModal');
  const oldPath = modal.dataset.path;
  const newName = document.getElementById('renameInput').value.trim();
  
  if (!newName) {
    window.app.showToast('Error', 'Please enter a new name', 'error');
    return;
  }

  window.app.renameFile(oldPath, newName);
  closeModal('renameModal');
}

function handleFileUpload(event) {
  const files = event.target.files;
  if (files.length > 0) {
    window.app.uploadFiles(files);
  }
  closeModal('uploadModal');
}
