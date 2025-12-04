/**
 * Synchronous theme initialization to prevent flash on page load.
 *
 * MUST load in <head> before frameworks. Zero dependencies by design.
 * Code duplication with util.js is intentional for independence.
 */

(function() {
    'use strict';
    
    function resolveTheme(mode) {
        if (mode === 'light' || mode === 'dark') {
            return mode;
        }
        
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        return 'light';
    }
    
    function getThemeModeFromSettings() {
        try {
            const cachedMode = localStorage.getItem('ext_theme_mode');
            if (cachedMode) {
                return cachedMode;
            }
            
            const settingsStr = localStorage.getItem('ext_settings');
            if (settingsStr) {
                const settings = JSON.parse(settingsStr);
                if (settings && settings.theme_mode) {
                    return settings.theme_mode;
                }
            }
        } catch (e) {
            console.warn('Failed to read theme settings:', e);
        }
        
        return 'auto';
    }
    
    function applyTheme(theme) {
        const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', resolvedTheme);
    }
    
    const themeMode = getThemeModeFromSettings();
    const resolvedTheme = resolveTheme(themeMode);
    applyTheme(resolvedTheme);
    
    // Expose to main.js for Vuetify initialization
    window.__initialTheme = resolvedTheme;
    
})();