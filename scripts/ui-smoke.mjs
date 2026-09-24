import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const widths = [320, 375, 430];
const loopback = new Set(["127.0.0.1", "localhost", "[::1]"]);
function localOrigin(value) {
  const url = new URL(value);
  assert.ok(loopback.has(url.hostname), "UI smoke requires a loopback origin.");
  assert.ok(["http:", "https:"].includes(url.protocol), "Unsupported local protocol.");
  assert.ok(!url.username && !url.password && !url.search && !url.hash && url.pathname === "/", "Use a credential-free local origin.");
  return url;
}

/** Isolated Chromium smoke against real local Supabase fixtures owned by the caller.
 * No mock API, browser storage export, trace, passwords or JWTs are written.
 * The caller removes accounts and all their shipments after this function ends.
 */
export async function runUISmoke({ adminEmail, adminPassword, userEmail, userPassword,
  expectedGuide, foreignGuide, baseURL, supabaseUrl, anonKey }) {
  const ui = localOrigin(baseURL);
  const backend = localOrigin(supabaseUrl);
  assert.ok(ui.origin !== backend.origin, "Frontend and backend require separate local origins.");
  for (const value of [adminEmail, adminPassword, userEmail, userPassword, anonKey]) assert.ok(typeof value === "string" && value, "Missing local UI fixture.");
  for (const guide of [expectedGuide, foreignGuide]) assert.match(guide, /^ME-\d{4}-\d{8,}$/);
  // The browser must not use the operator's personal browser/session.
  const { chromium } = await import("playwright");
  const { build, preview } = await import("vite");
  const work = await mkdtemp(join(tmpdir(), "milenio-ui-"));
  const outDir = join(work, "dist");
  const evidence = join(root, "evidencias/ci-ui");
  const reportPath = join(root, "reportes/integracion/ui-resultados.json");
  await mkdir(evidence, { recursive: true });
  await mkdir(dirname(reportPath), { recursive: true });
  const report = { schemaVersion: 1, startedAt: new Date().toISOString(),
    revision: process.env.GITHUB_SHA || execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
    environment: "Chromium aislado + build Vite temporal + Supabase local real", syntheticData: true,
    backend: backend.origin, frontend: ui.origin, viewportWidths: widths,
    limitations: ["Emulación de navegador; no dispositivo físico.", "Vite preview se usa para el backend local. La CSP y el contenedor publicado se comprueban por separado.", "Las fuentes web externas se bloquean para mantener el recorrido local."],
    cases: [], screenshots: [], status: "running" };
  let browser;
  let server;
  let page;
  let createdGuide;
  let currentCase = "UI-SETUP";
  let currentStep = "preparar-entorno";

  function failureDiagnostic(error) {
    const permittedNames = new Set(["AssertionError", "TimeoutError", "TypeError", "ReferenceError", "SyntaxError", "Error"]);
    const diagnostic = { step: currentStep, errorName: permittedNames.has(error?.name) ? error.name : "Error" };
    // Playwright call logs can contain fill(password). Never serialize them.
    // Only our explicitly authored assertion messages are eligible for output.
    const ownMessages = new Set([
      "The real local owner must appear in the selector.",
      "Keyboard Tab must move from email to the password field.",
    ]);
    const firstLine = typeof error?.message === "string" ? error.message.split("\n")[0] : "";
    if (error?.name === "AssertionError" && ownMessages.has(firstLine)) diagnostic.assertion = firstLine;
    return diagnostic;
  }

  async function scenario(id, label, operation) {
    currentCase = id;
    currentStep = "iniciar-escenario";
    const started = Date.now();
    try {
      await operation();
      report.cases.push({ id, label, status: "passed", durationMs: Date.now() - started });
      console.log(`PASS ${id}: ${label}`);
    } catch (error) {
      const failure = failureDiagnostic(error);
      report.failure = failure;
      report.cases.push({ id, label, status: "failed", durationMs: Date.now() - started,
        failure,
        detail: "La expectativa de interfaz no se cumplió. Consultar captura de fallo; no se serializan credenciales ni errores del proveedor." });
      throw new Error(`UI smoke failed: ${id}.`);
    }
  }
  async function screenshot(name, width) {
    currentStep = `captura-${name}-${width}`;
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth,
      content: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) }));
    assert.ok(dimensions.content <= dimensions.viewport + 1, `Horizontal overflow in ${name} at ${width}px.`);
    const filename = `${name}-${width}.png`;
    await page.screenshot({ path: join(evidence, filename), fullPage: true, animations: "disabled" });
    report.screenshots.push({ file: `evidencias/ci-ui/${filename}`, width, noHorizontalOverflow: true });
  }
  async function mobileViews(name) {
    for (const width of widths) await screenshot(name, width);
  }
  async function login(email, password) {
    currentStep = "login-abrir-pagina";
    await page.goto(ui.origin);
    currentStep = "login-esperar-formulario";
    await page.getByRole("heading", { name: "Bienvenido de nuevo", exact: true }).waitFor();
    currentStep = "login-capturar-correo";
    await page.getByLabel("Correo electrónico", { exact: true }).fill(email);
    currentStep = "login-capturar-clave";
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    currentStep = "login-enviar-formulario";
    await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
    currentStep = "login-esperar-inicio-autenticado";
    await page.waitForURL(`${ui.origin}/inicio`);
    await page.getByRole("heading", { name: /^Hola,/ }).waitFor();
  }
  async function logout() {
    await page.goto(`${ui.origin}/perfil`);
    await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click();
    await page.getByRole("heading", { name: "Bienvenido de nuevo", exact: true }).waitFor();
  }
  async function lookup(guide) {
    await page.goto(`${ui.origin}/consulta`);
    await page.getByLabel("Número de guía", { exact: true }).fill(guide);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
  }

  try {
    await build({ root, configFile: join(root, "vite.config.ts"), mode: "test", logLevel: "warn", base: "/",
      define: { "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(backend.origin),
        "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(anonKey) },
      build: { outDir, emptyOutDir: true, sourcemap: false } });
    server = await preview({ root, configFile: join(root, "vite.config.ts"), logLevel: "warn", base: "/",
      build: { outDir }, preview: { host: ui.hostname, port: Number(ui.port), strictPort: true } });
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 375, height: 900 }, locale: "es-MX", timezoneId: "America/Mexico_City" });
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: ui.origin });
    await context.route("**/*", async (route) => {
      const requestUrl = new URL(route.request().url());
      // Wrong build configuration cannot transmit fictitious credentials off-device.
      if ([ui.origin, backend.origin].includes(requestUrl.origin) || requestUrl.protocol === "file:") await route.continue();
      else await route.abort("blockedbyclient");
    });
    page = await context.newPage();
    page.setDefaultTimeout(20_000);
    page.setDefaultNavigationTimeout(30_000);

    await scenario("UI-01", "Login móvil, foco por teclado y error de credenciales incorrectas", async () => {
      await page.goto(ui.origin);
      await page.getByRole("button", { name: "Iniciar sesión", exact: true }).waitFor();
      await mobileViews("login");
      const emailField = page.getByLabel("Correo electrónico", { exact: true });
      const passwordField = page.getByLabel("Contraseña", { exact: true });
      await emailField.focus();
      await page.keyboard.press("Tab");
      assert.equal(await passwordField.evaluate((element) => element === document.activeElement), true,
        "Keyboard Tab must move from email to the password field.");
      await screenshot("login-foco-teclado", 320);
      await emailField.fill(adminEmail);
      // Deliberately wrong fixture value, never an existing account password.
      await passwordField.fill("Incorrecta-UI-fixture-no-es-una-clave-real");
      await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
      await page.getByRole("alert").filter({ hasText: "Correo o contraseña incorrectos." }).waitFor();
      await passwordField.fill("");
      await screenshot("login-error-credenciales", 430);
    });
    await scenario("UI-02", "Login ADMIN real y formulario de registro móvil", async () => {
      await login(adminEmail, adminPassword);
      currentStep = "registro-abrir-ruta";
      await page.getByRole("link", { name: "Registrar", exact: true }).click();
      currentStep = "registro-esperar-formulario";
      await page.getByRole("heading", { name: "Registrar paquete", exact: true }).waitFor();
      const ownerSelect = page.getByRole("combobox");
      currentStep = "registro-esperar-propietarios";
      await page.waitForFunction(() => {
        const select = document.querySelector(".register-form select");
        return select && !select.disabled && select.options.length > 1;
      });
      currentStep = "registro-leer-opciones-propietario";
      const choices = await ownerSelect.locator("option").evaluateAll((options) => options.map((option) => ({ value: option.value, label: option.textContent })));
      currentStep = "registro-encontrar-propietario-ficticio";
      const choice = choices.find((option) => option.label.includes(userEmail));
      assert.ok(choice, "The real local owner must appear in the selector.");
      currentStep = "registro-seleccionar-propietario";
      await ownerSelect.selectOption(choice.value);
      currentStep = "registro-capturar-destinatario";
      await page.getByLabel("Destinatario", { exact: true }).fill("Persona ficticia de interfaz");
      currentStep = "registro-capturar-direccion";
      await page.getByLabel("Dirección", { exact: true }).fill("Calle de prueba UI 123");
      currentStep = "registro-capturar-ciudad";
      await page.getByLabel("Ciudad", { exact: true }).fill("Ciudad de prueba UI");
      currentStep = "registro-capturar-descripcion";
      await page.getByLabel("Descripción", { exact: true }).fill("Paquete ficticio creado desde Chromium en el entorno aislado.");
      await mobileViews("registro");
    });
    await scenario("UI-03", "ADMIN registra paquete, recibe guía y la copia al portapapeles", async () => {
      await page.getByRole("button", { name: "Guardar y generar guía", exact: true }).click();
      await page.getByRole("heading", { name: "Paquete registrado", exact: true }).waitFor();
      createdGuide = await page.getByLabel("Guía confirmada", { exact: true }).inputValue();
      assert.match(createdGuide, /^ME-\d{4}-\d{8,}$/);
      await page.getByRole("button", { name: "Copiar guía", exact: true }).click();
      await page.getByText("Guía copiada al portapapeles.", { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), createdGuide);
      await screenshot("confirmacion-copia", 375);
    });
    await scenario("UI-04", "Logout ADMIN y rechazo de ruta protegida tras recargar", async () => {
      await logout();
      await page.goto(`${ui.origin}/registrar`);
      await page.getByRole("heading", { name: "Bienvenido de nuevo", exact: true }).waitFor();
      await page.reload();
      await page.getByRole("heading", { name: "Bienvenido de nuevo", exact: true }).waitFor();
    });
    await scenario("UI-05", "USER consulta el paquete creado en la interfaz a tres anchos", async () => {
      await login(userEmail, userPassword);
      assert.equal(await page.getByRole("link", { name: "Registrar", exact: true }).count(), 0);
      await lookup(createdGuide);
      await page.getByRole("heading", { name: createdGuide, exact: true }).waitFor();
      await page.getByText("Destinatario: Persona ficticia de interfaz", { exact: true }).waitFor();
      await mobileViews("consulta-propia");
    });
    await scenario("UI-06", "USER conserva acceso y consulta válida tras recarga", async () => {
      await page.reload();
      await page.getByRole("heading", { name: createdGuide, exact: true }).waitFor();
      await lookup(expectedGuide);
      await page.getByRole("heading", { name: expectedGuide, exact: true }).waitFor();
    });
    await scenario("UI-07", "La consulta ajena muestra rechazo y la guía inválida recibe validación", async () => {
      await lookup(foreignGuide);
      await page.getByRole("alert").filter({ hasText: "No tienes permiso para consultar este paquete." }).waitFor();
      await screenshot("consulta-ajena-rechazada", 320);
      await lookup("guia-invalida");
      await page.getByRole("alert").filter({ hasText: "La guía debe tener el formato ME-AAAA-########." }).waitFor();
      await screenshot("guia-invalida", 320);
    });
    await scenario("UI-08", "Logout USER borra la sesión y el detalle vuelve a exigir acceso", async () => {
      await logout();
      await page.goto(`${ui.origin}/envio/${createdGuide}`);
      await page.getByRole("heading", { name: "Bienvenido de nuevo", exact: true }).waitFor();
      await page.reload();
      await page.getByRole("heading", { name: "Bienvenido de nuevo", exact: true }).waitFor();
    });
    await scenario("UI-09", "Captura del tablero global de calidad generado", async () => {
      const dashboard = join(root, "reportes/sonar/final.html");
      await readFile(dashboard); // A missing report is a failure, not a fabricated image.
      await page.setViewportSize({ width: 1280, height: 960 });
      await page.goto(pathToFileURL(dashboard).href);
      await page.getByRole("heading", { name: "Calidad y mantenibilidad", exact: true }).waitFor();
      await page.screenshot({ path: join(evidence, "calidad-dashboard.png"), fullPage: true, animations: "disabled" });
      report.screenshots.push({ file: "evidencias/ci-ui/calidad-dashboard.png", source: "reportes/sonar/final.html" });
    });
    report.status = "passed";
  } catch (error) {
    report.status = "failed";
    report.failedStage = currentCase;
    report.failure ??= failureDiagnostic(error);
    if (page) {
      try { await page.screenshot({ path: join(evidence, "fallo.png"), fullPage: true }); }
      catch { /* A closed browser has no screenshot; never pretend one exists. */ }
    }
    throw new Error(`Isolated UI smoke failed at ${currentCase}. See reportes/integracion/ui-resultados.json.`);
  } finally {
    await browser?.close();
    if (server) await new Promise((done) => server.httpServer.close(done));
    await rm(work, { recursive: true, force: true });
    report.finishedAt = new Date().toISOString();
    report.summary = { passed: report.cases.filter((item) => item.status === "passed").length,
      failed: report.cases.filter((item) => item.status === "failed").length, totalPlanned: 9 };
    await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
  }
  return report;
}
