// Coin Balance System
class CoinManager {
    constructor() {
        this.defaultBalance = 300;
        this.coins = parseInt(localStorage.getItem('owl-ide-coins')) || this.defaultBalance;
        this.hasShownLowWarning = false;
        this.hasShownRudeMode = false;
        
        // Model costs
        this.modelCosts = {
            'baidu/cobuddy:free': 7,
            'openrouter/owl-alpha:free': 7,
            'poolside/laguna-xs.2:free': 7,
            'deepseek/deepseek-v4-flash:free': 7,
            'nvidia/nemotron-3-super-120b-a12b:free': 7,
            'openai/gpt-oss-120b:free': 7,
            'google/gemini-2.5-flash-lite': 10,
            'google/gemini-3.1-flash-lite': 10,
            'arcee-ai/trinity-large-thinking:free': 10,
            'openai/gpt-5.5': 25,
            'openai/gpt-5.4': 25,
            'google/gemini-3.5-flash': 25
        };
    }

    getBalance() {
        return this.coins;
    }

    getCost(modelId) {
        return this.modelCosts[modelId] || 10; // Default to 10 if unknown
    }

    canAfford(modelId) {
        return this.coins >= this.getCost(modelId);
    }

    spend(modelId) {
        const cost = this.getCost(modelId);
        if (this.coins < cost) {
            return false;
        }
        this.coins -= cost;
        this.save();
        this.updateUI();
        this.checkThresholds();
        return true;
    }

    add(amount) {
        if (amount <= 0 || !Number.isFinite(amount)) return;
        this.coins += amount;
        this.save();
        this.updateUI();
    }

    punish(amount) {
        this.coins -= amount;
        this.save();
        this.updateUI();
        this.checkThresholds();
    }

    save() {
        this.coins = Math.max(-Infinity, this.coins); // Allow negative
        localStorage.setItem('owl-ide-coins', this.coins);
    }

    updateUI() {
        const coinElements = document.querySelectorAll('#coinAmount, #modalCoinAmount, #settingsCoinBalance');
        coinElements.forEach(el => {
            el.textContent = this.coins;
        });

        const coinBalance = document.getElementById('coinBalance');
        if (coinBalance) {
            if (this.coins < 0) {
                coinBalance.classList.add('low');
                coinBalance.querySelector('span').textContent = `${this.coins} 💀`;
            } else if (this.coins < 100) {
                coinBalance.classList.add('low');
            } else {
                coinBalance.classList.remove('low');
            }
        }
    }

    checkThresholds() {
        if (this.coins < 0 && !this.hasShownRudeMode) {
            this.hasShownRudeMode = true;
            return 'rude';
        } else if (this.coins < 100 && this.coins >= 0 && !this.hasShownLowWarning) {
            this.hasShownLowWarning = true;
            return 'low';
        }
        return null;
    }

    resetWarnings() {
        this.hasShownLowWarning = false;
        this.hasShownRudeMode = false;
    }

    resetBalance() {
        this.coins = this.defaultBalance;
        this.save();
        this.updateUI();
        this.resetWarnings();
    }

    getCostByCategory(category) {
        const costs = {
            'free': 7,
            'fast': 10,
            'context': 25
        };
        return costs[category] || 10;
    }

    getModelCategory(modelId) {
        const freeModels = [
            'baidu/cobuddy:free',
            'openrouter/owl-alpha:free',
            'poolside/laguna-xs.2:free',
            'deepseek/deepseek-v4-flash:free',
            'nvidia/nemotron-3-super-120b-a12b:free',
            'openai/gpt-oss-120b:free'
        ];
        
        const fastModels = [
            'google/gemini-2.5-flash-lite',
            'google/gemini-3.1-flash-lite',
            'arcee-ai/trinity-large-thinking:free'
        ];
        
        if (freeModels.includes(modelId)) return 'free';
        if (fastModels.includes(modelId)) return 'fast';
        return 'context';
    }
}

// Global coin manager
const coinManager = new CoinManager();