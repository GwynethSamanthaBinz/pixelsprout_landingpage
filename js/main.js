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

// Observe all feature cards and the how-it-works block
document.querySelectorAll('.feature-card, .how-layout').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Safari/iOS: kein transparentes WebM → Hero-Video durch Standbild ersetzen,
// beim User-Journey-Video direkt die MP4 nehmen
if (document.documentElement.classList.contains('no-alpha-video')) {
    document.querySelectorAll('.hero-phone-video').forEach(v => v.remove());
    document.querySelectorAll('.userflow-video source[type="video/webm"]').forEach(s => s.remove());
    document.querySelectorAll('.userflow-video').forEach(v => v.load());
}

// Schritte-Karussell: Pfeil-Buttons scrollen um eine Karte
function initStepsCarousel() {
    const track = document.getElementById('steps-track');
    const prev = document.getElementById('steps-prev');
    const next = document.getElementById('steps-next');
    if (!track || !prev || !next) return;

    const stepWidth = () => {
        const step = track.querySelector('.step');
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return step ? step.offsetWidth + gap : track.clientWidth;
    };

    const updateButtons = () => {
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };

    prev.addEventListener('click', () => track.scrollBy({ left: -stepWidth(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: stepWidth(), behavior: 'smooth' }));
    track.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);
    updateButtons();
}

