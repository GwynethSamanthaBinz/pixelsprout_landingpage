// Smooth scrolling für Navigation Links (optional, bereits CSS vorhanden)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all feature cards and steps
document.querySelectorAll('.feature-card, .step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Timelapse Play/Pause
function toggleTimelapse(btn) {
    const video = document.getElementById('timelapse-vid');
    if (video.paused) {
        video.play();
        btn.innerHTML = '&#9646;&#9646; Pause';
    } else {
        video.pause();
        btn.innerHTML = '&#9654; Play';
    }
    video.onended = () => { btn.innerHTML = '&#9654; Play'; };
}

// Copy to Clipboard Funktion
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const button = event.target;
        const originalText = button.textContent;
        const lang = localStorage.getItem('language') || 'de';
        button.textContent = translations[lang]['copied'];
        button.style.opacity = '0.8';

        setTimeout(() => {
            button.textContent = originalText;
            button.style.opacity = '1';
        }, 2000);
    }).catch(() => {
        alert('Email: ' + text);
    });
}

// Mobile Navigation Toggle
function initMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    if (!toggle || !navLinks) return;

    // Button-Klick: Menü auf/zuklappen
    toggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        toggle.classList.toggle('open', isOpen);
        toggle.setAttribute('aria-expanded', isOpen);
        toggle.setAttribute('aria-label', isOpen ? 'Menü schließen' : 'Menü öffnen');
    });

    // Menü schließen wenn ein Link geklickt wird
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            toggle.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Menü öffnen');
        });
    });

    // Menü schließen wenn außerhalb geklickt wird
    document.addEventListener('click', (e) => {
        if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('open');
            toggle.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// Auf Seitenladeende aufrufen
document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    
    // Easter Egg: Konami Code für Bonus-Nachricht
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    
    document.addEventListener('keydown', (e) => {
        konamiIndex = e.key === konamiCode[konamiIndex] ? konamiIndex + 1 : 0;
        if (konamiIndex === konamiCode.length) {
            document.body.style.filter = 'hue-rotate(180deg)';
            console.log('%c🌱 Herzlichen Glückwunsch! Du hast den Easter Egg gefunden! 🌱', 'color: #FF6B9D; font-size: 20px; font-weight: bold;');
            konamiIndex = 0;
        }
    });
});

// Window Resize Handler
window.addEventListener('resize', () => {
    initMobileNav();
});
