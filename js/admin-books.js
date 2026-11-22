// path: js/admin-books.js
let books = [];
let editingIndex = -1;

async function loadBooks() {
  const res = await fetch(`${API}/data/books.json`);
  books = await res.json();
  renderBookList();
}

function renderBookList(filter = '') {
  const list = document.getElementById('books-list');
  const q = filter.toLowerCase();
  const filtered = books.filter(b => b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q));
  list.innerHTML = filtered.map((book, i) => {
    const realIndex = books.indexOf(book);
    return `<div class="book-list-item" onclick="editBook(${realIndex})" style="padding:12px; border-bottom:1px solid #eee; cursor:pointer; ${realIndex === editingIndex ? 'background:#faf6ef;' : ''}">
      <strong>${book.title || 'Untitled'}</strong><br>
      <small style="color:#888;">${book.author || ''}</small>
    </div>`;
  }).join('');
}

function editBook(index) {
  editingIndex = index;
  const book = books[index];
  document.getElementById('book-editor').innerHTML = `
    <label>Title</label>
    <input type="text" id="edit-title" value="${book.title || ''}" style="width:100%; padding:8px; margin-bottom:8px;">
    <label>Author</label>
    <input type="text" id="edit-author" value="${book.author || ''}" style="width:100%; padding:8px; margin-bottom:8px;">
    <label>Description</label>
    <textarea id="edit-desc" style="width:100%; height:80px; padding:8px; margin-bottom:8px;">${book.description || ''}</textarea>
    <label>Cover image</label>
    <div id="edit-dropzone" style="border:2px dashed #c9a227; border-radius:8px; padding:15px; text-align:center; margin-bottom:8px; background:#faf6ef; cursor:pointer;">
      Drop image or click
      <input type="file" id="edit-file" accept="image/*" style="display:none;">
    </div>
    <input type="text" id="edit-cover" value="${book.cover || ''}" style="width:100%; padding:8px; margin-bottom:8px; background:#f5f5f5;" readonly>
    <label style="display:flex; align-items:center; gap:8px; margin:8px 0;">
      <input type="checkbox" id="edit-published" ${book.published !== false ? 'checked' : ''}>
      Published
    </label>
    <button type="button" onclick="applyEdit()" style="margin-right:8px;">Apply</button>
    <button type="button" onclick="removeBook(${index})" style="background:#c0392b; margin-right:8px;">Remove</button>
    <button type="button" onclick="cancelEdit()">Back</button>
  `;
  renderBookList(document.getElementById('book-search').value);
  setupDropzone();
}

function startAddBook() {
  editingIndex = -1;
  document.getElementById('book-editor').innerHTML = `
    <label>Title</label>
    <input type="text" id="edit-title" style="width:100%; padding:8px; margin-bottom:8px;">
    <label>Author</label>
    <input type="text" id="edit-author" style="width:100%; padding:8px; margin-bottom:8px;">
    <label>Description</label>
    <textarea id="edit-desc" style="width:100%; height:80px; padding:8px; margin-bottom:8px;"></textarea>
    <label>Cover image</label>
    <div id="edit-dropzone" style="border:2px dashed #c9a227; border-radius:8px; padding:15px; text-align:center; margin-bottom:8px; background:#faf6ef; cursor:pointer;">
      Drop image or click
      <input type="file" id="edit-file" accept="image/*" style="display:none;">
    </div>
    <input type="text" id="edit-cover" style="width:100%; padding:8px; margin-bottom:8px; background:#f5f5f5;" readonly>
    <label style="display:flex; align-items:center; gap:8px; margin:8px 0;">
      <input type="checkbox" id="edit-published" checked>
      Published
    </label>
    <button type="button" onclick="applyNewBook()" style="margin-right:8px;">Add Book</button>
    <button type="button" onclick="cancelEdit()">Back</button>
  `;
  setupDropzone();
}

function setupDropzone() {
  const zone = document.getElementById('edit-dropzone');
  const fileInput = document.getElementById('edit-file');
  if (!zone) return;
  zone.addEventListener('click', () => fileInput.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.background = '#f0e6d0'; });
  zone.addEventListener('dragleave', () => zone.style.background = '#faf6ef');
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.style.background = '#faf6ef';
    if (e.dataTransfer.files[0]) uploadCover(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) uploadCover(fileInput.files[0]);
  });
}

async function uploadCover(file) {
  const formData = new FormData();
  formData.append('image', file);
  try {
    const res = await fetch(`${API}/upload-image`, { method: 'POST', body: formData });
    const result = await res.json();
    if (result.path) document.getElementById('edit-cover').value = result.path;
  } catch (e) {}
}

function applyEdit() {
  if (editingIndex < 0) return;
  books[editingIndex] = {
    id: books[editingIndex].id,
    title: document.getElementById('edit-title').value,
    author: document.getElementById('edit-author').value,
    description: document.getElementById('edit-desc').value,
    cover: document.getElementById('edit-cover').value,
    published: document.getElementById('edit-published').checked
  };
  renderBookList(document.getElementById('book-search').value);
}

function applyNewBook() {
  books.push({
    id: Date.now(),
    title: document.getElementById('edit-title').value,
    author: document.getElementById('edit-author').value,
    description: document.getElementById('edit-desc').value,
    cover: document.getElementById('edit-cover').value,
    published: document.getElementById('edit-published').checked
  });
  cancelEdit();
  renderBookList();
}

function cancelEdit() {
  editingIndex = -1;
  document.getElementById('book-editor').innerHTML = '<p style="color:#888;">Select a book from the list or click Add Book</p>';
  renderBookList(document.getElementById('book-search')?.value || '');
}

function removeBook(index) {
  if (confirm('Remove this book?')) {
    books.splice(index, 1);
    cancelEdit();
  }
}

async function saveBooks() {
  const status = document.getElementById('books-status');
  try {
    const res = await fetch(`${API}/save/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(books, null, 2)
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

document.getElementById('book-search')?.addEventListener('input', (e) => renderBookList(e.target.value));
document.addEventListener('DOMContentLoaded', loadBooks);