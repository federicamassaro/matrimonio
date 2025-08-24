// --- Form upload foto
const form = document.getElementById('uploadForm');
const message = document.getElementById('message');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        try {
            const response = await fetch('https://matrimoniome.ew.r.appspot.com/upload', {
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
    const b = bigint & 255;
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
function applicaTemaCoppiaExtra(bgColor, bgColorSecondario, font) {
    const rgb1 = hexToRgb(bgColor);
    const rgb2 = hexToRgb(bgColorSecondario);
    const coloreTerzo = `rgb(${mixColors(rgb1, rgb2)})`;
    const contrastText = getContrastColor(mixColors(rgb1, rgb2));

    document.querySelectorAll('button, a, th, td, p, span, h1, h2, h3, h4, h5, h6, label, input, select, textarea')
        .forEach(el => {
            if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'TH' || el.tagName === 'TD') {
                el.style.backgroundColor = coloreTerzo;
                el.style.color = contrastText;
            }
            el.style.fontFamily = font;
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
        if (data.colori) {
            document.body.style.backgroundColor = data.colori.sfondo || "#ffffff";
            document.body.style.color = data.colori.testo || "#000000";
            document.getElementById("title").style.fontFamily = data.colori.font || "Arial";
        }

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

// --- Applica tema coppia principale con effetti
async function applicaTemaCoppia(coppia) {
    try {
        const res = await fetch(`https://matrimonioapp.ew.r.appspot.com/admin/get_coppia?coppia=${encodeURIComponent(coppia)}`);
        const config = await res.json() || {};

        const bgColor = config.bg_color || '#ffffff';
        const bgColorSecondario = config.bg_color_secondario || '#eeeeee';
        const textColor = config.text_color || '#000000';
        const font = config.font_family || 'Arial, Helvetica, sans-serif';

        // Corpo pagina
        document.body.style.backgroundColor = bgColor;
        document.body.style.color = textColor;
        document.body.style.fontFamily = font;

        // Header
        const header = document.querySelector('header');
        if (header) {
            header.style.backgroundColor = config.header_color || '#eee';
            const h1 = header.querySelector('h1');
            if (h1) {
                h1.textContent = config.header_text || document.getElementById("title").textContent;
                h1.style.fontFamily = font;
            }
        }

        // Logo
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

        // --- EFFETTI SCRITTA
        if (config.effetto_scritta && config.effetti_scritta_lista) {
            const effetto = config.effetti_scritta_lista.find(e => e.id === config.effetto_scritta);
            if (effetto && effetto.css) {
                let css = effetto.css.replace(/var\(--text-color\)/g, textColor);
                css.split(';').forEach(rule => {
                    if (rule.trim()) {
                        let [prop, ...rest] = rule.split(':');
                        let val = rest.join(':');
                        if (prop && val) document.body.style.setProperty(prop.trim(), val.trim());
                    }
                });
            }
        }

        // --- EFFETTI SFONDO
        if (config.effetto_sfondo && config.effetti_sfondo_lista) {
            const effetto = config.effetti_sfondo_lista.find(e => e.id === config.effetto_sfondo);
            if (effetto && effetto.css) {
                let css = effetto.css
                    .replace(/var\(--bg-color\)/g, bgColor)
                    .replace(/var\(--bg-color-secondario\)/g, bgColorSecondario)
                    .replace(/var\(--bg-color-rgb\)/g, hexToRgb(bgColor))
                    .replace(/var\(--bg-color-secondario-rgb\)/g, hexToRgb(bgColorSecondario));

                css.split(';').forEach(rule => {
                    if (rule.trim()) {
                        let [prop, ...rest] = rule.split(':');
                        let val = rest.join(':');
                        if (prop && val) document.body.style.setProperty(prop.trim(), val.trim());
                    }
                });
            }
        }

        // Applica colori e font ai componenti
        applicaTemaCoppiaExtra(bgColor, bgColorSecondario, font);

    } catch (err) {
        console.warn("Tema coppia non caricato:", err);
    }
}

// --- Inizializzazione
window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    const coppia = params.get("coppia") || "default";

    await loadIndexData(coppia);
    await applicaTemaCoppia(coppia);
};
