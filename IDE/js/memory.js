// Persistent Memory System
class MemoryManager {
    constructor() {
        this.storageKey = 'owl-ide-memory';
        this.memories = this.load();
    }

    load() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load memories:', e);
            return [];
        }
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.memories));
        } catch (e) {
            console.error('Failed to save memories:', e);
        }
    }

    write(key, value) {
        if (!key || typeof key !== 'string') return false;
        
        // Sanitize key to prevent injection
        const sanitizedKey = key.replace(/[<>\"\';&]/g, '');
        
        const memory = {
            key: sanitizedKey,
            value: this.sanitizeValue(value),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        // Update existing or add new
        const existingIndex = this.memories.findIndex(m => m.key === sanitizedKey);
        if (existingIndex >= 0) {
            this.memories[existingIndex] = memory;
        } else {
            this.memories.push(memory);
        }

        this.save();
        return true;
    }

    read(key) {
        if (!key) return null;
        
        const sanitizedKey = key.replace(/[<>\"\';&]/g, '');
        const memory = this.memories.find(m => m.key === sanitizedKey);
        
        if (memory) {
            return memory.value;
        }
        return null;
    }

    delete(key) {
        if (!key) return false;
        
        const sanitizedKey = key.replace(/[<>\"\';&]/g, '');
        const initialLength = this.memories.length;
        this.memories = this.memories.filter(m => m.key !== sanitizedKey);
        
        if (this.memories.length !== initialLength) {
            this.save();
            return true;
        }
        return false;
    }

    readAll() {
        return [...this.memories];
    }

    clear() {
        this.memories = [];
        this.save();
    }

    getMemoryCount() {
        return this.memories.length;
    }

    sanitizeValue(value) {
        if (typeof value === 'string') {
            // Basic XSS prevention
            return value
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');
        }
        return value;
    }

    getFormattedMemories() {
        return this.memories.map(m => ({
            key: m.key,
            value: typeof m.value === 'string' && m.value.length > 100 
                ? m.value.substring(0, 100) + '...' 
                : m.value,
            createdAt: new Date(m.createdAt).toLocaleString(),
            updatedAt: new Date(m.updatedAt).toLocaleString()
        }));
    }

    exportMemories() {
        return JSON.stringify(this.memories, null, 2);
    }

    importMemories(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (Array.isArray(imported)) {
                this.memories = [...this.memories, ...imported];
                this.save();
                return true;
            }
            return false;
        } catch (e) {
            console.error('Failed to import memories:', e);
            return false;
        }
    }
}

// Chat History Manager
class ChatHistoryManager {
    constructor() {
        this.storageKey = 'owl-ide-chat-history';
        this.currentSession = 'session_' + Date.now();
        this.history = this.load();
    }

    load() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Failed to load chat history:', e);
            return {};
        }
    }

    save() {
        try {
            // Limit stored sessions to prevent localStorage overflow
            const sessions = Object.keys(this.history);
            if (sessions.length > 10) {
                // Remove oldest sessions
                sessions.sort((a, b) => {
                    const aTime = this.history[a][0]?.timestamp || 0;
                    const bTime = this.history[b][0]?.timestamp || 0;
                    return aTime - bTime;
                });
                
                for (let i = 0; i < sessions.length - 10; i++) {
                    delete this.history[sessions[i]];
                }
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(this.history));
        } catch (e) {
            console.error('Failed to save chat history:', e);
        }
    }

    addMessage(sessionId, role, content, toolCalls = null) {
        if (!this.history[sessionId]) {
            this.history[sessionId] = [];
        }

        const message = {
            role,
            content,
            tool_calls: toolCalls,
            timestamp: Date.now()
        };

        // Sanitize content
        if (typeof message.content === 'string') {
            message.content = message.content
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        this.history[sessionId].push(message);
        this.save();
    }

    getSession(sessionId) {
        return this.history[sessionId] || [];
    }

    getCurrentSession() {
        return this.getSession(this.currentSession);
    }

    setCurrentSession(sessionId) {
        this.currentSession = sessionId;
    }

    clearSession(sessionId) {
        if (this.history[sessionId]) {
            delete this.history[sessionId];
            this.save();
        }
    }

    newSession() {
        this.currentSession = 'session_' + Date.now();
        return this.currentSession;
    }

    getAllSessions() {
        return Object.keys(this.history).map(sessionId => ({
            id: sessionId,
            messageCount: this.history[sessionId].length,
            lastMessage: this.history[sessionId][this.history[sessionId].length - 1]?.timestamp || 0
        }));
    }

    exportSession(sessionId) {
        return JSON.stringify(this.history[sessionId] || [], null, 2);
    }
}

// Global instances
const memoryManager = new MemoryManager();
const chatHistoryManager = new ChatHistoryManager();