import { useEffect, useRef, useState } from "react"
import { useLocation, useParams } from "react-router"
import { apiFetch } from "../lib/supabase"
import { checkpointAt, checkpoints, countryName, progressAt, type PresentationShipment } from "./model"
import "./presentation.css"

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
  const journeysRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    journeysRef.current?.scrollTo({ top: journeysRef.current.scrollHeight, behavior: "auto" })
  }, [shipments.length])

  useEffect(() => {
    if (!runId) return
    if (preview) {
      const started = Date.now()
      setShipments([
        ["MX", "JP", 5], ["CO", "ES", 18], ["BR", "DE", 33],
        ["CA", "AR", 47], ["FR", "AU", 64], ["US", "KR", 83],
      ].map(([originCountry, destinationCountry, seconds], index) => ({
        id: `preview-${index}`,
        runId,
        originCountry: String(originCountry),
        destinationCountry: String(destinationCountry),
        packageName: `Paquete ${index + 1}`,
        trackingCode: String(4826 + index),
        participantName: `Participante ${index + 1}`,
        createdAt: new Date(started - Number(seconds) * 1000).toISOString(),
      })))
      setLoading(false)
      setConnected(true)
      return
    }
    if (!organizerKey) {
      setLoading(false)
      setError("Abre el enlace privado del proyector desde la página del organizador.")
      return
    }
    let active = true
    setShipments([])
    setLoading(true)
    setError("")
    async function load() {
      try {
        const rows = await apiFetch(`/presentation/runs/${encodeURIComponent(runId!)}/shipments`, {
          headers: { "X-Presentation-Key": organizerKey },
        }) as PresentationShipment[]
        if (active) { setShipments(rows); setConnected(true); setError("") }
      } catch (cause) {
        if (active) { setConnected(false); setError(cause instanceof Error ? cause.message : "No se pudo cargar la presentación.") }
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    const refresh = window.setInterval(() => void load(), 2000)
    return () => { active = false; window.clearInterval(refresh) }
  }, [runId, preview, organizerKey])

  return (
    <div className="presentation-screen">
      <header className="presentation-screen-header">
        <div>
          <span className="presentation-screen-kicker">MILENIO EXPRESS · {preview ? "VISTA PREVIA" : "EN VIVO"}</span>
          <h1>Paquetes alrededor del mundo</h1>
          <p>Cada línea es un paquete creado desde el celular de un participante.</p>
        </div>
        <div className="presentation-screen-stats">
          <strong>{shipments.length}</strong>
          <span>{shipments.length === 1 ? "paquete" : "paquetes"}</span>
          <small className={connected && !preview ? "connected" : ""}>
            {preview ? "Vista de ejemplo" : connected ? "● Conectado" : "○ Sincronizando"}
          </small>
        </div>
      </header>

      <main className="presentation-screen-main">
        {loading && <p className="presentation-empty" role="status">Preparando las rutas…</p>}
        {error && <p className="presentation-screen-error" role="alert">{error}</p>}
        {!loading && !error && shipments.length === 0 && (
          <div className="presentation-empty">
            <span aria-hidden="true">✦</span>
            <h2>La primera ruta está por comenzar</h2>
            <p>Los espectadores pueden crear sus paquetes desde sus celulares.</p>
          </div>
        )}
        <div className="presentation-journeys" aria-label="Paquetes de la presentación" ref={journeysRef}>
          {shipments.map((shipment, index) => {
            const progress = progressAt(shipment.createdAt, now)
            const percent = `${Math.round(progress * 100)}%`
            return (
              <article className="presentation-journey" key={shipment.id}>
                <div className="presentation-journey-heading">
                  <span className="presentation-journey-number">#{String(index + 1).padStart(2, "0")}</span>
                  <div className="presentation-journey-title">
                    <small>{shipment.participantName || "Participante"} · CÓDIGO {shipment.trackingCode || "----"}</small>
                    <strong>{shipment.packageName || "Paquete"}</strong>
                    <span>{countryName(shipment.originCountry)} → {countryName(shipment.destinationCountry)}</span>
                  </div>
                  <span className="presentation-journey-state">{checkpointAt(progress)}</span>
                </div>
                <div className="presentation-rail" aria-label={`${percent} del trayecto completado`}>
                  <div className="presentation-rail-progress" style={{ width: percent }} />
                  <div className="presentation-rail-marker" style={{ left: percent }} aria-hidden="true" />
                  {checkpoints.map((checkpoint, point) => (
                    <div
                      className={`presentation-checkpoint ${progress >= point / (checkpoints.length - 1) ? "reached" : ""}`}
                      style={{ left: `${point * 100 / (checkpoints.length - 1)}%` }}
                      key={checkpoint}
                    >
                      <span className="presentation-checkpoint-dot" />
                      <small>{checkpoint}</small>
                    </div>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </main>
      <footer className="presentation-screen-footer">Simulación de rutas · No representa un envío real</footer>
    </div>
  )
}
