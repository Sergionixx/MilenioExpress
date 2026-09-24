import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
function option(name, fallback = null) {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`Missing value for ${name}`);
  return args[index + 1];
}
const label = option("--label", "final");
if (!/^[a-z0-9_-]+$/i.test(label)) throw new Error("The report label must be a simple filename.");
const reference = option("--ref");
const output = resolve(root, option("--output", "reportes/sonar"));
const roots = ["src", "supabase/functions/server", "utils"];
const sourceExtension = /\.(?:ts|tsx|js|jsx|mjs)$/;
const git = (...command) => execFileSync("git", command, { cwd: root, encoding: "utf8" }).trimEnd();
const hash = (value) => createHash("sha256").update(value).digest("hex");
const escape = (value) => String(value ?? "N/D").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const temp = mkdtempSync(join(tmpdir(), "milenio-quality-"));
mkdirSync(output, { recursive: true });

function walk(directory) {
  if (!existsSync(join(root, directory))) return [];
  return readdirSync(join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : sourceExtension.test(path) ? [path] : [];
  });
}
function packageVersion(name) {
  let directory = dirname(require.resolve(name));
  while (directory !== dirname(directory)) {
    const filename = join(directory, "package.json");
    if (existsSync(filename)) {
      const manifest = JSON.parse(readFileSync(filename, "utf8"));
      if (manifest.name === name) return manifest.version;
    }
    directory = dirname(directory);
  }
  throw new Error(`Cannot identify installed version: ${name}`);
}
function readCoverage(path) {
  if (!path) return null;
  const absolute = resolve(root, path);
  const content = readFileSync(absolute, "utf8");
  let values;
  try {
    const data = JSON.parse(content);
    if (data.total?.lines && data.total?.branches && data.total?.functions) {
      values = { lines: data.total.lines.pct, branches: data.total.branches.pct, functions: data.total.functions.pct };
    }
  } catch { /* Node spec/TAP reports are text, not JSON. */ }
  if (!values) {
    const summary = content.match(/all files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/i);
    if (summary) values = { lines: Number(summary[1]), branches: Number(summary[2]), functions: Number(summary[3]) };
  }
  if (!values) throw new Error(`Unsupported coverage report: ${path}`);
  if (Object.values(values).some((value) => !Number.isFinite(value) || value < 0 || value > 100)) throw new Error("Invalid coverage percentages.");
  return { ...values, source: relative(root, absolute), sha256: hash(content), scope: "Módulo declarado por test:coverage; no equivale a cobertura de toda la aplicación." };
}
function readAudit(path) {
  if (!path) return null;
  const absolute = resolve(root, path);
  const content = readFileSync(absolute, "utf8");
  const data = JSON.parse(content);
  if (!data.metadata?.vulnerabilities) throw new Error(`No npm audit vulnerability summary in ${path}`);
  return { vulnerabilities: data.metadata.vulnerabilities, source: relative(root, absolute), sha256: hash(content), scope: "Dependencias evaluadas por npm audit; no son vulnerabilidades de código clasificadas por SonarQube." };
}
function portable(value) {
  return JSON.parse(JSON.stringify(value).replaceAll(temp.replaceAll("\\", "\\\\"), "."));
}
function render(report, baseline) {
  const metrics = report.metrics;
  const cards = [
    ["Archivos de aplicación", metrics.files], ["Hallazgos SonarJS", metrics.issues],
    ["Duplicación de líneas", `${metrics.duplicationPercent}%`],
    ["Cobertura del módulo · líneas", report.coverage ? `${report.coverage.lines}%` : "N/D"],
  ].map(([title, value]) => `<article><span>${escape(title)}</span><strong>${escape(value)}</strong></article>`).join("");
  const rows = report.findings.map((item) => `<tr><td>${escape(item.file)}:${item.line}</td><td><a href="${escape(item.documentation)}">${escape(item.ruleId)}</a></td><td>${escape(item.message)}</td></tr>`).join("");
  const grouped = Object.entries(metrics.byRule).sort((a, b) => b[1] - a[1]).map(([rule, count]) => `<tr><td>${escape(rule)}</td><td>${count}</td><td>${baseline ? (baseline.metrics.byRule[rule] ?? 0) : "N/D"}</td></tr>`).join("");
  const comparison = baseline ? `<p>Comparación con <code>${escape(baseline.revision)}</code>: ${baseline.metrics.issues} → ${metrics.issues} hallazgos; ${baseline.metrics.duplicationPercent}% → ${metrics.duplicationPercent}% de duplicación. El alcance puede crecer: ${baseline.metrics.files} → ${metrics.files} archivos. Menor cantidad no implica ausencia de riesgo.</p>` : "<p>Este es el análisis inicial del código exacto del commit indicado, ejecutado posteriormente para conservar una línea base reproducible.</p>";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Milenio Express · Calidad ${escape(label)}</title><style>
  *{box-sizing:border-box}body{margin:0;background:#f4f7fb;color:#142338;font:16px/1.6 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:44px 24px}h1{font-size:38px;line-height:1.12;margin:10px 0 20px}h2{margin-top:32px;font-size:24px}p{max-width:1000px}.eyebrow{color:#11675f;font-weight:750;text-transform:uppercase;letter-spacing:.14em;font-size:12px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}article,.note{padding:22px;background:white;border:1px solid #d9e3ed;border-radius:14px}article span{font-size:13px;color:#526174}article strong{display:block;font-size:34px;color:#106c60}.note{border-left:5px solid #c47921}.scroll{overflow:auto}table{width:100%;border-collapse:collapse;background:white;margin:12px 0 25px}th,td{padding:12px 14px;text-align:left;vertical-align:top;border-bottom:1px solid #dce4ec;overflow-wrap:anywhere}th{background:#16304c;color:white}td:first-child{min-width:180px}a{color:#08665f}code{font-size:.86em;overflow-wrap:anywhere}small{color:#526174}.meta{font-size:14px}footer{padding:24px 0;color:#526174;border-top:1px solid #d9e3ed}</style></head><body><main>
  <div class="eyebrow">Milenio Express / análisis global del código</div><h1>Calidad y mantenibilidad</h1><p>Tablero de análisis equivalente construido con ESLint, reglas SonarJS, jscpd y reportes auténticos de pruebas. No es un dashboard ni un Quality Gate de SonarQube Server.</p>
  <p class="meta">Corte: <strong>${escape(report.label)}</strong> · Ejecución UTC: ${escape(report.generatedAt)}<br>Referencia: <code>${escape(report.revision)}</code> · Estado: ${escape(report.snapshot)}<br>Huella SHA-256 del alcance: <code>${report.sourceDigest}</code></p>
  <div class="cards">${cards}</div><h2>Alcance y comparación</h2><p>Se analizan todos los archivos JS/TS de <code>src/</code>, <code>supabase/functions/server/</code> y <code>utils/</code>. Se excluyen dependencias, bundles generados, pruebas y scripts de automatización. Análisis de tipos habilitado para SonarJS. Duplicación: mínimo 5 líneas / 50 tokens, modo mild.</p>${comparison}
  <div class="note"><strong>Límites de interpretación</strong><p>Bugs, vulnerabilidades, Security Hotspots, Code Smells y deuda técnica según el modelo de SonarQube: <strong>N/D</strong>. Aquí se informan hallazgos identificados por reglas SonarJS; no se convierten automáticamente en métricas de servidor ni en horas de deuda. Cero alertas no demuestra seguridad completa. Las pruebas dinámicas están documentadas por separado.</p></div>
  <h2>Métricas verificables</h2><table><thead><tr><th>Métrica</th><th>Resultado</th><th>Origen / alcance</th></tr></thead><tbody>
  <tr><td>Archivos / líneas físicas</td><td>${metrics.files} / ${metrics.physicalLines}</td><td>Manifiesto de fuentes en ${escape(label)}.json</td></tr>
  <tr><td>Hallazgos / errores de parseo</td><td>${metrics.issues} / ${metrics.fatalErrors}</td><td>ESLint + SonarJS, sin inferir equivalencias con severidades de SonarQube</td></tr>
  <tr><td>Clones / líneas duplicadas</td><td>${metrics.clones} / ${metrics.duplicatedLines}</td><td>jscpd, ${metrics.duplicationPercent}% de sus líneas analizadas</td></tr>
  <tr><td>Cobertura líneas / ramas / funciones</td><td>${report.coverage ? `${report.coverage.lines}% / ${report.coverage.branches}% / ${report.coverage.functions}%` : "N/D"}</td><td>${escape(report.coverage?.scope ?? "No se adjuntó reporte de pruebas a este corte.")}</td></tr>
  <tr><td>Vulnerabilidades de dependencias</td><td>${report.audit ? escape(JSON.stringify(report.audit.vulnerabilities)) : "N/D"}</td><td>${escape(report.audit?.scope ?? "Sin npm audit adjunto a este corte.")}</td></tr></tbody></table>
  <h2>Reglas con hallazgos</h2><table><thead><tr><th>Regla</th><th>Este corte</th><th>Inicial</th></tr></thead><tbody>${grouped || '<tr><td colspan="3">No se detectaron hallazgos en las reglas ejecutadas.</td></tr>'}</tbody></table>
  <h2>Hallazgos para revisión</h2><p>La interpretación y las correcciones verificadas se registran en <a href="../../docs/CALIDAD.md">docs/CALIDAD.md</a>. Los resultados completos están en <a href="${escape(label)}-eslint.json">ESLint JSON</a>, <a href="${escape(label)}-jscpd.json">jscpd JSON</a> y <a href="${escape(label)}.json">métricas JSON</a>.</p>
  <div class="scroll"><table><thead><tr><th>Archivo / línea</th><th>Regla</th><th>Mensaje del analizador</th></tr></thead><tbody>${rows || '<tr><td colspan="3">Sin hallazgos.</td></tr>'}</tbody></table></div>
  <footer>Versiones: ${escape(Object.entries(report.tools).map(([name, version]) => `${name} ${version}`).join(" · "))}. Configuración SHA-256: <code>${report.configDigest}</code>.</footer></main></body></html>`;
}

try {
  const revision = reference ? git("rev-parse", "--verify", `${reference}^{commit}`) : git("rev-parse", "HEAD");
  const files = (reference ? git("ls-tree", "-r", "--name-only", revision, "--", ...roots).split("\n").filter((file) => sourceExtension.test(file)) : roots.flatMap(walk)).sort();
  if (!files.length) throw new Error("The source scope is empty.");
  const manifest = files.map((file) => {
    const content = reference ? execFileSync("git", ["show", `${revision}:${file}`], { cwd: root, encoding: "utf8" }) : readFileSync(join(root, file), "utf8");
    mkdirSync(dirname(join(temp, file)), { recursive: true });
    writeFileSync(join(temp, file), content);
    return { file, sha256: hash(content), physicalLines: content.split("\n").length - (content.endsWith("\n") ? 1 : 0) };
  });
  symlinkSync(join(root, "node_modules"), join(temp, "node_modules"), "dir");
  writeFileSync(join(temp, "tsconfig.quality.json"), JSON.stringify({ compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "Bundler", jsx: "react-jsx", strict: true, noEmit: true, skipLibCheck: true, allowImportingTsExtensions: true, allowJs: true }, include: roots }));
  const eslint = new ESLint({ cwd: temp, overrideConfigFile: join(root, "eslint.config.mjs"), overrideConfig: [{ languageOptions: { parserOptions: { project: "./tsconfig.quality.json", tsconfigRootDir: temp } } }] });
  const rawResults = await eslint.lintFiles(files.map((file) => join(temp, file)));
  const results = rawResults.map(({ source: _source, output: _output, ...result }) => ({ ...result, filePath: relative(temp, result.filePath) }));
  const metadata = eslint.getRulesMetaForResults(rawResults);
  const effectiveConfig = await eslint.calculateConfigForFile(join(temp, files[0]));
  const activeRules = Object.entries(effectiveConfig.rules).filter(([, config]) => config[0] !== 0).map(([name]) => name).sort();
  const findings = results.flatMap((result) => result.messages.map((message) => ({ file: result.filePath, ruleId: message.ruleId, line: message.line, column: message.column, severity: message.severity, category: metadata[message.ruleId]?.type ?? "unknown", fatal: message.fatal ?? false, message: message.message, documentation: metadata[message.ruleId]?.docs?.url ?? "https://eslint.org/docs/latest/use/" })));
  if (findings.some((item) => item.fatal)) throw new Error(`ESLint parse failure: ${JSON.stringify(findings.filter((item) => item.fatal))}`);
  const duplicateDirectory = join(temp, "duplication");
  const duplicationRun = spawnSync(process.execPath, [join(root, "node_modules/jscpd/bin/jscpd"), "--reporters", "json", "--silent", "--min-lines", "5", "--min-tokens", "50", "--mode", "mild", "--output", duplicateDirectory, ...roots.map((path) => join(temp, path))], { cwd: temp, encoding: "utf8" });
  if (duplicationRun.error || duplicationRun.status !== 0) throw new Error(`jscpd failed: ${duplicationRun.error ?? duplicationRun.stderr}`);
  const duplicates = portable(JSON.parse(readFileSync(join(duplicateDirectory, "jscpd-report.json"), "utf8")));
  const total = duplicates.statistics.total;
  const report = {
    schemaVersion: 1, label, generatedAt: new Date().toISOString(), revision,
    snapshot: reference ? "git commit exacto" : "árbol de trabajo; los hashes del manifiesto identifican el código analizado",
    sourceDigest: hash(JSON.stringify(manifest)), configDigest: hash(readFileSync(join(root, "eslint.config.mjs"))),
    tools: { node: process.version, eslint: packageVersion("eslint"), sonarjs: packageVersion("eslint-plugin-sonarjs"), typescriptParser: packageVersion("@typescript-eslint/parser"), typescript: packageVersion("typescript"), jscpd: packageVersion("jscpd") },
    analysisProfile: { name: "SonarJS recommended", activeRules, dependencyLockSha256: existsSync(join(root, "pnpm-lock.yaml")) ? hash(readFileSync(join(root, "pnpm-lock.yaml"))) : null, baselineNote: "Las fuentes de la referencia se analizan con las herramientas y tipos instalados actualmente, iguales a los del corte final; no se afirma una ejecución histórica del equipo." },
    scope: { roots, excludes: ["tests", "scripts", "dependencies", "generated bundles"], typeAware: true },
    metrics: { files: files.length, physicalLines: manifest.reduce((sum, file) => sum + file.physicalLines, 0), issues: findings.length, fatalErrors: 0, byRule: findings.reduce((counts, item) => ({ ...counts, [item.ruleId]: (counts[item.ruleId] ?? 0) + 1 }), {}), clones: total.clones, duplicatedLines: total.duplicatedLines, duplicationPercent: total.percentage, sonarServer: { bugs: null, vulnerabilities: null, securityHotspots: null, codeSmells: null, technicalDebt: null } },
    coverage: readCoverage(option("--coverage")), audit: readAudit(option("--audit")), manifest, findings,
  };
  writeFileSync(join(output, `${label}-eslint.json`), JSON.stringify(results, null, 2) + "\n");
  writeFileSync(join(output, `${label}-jscpd.json`), JSON.stringify(duplicates, null, 2) + "\n");
  writeFileSync(join(output, `${label}.json`), JSON.stringify(report, null, 2) + "\n");
  const baselineFile = join(output, "baseline.json");
  const baseline = label !== "baseline" && existsSync(baselineFile) ? JSON.parse(readFileSync(baselineFile, "utf8")) : null;
  writeFileSync(join(output, `${label}.html`), render(report, baseline));
  if (baseline) {
    const ruleMetrics = [...new Set([...Object.keys(baseline.metrics.byRule), ...Object.keys(report.metrics.byRule)])].sort().map((rule) => `| ${rule} | ${baseline.metrics.byRule[rule] ?? 0} | ${report.metrics.byRule[rule] ?? 0} |`).join("\n");
    writeFileSync(join(output, "METRICAS.md"), `# Métricas del análisis equivalente\n\nGenerado automáticamente por \`scripts/quality-report.mjs\` el ${report.generatedAt}. El dato original está en \`baseline.json\` y \`${label}.json\`; el dashboard está en \`${label}.html\`. No es un informe de SonarQube Server.\n\n| Métrica | Inicial | Final |\n|---|---:|---:|\n| Archivos de aplicación | ${baseline.metrics.files} | ${report.metrics.files} |\n| Líneas físicas | ${baseline.metrics.physicalLines} | ${report.metrics.physicalLines} |\n| Hallazgos SonarJS | ${baseline.metrics.issues} | ${report.metrics.issues} |\n| Clones jscpd | ${baseline.metrics.clones} | ${report.metrics.clones} |\n| Duplicación de líneas | ${baseline.metrics.duplicationPercent}% | ${report.metrics.duplicationPercent}% |\n| Cobertura de líneas del módulo | ${baseline.coverage ? `${baseline.coverage.lines}%` : "N/D"} | ${report.coverage ? `${report.coverage.lines}%` : "N/D"} |\n| Cobertura de ramas del módulo | ${baseline.coverage ? `${baseline.coverage.branches}%` : "N/D"} | ${report.coverage ? `${report.coverage.branches}%` : "N/D"} |\n| Cobertura de funciones del módulo | ${baseline.coverage ? `${baseline.coverage.functions}%` : "N/D"} | ${report.coverage ? `${report.coverage.functions}%` : "N/D"} |\n| Bugs, vulnerabilities, hotspots, code smells y deuda del servidor SonarQube | N/D | N/D |\n\n## Hallazgos por regla\n\n| Regla | Inicial | Final |\n|---|---:|---:|\n${ruleMetrics}\n\nEl alcance de pruebas del módulo y el de análisis estático de toda la aplicación son diferentes. La duplicación se mide con mínimo 5 líneas y 50 tokens. Los resultados no prueban ausencia absoluta de defectos.\n`);
  }
  console.log(JSON.stringify({ report: relative(root, join(output, `${label}.html`)), metrics: report.metrics, coverage: report.coverage }, null, 2));
} finally {
  rmSync(temp, { recursive: true, force: true });
}
