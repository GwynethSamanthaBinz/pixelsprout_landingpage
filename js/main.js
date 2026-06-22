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

// Fallende Sonnenblumen – nur Handy, einmalig beim Einscollen
function initFallingSunflowers() {
    const section  = document.getElementById('features');
    const container = document.getElementById('falling-sunflowers');
    if (!section || !container) return;

    let launched = false;

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !launched) {
            launched = true;
            observer.disconnect();
            setTimeout(() => launchFlowers(container), 80);
        }
    }, { threshold: 0.15 });

    observer.observe(section);
}

function launchFlowers(container) {
    const W     = container.offsetWidth;
    const H     = container.offsetHeight;
    const COUNT = 34;

    for (let i = 0; i < COUNT; i++) {
        const size = 36 + Math.random() * 88;          // 36–124 px

        // Startposition: irgendwo oben, auch seitlich außerhalb
        const startX = -size + Math.random() * (W + size);
        const startY = -(size + Math.random() * 120);
        const startAngle = (Math.random() - 0.5) * 80;

        // Wurfrichtung: schräg nach unten, mit seitlichem Schwung
        const throwDir  = Math.random() > 0.5 ? 1 : -1;
        const horizDist = throwDir * (40 + Math.random() * 100);

        // Parabolischer Scheitelpunkt (kurzer Aufwärtsbogen)
        const peakOffsetX = horizDist * 0.35;
        const peakOffsetY = -(20 + Math.random() * 70);

        // Endposition: Haufen am unteren Rand
        const endX = Math.max(4, Math.min(W - size - 4, startX + horizDist));
        const endY = H - size - Math.random() * (size * 0.8);   // leicht versetzt → Haufen-Effekt
        const endAngle = (Math.random() - 0.5) * 130;

        const duration = 2000 + Math.random() * 2000;            // 2–4 s
        const delay    = i * 200 + Math.random() * 150;          // stärker staffeln

        // Wrapper bewegt sich linear horizontal (Wurfgeschwindigkeit)
        const wrap = document.createElement('div');
        wrap.className = 'fall-sf-wrap';
        const img = document.createElement('img');
        img.src = 'img/deko/Sonneblume.png';
        img.style.width = size + 'px';
        wrap.appendChild(img);
        container.appendChild(wrap);

        // X: linearer Wurf
        wrap.animate(
            [{ transform: `translateX(${startX}px)` },
             { transform: `translateX(${endX}px)` }],
            { duration, delay, easing: 'linear', fill: 'both' }
        );

        // Y + Rotation: Parabel mit Schwerkraft
        img.animate([
            {
                transform: `translateY(${startY}px) rotate(${startAngle}deg)`,
                opacity: 0,
                easing: 'ease-out'
            },
            {
                transform: `translateY(${startY + peakOffsetY}px) rotate(${startAngle * 0.5}deg)`,
                opacity: 0.9,
                offset: 0.22,
                easing: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)'
            },
            {
                transform: `translateY(${endY}px) rotate(${endAngle}deg)`,
                opacity: 0.88
            }
        ], { duration, delay, fill: 'both' });

        // Nach dem Landen: draggable machen
        setTimeout(() => makeDraggable(wrap, img, endX, endY, endAngle), delay + duration + 50);
    }
}

function makeDraggable(wrap, img, endX, endY, endAngle) {
    // Animation einfrieren: WAAPI abbrechen, Position als CSS left/top fixieren
    img.style.transform = `rotate(${endAngle}deg)`;
    img.getAnimations().forEach(a => a.cancel());

    wrap.style.left = endX + 'px';
    wrap.style.top  = endY + 'px';
    wrap.getAnimations().forEach(a => a.cancel());
    wrap.style.willChange = 'auto';

    // Interaktion freischalten
    wrap.style.pointerEvents = 'auto';
    wrap.style.cursor = 'grab';
    wrap.style.userSelect = 'none';
    wrap.style.zIndex = '2';

    let sX = 0, sY = 0, oL = 0, oT = 0, dragging = false;

    function dragStart(clientX, clientY) {
        dragging = true;
        sX = clientX; sY = clientY;
        oL = parseFloat(wrap.style.left) || 0;
        oT = parseFloat(wrap.style.top)  || 0;
        wrap.style.cursor = 'grabbing';
        wrap.style.zIndex = '10';
    }

    function dragMove(clientX, clientY) {
        if (!dragging) return;
        wrap.style.left = (oL + clientX - sX) + 'px';
        wrap.style.top  = (oT + clientY - sY) + 'px';
    }

    function dragEnd() {
        dragging = false;
        wrap.style.cursor = 'grab';
        wrap.style.zIndex = '2';
    }

    // Touch (Handy)
    wrap.addEventListener('touchstart', e => {
        dragStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    wrap.addEventListener('touchmove', e => {
        if (dragging) {
            e.preventDefault();
            dragMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: false });

    wrap.addEventListener('touchend', dragEnd);

    // Maus (Desktop)
    wrap.addEventListener('mousedown', e => {
        dragStart(e.clientX, e.clientY);
        const move = e => dragMove(e.clientX, e.clientY);
        const up   = () => { dragEnd(); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
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

// LinkedIn Coming Soon Popup
function showLinkedinPopup() {
    const popup = document.getElementById('linkedin-popup');
    if (!popup) return;
    popup.classList.add('visible');
    document.addEventListener('keydown', closeOnEscape);
}

function hideLinkedinPopup() {
    const popup = document.getElementById('linkedin-popup');
    if (!popup) return;
    popup.classList.remove('visible');
    document.removeEventListener('keydown', closeOnEscape);
}

function closeOnEscape(e) {
    if (e.key === 'Escape') hideLinkedinPopup();
}

// Auf Seitenladeende aufrufen
document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initFallingSunflowers();
    
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
