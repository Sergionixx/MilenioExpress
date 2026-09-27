import { useEffect, useRef, useState, type FormEvent } from "react"
import { useParams } from "react-router"
import { phoneToken, presentationFetch } from "./api"
import { countries, countryName, progressAt, routeFor, stageAt, stageLabels, type PresentationShipment, type TrackedShipment } from "./model"
import "./presentation.css"

function RouteDetail({ shipment, now }: { shipment: TrackedShipment; now: number }) {
  const progress = progressAt(shipment.createdAt, now)
  const stage = stageAt(progress)
  return <section className="public-tracking-detail" aria-label="Detalle del rastreo">
    <div className="public-result-heading">
      <div><span className="public-overline">GUÍA DE RASTREO</span><strong>{shipment.trackingCode}</strong></div>
      <span className={progress === 1 ? "public-status delivered" : "public-status"}>{stageLabels[stage]}</span>
    </div>
    <h2>{shipment.packageName || "Paquete"}</h2>
    <p>{countryName(shipment.originCountry)} <span aria-hidden="true">→</span> {countryName(shipment.destinationCountry)}</p>
    <ol className="public-route-list">
      {routeFor(shipment).map((place, index) => <li key={index} className={index <= stage ? "reached" : ""} aria-current={index === stage ? "step" : undefined}>
        <span className="public-route-dot" aria-hidden="true">{index < stage ? "✓" : index + 1}</span>
        <div><strong>{place}</strong><small>{index <= stage
          ? new Date(Date.parse(shipment.createdAt) + index * 22_500).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
          : "Próxima escala"} · {stageLabels[index]}</small></div>
      </li>)}
    </ol>
  </section>
}

