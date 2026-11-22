// path: js/admin-videos.js
let videos = [];
let editingVideoIndex = -1;

async function loadVideos() {
  const res = await fetch(`${API}/data/videos.json`);
  videos = await res.json();
  renderVideoList();
}

function renderVideoList() {
  const list = document.getElementById('videos-list');
  list.innerHTML = videos.map((v, i) => `
    <div onclick="editVideo(${i})" style="padding:12px; border-bottom:1px solid #eee; cursor:pointer; ${i === editingVideoIndex ? 'background:#faf6ef;' : ''}">
      <strong>${v.title || 'Untitled'}</strong>
    </div>
  `).join('');
}

function editVideo(index) {
  editingVideoIndex = index;
  const v = videos[index];
  document.getElementById('video-editor').innerHTML = `
    <label>Title</label>
    <input type="text" id="video-title" value="${v.title || ''}" style="width:100%; padding:8px; margin-bottom:8px;">
    <label>YouTube URL</label>
    <input type="text" id="video-url" value="${v.url || ''}" style="width:100%; padding:8px; margin-bottom:8px;">
    <label>Thumbnail path</label>
    <input type="text" id="video-thumb" value="${v.thumbnail || ''}" style="width:100%; padding:8px; margin-bottom:8px; background:#f5f5f5;" readonly>
    <button type="button" onclick="applyVideo()" style="margin-right:8px;">Apply</button>
    <button type="button" onclick="removeVideo(${index})" style="background:#c0392b; margin-right:8px;">Remove</button>
    <button type="button" onclick="cancelVideo()">Back</button>
  `;
  renderVideoList();
}

function startAddVideo() {
  editingVideoIndex = -1;
  document.getElementById('video-editor').innerHTML = `
    <label>Title</label>
    <input type="text" id="video-title" style="width:100%; padding:8px; margin-bottom:8px;">
    <label>YouTube URL</label>
    <input type="text" id="video-url" style="width:100%; padding:8px; margin-bottom:8px;">
    <label>Thumbnail path</label>
    <input type="text" id="video-thumb" style="width:100%; padding:8px; margin-bottom:8px; background:#f5f5f5;" readonly>
    <button type="button" onclick="applyNewVideo()" style="margin-right:8px;">Add</button>
    <button type="button" onclick="cancelVideo()">Back</button>
  `;
}

function applyVideo() {
  if (editingVideoIndex < 0) return;
  videos[editingVideoIndex] = {
    id: videos[editingVideoIndex].id,
    title: document.getElementById('video-title').value,
    url: document.getElementById('video-url').value,
    thumbnail: document.getElementById('video-thumb').value
  };
  renderVideoList();
}

function applyNewVideo() {
  videos.push({
    id: Date.now(),
    title: document.getElementById('video-title').value,
    url: document.getElementById('video-url').value,
    thumbnail: document.getElementById('video-thumb').value
  });
  cancelVideo();
}

function cancelVideo() {
  editingVideoIndex = -1;
  document.getElementById('video-editor').innerHTML = '<p style="color:#888;">Select a video or click Add</p>';
  renderVideoList();
}

function removeVideo(index) {
  if (confirm('Remove this video?')) {
    videos.splice(index, 1);
    cancelVideo();
  }
}

async function saveVideos() {
  const status = document.getElementById('videos-status');
  try {
    const res = await fetch(`${API}/save/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(videos, null, 2)
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

document.addEventListener('DOMContentLoaded', loadVideos);