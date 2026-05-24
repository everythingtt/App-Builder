// File Viewer Manager
class FileViewerManager {
    constructor() {
        this.openFiles = new Map();
        this.activeFile = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tab close buttons will be added dynamically
    }

    openFile(file) {
        if (!file || !file.content) return;
        
        // Check if file is already open
        if (this.openFiles.has(file.path)) {
            this.switchToFile(file.path);
            return;
        }
        
        // Add to open files
        this.openFiles.set(file.path, {
            ...file,
            originalContent: file.content,
            modified: false
        });
        
        this.renderTabs();
        this.renderFileContent(file);
        this.activeFile = file.path;
    }

    closeFile(path) {
        const file = this.openFiles.get(path);
        if (!file) return;
        
        // Check for unsaved changes
        if (file.modified) {
            if (!confirm(`"${file.name}" has unsaved changes. Close anyway?`)) {
                return;
            }
        }
        
        this.openFiles.delete(path);
        
        if (this.activeFile === path) {
            // Switch to another file if available
            const remainingFiles = Array.from(this.openFiles.keys());
            if (remainingFiles.length > 0) {
                this.switchToFile(remainingFiles[remainingFiles.length - 1]);
            } else {
                this.activeFile = null;
                this.renderEmptyState();
            }
        }
        
        this.renderTabs();
    }

    switchToFile(path) {
        const file = this.openFiles.get(path);
        if (!file) return;
        
        this.activeFile = path;
        this.renderTabs();
        this.renderFileContent(file);
    }

    renderTabs() {
        const container = document.getElementById('viewerTabs');
        container.innerHTML = '';
        
        this.openFiles.forEach((file, path) => {
            const tab = document.createElement('div');
            tab.className = `tab ${path === this.activeFile ? 'active' : ''}`;
            tab.innerHTML = `
                <span class="tab-icon"><i class="fas ${explorerManager.getFileIcon(file.name)}"></i></span>
                <span class="tab-name">${this.escapeHtml(file.name)}${file.modified ? ' •' : ''}</span>
                <button class="tab-close" data-path="${path}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            tab.addEventListener('click', (e) => {
                if (!e.target.closest('.tab-close')) {
                    this.switchToFile(path);
                }
            });
            
            tab.querySelector('.tab-close').addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeFile(path);
            });
            
            container.appendChild(tab);
        });
    }

    renderFileContent(file) {
        const container = document.getElementById('viewerContent');
        
        if (file.mimeType?.startsWith('image/')) {
            container.innerHTML = `
                <div class="media-preview">
                    <img src="${file.content}" alt="${this.escapeHtml(file.name)}">
                </div>
            `;
        } else if (file.mimeType?.startsWith('video/')) {
            container.innerHTML = `
                <div class="media-preview">
                    <video controls>
                        <source src="${file.content}" type="${file.mimeType}">
                        Your browser does not support the video tag.
                    </video>
                </div>
            `;
        } else if (file.mimeType?.startsWith('audio/')) {
            container.innerHTML = `
                <div class="media-preview">
                    <audio controls>
                        <source src="${file.content}" type="${file.mimeType}">
                        Your browser does not support the audio tag.
                    </audio>
                </div>
            `;
        } else {
            // Text/Code editor
            const lineCount = file.content.split('\n').length;
            const language = this.detectLanguage(file.name);
            
            container.innerHTML = `
                <div class="editor-container">
                    <div class="line-numbers">${Array.from({length: lineCount}, (_, i) => i + 1).join('\n')}</div>
                    <textarea class="editor" spellcheck="false">${this.escapeHtml(file.content)}</textarea>
                </div>
            `;
            
            const editor = container.querySelector('.editor');
            const lineNumbers = container.querySelector('.line-numbers');
            
            // Sync scroll
            editor.addEventListener('scroll', () => {
                lineNumbers.scrollTop = editor.scrollTop;
            });
            
            // Auto-sync line count
            editor.addEventListener('input', () => {
                const newLineCount = editor.value.split('\n').length;
                lineNumbers.textContent = Array.from({length: newLineCount}, (_, i) => i + 1).join('\n');
                this.updateStatusBar(editor);
                
                // Mark as modified
                const openFile = this.openFiles.get(this.activeFile);
                if (openFile) {
                    openFile.modified = true;
                    openFile.content = editor.value;
                    this.renderTabs();
                }
            });
            
            editor.addEventListener('click', () => this.updateStatusBar(editor));
            editor.addEventListener('keyup', () => this.updateStatusBar(editor));
            
            // Initial status bar update
            this.updateStatusBar(editor);
        }
    }

    renderEmptyState() {
        const container = document.getElementById('viewerContent');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-code"></i>
                <p>Select a file to view or create a new one</p>
            </div>
        `;
    }

    detectLanguage(fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const langMap = {
            'js': 'JavaScript',
            'ts': 'TypeScript',
            'py': 'Python',
            'html': 'HTML',
            'css': 'CSS',
            'json': 'JSON',
            'md': 'Markdown',
            'txt': 'Plain Text',
            'xml': 'XML',
            'yaml': 'YAML',
            'yml': 'YAML',
            'java': 'Java',
            'cpp': 'C++',
            'c': 'C',
            'go': 'Go',
            'rs': 'Rust',
            'rb': 'Ruby',
            'php': 'PHP',
            'sql': 'SQL',
            'sh': 'Shell',
            'bat': 'Batch'
        };
        return langMap[ext] || 'Plain Text';
    }

    updateStatusBar(editor) {
        const text = editor.value;
        const cursorPos = editor.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPos);
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines.length;
        const currentCol = lines[lines.length - 1].length + 1;
        
        document.getElementById('statusLine').textContent = `Line: ${currentLine}, Column: ${currentCol}`;
    }

    updateLanguageDisplay(fileName) {
        const language = this.detectLanguage(fileName);
        document.getElementById('statusLanguage').textContent = language;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Get current content for AI tools
    getCurrentContent() {
        const file = this.openFiles.get(this.activeFile);
        return file ? file.content : '';
    }

    // Set content from AI tools
    setContent(path, content) {
        const file = this.openFiles.get(path);
        if (file) {
            file.content = content;
            file.modified = true;
            this.renderFileContent(file);
            this.renderTabs();
        } else {
            // File not open, update in explorer
            explorerManager.writeFileContent(path, content);
        }
    }

    // Save file (mark as not modified)
    saveFile(path) {
        const file = this.openFiles.get(path);
        if (file) {
            file.originalContent = file.content;
            file.modified = false;
            this.renderTabs();
            
            // Update in explorer
            explorerManager.writeFileContent(path, file.content);
            
            return { success: true };
        }
        return { error: 'File not found' };
    }

    // Search and replace in current file
    searchAndReplace(search, replace, all = false) {
        const file = this.openFiles.get(this.activeFile);
        if (!file) return { error: 'No file open' };
        
        let newContent;
        let count;
        
        if (all) {
            const regex = new RegExp(this.escapeRegExp(search), 'g');
            newContent = file.content.replace(regex, replace);
            count = (file.content.match(regex) || []).length;
        } else {
            const index = file.content.indexOf(search);
            if (index === -1) {
                return { error: 'Search text not found', count: 0 };
            }
            newContent = file.content.substring(0, index) + replace + file.content.substring(index + search.length);
            count = 1;
        }
        
        file.content = newContent;
        file.modified = true;
        
        // Update explorer
        explorerManager.writeFileContent(this.activeFile, newContent);
        
        // Re-render
        this.renderFileContent(file);
        this.renderTabs();
        
        return { success: true, count };
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Global file viewer manager
const fileViewerManager = new FileViewerManager();