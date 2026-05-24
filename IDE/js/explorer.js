// File Explorer Manager
class ExplorerManager {
    constructor() {
        this.fileSystem = {}; // Virtual file system
        this.folderHandles = {}; // For File System Access API
        this.expandedFolders = new Set([]);
        this.selectedItem = null;
        this.openFolders = new Set([]);
        this.customSchemas = new Map();
        
        this.init();
    }

    init() {
        this.renderDirectoryTree();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('importFolderBtn').addEventListener('click', () => this.importFolder());
        document.getElementById('createFileBtn').addEventListener('click', () => this.showNewFileModal());
        document.getElementById('createFolderBtn').addEventListener('click', () => this.showNewFolderModal());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Setup context menu
        document.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        document.addEventListener('click', () => this.hideContextMenu());
    }

    async importFolder() {
        // Use File System Access API if available
        if ('showDirectoryPicker' in window) {
            try {
                const dirHandle = await window.showDirectoryPicker();
                await this.processDirectoryHandle(dirHandle, '/');
                this.renderDirectoryTree();
            } catch (e) {
                if (e.name !== 'AbortError') {
                    console.error('Error importing folder:', e);
                    this.showError('Failed to import folder: ' + e.message);
                }
            }
        } else {
            // Fallback to file input
            document.getElementById('fileInput').click();
        }
    }

    async processDirectoryHandle(handle, path) {
        this.folderHandles[path] = handle;
        
        for await (const [name, entry] of handle.entries()) {
            const fullPath = path === '/' ? `/${name}` : `${path}/${name}`;
            
            if (entry.kind === 'directory') {
                this.fileSystem[fullPath] = {
                    type: 'folder',
                    name: name,
                    path: fullPath,
                    children: []
                };
                this.expandedFolders.add(fullPath);
                await this.processDirectoryHandle(entry, fullPath);
            } else {
                const file = await entry.getFile();
                const content = await this.readFileContent(file);
                
                this.fileSystem[fullPath] = {
                    type: 'file',
                    name: name,
                    path: fullPath,
                    content: content,
                    size: file.size,
                    lastModified: file.lastModified,
                    mimeType: file.type
                };
                
                // Add to parent's children
                const parentPath = path || '/';
                if (this.fileSystem[parentPath]) {
                    this.fileSystem[parentPath].children.push(fullPath);
                }
            }
        }
    }

    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            
            if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
                // Read as data URL for media files
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    handleFileSelect(e) {
        const files = e.target.files;
        const folderName = files[0]?.webkitRelativePath?.split('/')[0] || 'Import';
        const folderPath = `/${folderName}`;
        
        this.fileSystem[folderPath] = {
            type: 'folder',
            name: folderName,
            path: folderPath,
            children: []
        };
        
        this.expandedFolders.add(folderPath);
        
        for (const file of files) {
            const relativePath = file.webkitPathVariable || file.webkitRelativePath;
            const pathParts = relativePath.split('/');
            let currentPath = folderPath;
            
            // Create subfolders
            for (let i = 1; i < pathParts.length - 1; i++) {
                const subPath = `${currentPath}/${pathParts[i]}`;
                if (!this.fileSystem[subPath]) {
                    this.fileSystem[subPath] = {
                        type: 'folder',
                        name: pathParts[i],
                        path: subPath,
                        children: []
                    };
                    this.expandedFolders.add(subPath);
                }
                currentPath = subPath;
            }
            
            const fileName = pathParts[pathParts.length - 1];
            const filePath = `${currentPath}/${fileName}`;
            
            // Read file content
            const reader = new FileReader();
            reader.onload = (e) => {
                this.fileSystem[filePath] = {
                    type: 'file',
                    name: fileName,
                    path: filePath,
                    content: e.target.result,
                    size: file.size,
                    lastModified: file.lastModified,
                    mimeType: file.type
                };
                
                // Add to parent's children
                if (this.fileSystem[currentPath] && !this.fileSystem[currentPath].children.includes(filePath)) {
                    this.fileSystem[currentPath].children.push(filePath);
                }
                
                this.renderDirectoryTree();
            };
            
            reader.readAsText(file);
        }
        
        this.renderDirectoryTree();
        e.target.value = '';
    }

