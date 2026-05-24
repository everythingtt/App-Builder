class FileExplorer {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.getElementById(container) 
      : container;
    
    this.options = {
      onFileSelect: options.onFileSelect || (() => {}),
      onFileCreate: options.onFileCreate || (() => {}),
      onFolderCreate: options.onFolderCreate || (() => {}),
      onFileRename: options.onFileRename || (() => {}),
      onFileDelete: options.onFileDelete || (() => {}),
      ...options
    };

    this.state = {
      files: new Map(),
      expandedFolders: new Set(),
      selectedFile: null,
      directoryMap: new Map()
    };

    this.init();
  }

  init() {
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    
    const rootElement = this.createRootElement();
    this.container.appendChild(rootElement);
  }

  createRootElement() {
    const root = document.createElement('div');
    root.className = 'file-explorer';

    const header = document.createElement('div');
    header.className = 'sidebar-header';
    header.innerHTML = `
      <span class="sidebar-title">Explorer</span>
      <div class="sidebar-actions">
        <button class="btn btn-icon" id="newFileBtn" title="New File">📄</button>
        <button class="btn btn-icon" id="newFolderBtn" title="New Folder">📁</button>
        <button class="btn btn-icon" id="uploadBtn" title="Upload">⬆️</button>
      </div>
    `;

    const tree = document.createElement('div');
    tree.className = 'file-tree';
    tree.id = 'fileTree';

    root.appendChild(header);
    root.appendChild(tree);

    this.renderFileTree(tree);

    setTimeout(() => {
      header.querySelector('#newFileBtn').addEventListener('click', () => {
        this.options.onFileCreate();
      });
      header.querySelector('#newFolderBtn').addEventListener('click', () => {
        this.options.onFolderCreate();
      });
      header.querySelector('#uploadBtn').addEventListener('click', () => {
        this.options.onUpload?.();
      });
    }, 0);

    return root;
  }

  renderFileTree(container) {
    container.innerHTML = '';

    const sortedFiles = Array.from(this.state.files.entries())
      .filter(([path]) => !path.includes('/'))
      .sort((a, b) => {
        const aIsFolder = this.isDirectory(a[0]);
        const bIsFolder = this.isDirectory(b[0]);
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return a[0].localeCompare(b[0]);
      });

    sortedFiles.forEach(([path, file]) => {
      container.appendChild(this.createFileElement(path, file));
    });
  }

  createFileElement(path, file) {
    const element = document.createElement('div');
    element.className = 'file-item';
    element.dataset.path = path;

    const isFolder = this.isDirectory(path);
    const isExpanded = this.state.expandedFolders.has(path);
    const isSelected = this.state.selectedFile === path;

    if (isFolder) element.classList.add('folder');
    if (isSelected) element.classList.add('active');

    const icon = isFolder ? (isExpanded ? '📂' : '📁') : this.getFileIcon(path);
    const name = path.split('/').pop();

    element.innerHTML = `
      <span class="icon">${icon}</span>
      <span class="name">${name}</span>
      <div class="actions">
        <button class="rename-btn" title="Rename">✏️</button>
        <button class="delete-btn" title="Delete">🗑️</button>
      </div>
    `;

    element.addEventListener('click', (e) => {
      if (e.target.closest('.actions')) return;
      
      if (isFolder) {
        this.toggleFolder(path);
      } else {
        this.selectFile(path);
      }
    });

    element.querySelector('.rename-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.options.onFileRename(path);
    });

    element.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.options.onFileDelete(path);
    });

    if (isFolder && isExpanded) {
      const children = this.createChildrenElement(path);
      element.appendChild(children);
    }

    return element;
  }

  createChildrenElement(parentPath) {
    const children = document.createElement('div');
    children.className = 'file-children';

    const childFiles = Array.from(this.state.files.entries())
      .filter(([p]) => {
        const parentParts = parentPath.split('/').length;
        const pParts = p.split('/').length;
        return p.startsWith(parentPath + '/') && pParts === parentParts + 1;
      })
      .sort((a, b) => {
        const aIsFolder = this.isDirectory(a[0]);
        const bIsFolder = this.isDirectory(b[0]);
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return a[0].localeCompare(b[0]);
      });

    childFiles.forEach(([path, file]) => {
      children.appendChild(this.createFileElement(path, file));
    });

    return children;
  }

  toggleFolder(path) {
    if (this.state.expandedFolders.has(path)) {
      this.state.expandedFolders.delete(path);
    } else {
      this.state.expandedFolders.add(path);
    }
    this.render();
  }

  selectFile(path) {
    this.state.selectedFile = path;
    this.options.onFileSelect(path);
    this.render();
  }

  isDirectory(path) {
    return this.state.directoryMap.has(path) || 
           Array.from(this.state.files.keys()).some(p => p.startsWith(path + '/'));
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

  setFiles(files) {
    this.state.files = new Map(files);
    this.render();
  }

  setDirectoryMap(directoryMap) {
    this.state.directoryMap = new Map(directoryMap);
    this.render();
  }

  addFile(path, file) {
    this.state.files.set(path, file);
    this.render();
  }

  removeFile(path) {
    this.state.files.delete(path);
    this.render();
  }

  renameFile(oldPath, newPath) {
    const file = this.state.files.get(oldPath);
    if (file) {
      this.state.files.delete(oldPath);
      this.state.files.set(newPath, file);
      this.render();
    }
  }

  getSelectedFile() {
    return this.state.selectedFile;
  }

  expandAll() {
    this.state.directoryMap.forEach((_, path) => {
      this.state.expandedFolders.add(path);
    });
    this.render();
  }

  collapseAll() {
    this.state.expandedFolders.clear();
    this.render();
  }
}

export { FileExplorer };
