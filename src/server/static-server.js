const http = require('http');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Static HTTP Server
 * 
 * Simple Node.js static file server for DLest development
 */

class StaticServer {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.root = path.resolve(options.root || process.cwd());
    this.host = options.host || 'localhost';
    this.server = null;
    this.verbose = options.verbose || false;
  }

  /**
   * Start the server
   */
  async start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          reject(new Error(`Port ${this.port} is already in use`));
        } else {
          reject(error);
        }
      });

      this.server.listen(this.port, this.host, () => {
        const url = `http://${this.host}:${this.port}`;
        console.log(chalk.green(`🌐 DLest server running at ${url}`));
        console.log(chalk.gray(`📁 Serving files from: ${this.root}`));
        console.log(chalk.gray('⏹️  Press Ctrl+C to stop\n'));
        resolve(url);
      });
    });
  }

  /**
   * Stop the server
   */
  async stop() {
    if (!this.server) return;

    return new Promise((resolve) => {
      this.server.close(() => {
        console.log(chalk.yellow('\n⏹️  Server stopped'));
        resolve();
      });
    });
  }

  /**
   * Handle HTTP request
   */
  handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let filePath = path.join(this.root, decodeURIComponent(url.pathname));

    // Security: prevent directory traversal
    if (!filePath.startsWith(this.root)) {
      this.sendError(res, 403, 'Forbidden');
      return;
    }

    // Log request if verbose
    if (this.verbose) {
      console.log(chalk.blue(`${req.method} ${req.url}`));
    }

    this.serveFile(req, res, filePath);
  }

  /**
   * Serve file or directory
   */
  serveFile(req, res, filePath) {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        // File not found, try with .html extension for SPA support
        if (err.code === 'ENOENT' && !path.extname(filePath)) {
          const htmlPath = filePath + '.html';
          return this.serveFile(req, res, htmlPath);
        }
        
        // If still not found, try index.html in directory
        if (err.code === 'ENOENT') {
          const indexPath = path.join(path.dirname(filePath), 'index.html');
          return this.serveFile(req, res, indexPath);
        }
        
        this.sendError(res, 404, 'Not Found');
        return;
      }

      if (stats.isDirectory()) {
        // Try to serve index.html from directory
        const indexPath = path.join(filePath, 'index.html');
        fs.access(indexPath, fs.constants.F_OK, (indexErr) => {
          if (indexErr) {
            this.sendDirectoryListing(res, filePath);
          } else {
            this.serveFile(req, res, indexPath);
          }
        });
        return;
      }

      if (stats.isFile()) {
        this.sendFile(res, filePath, stats);
        return;
      }

      this.sendError(res, 404, 'Not Found');
    });
  }

  /**
   * Send file content
   */
  sendFile(res, filePath, stats) {
    const mimeType = this.getMimeType(filePath);
    const range = res.req.headers.range;

    // Set headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Add CORS headers for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle range requests (for video/audio)
    if (range) {
      const positions = range.replace(/bytes=/, "").split("-");
      const start = parseInt(positions[0], 10);
      const total = stats.size;
      const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
      const chunksize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Content-Length': chunksize
      });

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      res.setHeader('Content-Length', stats.size);
      res.writeHead(200);
      fs.createReadStream(filePath).pipe(res);
    }

    // Log success if verbose
    if (this.verbose) {
      console.log(chalk.green(`  ✓ ${res.statusCode} ${path.relative(this.root, filePath)}`));
    }
  }

  /**
   * Send directory listing
   */
  sendDirectoryListing(res, dirPath) {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        this.sendError(res, 500, 'Internal Server Error');
        return;
      }

      const relativePath = path.relative(this.root, dirPath);
      const title = relativePath || 'Root Directory';

      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Directory: ${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; }
    h1 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; }
    ul { list-style: none; padding: 0; }
    li { margin: 0.5rem 0; }
    a { text-decoration: none; color: #0066cc; }
    a:hover { text-decoration: underline; }
    .parent { color: #666; }
    .dir { font-weight: bold; }
    .file { color: #333; }
  </style>
</head>
<body>
  <h1>📁 ${title}</h1>
  <ul>`;

      // Add parent directory link if not root
      if (relativePath) {
        const parentPath = path.dirname(relativePath);
        const parentUrl = parentPath === '.' ? '/' : `/${parentPath}`;
        html += `    <li><a href="${parentUrl}" class="parent">📁 ..</a></li>\n`;
      }

      // Sort files: directories first, then files
      files.sort((a, b) => {
        const aPath = path.join(dirPath, a);
        const bPath = path.join(dirPath, b);
        const aStat = fs.statSync(aPath);
        const bStat = fs.statSync(bPath);
        
        if (aStat.isDirectory() && !bStat.isDirectory()) return -1;
        if (!aStat.isDirectory() && bStat.isDirectory()) return 1;
        return a.localeCompare(b);
      });

      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        const isDir = stats.isDirectory();
        const icon = isDir ? '📁' : '📄';
        const className = isDir ? 'dir' : 'file';
        
        const url = path.join('/', relativePath, file).replace(/\\/g, '/');
        html += `    <li><a href="${url}" class="${className}">${icon} ${file}</a></li>\n`;
      });

      html += `  </ul>
  <hr>
  <p><small>DLest Development Server</small></p>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.writeHead(200);
      res.end(html);
    });
  }

  /**
   * Send error response
   */
  sendError(res, statusCode, message) {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Error ${statusCode}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; text-align: center; }
    h1 { color: #cc0000; }
    p { color: #666; }
  </style>
</head>
<body>
  <h1>Error ${statusCode}</h1>
  <p>${message}</p>
  <hr>
  <p><small>DLest Development Server</small></p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.writeHead(statusCode);
    res.end(html);

    // Log error if verbose
    if (this.verbose) {
      console.log(chalk.red(`  ✗ ${statusCode} ${message}`));
    }
  }

  /**
   * Get MIME type for file
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.htm': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.xml': 'application/xml; charset=utf-8',
      '.txt': 'text/plain; charset=utf-8',
      '.md': 'text/markdown; charset=utf-8',
      
      // Images
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
      
      // Fonts
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      
      // Media
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      
      // Archives
      '.zip': 'application/zip',
      '.pdf': 'application/pdf',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Check if port is available
   */
  static async isPortAvailable(port, host = 'localhost') {
    return new Promise((resolve) => {
      const server = http.createServer();
      
      server.listen(port, host, () => {
        server.close(() => resolve(true));
      });
      
      server.on('error', () => resolve(false));
    });
  }

  /**
   * Find available port starting from given port
   */
  static async findAvailablePort(startPort = 3000, host = 'localhost') {
    let port = startPort;
    while (port < startPort + 100) {
      if (await StaticServer.isPortAvailable(port, host)) {
        return port;
      }
      port++;
    }
    throw new Error(`No available port found starting from ${startPort}`);
  }
}

module.exports = { StaticServer };