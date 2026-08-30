(() => {
    'use strict';

    let navigating = false;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function isPlainClick(event) {
        return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    }

    document.addEventListener('click', event => {
        if (event.defaultPrevented || !isPlainClick(event)) return;
        const link = event.target.closest('a[href]');
        if (!link || link.target || link.hasAttribute('download')) return;

        const destination = new URL(link.href, location.href);
        if (!['http:', 'https:', 'file:'].includes(destination.protocol) || destination.origin !== location.origin) return;
        const sameDocument = destination.pathname === location.pathname && destination.search === location.search;
        if (sameDocument && destination.hash && destination.hash !== location.hash) return;

        if (link.hasAttribute('data-skip-entry')) {
            try { sessionStorage.setItem('xiaofart-skip-entry-once', '1'); } catch (error) {}
        }

        event.preventDefault();
        if (navigating) return;
        navigating = true;
        document.body.classList.add('is-page-leaving');
        document.body.setAttribute('aria-busy', 'true');

        setTimeout(() => {
            location.href = destination.href;
        }, reducedMotion ? 0 : 320);
    }, { capture: true });

    addEventListener('pageshow', () => {
        navigating = false;
        document.body.classList.remove('is-page-leaving');
        document.body.removeAttribute('aria-busy');
    });
})();
