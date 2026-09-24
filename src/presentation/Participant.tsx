import { useEffect, useState, type FormEvent } from "react"
import { useParams } from "react-router"
import { apiFetch } from "../lib/supabase"
import { checkpointAt, checkpoints, countries, countryName, progressAt, type PresentationShipment } from "./model"
import "./presentation.css"

type Props = { participant: { id: string; name: string } }

export default function PresentationParticipant({ participant }: Props) {
  const { runId } = useParams()
  const [packageName, setPackageName] = useState("")
  const [originCountry, setOriginCountry] = useState("MX")
  const [destinationCountry, setDestinationCountry] = useState("US")
  const [trackingCode, setTrackingCode] = useState("")
  const [shipments, setShipments] = useState<PresentationShipment[]>([])
  const [now, setNow] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState("")

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!runId) return
    let active = true
    async function load() {
      try {
        const rows = await apiFetch(`/presentation/runs/${encodeURIComponent(runId!)}/shipments`) as PresentationShipment[]
        if (active) { setShipments(rows); setAvailable(true); setError("") }
      } catch (cause) {
        if (active) { setAvailable(false); setError(cause instanceof Error ? cause.message : "No se encontró esta presentación.") }
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    const interval = window.setInterval(() => void load(), 5000)
    return () => { active = false; window.clearInterval(interval) }
  }, [runId])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!runId || originCountry === destinationCountry) {
      setError("Elige dos países distintos.")
      return
    }
    if (!/^[0-9]{4}$/.test(trackingCode)) {
      setError("Escribe exactamente cuatro dígitos para rastrear tu paquete.")
      return
    }
    setSaving(true)
    setError("")
    setFeedback("")
    try {
      const created = await apiFetch(`/presentation/runs/${encodeURIComponent(runId)}/shipments`, {
        method: "POST",
        body: JSON.stringify({ packageName: packageName.trim(), originCountry, destinationCountry, trackingCode }),
      }) as PresentationShipment
      setShipments((current) => [...current, created])
      setFeedback(`¡Listo! Tu paquete ${trackingCode} ya está en camino.`)
      setPackageName("")
      setTrackingCode("")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear tu paquete.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="presentation-guest">
      <header className="presentation-guest-header">
        <span className="presentation-guest-brand">milenio<span>express</span></span>
        <small>PRESENTACIÓN EN VIVO</small>
      </header>
      <div className="presentation-guest-content">
        <p className="eyebrow">HOLA, {participant.name.split(" ")[0].toUpperCase()}</p>
        <h1>Envía tu paquete</h1>
        <p className="presentation-guest-intro">Ponle un nombre, elige los países y crea un código de cuatro dígitos para seguirlo.</p>

        <form className="presentation-guest-form" onSubmit={(event) => void submit(event)}>
          <label>
            Nombre del paquete
            <input required maxLength={40} value={packageName} onChange={(event) => setPackageName(event.target.value)} placeholder="Ej. Regalo para Ana" />
          </label>
          <label>
            Sale de
            <select value={originCountry} onChange={(event) => setOriginCountry(event.target.value)}>
              {countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
            </select>
          </label>
          <label>
            Llega a
            <select value={destinationCountry} onChange={(event) => setDestinationCountry(event.target.value)}>
              {countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
            </select>
          </label>
          <label>
            Tu código de rastreo (4 dígitos)
            <input required type="text" inputMode="numeric" autoComplete="off" pattern="[0-9]{4}" maxLength={4} value={trackingCode} onChange={(event) => setTrackingCode(event.target.value.replace(/\D/g, ""))} placeholder="Ej. 4826" />
          </label>
          <button className="primary-button" type="submit" disabled={saving || loading || !available || originCountry === destinationCountry || !packageName.trim() || trackingCode.length !== 4}>
            {saving ? "Creando…" : "Crear paquete"}
          </button>
        </form>

        {loading && <p className="muted-text" role="status">Preparando tu espacio…</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {feedback && <p className="presentation-feedback" role="status">{feedback}</p>}

        <section className="presentation-guest-orders" aria-label="Mis paquetes">
          <h2>Mis paquetes</h2>
          {!loading && shipments.length === 0 && <p>Aún no tienes paquetes. Crea el primero arriba.</p>}
          {[...shipments].reverse().map((shipment) => {
            const progress = progressAt(shipment.createdAt, now)
            return (
              <article className="presentation-guest-order" key={shipment.id}>
                <div className="presentation-guest-order-top">
                  <strong>{shipment.packageName || "Paquete"}</strong>
                  <span>#{shipment.trackingCode || "----"}</span>
                </div>
                <p>{countryName(shipment.originCountry)} → {countryName(shipment.destinationCountry)}</p>
                <div className="presentation-guest-progress" aria-label={`${Math.round(progress * 100)}% del trayecto`}>
                  <span style={{ width: `${Math.round(progress * 100)}%` }} />
                </div>
                <div className="presentation-guest-checkpoints">
                  {checkpoints.map((point, index) => <small className={progress >= index / (checkpoints.length - 1) ? "reached" : ""} key={point}>{point}</small>)}
                </div>
                <b>{checkpointAt(progress)}</b>
              </article>
            )
          })}
        </section>
      </div>
    </main>
  )
}
