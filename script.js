// --- Form upload foto
const form = document.getElementById('uploadForm');
const message = document.getElementById('message');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        try {
            const response = await fetch('https://matrimoniome.ew.r.appspot.com/upload', {  // Cambia con il tuo backend URL
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                message.innerHTML = `Foto caricata con successo! <a href="${data.link}" target="_blank">Vedi foto</a>`;
            } else {
                message.textContent = 'Errore nel caricamento.';
            }
        } catch (err) {
            console.error(err);
            message.textContent = 'Errore nel caricamento.';
        }
    });
}

// --- Helper: HEX to RGB
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = (bigint & 255);
    return `${r},${g},${b}`;
}

// --- Mix due colori RGB
function mixColors(rgb1, rgb2) {
    const [r1, g1, b1] = rgb1.split(',').map(Number);
    const [r2, g2, b2] = rgb2.split(',').map(Number);
    return `${Math.floor((r1 + r2) / 2)},${Math.floor((g1 + g2) / 2)},${Math.floor((b1 + b2) / 2)}`;
}

// --- Colore del testo a contrasto
function getContrastColor(rgb) {
    const [r, g, b] = rgb.split(',').map(Number);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? '#000000' : '#ffffff';
}

// --- Aggiornamento elementi con tema coppia
function applicaTemaCoppiaExtra(sfondo, sfondoSecondario, font) {
    const rgb1 = hexToRgb(sfondo);
    const rgb2 = hexToRgb(sfondoSecondario);
    const coloreTerzo = `rgb(${mixColors(rgb1, rgb2)})`;
    const contrastText = getContrastColor(mixColors(rgb1, rgb2));

    document.querySelectorAll('button, a, th, td, p, span, h1, h2, h3, h4, h5, h6, label, input, select, textarea')
        .forEach(el => {
            if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'TH' || el.tagName === 'TD') {
                el.style.backgroundColor = coloreTerzo;
                el.style.color = contrastText;
            }
            el.style.font = font;
        });
}

// --- Caricamento dati index della coppia
async function loadIndexData(coppia) {
    try {
        const res = await fetch(`https://matrimonioapp.ew.r.appspot.com/admin/get_coppia?coppia=${encodeURIComponent(coppia)}`);
        const data = await res.json();

        if (data.error) {
            console.warn("Coppia non trovata, uso default");
            return;
        }

        // Titolo
        document.getElementById("title").textContent = data.titolo_index || "Benvenuti al nostro matrimonio";

        // Colori e font
        document.body.style.backgroundColor = data.sfondo || "#ffffff";
        document.body.style.color = data.testo || "#000000";
        document.getElementById("title").style.font = data.font || "Arial";

        // Foto
        if (data.foto_url) {
            document.getElementById("index-photo").src = data.foto_url;
        }

        // Aggiorna link galleria
        document.getElementById("galleria-btn").href = `gallery.html?coppia=${encodeURIComponent(coppia)}`;

    } catch (err) {
        console.error("Errore caricamento dati index:", err);
    }
}

