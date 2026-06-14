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

// Mobile Navigation Toggle (optional für zukünftige Erweiterungen)
function initMobileNav() {
    const navLinks = document.querySelector('.nav-links');
    if (window.innerWidth <= 768) {
        // Könnte hier ein Mobile Menu hinzugefügt werden
    }
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
