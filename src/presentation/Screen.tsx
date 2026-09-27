import { useEffect, useState, type CSSProperties } from "react"
import { useLocation, useParams } from "react-router"
import { presentationFetch } from "./api"
import { checkpointAt, cityName, countries, progressAt, projectorLayout, stageAt, stageLabels, type PresentationShipment } from "./model"
import "./presentation.css"
import ParticipantQr from "./Qr"

export default function PresentationScreen() {
  const { runId } = useParams()
  const location = useLocation()
  const organizerKey = new URLSearchParams(location.hash.slice(1)).get("key") ?? ""
  const preview = import.meta.env.DEV && runId === "vista-previa"
  const [shipments, setShipments] = useState<PresentationShipment[]>([])
  const [now, setNow] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [connected, setConnected] = useState(false)
  const [page, setPage] = useState(0)
  const [fullscreenError, setFullscreenError] = useState("")
  const [height, setHeight] = useState(window.innerHeight)
  const pages = Math.max(1, Math.ceil(shipments.length / 30))
  const safePage = Math.min(page, pages - 1)
  const visible = shipments.slice(safePage * 30, (safePage + 1) * 30)
  const { columns, rows } = projectorLayout(visible.length, height)
  const delivered = shipments.filter((item) => progressAt(item.createdAt, now) === 1).length

  useEffect(() => {
    const resize = () => setHeight(window.innerHeight)
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    if (pages < 2) return
    const timer = window.setInterval(() => setPage((value) => (value + 1) % pages), 12_000)
    return () => window.clearInterval(timer)
  }, [pages])
  useEffect(() => {
    if (!runId) return
    if (preview) {
      const count = Math.min(60, Math.max(1, Number(new URLSearchParams(location.search).get("count")) || 30))
      const started = Date.now()
      setShipments(Array.from({ length: count }, (_, index) => ({
        id: `preview-${index}`, runId,
        originCountry: countries[index % countries.length].code,
        destinationCountry: countries[(index + 11) % countries.length].code,
        packageName: ["Libros de arquitectura", "Café de especialidad", "Equipo fotográfico", "Regalo de cumpleaños", "Muestras textiles"][index % 5],
        trackingCode: `ME${String(index + 1).padStart(4, "2")}`,
        createdAt: new Date(started - (index * 7 % 100) * 1000).toISOString(),
      })))
      setLoading(false); setConnected(true); return
    }
    if (!organizerKey) {
      setLoading(false); setError("Abre el enlace privado del proyector desde el control de la presentación."); return
    }
    let active = true
    let busy = false
    setShipments([]); setLoading(true); setError("")
    async function load() {
      if (busy) return
      busy = true
      try {
        const data = await presentationFetch(`/runs/${runId}/shipments`, { headers: { "X-Presentation-Key": organizerKey } }) as PresentationShipment[]
        if (active) { setShipments(data); setConnected(true); setError("") }
      } catch (cause) {
        if (active) { setConnected(false); setError(cause instanceof Error ? cause.message : "No se pudo actualizar el proyector.") }
      } finally { busy = false; if (active) setLoading(false) }
    }
    void load()
    const refresh = window.setInterval(() => void load(), 2000)
    return () => { active = false; window.clearInterval(refresh) }
  }, [runId, preview, organizerKey, location.search])
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
      setFullscreenError("")
    } catch { setFullscreenError("Utiliza F11 para activar la pantalla completa.") }
  }
  return <div className="projector">
    <header className="projector-header">
      <div><span className="projector-brand">milenio<span>express</span></span><h1>Envíos en movimiento</h1></div>
      <div className="projector-join">{!preview && <ParticipantQr url={`${window.location.origin}/presentacion/participar/${runId}`}/>}<div className="projector-instructions"><strong>Rastrea cualquier guía desde tu celular</strong><span>{window.location.host}</span><small>Escanea el QR · Sin registro</small></div></div>
      <div className="projector-counts"><div><strong>{shipments.length}</strong><span>paquetes</span></div><div><strong>{delivered}</strong><span>entregados</span></div></div>
    </header>
    <div className="projector-toolbar"><span><i className={connected ? "online" : ""}/>{preview ? "Vista de ejemplo" : connected ? "En vivo · Actualización automática" : "Reconectando…"}</span>
      <div>{pages > 1 && <><button type="button" aria-label="Página anterior" onClick={() => setPage((safePage - 1 + pages) % pages)}>←</button><span>{safePage * 30 + 1}–{Math.min((safePage + 1) * 30, shipments.length)} de {shipments.length}</span><button type="button" aria-label="Página siguiente" onClick={() => setPage((safePage + 1) % pages)}>→</button></>}
      <button type="button" onClick={() => void fullscreen()}>Pantalla completa ↗</button></div>
    </div>
    {(error || fullscreenError) && <p className="projector-error" role="alert">{error || fullscreenError}</p>}
    {loading ? <div className="projector-empty" role="status">Preparando los envíos…</div>
      : shipments.length === 0 ? <div className="projector-empty"><h2>La primera ruta está por comenzar</h2><p>Abre {window.location.host} en tu teléfono y crea un paquete.</p></div>
      : <main className="projector-grid" aria-label="Paquetes de la presentación" style={{ "--columns": columns, "--rows": rows } as CSSProperties}>
        {visible.map((shipment) => {
          const progress = progressAt(shipment.createdAt, now)
          return <article className={progress === 1 ? "projector-card delivered" : "projector-card"} key={shipment.id}>
            <div className="projector-card-top"><strong className="projector-guide">{shipment.trackingCode || "SIN GUÍA"}</strong><span>{stageLabels[stageAt(progress)]}</span></div>
            <div className="projector-card-route"><strong title={shipment.packageName ?? ""}>{shipment.packageName || "Paquete"}</strong><span>{cityName(shipment.originCountry)} → {cityName(shipment.destinationCountry)}</span></div>
            <div className="projector-progress" role="progressbar" aria-label={`Recorrido de ${shipment.trackingCode}`} aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${progress * 100}%` }}/>{[0, 1, 2, 3, 4].map((step) => <i key={step} className={progress >= step / 4 ? "reached" : ""} style={{ left: `${step * 25}%` }}/>)}
            </div>
            <div className="projector-card-location"><span title={checkpointAt(progress, shipment)}>{checkpointAt(progress, shipment)}</span><small>{Math.round(progress * 100)}%</small></div>
          </article>
        })}
      </main>}
    <footer className="projector-footer"><span>Dinámica de presentación · Envíos simulados</span><span>Las guías son públicas. Tu lista de paquetes es personal.</span></footer>
  </div>
}
