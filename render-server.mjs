import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// Load the TanStack Start fetch handler
const { default: app } = await import('./dist/server/server.js');

const MIME = {
  '.js':    'application/javascript',
  '.mjs':   'application/javascript',
  '.css':   'text/css',
  '.html':  'text/html',
  '.svg':   'image/svg+xml',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.json':  'application/json',
  '.webp':  'image/webp',
};

const server = createServer(async (req, res) => {
  try {
    // Serve static assets from dist/client directly
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const staticPath = join(__dirname, 'dist/client', pathname);

    try {
      const content = await readFile(staticPath);
      const mime = MIME[extname(staticPath).toLowerCase()] ?? 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'public, max-age=31536000, immutable' });
      res.end(content);
      return;
    } catch {
      // Not a static file — fall through to SSR handler
    }

    // Collect request body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);

    // Adapt Node.js request → Web API Request
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      headers[k] = Array.isArray(v) ? v.join(', ') : v;
    }

    const request = new Request(
      new URL(req.url, `http://localhost:${PORT}`),
      {
        method: req.method,
        headers,
        body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : body.length ? body : undefined,
      }
    );

    // Run through TanStack Start
    const response = await app.fetch(request, {}, { waitUntil: () => {}, passThroughOnException: () => {} });

    // Write response
    for (const [k, v] of response.headers.entries()) res.setHeader(k, v);
    res.statusCode = response.status;
    const buf = await response.arrayBuffer();
    res.end(Buffer.from(buf));

  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`pagecraft-studio listening on port ${PORT}`);
});
