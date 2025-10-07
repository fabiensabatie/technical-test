const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3002;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Remove query parameters for file path
  let filePath = req.url.split('?')[0];
  
  // Default to test playground
  if (filePath === '/' || filePath === '') {
    filePath = '/test-playground.html';
  }

  // Serve files from dist directory or root
  let fullPath;
  if (filePath.startsWith('/dist/')) {
    fullPath = path.join(__dirname, filePath);
  } else {
    fullPath = path.join(__dirname, filePath);
  }

  // Get file extension
  const ext = path.extname(fullPath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  // Read and serve the file
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>404 Not Found</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  background: #f9fafb;
                }
                .error-container {
                  text-align: center;
                  padding: 40px;
                  background: white;
                  border-radius: 12px;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                h1 { color: #dc2626; margin: 0 0 16px 0; }
                p { color: #6b7280; margin: 0; }
                code { background: #f3f4f6; padding: 2px 8px; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="error-container">
                <h1>404 - File Not Found</h1>
                <p>Could not find: <code>${filePath}</code></p>
                <p style="margin-top: 20px;">
                  Make sure you ran <code>npm run build</code> before starting the test server.
                </p>
              </div>
            </body>
          </html>
        `);
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success - serve the file
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log('\n🚀 Block Test Server Running!\n');
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Testing: threescene/Block module\n`);
  console.log('📝 Make sure you ran "npm run build" first!\n');
  console.log('Press Ctrl+C to stop the server\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down test server...\n');
  server.close(() => {
    process.exit(0);
  });
});

