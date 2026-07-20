(() => {
    'use strict';

    const root = document.documentElement;
    const stored = localStorage.getItem('xiaofart-theme');
    const initial = stored || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

    function applyTheme(theme) {
        root.dataset.adminTheme = theme;
        localStorage.setItem('xiaofart-theme', theme);
        const button = document.getElementById('adminThemeToggle');
        if (button) {
            button.setAttribute('aria-pressed', String(theme === 'light'));
            button.setAttribute('aria-label', theme === 'light' ? '切换到深色主题' : '切换到浅色主题');
        }
    }

    function mountThemeToggle() {
        if (document.getElementById('adminThemeToggle')) return;
        const button = document.createElement('button');
        button.id = 'adminThemeToggle';
        button.type = 'button';
        button.className = 'admin-theme-toggle';
        button.innerHTML = '<span aria-hidden="true"></span>';
        button.addEventListener('click', () => applyTheme(root.dataset.adminTheme === 'light' ? 'dark' : 'light'));

        const headerRow = document.querySelector('.admin-app header > div');
        if (headerRow) headerRow.append(button);
        else document.body.append(button);
        applyTheme(root.dataset.adminTheme || initial);
    }

    applyTheme(initial);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountThemeToggle);
    else mountThemeToggle();
})();