// Sticker ausprobieren (Karte "Notizen & Habits") – nichts wird gespeichert
function initStickers() {
    const card = document.getElementById('sticker-card');
    const toggle = document.getElementById('sticker-toggle');
    const tray = document.getElementById('sticker-tray');
    const layer = document.getElementById('sticker-layer');
    const shot = card && card.querySelector('.sticker-shot');
    if (!card || !toggle || !tray || !layer || !shot) return;

    const MAX_STICKERS = 8;
    const DOUBLE_TAP_MS = 300;

    // Handyhöhe für die Position von Button und Leiste
    const updateSizes = () => card.style.setProperty('--shot-h', shot.offsetHeight + 'px');
    new ResizeObserver(updateSizes).observe(shot);
    updateSizes();

    toggle.addEventListener('click', () => {
        const open = card.classList.toggle('stickers-open');
        toggle.setAttribute('aria-expanded', open);
    });

    const insideCard = (x, y) => {
        const r = card.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };

    // Position in Prozent der Karte, damit Sticker beim Skalieren mitwandern
    const placeAt = (el, x, y) => {
        const r = card.getBoundingClientRect();
        el.style.left = ((x - r.left) / r.width * 100) + '%';
        el.style.top = ((y - r.top) / r.height * 100) + '%';
    };

    // Pointer verfolgen (Maus + Touch) bis zum Loslassen
    const follow = (downEvent, onMove, onEnd) => {
        const id = downEvent.pointerId;
        const move = e => { if (e.pointerId === id) onMove(e.clientX, e.clientY); };
        const up = e => {
            if (e.pointerId !== id) return;
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
            onEnd(e.clientX, e.clientY, e.type === 'pointercancel');
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
    };

    const addSticker = (src, x, y) => {
        const sticker = document.createElement('div');
        sticker.className = 'sticker-placed';
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        img.draggable = false;
        // Kleines rotes Kreuz zum Löschen
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'sticker-remove';
        remove.textContent = '×';
        remove.setAttribute('aria-label', translations[localStorage.getItem('language') || 'de']['stickers.remove']);
        remove.addEventListener('pointerdown', e => e.stopPropagation());
        remove.addEventListener('click', () => sticker.remove());
        sticker.append(img, remove);
        placeAt(sticker, x, y);
        layer.appendChild(sticker);

        let lastTap = 0;
        sticker.addEventListener('pointerdown', e => {
            e.preventDefault();
            // Doppelklick / Doppeltipp entfernt den Sticker
            if (Date.now() - lastTap < DOUBLE_TAP_MS) {
                sticker.remove();
                return;
            }
            const start = { left: sticker.style.left, top: sticker.style.top };
            let moved = false;
            sticker.classList.add('dragging');
            follow(e, (mx, my) => { moved = true; placeAt(sticker, mx, my); }, (ux, uy, cancelled) => {
                sticker.classList.remove('dragging');
                if (cancelled || !insideCard(ux, uy)) {
                    sticker.style.left = start.left;
                    sticker.style.top = start.top;
                }
                lastTap = moved ? 0 : Date.now();
            });
        });
    };

    // Aus der Leiste ziehen: eine Kopie folgt dem Pointer
    tray.addEventListener('pointerdown', e => {
        const source = e.target.closest('img');
        if (!source || !tray.contains(source)) return;
        e.preventDefault();

        const ghost = source.cloneNode();
        ghost.className = 'sticker-ghost';
        const moveGhost = (x, y) => { ghost.style.left = x + 'px'; ghost.style.top = y + 'px'; };
        moveGhost(e.clientX, e.clientY);
        document.body.appendChild(ghost);

        follow(e, moveGhost, (x, y, cancelled) => {
            if (!cancelled && insideCard(x, y) && layer.children.length < MAX_STICKERS) {
                addSticker(source.src, x, y);
                ghost.remove();
                return;
            }
            // Zurück in die Leiste fahren
            const r = source.getBoundingClientRect();
            ghost.classList.add('returning');
            requestAnimationFrame(() => moveGhost(r.left + r.width / 2, r.top + r.height / 2));
            setTimeout(() => ghost.remove(), 250);
        });
    });
}

// Timelapse Play/Pause
function toggleTimelapse(btn) {
    const video = btn.closest('.timelapse-outer').querySelector('video');
    if (video.paused) {
        // Immer nur ein Timelapse gleichzeitig abspielen
        document.querySelectorAll('.timelapse-outer video').forEach(other => {
            if (other !== video && !other.paused) {
                other.pause();
                other.closest('.timelapse-outer').querySelector('.timelapse-play-btn').innerHTML = '&#9654; Play';
            }
        });
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
    const W         = container.offsetWidth;
    const H         = container.offsetHeight;
    const isDesktop = W > 768;
    const COUNT     = isDesktop ? 56 : 34;
    const cardW     = Math.min(900, W);
    const margin    = Math.max(0, (W - cardW) / 2);

    // Stack-Tracking: Spalten à 40px, prüft alle vom Blumen-Rechteck belegten Spalten
    const slotW = 40;
    const leftSlots   = {};
    const rightSlots  = {};
    const mobileSlots = {};

    // ~8% Überlappung, Stapel max. 40% der Sektionshöhe
    function stackedY(slots, x, size) {
        const c0 = Math.floor(x / slotW);
        const c1 = Math.floor((x + size) / slotW);

        let minFloor = H;
        for (let c = c0; c <= c1; c++) {
            const f = slots[c] !== undefined ? slots[c] : H;
            if (f < minFloor) minFloor = f;
        }

        const y = minFloor - size;

        // Stapel auf unterste 40% der Sektion begrenzen → darüber: einfach unten ablegen (Überlappung ok)
        if (y < H * 0.6) {
            return H - size - Math.random() * size * 0.4;
        }

        // 8% Überlappung: Boden steigt um 92% der Blumengröße
        const newFloor = minFloor - size * 0.92;
        for (let c = c0; c <= c1; c++) {
            const cur = slots[c] !== undefined ? slots[c] : H;
            if (newFloor < cur) slots[c] = newFloor;
        }

        return y;
    }

    for (let i = 0; i < COUNT; i++) {
        const size     = 36 + Math.random() * 88;
        const leftSide = isDesktop && margin > 40 && (i % 2 === 0);
        const rightSide= isDesktop && margin > 40 && (i % 2 !== 0);

        let startX, endX;
        if (leftSide) {
            startX = Math.random() * margin;
            endX   = Math.max(4, Math.min(margin - size * 0.2, startX + (Math.random() - 0.5) * 80));
        } else if (rightSide) {
            startX = W - margin + Math.random() * margin;
            endX   = Math.max(W - margin, Math.min(W - size - 4, startX + (Math.random() - 0.5) * 80));
        } else {
            startX = -size + Math.random() * (W + size);
            endX   = Math.max(4, Math.min(W - size - 4, startX + (Math.random() - 0.5) * 140));
        }

        const startY     = -(size + Math.random() * 120);
        const startAngle = (Math.random() - 0.5) * 80;
        const horizDist  = endX - startX;
        const peakOffsetY= -(20 + Math.random() * 70);

        const slots = leftSide ? leftSlots : rightSide ? rightSlots : mobileSlots;
        const endY  = stackedY(slots, endX, size);

        const endAngle = (Math.random() - 0.5) * 130;
        const duration = 2000 + Math.random() * 2000;
        const delay    = i * 200 + Math.random() * 150;

        const wrap = document.createElement('div');
        wrap.className = 'fall-sf-wrap';
        const img = document.createElement('img');
        img.src = 'img/deko/Sonneblume.png';
        img.style.width = size + 'px';
        wrap.appendChild(img);
        container.appendChild(wrap);

        wrap.animate(
            [{ transform: `translateX(${startX}px)` },
             { transform: `translateX(${endX}px)` }],
            { duration, delay, easing: 'linear', fill: 'both' }
        );

        img.animate([
            { transform: `translateY(${startY}px) rotate(${startAngle}deg)`,                        opacity: 0,    easing: 'ease-out' },
            { transform: `translateY(${startY + peakOffsetY}px) rotate(${startAngle * 0.5}deg)`,    opacity: 0.9,  offset: 0.22, easing: 'cubic-bezier(0.55,0.055,0.675,0.19)' },
            { transform: `translateY(${endY}px) rotate(${endAngle}deg)`,                             opacity: 0.88 }
        ], { duration, delay, fill: 'both' });

        // Nach dem Landen: Drag freischalten – Animation bleibt bis zur ersten Interaktion
        setTimeout(() => {
            wrap.style.pointerEvents = 'auto';
            wrap.style.cursor        = 'grab';
            wrap.style.userSelect    = 'none';
            wrap.style.zIndex        = '2';

            let converted = false;
            let sX = 0, sY = 0, oL = 0, oT = 0, dragging = false;

            // Lazy: erst beim ersten Drag von WAAPI auf CSS-Position umstellen
            function convertToStatic() {
                if (converted) return;
                converted = true;
                img.style.transform = `rotate(${endAngle}deg)`;
                img.style.opacity   = '0.88';
                img.getAnimations().forEach(a => a.cancel());
                wrap.style.position = 'absolute';
                wrap.style.left     = endX + 'px';
                wrap.style.top      = endY + 'px';
                wrap.getAnimations().forEach(a => a.cancel());
                wrap.style.willChange = 'auto';
            }

            function dragStart(clientX, clientY) {
                convertToStatic();
                dragging = true;
                sX = clientX; sY = clientY;
                oL = parseFloat(wrap.style.left) || endX;
                oT = parseFloat(wrap.style.top)  || endY;
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

            wrap.addEventListener('touchstart', e => dragStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
            wrap.addEventListener('touchmove',  e => { if (dragging) { e.preventDefault(); dragMove(e.touches[0].clientX, e.touches[0].clientY); } }, { passive: false });
            wrap.addEventListener('touchend',   dragEnd);
            wrap.addEventListener('mousedown',  e => {
                dragStart(e.clientX, e.clientY);
                const move = e => dragMove(e.clientX, e.clientY);
                const up   = () => { dragEnd(); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
                document.addEventListener('mousemove', move);
                document.addEventListener('mouseup', up);
            });
        }, delay + duration + 50);
    }
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
    initFallingSunflowers();
    initStepsCarousel();
    initStickers();

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
