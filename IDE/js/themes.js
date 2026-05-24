// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('owl-ide-theme') || 'kawaii-pink';
        this.wallpapers = {
            'kawaii-pink': [
                'https://wallup.net/wp-content/uploads/2015/12/57861-anime-school_uniform-anime_girls-Hentai_Ouji_to_Warawanai_Neko-visual_novel-Maimaki_Mai-Yokodera_Youto-748x529.jpg',
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJImUjAKPOJj-doxSARCmNUesF5gOUbDD7MA&s',
                'https://c4.wallpaperflare.com/wallpaper/495/637/212/anime-anime-girls-hentai-ouji-to-warawanai-neko-tsutsukakushi-tsukiko-wallpaper-preview.jpg',
                'https://c4.wallpaperflare.com/wallpaper/306/381/112/anime-girls-hentai-ouji-to-warawanai-neko-blue-eyes-blushing-wallpaper-preview.jpg'
            ],
            'metal-action': [
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1EAGxV42QfEEMk2DLqE4oSEQSmiWDQddb2g&s',
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDUPWQpgRkg6AXkln1zUUjRkd8jwZ94GjkeQ&s',
                'https://static.wikia.nocookie.net/aesthetics/images/e/e8/Femboy_castiel_onyx.jpg/revision/latest?cb=20230730190533',
                'https://cdn-images.dzcdn.net/images/cover/d478838532d15910554acf359b95c553/0x1900-000000-80-0-0.jpg'
            ]
        };
        this.currentWallpaperIndex = 0;
        
        this.init();
    }

    init() {
        document.body.setAttribute('data-theme', this.currentTheme);
        this.updateBackground();
        this.startSlideshow();
    }

    setTheme(themeName) {
        if (!['kawaii-pink', 'metal-action'].includes(themeName)) {
            console.warn('Invalid theme name');
            return;
        }
        
        this.currentTheme = themeName;
        this.currentWallpaperIndex = 0;
        document.body.setAttribute('data-theme', themeName);
        localStorage.setItem('owl-ide-theme', themeName);
        this.updateBackground();
    }

    updateBackground() {
        const wallpaperKey = `wallpaper-${this.currentTheme === 'kawaii-pink' ? 'kawaii'}-${this.currentWallpaperIndex + 1}`;
        document.body.setAttribute(`data-wallpaper`, wallpaperKey);
        
        const wallpapers = this.wallpapers[this.currentTheme];
        const bgElement = document.getElementById('dynamicBackground');
        
        if (bgElement && wallpapers.length > 0) {
            bgElement.style.backgroundImage = `url('${wallpapers[this.currentWallpaperIndex]}')`;
        }
    }

    nextWallpaper() {
        const wallpapers = this.wallpapers[this.currentTheme];
        this.currentWallpaperIndex = (this.currentWallpaperIndex + 1) % wallpapers.length;
        this.updateBackground();
    }

    startSlideshow() {
        // Change wallpaper every 30 seconds
        setInterval(() => {
            this.nextWallpaper();
        }, 30000);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getThemeDisplayName() {
        return this.currentTheme === 'kawaii-pink' ? 'Kawaii Pink' : 'Metal Action';
    }
}

// Global theme manager
const themeManager = new ThemeManager();