// --- Applica tema coppia principale (con log per debug effetti)
async function applicaTemaCoppia(coppia) {
    try {
        // --- Fetch dati coppia
        const res = await fetch(`https://matrimonioapp.ew.r.appspot.com/admin/get_coppia?coppia=${encodeURIComponent(coppia)}`);
        const config = await res.json() || {};

        const sfondo = config.sfondo || '#ffffff';
        const sfondoSecondario = config.sfondo_secondario || '#eeeeee';
        const testo = config.testo || '#000000';
        const font = config.font || 'Arial, Helvetica, sans-serif';
        const effetto_scritta = config.effetto_scritta;
        const effetto_sfondo = config.effetto_sfondo;

        // --- Corpo pagina: gradiente e font
        document.body.style.background = `linear-gradient(135deg, ${sfondo}, ${sfondoSecondario})`;
        document.body.style.color = testo;
        document.body.style.fontFamily = font;

        // --- Header
        const header = document.querySelector('header');
        if (header) {
            header.style.backgroundColor = config.header_color || '#eee';
            const h1 = header.querySelector('h1');
            if (h1) {
                h1.textContent = config.header_text || document.getElementById("title").textContent;
                h1.style.fontFamily = font;
            }
        }

        // --- Logo
        if (config.logo_url) {
            let logo = document.getElementById('admin-logo');
            if (!logo) {
                logo = document.createElement('img');
                logo.id = 'admin-logo';
                logo.style.height = '40px';
                logo.style.position = 'absolute';
                logo.style.top = '10px';
                logo.style.left = '10px';
                document.body.appendChild(logo);
            }
            logo.src = config.logo_url;
        }

        // --- Carica effetti
        const effettiRes = await fetch('https://matrimonioapp.ew.r.appspot.com/admin/get_effetti');
        const effettiData = await effettiRes.json();
        const effettiScritta = effettiData.scritta || [];
        const effettiSfondo = effettiData.sfondo || [];

        // --- Applica effetto scritta
        if (effetto_scritta) {
            const effScritta = effettiScritta.find(e => e.id === effetto_scritta);
            if (effScritta && effScritta.css) {
                let css = effScritta.css.replace(/var\(--text-color\)/g, testo);
                css.split(';').forEach(rule => {
                    if (rule.trim()) {
                        let [prop, ...rest] = rule.split(':');
                        let val = rest.join(':');
                        if (prop && val) document.body.style.setProperty(prop.trim(), val.trim());
                    }
                });
            }
        }

        console.log(effetto_sfondo)
        // --- Applica effetto sfondo senza sovrascrivere gradiente
        if (effetto_sfondo) {
            
            const effSfondo = effettiSfondo.find(e => e.id === effetto_sfondo);
            if (effSfondo && effSfondo.css) {
                let css = effSfondo.css
                    .replace(/var\(--sfondo\)/g, sfondo)
                    .replace(/var\(--sfondo-secondario\)/g, sfondoSecondario)
                    .replace(/var\(--sfondo-rgb\)/g, hexToRgb(sfondo))
                    .replace(/var\(--sfondo-secondario-rgb\)/g, hexToRgb(sfondoSecondario));

                css.split(';').forEach(rule => {
                    if (rule.trim()) {
                        let [prop, ...rest] = rule.split(':');
                        let val = rest.join(':');
                        // Se l’effetto contiene background, usa background-image per non cancellare il gradiente
                       if (prop.trim() === 'background') {
    document.body.style.background = val.trim();
} else if (prop.trim() === 'background-image') {
    document.body.style.backgroundImage = val.trim();
} else if (prop.trim() === 'background-color') {
    document.body.style.backgroundColor = val.trim();
} else {
    document.body.style.setProperty(prop.trim(), val.trim());
}
                    }
                });

                // --- Overlay automatico se c'è immagine
                const urlMatch = css.match(/url\(([^)]+)\)/);
                if (urlMatch) {
                    let overlay = document.getElementById('admin-theme-overlay');
                    if (!overlay) {
                        overlay = document.createElement('div');
                        overlay.id = 'admin-theme-overlay';
                        overlay.className = 'overlay';
                        overlay.style.position = 'fixed';
                        overlay.style.top = '0';
                        overlay.style.left = '0';
                        overlay.style.right = '0';
                        overlay.style.bottom = '0';
                        overlay.style.pointerEvents = 'none';
                        overlay.style.zIndex = '0';
                        overlay.style.backgroundColor = `rgba(${hexToRgb(sfondo)},0.3)`;
                        document.body.appendChild(overlay);
                    } else {
                        overlay.style.backgroundColor = `rgba(${hexToRgb(sfondo)},0.3)`;
                    }
                } else {
                    const existingOverlay = document.getElementById('admin-theme-overlay');
                    if (existingOverlay) existingOverlay.remove();
                }
            }
        }

        // --- Aggiorna bottoni, link, tabelle e font globale
        applicaTemaCoppiaExtra(sfondo, sfondoSecondario, font);

    } catch (err) {
        console.warn("Tema admin non caricato:", err);
    }
}
