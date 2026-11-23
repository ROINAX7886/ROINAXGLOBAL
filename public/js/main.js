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

// --- Express Auth Session Check & Dynamic Header State ---
document.addEventListener('DOMContentLoaded', async () => {
    const desktopGuest = document.getElementById('desktop-guest-actions');
    const desktopUser = document.getElementById('desktop-user-actions');
    const mobileGuest = document.getElementById('mobile-guest-actions');
    const mobileUser = document.getElementById('mobile-user-actions');
    const userGreeting = document.getElementById('user-greeting');
    const mobileUserGreeting = document.getElementById('mobile-user-greeting');
    const desktopLogout = document.getElementById('desktop-logout-btn');
    const mobileLogout = document.getElementById('mobile-logout-btn');

    try {
        const res = await fetch('/api/auth/me');
        const result = await res.json();

        if (res.ok && result.data && result.data.id) {
            const firstName = result.data.name.split(' ')[0];

            if (userGreeting) userGreeting.innerHTML = `<i class="fa-regular fa-circle-user"></i> ${firstName}`;
            if (mobileUserGreeting) mobileUserGreeting.innerHTML = `<i class="fa-regular fa-circle-user"></i> ${result.data.email}`;

            if (desktopGuest) desktopGuest.style.display = 'none';
            if (desktopUser) desktopUser.style.display = 'flex';
            if (mobileGuest) mobileGuest.style.display = 'none';
            if (mobileUser) mobileUser.style.display = 'flex';
        }
    } catch {
        // Guest mode default remains intact
    }

    async function handleLogout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.reload();
        } catch (err) {
            console.error('Logout error:', err);
        }
    }

    if (desktopLogout) desktopLogout.addEventListener('click', handleLogout);
    if (mobileLogout) mobileLogout.addEventListener('click', handleLogout);
});