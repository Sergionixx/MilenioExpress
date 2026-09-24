import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router"
import { apiFetch, supabase } from "../lib/supabase"
import {
  checkpointAt,
  checkpoints,
  countryName,
  mergePresentationShipments,
  participantCode,
  progressAt,
  type PresentationShipment,
} from "./model"
import "./presentation.css"

type NewRow = {
  id: string
  run_id: string
  origin_country: string
  destination_country: string
  participant_id: string | null
  participant_name: string | null
  created_at: string
}

export default function PresentationScreen() {
  const { runId } = useParams()
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
        createdAt: new Date(started - Number(seconds) * 1000).toISOString(),
      })))
      setLoading(false)
      setConnected(true)
      return
    }
    let active = true
    setShipments([])
    setLoading(true)
    setError("")
    setConnected(false)
    const load = async () => {
      try {
        const items = await apiFetch(`/presentation/runs/${encodeURIComponent(runId)}/shipments`) as PresentationShipment[]
        if (!active) return
        setShipments((current) => mergePresentationShipments(current, items))
        setError("")
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "No se pudo cargar la presentación.")
      } finally {
        if (active) setLoading(false)
      }
    }
    const channel = supabase
      .channel(`presentation-${runId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "presentation_shipments", filter: `run_id=eq.${runId}`,
      }, (payload) => {
        if (!active) return
        const row = payload.new as NewRow
        setShipments((current) => mergePresentationShipments(current, [{
          id: row.id,
          runId: row.run_id,
          originCountry: row.origin_country,
          destinationCountry: row.destination_country,
          participantId: row.participant_id,
          participantName: row.participant_name,
          createdAt: row.created_at,
        }]))
      })
      .subscribe((status) => {
        if (!active) return
        setConnected(status === "SUBSCRIBED")
        if (status === "SUBSCRIBED") void load()
      })
    void load()
    const refresh = window.setInterval(() => void load(), 15_000)
    return () => {
      active = false
      window.clearInterval(refresh)
      void supabase.removeChannel(channel)
    }
  }, [runId, preview])

  return (
    <div className="presentation-screen">
      <header className="presentation-screen-header">
        <div>
          <span className="presentation-screen-kicker">MILENIO EXPRESS · {preview ? "VISTA PREVIA" : "EN VIVO"}</span>
          <h1>Rutas alrededor del mundo</h1>
          <p>Cada línea es un envío simulado por un participante.</p>
        </div>
        <div className="presentation-screen-stats">
          <strong>{shipments.length}</strong>
          <span>{shipments.length === 1 ? "envío" : "envíos"}</span>
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
            <p>Los participantes pueden elegir origen y destino desde sus celulares.</p>
          </div>
        )}
        <div className="presentation-journeys" aria-label="Envíos de la presentación" ref={journeysRef}>
          {shipments.map((shipment, index) => {
            const progress = progressAt(shipment.createdAt, now)
            const percent = `${Math.round(progress * 100)}%`
            return (
              <article className="presentation-journey" key={shipment.id}>
                <div className="presentation-journey-heading">
                  <span className="presentation-journey-number">#{String(index + 1).padStart(2, "0")}</span>
                  <div className="presentation-journey-title">
                    {shipment.participantId && shipment.participantName && (
                      <small>{shipment.participantName} · {participantCode(shipment.participantId)}</small>
                    )}
                    <strong>{countryName(shipment.originCountry)} <span aria-hidden="true">→</span> {countryName(shipment.destinationCountry)}</strong>
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
