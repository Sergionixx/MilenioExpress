import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve(process.env.STATIC_DIR || 'dist');
const port = Number(process.env.PORT || 4174);
const host = process.env.HOST || '127.0.0.1';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const policy = [
  "default-src 'self'", "script-src 'self'", "style-src 'self' https://fonts.googleapis.com",
  "img-src 'self' data:", "font-src 'self' https://fonts.gstatic.com", "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
].join('; ');
export const server = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Security-Policy', policy);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Solicitud inválida'); return; }
  let file = resolve(root, `.${pathname}`);
  if ((file !== root && !file.startsWith(root + sep)) || pathname.split('/').some(part => part.startsWith('.'))) {
    res.writeHead(404); res.end('No encontrado'); return;
  }
  try {
    const info = await stat(file).catch(() => null);
    if (!info?.isFile()) {
      if (extname(pathname)) { res.writeHead(404); res.end('No encontrado'); return; }
      file = resolve(root, 'index.html');
    }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(500); res.end('No se pudo servir la aplicación'); }
});
server.listen(port, host, () => console.log(`Milenio Express: http://${host}:${port}`));
