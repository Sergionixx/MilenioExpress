import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.env.DEPLOY_URL || 'http://127.0.0.1:4174';
const checks = [];
async function check(path, expected, method = 'GET') {
  const response = await fetch(new URL(path, base), { method, signal: AbortSignal.timeout(10_000) });
  assert.equal(response.status, expected, `${method} ${path}`);
  const headers = Object.fromEntries(response.headers);
  assert.ok(headers['content-security-policy']?.includes("frame-ancestors 'none'"));
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.equal(headers['x-frame-options'], 'DENY');
  checks.push({ method, path, status: response.status, securityHeaders: headers });
  return response;
}
const html = await (await check('/', 200)).text();
assert.match(html, /Milenio Express/);
const asset = /<script[^>]+src="([^"]+)"/.exec(html)?.[1];
assert.ok(asset, 'El HTML debe referenciar el bundle desplegado');
await check(asset, 200);
await check('/consulta', 200);
await check('/.env', 404);
await check('/missing.js', 404);
await check('/', 405, 'POST');
mkdirSync('evidencias', { recursive: true });
const result = { timestamp: new Date().toISOString(), commit: process.env.GITHUB_SHA || null, environment: process.env.GITHUB_ACTIONS ? 'Contenedor de pruebas efímero en GitHub Actions' : 'Servidor local de pruebas', base, checks };
writeFileSync('evidencias/despliegue.json', JSON.stringify(result, null, 2)+'\n');
console.log(`Despliegue verificado: ${checks.length} comprobaciones HTTP y cabeceras en ${base}`);
