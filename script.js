const form = document.getElementById('uploadForm');
const message = document.getElementById('message');
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
