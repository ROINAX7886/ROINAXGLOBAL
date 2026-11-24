// --- Preloader Controller ---
document.body.classList.add('loading');
const preloader = document.getElementById('preloader');

function hidePreloader() {
    if (!preloader || preloader.classList.contains('hidden')) return;
    preloader.classList.add('hidden');
    document.body.classList.remove('loading');
}

window.addEventListener('load', () => {
    setTimeout(hidePreloader, 450);
});
setTimeout(hidePreloader, 2500);

// --- Scroll Progress Bar & Sticky Scrolled Header ---
const header = document.getElementById('siteHeader');
const scrollProgress = document.getElementById('scrollProgress');

window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (scrollProgress) {
        scrollProgress.style.width = `${progress}%`;
    }

    if (header) {
        header.classList.toggle('scrolled', scrollTop > 20);
    }
});

// --- Responsive Hamburger Menu ---
const hamburger = document.getElementById('hamburger');
const mainNav = document.getElementById('mainNav');

if (hamburger && mainNav) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mainNav.classList.toggle('open');
    });

    mainNav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', (e) => {
            const parentDropdown = link.closest('.has-dropdown');
            if (window.innerWidth <= 860 && parentDropdown && link === parentDropdown.querySelector(':scope > a')) {
                e.preventDefault();
                parentDropdown.classList.toggle('open');
                return;
            }
            hamburger.classList.remove('open');
            mainNav.classList.remove('open');
        });
    });
}

// --- Scroll Reveal Animations ---
const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
const revealObserver = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    }
);
revealElements.forEach((el) => revealObserver.observe(el));

// --- Hero Video Auto-Play Resilience ---
const heroVideo = document.getElementById('heroVideo');
if (heroVideo) {
    const keepPlaying = () => {
        if (heroVideo.paused) {
            heroVideo.play().catch(() => { });
        }
    };

    heroVideo.addEventListener('canplay', keepPlaying);
    heroVideo.addEventListener('stalled', keepPlaying);
    heroVideo.addEventListener('suspend', keepPlaying);
    heroVideo.addEventListener('pause', keepPlaying);

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) keepPlaying();
    });
}

// --- Express Auth Session Check (Dynamic Header State) ---
async function checkAuthStatus() {
    const desktopGuest = document.getElementById('desktop-guest-actions');
    const desktopUser = document.getElementById('desktop-user-actions');
    const mobileGuest = document.getElementById('mobile-guest-actions');
    const mobileUser = document.getElementById('mobile-user-actions');

    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        // Checks for authenticated state matching getMe controller response
        const isAuthenticated = res.ok && ((data.authenticated && data.user) || (data.data && data.data.id));

        if (isAuthenticated) {
            // Hide Sign In / Sign Up buttons
            if (desktopGuest) desktopGuest.style.display = 'none';
            if (mobileGuest) mobileGuest.style.display = 'none';

            // Show Only Profile Button
            if (desktopUser) desktopUser.style.display = 'flex';
            if (mobileUser) mobileUser.style.display = 'flex';
        } else {
            // Revert back to Guest Sign In / Sign Up
            if (desktopGuest) desktopGuest.style.display = 'flex';
            if (mobileGuest) mobileGuest.style.display = 'flex';

            // Hide Profile Button
            if (desktopUser) desktopUser.style.display = 'none';
            if (mobileUser) mobileUser.style.display = 'none';
        }
    } catch {
        // Keep default guest actions visible if the request fails
        if (desktopGuest) desktopGuest.style.display = 'flex';
        if (mobileGuest) mobileGuest.style.display = 'flex';
        if (desktopUser) desktopUser.style.display = 'none';
        if (mobileUser) mobileUser.style.display = 'none';
    }
}

// --- Global Accordion Component ---
function initAccordions() {
    const faqTriggers = document.querySelectorAll('.faq-trigger');
    if (!faqTriggers.length) return;

    faqTriggers.forEach((trigger) => {
        trigger.addEventListener('click', () => {
            const currentItem = trigger.closest('.faq-item');
            const currentPanel = currentItem.querySelector('.faq-panel');
            const isCurrentlyActive = currentItem.classList.contains('active');

            // Close sibling accordion items
            document.querySelectorAll('.faq-item').forEach((item) => {
                item.classList.remove('active');
                const btn = item.querySelector('.faq-trigger');
                if (btn) btn.setAttribute('aria-expanded', 'false');
                const panel = item.querySelector('.faq-panel');
                if (panel) panel.style.maxHeight = null;
            });

            // Expand selected item if it wasn't open
            if (!isCurrentlyActive) {
                currentItem.classList.add('active');
                trigger.setAttribute('aria-expanded', 'true');
                currentPanel.style.maxHeight = currentPanel.scrollHeight + 'px';
            }
        });
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    initAccordions();
});