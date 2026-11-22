// path: js/admin-hero.js
const API = 'http://localhost:3000';
let heroData = {};

async function loadHero() {
  const res = await fetch(`${API}/data/hero.json`);
  heroData = await res.json();
}

function editHero() {
  document.getElementById('hero-editor').innerHTML = `
    <label>Headline</label>
    <input type="text" id="hero-headline" value="${heroData.headline || ''}" style="width:100%; padding:8px; margin-bottom:8px;">
    <label>Description</label>
    <textarea id="hero-description" style="width:100%; height:70px; padding:8px; margin-bottom:8px;">${heroData.description || ''}</textarea>
    <label>Hero Image</label>
    <div id="hero-dropzone" style="border:2px dashed #c9a227; border-radius:8px; padding:15px; text-align:center; margin-bottom:8px; background:#faf6ef; cursor:pointer;">
      Drop image or click
      <input type="file" id="hero-file" accept="image/*" style="display:none;">
    </div>
    <input type="text" id="hero-image" value="${heroData.image || ''}" style="width:100%; padding:8px; margin-bottom:8px; background:#f5f5f5;" readonly>
    <button type="button" onclick="cancelHeroEdit()" style="margin-top:8px;">Back</button>
  `;
  const zone = document.getElementById('hero-dropzone');
  const fileInput = document.getElementById('hero-file');
  zone.addEventListener('click', () => fileInput.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.background = '#f0e6d0'; });
  zone.addEventListener('dragleave', () => zone.style.background = '#faf6ef');
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.style.background = '#faf6ef';
    if (e.dataTransfer.files[0]) uploadHeroImage(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) uploadHeroImage(fileInput.files[0]);
  });
}

function cancelHeroEdit() {
  document.getElementById('hero-editor').innerHTML = '';
}

async function uploadHeroImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  try {
    const res = await fetch(`${API}/upload-image`, { method: 'POST', body: formData });
    const result = await res.json();
    if (result.path) document.getElementById('hero-image').value = result.path;
  } catch (e) {}
}

async function saveHero() {
  const status = document.getElementById('hero-status');
  const headline = document.getElementById('hero-headline');
  if (!headline) {
    status.textContent = 'Click Edit first';
    status.style.color = 'red';
    return;
  }
  heroData = {
    headline: document.getElementById('hero-headline').value,
    description: document.getElementById('hero-description').value,
    image: document.getElementById('hero-image').value,
    buttonText: heroData.buttonText || 'Ordenar Libro',
    buttonLink: heroData.buttonLink || 'pages/comprar.html'
  };
  try {
    const res = await fetch(`${API}/save/hero`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(heroData, null, 2)
    });
    if (res.ok) {
      status.textContent = 'Saved ✓';
      status.style.color = 'green';
      cancelHeroEdit();
    } else {
      status.textContent = 'Save failed';
      status.style.color = 'red';
    }
  } catch (e) {
    status.textContent = 'Error';
    status.style.color = 'red';
  }
}

document.addEventListener('DOMContentLoaded', loadHero);