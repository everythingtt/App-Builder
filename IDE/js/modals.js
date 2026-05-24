// Modal Manager
class ModalManager {
    constructor() {
        this.modals = {};
        this.init();
    }

    init() {
        this.setupModals();
        this.setupEventListeners();
    }

    setupModals() {
        // Get all modals
        document.querySelectorAll('.modal').forEach(modal => {
            this.modals[modal.id] = modal;
        });
    }

    setupEventListeners() {
        // Close buttons
        document.querySelectorAll('[id^="close"], [id^="cancel"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.closest('.modal')?.id;
                if (modalId) this.hide(modalId);
            });
        });

        // Close on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hide(modal.id);
                }
            });
        });

        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.show('settingsModal');
            this.updateSettingsDisplay();
        });

        // API Settings modal
        document.getElementById('apiSettingsBtn').addEventListener('click', () => {
            this.show('apiSettingsModal');
            document.getElementById('apiKeyInput').value = apiManager.getApiKey();
        });

        // Save API Key
        document.getElementById('saveApiKeyBtn').addEventListener('click', () => {
            const key = document.getElementById('apiKeyInput').value;
            apiManager.setApiKey(key);
            this.hide('apiSettingsModal');
            chatManager.addMessage('system', 'API key updated successfully!');
        });

        // New File Modal
        document.getElementById('confirmNewFile').addEventListener('click', () => {
            const fileName = document.getElementById('newFileName').value;
            const location = document.getElementById('newFileLocation').value;
            
            if (fileName) {
                explorerManager.createFile(fileName, location);
                this.hide('newFileModal');
                document.getElementById('newFileName').value = '';
            }
        });

        // Beg for coins button
        document.getElementById('begForCoinsBtn')?.addEventListener('click', () => {
            this.handleBegForCoins();
        });

        // Memory management buttons
        document.getElementById('viewMemoryBtn')?.addEventListener('click', () => {
            this.showMemoryViewer();
        });

        document.getElementById('clearMemoryBtn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all persistent memory?')) {
                memoryManager.clear();
                chatManager.addMessage('system', 'Persistent memory cleared.');
            }
        });
    }

    show(modalId) {
        const modal = this.modals[modalId];
        if (modal) {
            modal.classList.add('active');
            
            // Update dynamic content
            if (modalId === 'lowCoinsModal') {
                document.getElementById('modalCoinAmount').textContent = coinManager.getBalance();
            }
        }
    }

    hide(modalId) {
        const modal = this.modals[modalId];
        if (modal) {
            modal.classList.remove('active');
        }
    }

    updateSettingsDisplay() {
        document.getElementById('currentThemeDisplay').textContent = themeManager.getThemeDisplayName();
        document.getElementById('settingsCoinBalance').textContent = coinManager.getBalance();
    }

    handleBegForCoins() {
        const apologies = [
            "I'm so sorry Daddy~ Please forgive my wastefulness~ 🥺",
            "I promise to be more careful with coins~ Have mercy on me~ 🙏",
            "I'll be a good girl/boy from now on~ Please give me another chance~ 💕"
        ];
        
        const randomApology = apologies[Math.floor(Math.random() * apologies.length)];
        
        chatManager.addMessage('system', `You beg: "${randomApology}"`);
        
        // Punish the user for begging (as per requirements)
        coinManager.punish(5);
        
        chatManager.addMessage('system', `Daddy says: "Pathetic! -5 coins for wasting my time!"`);
        
        // Close modal
        this.hide('lowCoinsModal');
        
        // Show rude response
        setTimeout(() => {
            chatManager.addMessage('assistant', 
                `Hmph~ Did you really think begging would work? 🙄\n\n` +
                `Now you have ${coinManager.getBalance()} coins. ` +
                `Maybe try being a little MORE pathetic next time~\n\n` +
                `Anyway... what do you ACTUALLY want? 💅`
            );
        }, 1000);
    }

    showMemoryViewer() {
        const memories = memoryManager.getFormattedMemories();
        
        if (memories.length === 0) {
            chatManager.addMessage('system', 'No persistent memory entries found.');
            return;
        }

        let memoryText = '📚 Persistent Memory Contents:\n\n';
        memories.forEach((mem, i) => {
            memoryText += `${i + 1}. **${mem.key}**\n`;
            memoryText += `   Value: ${mem.value}\n`;
            memoryText += `   Created: ${mem.createdAt}\n\n`;
        });

        chatManager.addMessage('system', memoryText);
    }
}

// Global modal manager
const modalManager = new ModalManager();

// Make it available globally
window.modalManager = modalManager;