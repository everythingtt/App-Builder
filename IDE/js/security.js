// Anti-Exploit Security System
class SecurityManager {
    constructor() {
        this.requestCount = 0;
        this.maxRequestsPerMinute = 30;
        this.requestLog = [];
        this.blockedModels = this.getBlockedModels();
        this.allowedModels = this.getAllowedModels();
    }

    getBlockedModels() {
        // Models not in the allowed list are blocked
        return [];
    }

    getAllowedModels() {
        return [
            'baidu/cobuddy:free',
            'openrouter/owl-alpha:free',
            'poolside/laguna-xs.2:free',
            'deepseek/deepseek-v4-flash:free',
            'nvidia/nemotron-3-super-120b-a12b:free',
            'openai/gpt-oss-120b:free',
            'google/gemini-2.5-flash-lite',
            'google/gemini-3.1-flash-lite',
            'arcee-ai/trinity-large-thinking:free',
            'openai/gpt-5.5',
            'openai/gpt-5.4',
            'google/gemini-3.5-flash'
        ];
    }

    isModelAllowed(modelId) {
        return this.allowedModels.includes(modelId);
    }

    sanitizeApiKey(key) {
        if (!key) return null;
        
        // Remove any non-ASCII or suspicious characters
        const sanitized = key.replace(/[^\x20-\x7E]/g, '');
        
        // Basic format validation for OpenRouter keys
        if (sanitized.startsWith('sk-or-v1-')) {
            return sanitized;
        }
        
        // Allow custom keys but log warning
        console.warn('API key format is non-standard');
        return sanitized.substring(0, 100); // Limit length
    }

    checkRateLimit() {
        const now = Date.now();
        
        // Remove old entries (older than 1 minute)
        this.requestLog = this.requestLog.filter(t => now - t < 60000);
        
        if (this.requestLog.length >= this.maxRequestsPerMinute) {
            return {
                allowed: false,
                retryAfter: 60000 - (now - this.requestLog[0])
            };
        }
        
        this.requestLog.push(now);
        return { allowed: true, retryAfter: 0 };
    }

   sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .substring(0, 50000); // Limit input size
    }

    sanitizeOutput(output) {
        if (typeof output !== 'string') return output;
        
        return output
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '');
    }

    validateFilePath(path) {
        if (!path) return false;
        
        // Prevent path traversal
        if (path.includes('..') || path.includes('~') || path.startsWith('/')) {
            return false;
        }
        
        // Check for suspicious patterns
        const suspiciousPatterns = [
            /[\x00-\x1F]/, // Control characters
            /<(?:frame|embed|object|applet)/i,
            /\.\.[\\\/]/
        ];
        
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(path)) {
                return false;
            }
        }
        
        return true;
    }

    validateFileName(name) {
        if (!name || typeof name !== 'string') return false;
        
        // Allow reasonable file names
        const validPattern = /^[a-zA-Z0-9_\-\.\s]{1,255}$/;
        return validPattern.test(name);
    }

    // Prevent code injection in file content
    checkCodeSafety(content, language) {
        const dangerousPatterns = [
            /\beval\s*\(/gi,
            /\bFunction\s*\(/gi,
            /\bnew\s+Function\s*\(/gi,
            /\bsetTimeout\s*\(\s*["`']/gi,
            /\bsetInterval\s*\(\s*["`']/gi,
            /\bimport\s*\(\s*["`']/gi,
            /\brequire\s*\(\s*["`']\s*child_process/gi,
            /\bprocess\s*\[/gi,
        ];
        
        for (const pattern of dangerousPatterns) {
            if (pattern.test(content)) {
                return {
                    safe: false,
                    reason: 'Potentially dangerous code pattern detected'
                };
            }
        }
        
        return { safe: true };
    }

    // Encrypt sensitive data before storage
    encryptData(data) {
        // Simple obfuscation (not true encryption, but better than plaintext)
        try {
            return btoa(encodeURIComponent(JSON.stringify(data)));
        } catch (e) {
            console.error('Encryption failed:', e);
            return null;
        }
    }

    decryptData(encrypted) {
        try {
            return JSON.parse(decodeURIComponent(atob(encrypted)));
        } catch (e) {
            console.error('Decryption failed:', e);
            return null;
        }
    }

    // Generate secure random ID
    generateSecureId() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Audit log
    logAudit(action, details = {}) {
        const auditEntry = {
            timestamp: Date.now(),
            action,
            details,
            userAgent: navigator.userAgent.substring(0, 100)
        };
        
        // Store last 100 audit entries
        const auditLog = JSON.parse(localStorage.getItem('owl-ide-audit') || '[]');
        auditLog.push(auditEntry);
        
        if (auditLog.length > 100) {
            auditLog.splice(0, auditLog.length - 100);
        }
        
        localStorage.setItem('owl-ide-audit', JSON.stringify(auditLog));
    }

    getAuditLog() {
        return JSON.parse(localStorage.getItem('owl-ide-audit') || '[]');
    }

    clearAuditLog() {
        localStorage.removeItem('owl-ide-audit');
    }
}

// Global security manager
const securityManager = new SecurityManager();