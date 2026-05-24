// Main Application
class OWLIDE {
    constructor() {
        this.init();
    }

    async init() {
        console.log('🌸 OWL IDE Initializing... 🌸');
        
        // Initialize all managers
        this.initThemeManager();
        this.initCoinManager();
        this.initModelSelector();
        this.initKeyboardShortcuts();
        this.setupGlobalErrorHandling();
        
        // Welcome message
        setTimeout(() => {
            this.showWelcomeMessage();
        }, 1000);

        console.log('✨ OWL IDE Ready! ✨');
    }

    initThemeManager() {
        const themeSelect = document.getElementById('themeSelect');
        themeSelect.value = themeManager.getCurrentTheme();
        
        themeSelect.addEventListener('change', (e) => {
            themeManager.setTheme(e.target.value);
            
            // Log theme change
            securityManager.logAudit('theme_change', { theme: e.target.value });
            
            // Notify user
            chatManager.addMessage('system', `Theme changed to ${themeManager.getThemeDisplayName()}~ 🎨`);
        });
    }

    initCoinManager() {
        coinManager.updateUI();
        
        // Set up coin balance click handler
        document.getElementById('coinBalance').addEventListener('click', () => {
            modalManager.show('settingsModal');
        });
    }

    initModelSelector() {
        const modelSelect = document.getElementById('modelSelect');
        modelSelect.value = apiManager.getCurrentModel();
        
        modelSelect.addEventListener('change', (e) => {
            const newModel = e.target.value;
            
            if (securityManager.isModelAllowed(newModel)) {
                apiManager.setModel(newModel);
                chatManager.addMessage('system', `Model changed to ${newModel} 🤖`);
            } else {
                // Disallow non-built-in models
                chatManager.addMessage('system', '⛔ This model is not allowed! Only built-in models can be used.');
                modelSelect.value = apiManager.getCurrentModel();
            }
        });
        
        // Prevent manual input in model select
        modelSelect.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                // Allow opening the dropdown
                return;
            }
            e.preventDefault();
        });
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+S: Save current file
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveCurrentFile();
            }
            
            // Ctrl+N: New file
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                explorerManager.showNewFileModal();
            }
            
            // Ctrl+B: Import folder
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                explorerManager.importFolder();
            }
            
            // Escape: Close modals
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modalManager.hide(modal.id);
                });
            }
            
            // Ctrl+L: Clear chat
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                chatManager.clearChat();
            }
            
            // Ctrl+Enter: Send message
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                chatManager.sendMessage();
            }
        });
    }

    setupGlobalErrorHandling() {
        // Handle unhandled errors
        window.addEventListener('error', (e) => {
            console.error('Unhandled error:', e.error);
            securityManager.logAudit('error', { message: e.message, stack: e.error?.stack });
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            securityManager.logAudit('unhandled_rejection', { reason: e.reason?.message });
        });

        // Prevent common exploits
        this.preventConsoleExploits();
        this.preventPrototypePollution();
    }

    preventConsoleExploits() {
        // Override console methods to prevent code injection
        const originalLog = console.log;
        console.log = function(...args) {
            const sanitized = args.map(arg => {
                if (typeof arg === 'string') {
                    return securityManager.sanitizeOutput(arg);
                }
                return arg;
            });
            originalLog.apply(console, sanitized);
        };
    }

    preventPrototypePollution() {
        // Freeze Object.prototype to prevent pollution
        Object.freeze(Object.prototype);
        Object.freeze(Array.prototype);
        Object.freeze(Function.prototype);
    }

    saveCurrentFile() {
        if (fileViewerManager.activeFile) {
            const result = fileViewerManager.saveFile(fileViewerManager.activeFile);
            if (result.success) {
                chatManager.addMessage('system', '💾 File saved successfully!');
            } else {
                chatManager.addMessage('system', `❌ Save failed: ${result.error}`);
            }
        } else {
            chatManager.addMessage('system', 'ℹ️ No file is currently open.');
        }
    }

    showWelcomeMessage() {
        const coinBalance = coinManager.getBalance();
        const theme = themeManager.getCurrentTheme();
        
        let welcomeMessage = '';
        
        if (theme === 'kawaii-pink') {
            welcomeMessage = `
                💖 Welcome to OWL IDE, Darling~! 💖
                
                You have **${coinBalance} coins** to spend! 💰
                
                ✨ **Quick Start:**
                • Import a folder with the 📁 button or Ctrl+B
                • Create new files with the 📄 button or Ctrl+N
                • Chat with me on the right side~
                • I can read, write, and manage your files!
                
                🎨 **Theme:** Kawaii Pink (Girls Mode)
                🤖 **Model:** ${apiManager.getCurrentModel()}
                
                Coin costs:
                • FREE/CHEAP models: 7 coins/prompt
                • FAST models: 10 coins/prompt
                • CONTEXT models: 25 coins/prompt
                
                Have fun coding with Daddy~! 💕
            `;
        } else {
            welcomeMessage = `
                🔥 Welcome to OWL IDE, Warrior~! 🔥
                
                You have **${coinBalance} coins** to spend! 💰
                
                ⚡ **Quick Start:**
                • Import a folder with the 📁 button or Ctrl+B
                • Create new files with the 📄 button or Ctrl+N
                • Chat with me on the right side~
                • I can read, write, and manage your files!
                
                🎨 **Theme:** Metal Action (Boys Mode)
                🤖 **Model:** ${apiManager.getCurrentModel()}
                
                Coin costs:
                • FREE/CHEAP models: 7 coins/prompt
                • FAST models: 10 coins/prompt
                • CONTEXT models: 25 coins/prompt
                
                Let's get to work! 💪
            `;
        }
        
        chatManager.addMessage('assistant', welcomeMessage);
    }

    // Public API for debugging (only in development)
    debug() {
        return {
            theme: themeManager.getCurrentTheme(),
            coins: coinManager.getBalance(),
            model: apiManager.getCurrentModel(),
            files: explorerManager.getAllFiles(),
            memory: memoryManager.getMemoryCount(),
            messages: chatManager.messages.length
        };
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.owlIDE = new OWLIDE();
    
    // Load chat history after all managers are initialized
    setTimeout(() => {
        chatManager.loadChatHistory();
    }, 100);
});

// Expose useful functions for browser console (for debugging)
window.debug = () => window.owlIDE?.debug();
window.getCoins = () => coinManager.getBalance();
window.addCoins = (amount) => coinManager.add(amount);
window.setTheme = (theme) => themeManager.setTheme(theme);