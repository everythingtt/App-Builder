class Editor {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.getElementById(container)
      : container;

    this.options = {
      onFileChange: options.onFileChange || (() => {}),
      onFileSave: options.onFileSave || (() => {}),
      ...options
    };

    this.state = {
      activeFile: null,
      openTabs: [],
      files: new Map()
    };

    this.init();
  }

  init() {
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="main-content">
        <div class="tabs-container" id="tabsContainer">
          ${this.renderTabs()}
        </div>
        
        <div class="editor-container">
          <div class="editor-pane">
            <div class="editor-header">
              <span class="editor-path" id="editorPath">
                ${this.state.activeFile || 'No file selected'}
              </span>
              <div class="editor-actions">
                <button class="btn btn-icon" id="saveFileBtn" title="Save (Ctrl+S)">💾</button>
                <button class="btn btn-icon" id="formatBtn" title="Format">✨</button>
              </div>
            </div>
            <div class="editor-content" id="editorContent">
              ${this.renderEditorContent()}
            </div>
          </div>
          
          <div class="preview-pane">
            <div class="preview-header">
              <span class="preview-title">Preview</span>
              <div class="preview-actions">
                <button class="btn btn-icon" id="refreshPreviewBtn" title="Refresh">🔄</button>
                <button class="btn btn-icon" id="openExternalBtn" title="Open in New Tab">↗️</button>
              </div>
            </div>
            <div class="preview-content" id="previewContent">
              ${this.renderPreviewContent()}
            </div>
          </div>
        </div>
        
        <div class="context-bar" id="contextBar">
          <span class="label">Context:</span>
          <span class="value">0 / 32,768 tokens (0%)</span>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  renderTabs() {
    if (this.state.openTabs.length === 0) {
      return '';
    }

    return this.state.openTabs.map(path => {
      const isActive = path === this.state.activeFile;
      const name = path.split('/').pop();
      const icon = this.getFileIcon(path);

      return `
        <div class="tab ${isActive ? 'active' : ''}" data-path="${path}">
          <span>${icon}</span>
          <span>${name}</span>
          <button class="close" data-path="${path}">×</button>
        </div>
      `;
    }).join('');
  }

  renderEditorContent() {
    if (!this.state.activeFile) {
      return `
        <div class="empty-state">
          <div class="icon">📂</div>
          <div class="title">No file selected</div>
          <div class="description">Select a file from the explorer to start editing</div>
        </div>
      `;
    }

    const file = this.state.files.get(this.state.activeFile);
    if (!file) {
      return `
        <div class="empty-state">
          <div class="icon">❌</div>
          <div class="title">File not found</div>
          <div class="description">The selected file could not be loaded</div>
        </div>
      `;
    }

    const isEditable = this.isEditableFile(this.state.activeFile);

    if (isEditable) {
      return `<textarea id="codeEditor" spellcheck="false">${this.escapeHtml(file.content)}</textarea>`;
    } else {
      return `<pre>${this.escapeHtml(file.content)}</pre>`;
    }
  }

  renderPreviewContent() {
    if (!this.state.activeFile) {
      return `
        <div class="empty-state">
          <div class="icon">👁️</div>
          <div class="title">No preview available</div>
          <div class="description">Select an HTML file to see a live preview</div>
        </div>
      `;
    }

    const file = this.state.files.get(this.state.activeFile);
    const ext = this.state.activeFile.split('.').pop()?.toLowerCase();

    if (ext === 'html') {
      const blob = new Blob([file.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      return `<iframe src="${url}" sandbox="allow-scripts"></iframe>`;
    } else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
      const base64 = btoa(file.content);
      return `<img src="data:${mimeType};base64,${base64}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">`;
    }

    return `
      <div class="empty-state">
        <div class="icon">📄</div>
        <div class="title">Preview not available</div>
        <div class="description">This file type doesn't support live preview</div>
      </div>
    `;
  }

  setupEventListeners() {
    this.container.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (tab && !e.target.classList.contains('close')) {
        this.openFile(tab.dataset.path);
      }

      const closeBtn = e.target.closest('.tab .close');
      if (closeBtn) {
        this.closeTab(closeBtn.dataset.path);
      }
    });

    const editor = this.container.querySelector('#codeEditor');
    if (editor) {
      editor.addEventListener('input', () => {
        this.options.onFileChange(this.state.activeFile, editor.value);
      });
    }

    const saveBtn = this.container.querySelector('#saveFileBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const file = this.state.files.get(this.state.activeFile);
        if (file) {
          this.options.onFileSave(this.state.activeFile, file.content);
        }
      });
    }

    const refreshBtn = this.container.querySelector('#refreshPreviewBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshPreview();
      });
    }

    const externalBtn = this.container.querySelector('#openExternalBtn');
    if (externalBtn) {
      externalBtn.addEventListener('click', () => {
        this.openInNewTab();
      });
    }
  }

  openFile(path) {
    this.state.activeFile = path;
    
    if (!this.state.openTabs.includes(path)) {
      this.state.openTabs.push(path);
    }

    this.render();
  }

  closeTab(path) {
    this.state.openTabs = this.state.openTabs.filter(p => p !== path);
    
    if (this.state.activeFile === path) {
      this.state.activeFile = this.state.openTabs[this.state.openTabs.length - 1] || null;
    }

    this.render();
  }

  getFileIcon(path) {
    const ext = path.split('.').pop()?.toLowerCase();
    const icons = {
      js: '📜', ts: '📘', jsx: '⚛️', tsx: '⚛️',
      html: '🌐', css: '🎨', scss: '🎨', json: '📋',
      md: '📝', txt: '📄', png: '🖼️', jpg: '🖼️', svg: '🖼️',
      gif: '🖼️', mp4: '🎬', mp3: '🎵', wav: '🎵',
      zip: '📦', py: '🐍', rb: '💎', go: '🔵'
    };
    return icons[ext] || '📄';
  }

  isEditableFile(path) {
    const ext = path.split('.').pop()?.toLowerCase();
    const editableExts = ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'md', 'txt', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'php', 'sql', 'yaml', 'yml', 'xml', 'env', 'gitignore'];
    return editableExts.includes(ext);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  refreshPreview() {
    const previewContent = this.container.querySelector('#previewContent');
    previewContent.innerHTML = this.renderPreviewContent();
  }

  openInNewTab() {
    if (!this.state.activeFile) return;
    
    const file = this.state.files.get(this.state.activeFile);
    const ext = this.state.activeFile.split('.').pop()?.toLowerCase();
    
    if (ext === 'html') {
      const blob = new Blob([file.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  }

  updateContextBar(files, model, contextLimit) {
    let totalTokens = 0;
    
    files.forEach(file => {
      totalTokens += Math.ceil(file.content.length / 4);
    });

    const percentage = (totalTokens / contextLimit) * 100;
    const isWarning = percentage > 70;
    const isError = percentage > 90;

    const contextBar = this.container.querySelector('#contextBar');
    contextBar.innerHTML = `
      <span class="label">Context:</span>
      <span class="value ${isError ? 'error' : isWarning ? 'warning' : ''}">
        ${totalTokens.toLocaleString()} / ${contextLimit.toLocaleString()} tokens (${percentage.toFixed(1)}%)
      </span>
    `;
  }

  setFiles(files) {
    this.state.files = new Map(files);
    this.render();
  }

  getActiveFile() {
    return this.state.activeFile;
  }

  setActiveFile(path) {
    this.state.activeFile = path;
    this.render();
  }
}

export { Editor };