    renderDirectoryTree() {
        const container = document.getElementById('directoryTree');
        container.innerHTML = '';
        
        const rootItems = Object.values(this.fileSystem).filter(item => {
            const parentPath = item.path.substring(0, item.path.lastIndexOf('/'));
            return parentPath === '' && item.path !== '/';
        });
        
        // Render virtual root
        const rootElement = this.createTreeItem({
            name: 'Workspace',
            path: '/',
            type: 'folder',
            children: rootItems.map(item => item.path)
        }, 0);
        
        container.appendChild(rootElement);
    }

    createTreeItem(item, depth) {
        const div = document.createElement('div');
        div.className = 'tree-item';
        div.dataset.path = item.path;
        div.dataset.type = item.type;
        
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = this.expandedFolders.has(item.path);
        
        div.innerHTML = `
            <span class="tree-toggle ${isExpanded ? 'expanded' : ''} ${hasChildren ? '' : 'empty'}">
                <i class="fas fa-chevron-right"></i>
            </span>
            <span class="icon ${item.type}">
                <i class="fas ${item.type === 'folder' ? 'fa-folder' : this.getFileIcon(item.name)}"></i>
            </span>
            <span class="name">${this.escapeHtml(item.name)}</span>
            <span class="actions">
                <button class="btn-icon-sm action-btn" data-action="rename">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon-sm action-btn" data-action="delete">
                    <i class="fas fa-trash"></i>
                </button>
            </span>
        `;
        
        if (item.type === 'folder') {
            div.addEventListener('click', (e) => {
                if (!e.target.closest('.action-btn') && !e.target.closest('.actions')) {
                    this.toggleFolder(item.path);
                }
            });
            
            if (hasChildren && isExpanded) {
                const childrenDiv = document.createElement('div');
                childrenDiv.className = 'tree-children';
                
                const children = item.children.map(childPath => this.fileSystem[childPath]).filter(Boolean);
                children.sort((a, b) => {
                    if (a.type === b.type) return a.name.localeCompare(b.name);
                    return a.type === 'folder' ? -1 : 1;
                });
                
                children.forEach(child => {
                    childrenDiv.appendChild(this.createTreeItem(child, depth + 1));
                });
                
                div.appendChild(childrenDiv);
            }
        } else {
            div.addEventListener('click', (e) => {
                if (!e.target.closest('.action-btn') && !e.target.closest('.actions')) {
                    this.openFile(item.path);
                }
            });
        }
        
        // Action buttons
        div.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                if (action === 'delete') {
                    this.deleteItem(item.path);
                } else if (action === 'rename') {
                    this.renameItem(item.path);
                }
            });
        });
        
        return div;
    }

    toggleFolder(path) {
        if (this.expandedFolders.has(path)) {
            this.expandedFolders.delete(path);
        } else {
            this.expandedFolders.add(path);
        }
        this.renderDirectoryTree();
    }

    openFile(path) {
        const file = this.fileSystem[path];
        if (file && file.type === 'file') {
            window.fileViewerManager.openFile(file);
        }
    }

    async createFile(name, path, content = '') {
        if (!securityManager.validateFileName(name)) {
            this.showError('Invalid file name');
            return null;
        }
        
        const parentPath = path === '/' ? '' : path;
        const fullPath = `${parentPath}/${name}`;
        
        if (this.fileSystem[fullPath]) {
            this.showError('File already exists');
            return null;
        }
        
        this.fileSystem[fullPath] = {
            type: 'file',
            name: name,
            path: fullPath,
            content: content,
            size: content.length,
            lastModified: Date.now()
        };
        
        // Add to parent's children
        if (this.fileSystem[`${parentPath}`]) {
            this.fileSystem[`${parentPath}`].children.push(fullPath);
        }
        
        this.renderDirectoryTree();
        return fullPath;
    }

    async createFolder(name, path) {
        if (!securityManager.validateFileName(name)) {
            this.showError('Invalid folder name');
            return null;
        }
        
        const parentPath = path === '/' ? '' : path;
        const fullPath = `${parentPath}/${name}`;
        
        if (this.fileSystem[fullPath]) {
            this.showError('Folder already exists');
            return null;
        }
        
        this.fileSystem[fullPath] = {
            type: 'folder',
            name: name,
            path: fullPath,
            children: []
        };
        
        this.expandedFolders.add(fullPath);
        
        // Add to parent's children
        if (this.fileSystem[`${parentPath}`]) {
            this.fileSystem[`${parentPath}`].children.push(fullPath);
        }
        
        this.renderDirectoryTree();
        return fullPath;
    }

    deleteItem(path) {
        if (confirm(`Are you sure you want to delete "${this.fileSystem[path]?.name}"?`)) {
            this.deleteItemRecursive(path);
            this.renderDirectoryTree();
        }
    }

    deleteItemRecursive(path) {
        const item = this.fileSystem[path];
        if (!item) return;
        
        if (item.type === 'folder' && item.children) {
            item.children.forEach(childPath => this.deleteItemRecursive(childPath));
        }
        
        // Remove from parent's children
        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
        if (this.fileSystem[parentPath]) {
            this.fileSystem[parentPath].children = this.fileSystem[parentPath].children.filter(c => c !== path);
        }
        
        delete this.fileSystem[path];
        this.expandedFolders.delete(path);
    }

    renameItem(path) {
        const item = this.fileSystem[path];
        if (!item) return;
        
        const newName = prompt('Enter new name:', item.name);
        if (!newName || newName === item.name) return;
        
        if (!securityManager.validateFileName(newName)) {
            this.showError('Invalid name');
            return;
        }
        
        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
        const newPath = `${parentPath}/${newName}`;
        
        if (this.fileSystem[newPath]) {
            this.showError('Name already exists');
            return;
        }
        
        // Update file system
        item.name = newName;
        item.path = newPath;
        this.fileSystem[newPath] = item;
        delete this.fileSystem[path];
        
        // Update parent's children
        if (this.fileSystem[parentPath]) {
            const index = this.fileSystem[parentPath].children.indexOf(path);
            if (index >= 0) {
                this.fileSystem[parentPath].children[index] = newPath;
            }
        }
        
        // Update expanded folders
        if (this.expandedFolders.has(path)) {
            this.expandedFolders.delete(path);
            this.expandedFolders.add(newPath);
        }
        
        this.renderDirectoryTree();
    }

    getFileIcon(fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const iconMap = {
            'js': 'fa-brands fa-js',
            'ts': 'fa-brands fa-js',
            'py': 'fa-brands fa-python',
            'html': 'fa-brands fa-html5',
            'css': 'fa-brands fa-css3',
            'json': 'fa-file-code',
            'md': 'fa-file-alt',
            'txt': 'fa-file-alt',
            'jpg': 'fa-file-image',
            'jpeg': 'fa-file-image',
            'png': 'fa-file-image',
            'gif': 'fa-file-image',
            'svg': 'fa-file-image',
            'mp4': 'fa-file-video',
            'webm': 'fa-file-video',
            'mp3': 'fa-file-audio',
            'wav': 'fa-file-audio',
            'pdf': 'fa-file-pdf',
            'zip': 'fa-file-archive',
            'rar': 'fa-file-archive'
        };
        return iconMap[ext] || 'fa-file';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        alert(message);
    }

    showNewFileModal() {
        window.modalManager.show('newFileModal');
    }

    showNewFolderModal() {
        const name = prompt('Enter folder name:');
        if (name) {
            this.createFolder(name, '/');
        }
    }

    handleContextMenu(e) {
        const treeItem = e.target.closest('.tree-item');
        if (!treeItem) return;
        
        e.preventDefault();
        
        const path = treeItem.dataset.path;
        const type = treeItem.dataset.type;
        
        this.showContextMenu(e.clientX, e.clientY, path, type);
    }

    showContextMenu(x, y, path, type) {
        this.hideContextMenu();
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.id = 'contextMenu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        
        let items = [];
        
        if (type === 'folder') {
            items = [
                { icon: 'fa-file-plus', label: 'New File', action: () => this.createFileInFolder(path) },
                { icon: 'fa-folder-plus', label: 'New Folder', action: () => this.createFolderInFolder(path) },
                { divider: true },
                { icon: 'fa-edit', label: 'Rename', action: () => this.renameItem(path) },
                { icon: 'fa-trash', label: 'Delete', action: () => this.deleteItem(path) }
            ];
        } else {
            items = [
                { icon: 'fa-edit', label: 'Open', action: () => this.openFile(path) },
                { icon: 'fa-edit', label: 'Rename', action: () => this.renameItem(path) },
                { icon: 'fa-trash', label: 'Delete', action: () => this.deleteItem(path) }
            ];
        }
        
        items.forEach(item => {
            if (item.divider) {
                const divider = document.createElement('div');
                divider.className = 'context-menu-divider';
                menu.appendChild(divider);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item';
                menuItem.innerHTML = `<i class="fas ${item.icon}"></i> ${item.label}`;
                menuItem.addEventListener('click', () => {
                    item.action();
                    this.hideContextMenu();
                });
                menu.appendChild(menuItem);
            }
        });
        
        document.body.appendChild(menu);
    }

    hideContextMenu() {
        const existing = document.getElementById('contextMenu');
        if (existing) existing.remove();
    }

    createFileInFolder(path) {
        const name = prompt('Enter file name:');
        if (name) {
            this.createFile(name, path);
        }
    }

    createFolderInFolder(path) {
        const name = prompt('Enter folder name:');
        if (name) {
            this.createFolder(name, path);
        }
    }

    // Get directory listing for AI tools
    listDirectory(path = '/') {
        const item = this.fileSystem[path];
        if (!item || item.type !== 'folder') {
            return { error: 'Path is not a directory' };
        }
        
        return {
            path: path,
            contents: item.children.map(childPath => {
                const child = this.fileSystem[childPath];
                return {
                    name: child.name,
                    type: child.type,
                    path: child.path,
                    size: child.size || 0
                };
            })
        };
    }

    // Get all files for workspace review
    getAllFiles() {
        return Object.values(this.fileSystem)
            .filter(item => item.type === 'file')
            .map(file => ({
                path: file.path,
                name: file.name,
                size: file.size || 0
            }));
    }

    // Get file content for AI tools
    getFileContent(path) {
        const file = this.fileSystem[path];
        if (!file || file.type !== 'file') {
            return { error: 'File not found' };
        }
        
        return {
            path: file.path,
            name: file.name,
            content: file.content,
            size: file.size || 0
        };
    }

    // Write file content from AI tools
    writeFileContent(path, content) {
        const file = this.fileSystem[path];
        if (!file || file.type !== 'file') {
            return { error: 'File not found' };
        }
        
        file.content = content;
        file.size = content.length;
        file.lastModified = Date.now();
        
        return { success: true, path: path };
    }

    // Add custom JSON schema for AI models
    addCustomSchema(name, schema) {
        try {
            const parsed = JSON.parse(schema);
            this.customSchemas.set(name, parsed);
            return { success: true };
        } catch (e) {
            return { error: 'Invalid JSON schema: ' + e.message };
        }
    }

    getCustomSchema(name) {
        return this.customSchemas.get(name) || null;
    }

    getAllCustomSchemas() {
        return Object.fromEntries(this.customSchemas);
    }
}

// Global explorer manager
const explorerManager = new ExplorerManager();