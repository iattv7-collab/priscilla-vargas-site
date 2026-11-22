// path: server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const IMAGES_DIR = path.join(__dirname, 'images');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Serve admin.html
  if (req.url === '/' || req.url === '/admin.html') {
    fs.readFile(path.join(__dirname, 'admin.html'), (err, data) => {
      if (err) { res.writeHead(500); res.end('Error'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // Save JSON
  if (req.method === 'POST' && req.url.startsWith('/save/')) {
    const type = req.url.split('/')[2];
    if (!['books', 'testimonials', 'videos', 'hero'].includes(type)) {
      res.writeHead(400); res.end('Invalid type'); return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        JSON.parse(body);
        const filePath = path.join(DATA_DIR, `${type}.json`);
        fs.writeFile(filePath, body, (err) => {
          if (err) { res.writeHead(500); res.end('Write error'); return; }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        });
      } catch (e) {
        res.writeHead(400); res.end('Invalid JSON');
      }
    });
    return;
  }

  // Image upload
  if (req.method === 'POST' && req.url === '/upload-image') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const boundary = req.headers['content-type'].split('boundary=')[1];
      const buffer = Buffer.concat(chunks);
      const parts = buffer.toString('binary').split('--' + boundary);
      
      for (const part of parts) {
        if (part.includes('filename=')) {
          const filenameMatch = part.match(/filename="(.+?)"/);
          if (!filenameMatch) continue;
          const filename = filenameMatch[1];
          const fileStart = part.indexOf('\r\n\r\n') + 4;
          const fileEnd = part.lastIndexOf('\r\n');
          const fileData = Buffer.from(part.slice(fileStart, fileEnd), 'binary');
          
          const savePath = path.join(IMAGES_DIR, filename);
          fs.writeFileSync(savePath, fileData);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ path: 'images/' + filename }));
          return;
        }
      }
      res.writeHead(400); res.end('No file');
    });
    return;
  }

  // Serve static files
  const filePath = path.join(__dirname, req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Admin server running at http://localhost:${PORT}/admin.html`);
});