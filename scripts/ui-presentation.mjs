import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { chromium } from "playwright"

const base = process.env.MILENIO_UI_URL || "http://localhost:8444"
const key = process.env.MILENIO_ORGANIZER_KEY
const project = process.env.VITE_SUPABASE_URL || "https://rltahgouyixqquspofsf.supabase.co"
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_8dC_SpYmjgaIhK2O6mviGA_jiSU9qGB"
const api = `${project}/functions/v1/make-server-845b49a4/presentation`
if (!key) throw new Error("Falta MILENIO_ORGANIZER_KEY.")
const report = { checkedAt: new Date().toISOString(), base, runId: "", checks: [], screenshots: [] }
const errors = []
let browser
async function request(path, init = {}, token) {
  const response = await fetch(api + path, { ...init, headers: { "Content-Type": "application/json", apikey: publicKey, ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, signal: AbortSignal.timeout(15_000) })
  const body = await response.json()
  assert.ok(response.ok, `API ${response.status}: ${body.code || "error"}`)
  return body
}
async function screenshot(page, name) {
  await page.screenshot({ path: `docs/evidencia/presentacion/${name}.png`, fullPage: true })
  report.screenshots.push(name)
}
async function fits(page) {
  const result = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }))
  assert.ok(result.scroll <= result.width, "Desbordamiento horizontal")
}
try {
  await mkdir("docs/evidencia/presentacion", { recursive: true })
  const run = await request("/runs", { method: "POST", headers: { "X-Presentation-Key": key } })
  report.runId = run.id
  const path = `/presentacion/participar/${run.id}`
  browser = await chromium.launch({ headless: true, executablePath: process.env.MILENIO_BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" })
  const a = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const b = await browser.newContext({ viewport: { width: 430, height: 932 } })
  const c = await browser.newContext({ viewport: { width: 320, height: 740 } })
  const pageA = await a.newPage()
  const pageB = await b.newPage()
  const pageC = await c.newPage()
  for (const page of [pageA, pageB, pageC]) page.on("pageerror", (error) => errors.push(error.message))
  await pageA.goto(base + path)
  await pageA.getByRole("button", { name: "Rastrear paquete", exact: true }).waitFor()
  await pageA.waitForFunction(() => !document.querySelector(".public-button")?.disabled)
  assert.equal(await pageA.locator('input[type="email"]').count(), 0)
  await screenshot(pageA, "rastreo-375")
  report.checks.push("Página pública sin formulario de acceso")
  async function create(page, name, origin, destination) {
    await page.goto(base + path)
    await page.getByRole("tab", { name: "Crear paquete", exact: true }).click()
    await page.getByLabel("Nombre del paquete", { exact: true }).fill(name)
    await page.getByLabel("País de origen", { exact: true }).selectOption(origin)
    await page.getByLabel("País de destino", { exact: true }).selectOption(destination)
    await page.getByRole("button", { name: "Crear paquete", exact: true }).click()
    await page.locator(".public-created > strong").waitFor({ timeout: 20_000 })
    const guide = await page.locator(".public-created > strong").innerText()
    assert.match(guide, /^[A-HJ-NP-Z2-9]{6}$/)
    await fits(page)
    return guide
  }
  const guideA = await create(pageA, "Libros para Madrid", "HK", "ES")
  const guideB = await create(pageB, "Café de Colombia", "CO", "JP")
  assert.notEqual(guideA, guideB)
  await screenshot(pageA, "creacion-375")
  await pageA.reload()
  await pageA.locator(".public-own-card").waitFor()
  assert.equal(await pageA.locator(".public-own-card").count(), 1)
  assert.ok((await pageA.locator(".public-own-card").innerText()).includes(guideA))
  assert.ok(!(await pageA.locator(".public-own").innerText()).includes(guideB))
  report.checks.push("Guías automáticas únicas y lista personal persistente al recargar")
  await pageA.getByLabel("Número de guía", { exact: true }).fill(guideB)
  await pageA.getByRole("button", { name: "Rastrear paquete", exact: true }).click()
  await pageA.locator(".public-tracking-detail").waitFor()
  assert.ok((await pageA.locator(".public-tracking-detail").innerText()).includes("Café de Colombia"))
  assert.equal(await pageA.locator(".public-own-card").count(), 1)
  report.checks.push("Un teléfono rastrea el paquete de otro sin incorporarlo a su lista")
  await pageC.goto(base + path)
  await pageC.getByLabel("Número de guía", { exact: true }).fill(guideA)
  await pageC.getByRole("button", { name: "Rastrear paquete", exact: true }).click()
  await pageC.locator(".public-tracking-detail").waitFor()
  assert.equal(await pageC.evaluate(() => localStorage.getItem("milenio-presentation-phone")), null)
  assert.equal(await pageC.locator(".public-own-card").count(), 0)
  assert.ok((await pageC.locator(".public-route-list").innerText()).includes("Almacén Madrid"))
  await fits(pageC)
  await screenshot(pageC, "rastreo-publico-320")
  await pageC.getByLabel("Número de guía", { exact: true }).fill("ZZZZZZ")
  await pageC.getByRole("button", { name: "Rastrear paquete", exact: true }).click()
  await pageC.getByRole("alert").waitFor()
  assert.ok((await pageC.getByRole("alert").innerText()).includes("No encontramos"))
  report.checks.push("Rastreo desde un tercer navegador sin crear identidad; guía inexistente explicada")
  const token = await pageA.evaluate(() => JSON.parse(localStorage.getItem("milenio-presentation-phone")).access_token)
  for (let index = 2; index < 30; index++) {
    await request(`/runs/${run.id}/shipments`, { method: "POST", body: JSON.stringify({ packageName: `Paquete de prueba ${index + 1}`, originCountry: index % 2 ? "MX" : "FR", destinationCountry: index % 2 ? "ES" : "SG" }) }, token)
  }
  const screenContext = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const screen = await screenContext.newPage()
  screen.on("pageerror", (error) => errors.push(error.message))
  await screen.goto(`${base}/presentacion/pantalla/${run.id}#key=${encodeURIComponent(key)}`)
  await screen.locator(".projector-card").nth(29).waitFor({ timeout: 20_000 })
  for (const [width, height] of [[1280, 720], [1366, 768], [1920, 1080]]) {
    await screen.setViewportSize({ width, height })
    const bounds = await screen.locator(".projector-card").evaluateAll((cards) => cards.map((card) => {
      const box = card.getBoundingClientRect()
      return { top: box.top, bottom: box.bottom, right: box.right, left: box.left, scroll: card.scrollHeight, height: card.clientHeight }
    }))
    assert.equal(bounds.length, 30)
    for (const box of bounds) {
      assert.ok(box.top >= 0 && box.bottom <= height && box.left >= 0 && box.right <= width, `Tarjeta fuera del proyector ${width}×${height}`)
      assert.ok(box.scroll <= box.height + 1, `Contenido de tarjeta no cabe a ${width}×${height}`)
    }
    await fits(screen)
    await screenshot(screen, `proyector-30-${width}`)
  }
  report.checks.push("30 paquetes y sus guías visibles sin scroll en 1280×720, 1366×768 y 1920×1080")
  const progressBefore = Number(await screen.getByRole("progressbar").last().getAttribute("aria-valuenow"))
  await screen.waitForTimeout(2100)
  assert.ok(Number(await screen.getByRole("progressbar").last().getAttribute("aria-valuenow")) > progressBefore)
  report.checks.push("El progreso avanza automáticamente")
  await pageC.goto(base + "/inicio")
  await pageC.getByLabel("Correo electrónico", { exact: true }).waitFor()
  assert.ok(pageC.url().endsWith("/admin"))
  report.checks.push("La interfaz administrativa sigue protegida por login")
  await pageB.setViewportSize({ width: 1440, height: 900 })
  await pageB.goto(base)
  await screenshot(pageB, "rastreo-escritorio")
  await pageB.getByRole("tab", { name: "Crear paquete", exact: true }).click()
  await screenshot(pageB, "creacion-escritorio")
  assert.deepEqual(errors, [])
  report.status = "passed"
  console.log(JSON.stringify({ status: report.status, runId: run.id, checks: report.checks }))
} catch (error) {
  report.status = "failed"
  report.error = String(error.message).split(key).join("[private]")
  console.error(report.error)
  process.exitCode = 1
} finally {
  if (browser) await browser.close()
  await writeFile("docs/evidencia/presentacion/resultados-ui.json", JSON.stringify(report, null, 2))
}