export default function PresentationParticipant() {
  const { runId: suppliedRun } = useParams()
  const [runId, setRunId] = useState(suppliedRun)
  const [tab, setTab] = useState<"track" | "create">("track")
  const [packageName, setPackageName] = useState("")
  const [originCountry, setOriginCountry] = useState("MX")
  const [destinationCountry, setDestinationCountry] = useState("ES")
  const [guide, setGuide] = useState("")
  const [shipments, setShipments] = useState<PresentationShipment[]>([])
  const [tracked, setTracked] = useState<TrackedShipment | null>(null)
  const [created, setCreated] = useState<PresentationShipment | null>(null)
  const [now, setNow] = useState(Date.now())
  const [available, setAvailable] = useState(false)
  const [saving, setSaving] = useState(false)
  const [finding, setFinding] = useState(false)
  const [runError, setRunError] = useState("")
  const [createError, setCreateError] = useState("")
  const [trackError, setTrackError] = useState("")
  const [ownError, setOwnError] = useState("")
  const [copyFeedback, setCopyFeedback] = useState("")
  const detailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    let active = true
    const abort = new AbortController()
    setRunId(suppliedRun); setAvailable(false); setRunError(""); setShipments([]); setCreated(null); setTracked(null)
    const path = suppliedRun ? `/runs/${encodeURIComponent(suppliedRun)}` : "/active"
    void presentationFetch(path, { signal: abort.signal }).then((run: { id: string }) => {
      if (active) { setRunId(run.id); setAvailable(true) }
    }).catch((cause) => { if (active) setRunError(cause instanceof Error ? cause.message : "La presentación no está disponible.") })
    return () => { active = false; abort.abort() }
  }, [suppliedRun])
  useEffect(() => {
    if (!runId || !available) return
    let active = true
    let busy = false
    async function load() {
      if (busy) return
      busy = true
      try {
        const token = await phoneToken()
        if (!token) return
        const rows = await presentationFetch(`/runs/${runId}/shipments`, {}, token) as PresentationShipment[]
        if (active) { setShipments(rows); setOwnError("") }
      } catch { if (active) setOwnError("No se pudo actualizar tu lista. Volveremos a intentarlo.") }
      finally { busy = false }
    }
    void load()
    const timer = window.setInterval(() => void load(), 5000)
    return () => { active = false; window.clearInterval(timer) }
  }, [runId, available])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!runId || saving) return
    if (originCountry === destinationCountry) { setCreateError("Elige dos países distintos."); return }
    setSaving(true); setCreateError(""); setCreated(null); setCopyFeedback("")
    try {
      const token = await phoneToken(true)
      const shipment = await presentationFetch(`/runs/${runId}/shipments`, {
        method: "POST", body: JSON.stringify({ packageName: packageName.trim(), originCountry, destinationCountry }),
      }, token) as PresentationShipment
      setShipments((current) => [...current.filter((item) => item.id !== shipment.id), shipment])
      setCreated(shipment); setPackageName("")
    } catch (cause) { setCreateError(cause instanceof Error ? cause.message : "No se pudo crear el paquete.") }
    finally { setSaving(false) }
  }
  async function track(event?: FormEvent<HTMLFormElement>, code = guide) {
    event?.preventDefault()
    if (!runId || finding) return
    setTrackError(""); setTracked(null)
    if (!/^(?:[A-Z2-9]{6}|[0-9]{4})$/.test(code.trim().toUpperCase())) {
      setTrackError("Escribe los seis caracteres de la guía que aparece en el proyector."); return
    }
    setFinding(true)
    try {
      const shipment = await presentationFetch(`/runs/${runId}/track/${encodeURIComponent(code.trim().toUpperCase())}`) as TrackedShipment
      setTracked(shipment); setTab("track"); setGuide(code)
      window.setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
    } catch (cause) { setTrackError(cause instanceof Error ? cause.message : "No se pudo rastrear la guía.") }
    finally { setFinding(false) }
  }
  async function copyGuide() {
    if (!created?.trackingCode) return
    try { await navigator.clipboard.writeText(created.trackingCode); setCopyFeedback("Guía copiada.") }
    catch { setCopyFeedback("Selecciona la guía y cópiala para compartirla.") }
  }
  return <div className="public-site">
    <header className="public-header">
      <a href="/" className="public-brand" aria-label="Milenio Express, inicio">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Zm0 0 9 4.5 9-4.5M12 12v9"/></svg>
        <span>milenio<span>express</span></span>
      </a>
      <span className="public-header-label">ENVÍOS INTERNACIONALES</span>
    </header>
    <main className="public-main">
      <section className="public-intro">
        <div className="public-overline">MILENIO EXPRESS</div>
        <h1>Tu paquete. <br/>Cada paso, a la vista.</h1>
        <p>Consulta dónde está tu envío o crea un nuevo paquete. Nosotros nos encargamos de asignar la guía.</p>
        <div className="public-network"><span>32 países y regiones</span><span>Rastreo sin registro</span></div>
        <div className="public-route-illustration" aria-hidden="true"><span>MX</span><i/><span>HK</span><i/><span>ES</span></div>
      </section>
      <section className="public-service" aria-label="Servicios de paquetes">
        <div className="public-tabs" role="tablist" aria-label="Qué quieres hacer">
          <button type="button" role="tab" id="track-tab" aria-selected={tab === "track"} aria-controls="track-panel" onClick={() => setTab("track")}>Rastrear paquete</button>
          <button type="button" role="tab" id="create-tab" aria-selected={tab === "create"} aria-controls="create-panel" onClick={() => setTab("create")}>Crear paquete</button>
        </div>
        {tab === "track" ? <div role="tabpanel" id="track-panel" aria-labelledby="track-tab" className="public-service-body">
          <h2>¿Dónde está tu paquete?</h2>
          <p>Ingresa tu guía o cualquiera de las que aparecen en la pantalla de la presentación.</p>
          <form onSubmit={(event) => void track(event)}>
            <label htmlFor="public-guide">Número de guía</label>
            <input id="public-guide" className="public-guide-input" required maxLength={6} value={guide} onChange={(event) => setGuide(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="Ej. MX7K2P" aria-describedby={trackError ? "track-error" : "guide-help"} />
            <small id="guide-help">Hasta 6 caracteres. Sin cuenta ni contraseña.</small>
            <button className="public-button" disabled={!available || finding} type="submit">{finding ? "Buscando…" : "Rastrear paquete"}<span aria-hidden="true">→</span></button>
          </form>
          {trackError && <p id="track-error" className="public-error" role="alert">{trackError}</p>}
        </div> : <div role="tabpanel" id="create-panel" aria-labelledby="create-tab" className="public-service-body">
          <h2>Un nuevo envío</h2><p>Elige su origen y destino. Tu guía se genera automáticamente.</p>
          <form onSubmit={(event) => void submit(event)}>
            <label htmlFor="public-package">Nombre del paquete</label>
            <input id="public-package" required maxLength={40} value={packageName} onChange={(event) => setPackageName(event.target.value)} placeholder="Ej. Libros para Madrid" disabled={saving}/>
            <div className="public-country-fields">
              <label>País de origen<select aria-label="País de origen" value={originCountry} onChange={(event) => setOriginCountry(event.target.value)} disabled={saving}>{countries.map(({ code, name }) => <option key={code} value={code}>{name}</option>)}</select></label>
              <label>País de destino<select aria-label="País de destino" value={destinationCountry} onChange={(event) => setDestinationCountry(event.target.value)} disabled={saving}>{countries.map(({ code, name }) => <option key={code} value={code} disabled={code === originCountry}>{name}</option>)}</select></label>
            </div>
            {originCountry === destinationCountry && <small className="public-error">El destino debe ser distinto del origen.</small>}
            <button className="public-button" disabled={!available || saving || originCountry === destinationCountry} type="submit">{saving ? "Creando…" : "Crear paquete"}<span aria-hidden="true">→</span></button>
          </form>
          {createError && <p className="public-error" role="alert">{createError}</p>}
          {created && <div className="public-created" role="status"><span>Paquete creado. Tu guía es</span><strong>{created.trackingCode}</strong><div><button type="button" onClick={() => void copyGuide()}>Copiar guía</button><button type="button" onClick={() => void track(undefined, created.trackingCode!)}>Ver recorrido →</button></div><small>{copyFeedback || "Ya aparece en el proyector."}</small></div>}
        </div>}
        {runError ? <p className="public-error public-run-state" role="alert">{runError} <button type="button" onClick={() => window.location.reload()}>Reintentar</button></p>
          : !available && <p className="public-run-state" role="status">Conectando con la presentación…</p>}
      </section>
      {tracked && <div className="public-result" ref={detailRef}><RouteDetail shipment={tracked} now={now}/></div>}
      <section className="public-own" aria-label="Mis paquetes">
        <div className="public-own-heading"><h2>Mis paquetes <span>{shipments.length}</span></h2><p>Creados desde este navegador</p></div>
        {ownError && <p className="public-error" role="status">{ownError}</p>}
        {shipments.length === 0 ? <div className="public-own-empty"><p>Tus envíos aparecerán aquí.</p><button type="button" onClick={() => { setTab("create"); document.querySelector(".public-service")?.scrollIntoView({ behavior: "smooth" }) }}>Crear mi primer paquete →</button></div>
          : <div className="public-own-list">{[...shipments].reverse().map((shipment) => {
            const progress = progressAt(shipment.createdAt, now)
            return <button type="button" className="public-own-card" key={shipment.id} onClick={() => void track(undefined, shipment.trackingCode!)}>
              <div><strong>{shipment.packageName}</strong><code>{shipment.trackingCode}</code></div>
              <p>{countryName(shipment.originCountry)} → {countryName(shipment.destinationCountry)}</p>
              <span className="public-progress"><i style={{ width: `${progress * 100}%` }}/></span>
              <small>{routeFor(shipment)[stageAt(progress)]}</small>
            </button>
          })}</div>}
        <small className="public-device-note">La lista se conserva en este navegador. Si borras sus datos o cambias de teléfono, puedes seguir rastreando con la guía.</small>
      </section>
    </main>
    <footer className="public-footer"><span>© Milenio Express</span><span>Dinámica de presentación · Envíos simulados</span><a href="/admin">Administración</a></footer>
  </div>
}
