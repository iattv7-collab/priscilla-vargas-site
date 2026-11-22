// path: js/admin-testimonials.js
let testimonials = [];
let editingTestIndex = -1;

async function loadTestimonials() {
  const res = await fetch(`${API}/data/testimonials.json`);
  testimonials = await res.json();
  renderTestimonialList();
}

function renderTestimonialList() {
  const list = document.getElementById('testimonials-list');
  list.innerHTML = testimonials.map((t, i) => `
    <div onclick="editTestimonial(${i})" style="padding:12px; border-bottom:1px solid #eee; cursor:pointer; ${i === editingTestIndex ? 'background:#faf6ef;' : ''}">
      <strong>${t.author || 'Anonymous'}</strong><br>
      <small style="color:#888;">${(t.quote || '').substring(0, 40)}...</small>
    </div>
  `).join('');
}

function editTestimonial(index) {
  editingTestIndex = index;
  const t = testimonials[index];
  document.getElementById('testimonial-editor').innerHTML = `
    <label>Quote</label>
    <textarea id="test-quote" style="width:100%; height:70px; padding:8px; margin-bottom:8px;">${t.quote || ''}</textarea>
    <label>Author</label>
    <input type="text" id="test-author" value="${t.author || ''}" style="width:100%; padding:8px; margin-bottom:8px;">
    <label>YouTube URL (optional)</label>
    <input type="text" id="test-video" value="${t.video || ''}" style="width:100%; padding:8px; margin-bottom:8px;">
    <button type="button" onclick="applyTestimonial()" style="margin-right:8px;">Apply</button>
    <button type="button" onclick="removeTestimonial(${index})" style="background:#c0392b; margin-right:8px;">Remove</button>
    <button type="button" onclick="cancelTestimonial()">Back</button>
  `;
  renderTestimonialList();
}

function startAddTestimonial() {
  editingTestIndex = -1;
  document.getElementById('testimonial-editor').innerHTML = `
    <label>Quote</label>
    <textarea id="test-quote" style="width:100%; height:70px; padding:8px; margin-bottom:8px;"></textarea>
    <label>Author</label>
    <input type="text" id="test-author" style="width:100%; padding:8px; margin-bottom:8px;">
    <label>YouTube URL (optional)</label>
    <input type="text" id="test-video" style="width:100%; padding:8px; margin-bottom:8px;">
    <button type="button" onclick="applyNewTestimonial()" style="margin-right:8px;">Add</button>
    <button type="button" onclick="cancelTestimonial()">Back</button>
  `;
}

function applyTestimonial() {
  if (editingTestIndex < 0) return;
  testimonials[editingTestIndex] = {
    id: testimonials[editingTestIndex].id,
    quote: document.getElementById('test-quote').value,
    author: document.getElementById('test-author').value,
    video: document.getElementById('test-video').value
  };
  renderTestimonialList();
}

function applyNewTestimonial() {
  testimonials.push({
    id: Date.now(),
    quote: document.getElementById('test-quote').value,
    author: document.getElementById('test-author').value,
    video: document.getElementById('test-video').value
  });
  cancelTestimonial();
}

function cancelTestimonial() {
  editingTestIndex = -1;
  document.getElementById('testimonial-editor').innerHTML = '<p style="color:#888;">Select a testimonial or click Add</p>';
  renderTestimonialList();
}

function removeTestimonial(index) {
  if (confirm('Remove this testimonial?')) {
    testimonials.splice(index, 1);
    cancelTestimonial();
  }
}

async function saveTestimonials() {
  const status = document.getElementById('testimonials-status');
  try {
    const res = await fetch(`${API}/save/testimonials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testimonials, null, 2)
    });
    if (res.ok) {
      status.textContent = 'Saved ✓';
      status.style.color = 'green';
    } else {
      status.textContent = 'Save failed';
      status.style.color = 'red';
    }
  } catch (e) {
    status.textContent = 'Error';
    status.style.color = 'red';
  }
}

document.addEventListener('DOMContentLoaded', loadTestimonials);