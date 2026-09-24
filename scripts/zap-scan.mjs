import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

// Solo inspección pasiva del frontend local: nunca activa ataques ni visita Supabase.
const [label = 'final', target = 'http://127.0.0.1:4174/'] = process.argv.slice(2)
if (!/^[a-z0-9-]+$/.test(label)) throw new Error('Etiqueta inválida')
const url = new URL(target)
if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname) || url.username || url.password) {
  throw new Error('Este plan solo permite HTTP en localhost/127.0.0.1 sin credenciales')
}
const zapHome = process.env.ZAP_HOME
if (!zapHome) throw new Error('Define ZAP_HOME como el directorio portable de ZAP 2.17.0')
const outputDir = path.resolve('reportes/seguridad-zap', label)
const sessionDir = await mkdtemp(path.join(tmpdir(), 'milenio-zap-'))
await mkdir(outputDir, { recursive: true })
const origin = url.origin
const escapedOrigin = origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const plan = {
  env: {
    contexts: [{ name: 'milenio-local', urls: [origin], includePaths: [`${escapedOrigin}/.*`] }],
    parameters: { failOnError: true, failOnWarning: false, continueOnFailure: false, progressToStdout: true },
  },
  jobs: [
    { type: 'passiveScan-config', parameters: { scanOnlyInScope: true } },
    { type: 'spider', parameters: { context: 'milenio-local', url: target, maxDuration: 1, maxDepth: 3, maxChildren: 20 },
      tests: [{ name: 'Al menos la página inicial fue visitada', type: 'stats', statistic: 'automation.spider.urls.added', operator: '>=', value: 1, onFail: 'error' }] },
    { type: 'passiveScan-wait', parameters: { maxDuration: 2 } },
    ...['traditional-html', 'traditional-json'].map(template => ({
      type: 'report', parameters: {
        template, reportDir: outputDir, reportFile: `zap-${label}`,
        reportTitle: `Milenio Express — ZAP ${label}`,
        reportDescription: 'Inspección pasiva del frontend local. Sin autenticación JWT, escaneo activo ni acceso al backend remoto.',
      }, sites: [origin],
    })),
  ],
}
// JSON es un subconjunto de YAML; se conserva el plan exacto ejecutado.
const planPath = path.join(outputDir, 'plan.yaml')
await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`)
const startedAt = new Date().toISOString()
const initialResponse = await fetch(target, { redirect: 'error' })
if (!initialResponse.ok) throw new Error(`El target devuelve HTTP ${initialResponse.status}`)
const initialBody = await initialResponse.text()
await writeFile(path.join(outputDir, 'http-root.json'), `${JSON.stringify({
  target, status: initialResponse.status, headers: Object.fromEntries(initialResponse.headers),
  bodySha256: createHash('sha256').update(initialBody).digest('hex'),
}, null, 2)}\n`)
const args = ['-cmd', '-host', '127.0.0.1', '-port', process.env.ZAP_PORT || '8098', '-dir', sessionDir, '-autorun', planPath]
const log = createWriteStream(path.join(outputDir, 'execution.log'))
const proc = spawn('bash', [path.join(zapHome, 'zap.sh'), ...args], { env: process.env })
proc.stdout.on('data', chunk => { process.stdout.write(chunk); log.write(chunk) })
proc.stderr.on('data', chunk => { process.stderr.write(chunk); log.write(chunk) })
const exitCode = await new Promise((resolve, reject) => { proc.once('error', reject); proc.once('exit', code => resolve(code)) })
await new Promise(resolve => log.end(resolve))
await writeFile(path.join(outputDir, 'run.json'), `${JSON.stringify({
  tool: 'ZAP', version: '2.17.0', label, target, startedAt, finishedAt: new Date().toISOString(), exitCode,
  sourceVersion: process.env.SCAN_SOURCE_VERSION || 'working-tree; consultar manifiesto de entrega',
  command: ['bash', '<ZAP_HOME>/zap.sh', ...args.map(arg => arg === sessionDir ? '<TEMP_SESSION>' : arg)],
  scope: 'Frontend HTTP local, spider tradicional y reglas pasivas; sin backend remoto, login ni pruebas activas',
}, null, 2)}\n`)
if (exitCode !== 0 && exitCode !== 2) process.exitCode = exitCode || 1
// Detectar informes incompletos en vez de presentar un fallo como escaneo exitoso.
const report = JSON.parse(await readFile(path.join(outputDir, `zap-${label}.json`), 'utf8'))
console.log(JSON.stringify({ report: outputDir, exitCode, sites: report.site?.map(site => ({ url: site['@name'], alertTypes: site.alerts?.length || 0 })) }))
