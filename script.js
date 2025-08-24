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

async function applicaTemaCoppia(coppia) {
    try {
        const res = await fetch(`https://matrimonioapp.ew.r.appspot.com/admin/get_coppia?coppia=${encodeURIComponent(coppia)}`);
        const data = await res.json() || {};

        if (data.error) {
            console.warn("Coppia non trovata, uso default");
            return;
        }

        // --- Titolo e header
        document.getElementById("title").textContent = data.titolo_index || "Benvenuti al nostro matrimonio";
        const header = document.querySelector('header');
        if(header){
            header.style.backgroundColor = data.colori?.header || '#eee';
            const h1 = header.querySelector('h1');
            if(h1) h1.style.fontFamily = data.colori?.font || 'Arial, Helvetica, sans-serif';
        }

        // --- Corpo pagina
        const bgColor = data.colori?.sfondo || '#ffffff';
        const bgColorSecondario = data.colori?.secondario || '#eeeeee';
        const textColor = data.colori?.testo || '#000000';
        const font = data.colori?.font || 'Arial, Helvetica, sans-serif';

        document.body.style.backgroundColor = bgColor;
        document.body.style.color = textColor;
        document.body.style.fontFamily = font;

        // --- Foto
        if(data.foto_url){
            document.getElementById("index-photo").src = data.foto_url;
        }

        // --- Link galleria
        document.getElementById("galleria-btn").href = `gallery.html?coppia=${encodeURIComponent(coppia)}`;

        // --- Overlay e effetti sfondo
        if(data.effetto_sfondo){
            const effettiRes = await fetch('https://matrimonioapp.ew.r.appspot.com/admin/get_effetti');
            const effettiData = await effettiRes.json();
            const effSfondo = effettiData.sfondo.find(e => e.id === data.effetto_sfondo);

            if(effSfondo?.css){
                let css = effSfondo.css
                    .replace(/var\(--bg-color\)/g, bgColor)
                    .replace(/var\(--bg-color-secondario\)/g, bgColorSecondario)
                    .replace(/var\(--bg-color-rgb\)/g, hexToRgb(bgColor))
                    .replace(/var\(--bg-color-secondario-rgb\)/g, hexToRgb(bgColorSecondario));

                css.split(';').forEach(rule => {
                    if(rule.trim()){
                        let [prop, ...rest] = rule.split(':');
                        let val = rest.join(':');
                        if(prop && val) document.body.style.setProperty(prop.trim(), val.trim());
                    }
                });

                const urlMatch = css.match(/url\(([^)]+)\)/);
                let overlay = document.getElementById('admin-theme-overlay');
                if(urlMatch){
                    if(!overlay){
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
                        document.body.appendChild(overlay);
                    }
                    overlay.style.backgroundColor = `rgba(${hexToRgb(bgColor)},0.3)`;
                } else if(overlay){
                    overlay.remove();
                }
            }
        }

        // --- Aggiorna bottoni, link, tabelle e font globale
        applicaTemaCoppiaExtra(bgColor, bgColorSecondario, font);

    } catch(err){
        console.error("Errore applicazione tema coppia:", err);
    }
}

