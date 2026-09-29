import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const dir = path.resolve('reportes/seguridad-zap')
const reports = {}
for (const label of ['baseline', 'final']) {
  const data = JSON.parse(await readFile(path.join(dir, label, `zap-${label}.json`), 'utf8'))
  const alerts = (data.site || []).flatMap(site => site.alerts || [])
  reports[label] = {
    generated: data['@generated'], version: data['@version'],
    sites: data.site?.map(site => site['@name']),
    riskTypes: Object.fromEntries(['0', '1', '2', '3'].map(risk => [risk, alerts.filter(a => a.riskcode === risk).length])),
    alerts: alerts.map(a => ({ id: a.pluginid, name: a.name, risk: a.riskdesc, riskCode: Number(a.riskcode), instances: Number(a.count) })),
  }
}
const summary = {
  note: 'Resultado derivado de reportes originales; riskCode 0=informativo, 1=bajo, 2=medio, 3=alto. Alcance frontend local pasivo.',
  ...reports,
  correctedRiskTypes: reports.baseline.alerts.filter(a => a.riskCode > 0 && !reports.final.alerts.some(b => b.id === a.id)).map(a => a.id),
}
await writeFile(path.join(dir, 'comparacion.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
