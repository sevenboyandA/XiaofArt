(() => {
    const root = document.documentElement;
    const button = document.getElementById('themeToggle');
    const meta = document.querySelector('meta[name="theme-color"]');
    const apply = theme => {
        root.dataset.theme = theme;
        const isLight = theme === 'light';
        button?.setAttribute('aria-pressed', String(isLight));
        button?.setAttribute('aria-label', isLight ? '切换到深色主题' : '切换到浅色主题');
        meta?.setAttribute('content', isLight ? '#f4f2ed' : '#0a0a0a');
    };
    apply(localStorage.getItem('xiaofart-theme') || (matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark'));
    button?.addEventListener('click', () => {
        const theme = root.dataset.theme === 'light' ? 'dark' : 'light';
        document.startViewTransition ? document.startViewTransition(() => apply(theme)) : apply(theme);
        localStorage.setItem('xiaofart-theme', theme);
    });
    document.querySelectorAll('a[data-skip-entry]').forEach(link => {
        link.addEventListener('click', () => {
            try { sessionStorage.setItem('xiaofart-skip-entry-once', '1'); } catch (error) {}
        });
    });
    addEventListener('scroll', () => document.getElementById('siteHeader')?.classList.toggle('is-scrolled', scrollY > 24), { passive: true });
    const year = document.getElementById('currentYear');
    if (year) year.textContent = String(new Date().getFullYear());
})();
