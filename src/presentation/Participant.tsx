import { useEffect, useState, type FormEvent } from "react"
import { Link, useParams } from "react-router"
import { apiFetch } from "../lib/supabase"
import { countries, countryName, participantCode, type PresentationShipment } from "./model"
import "./presentation.css"

type Props = { participant: { id: string; name: string } }

export default function PresentationParticipant({ participant }: Props) {
  const { runId } = useParams()
  const [originCountry, setOriginCountry] = useState("MX")
  const [destinationCountry, setDestinationCountry] = useState("US")
  const [shipments, setShipments] = useState<PresentationShipment[]>([])
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState("")

  useEffect(() => {
    if (!runId) return
    let active = true
    setLoading(true)
    setAvailable(false)
    setError("")
    void apiFetch(`/presentation/runs/${encodeURIComponent(runId)}/shipments`)
      .then((result) => { if (active) { setShipments(result as PresentationShipment[]); setAvailable(true) } })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "No se encontró esta presentación.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [runId])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!runId || originCountry === destinationCountry) {
      setError("Elige dos países distintos.")
      return
    }
    setSaving(true)
    setError("")
    setFeedback("")
    try {
      const created = await apiFetch(`/presentation/runs/${encodeURIComponent(runId)}/shipments`, {
        method: "POST",
        body: JSON.stringify({ originCountry, destinationCountry }),
      }) as PresentationShipment
      setShipments((current) => [...current, created])
      setFeedback(`¡Listo! ${countryName(originCountry)} → ${countryName(destinationCountry)} ya aparece en el proyector.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo enviar tu ruta.")
    } finally {
      setSaving(false)
    }
  }

  const ownCount = shipments.filter((item) => item.participantId === participant.id).length

  return (
    <main className="screen presentation-control">
      <div className="eyebrow">PARTICIPA DESDE TU CELULAR</div>
      <h1>Hola, {participant.name.split(" ")[0]}</h1>
      <p className="muted-text">Tu código es <strong>{participantCode(participant.id)}</strong>. Identifica tus rutas aunque otra persona use el mismo nombre.</p>
      <section className="presentation-panel">
        <div className="presentation-panel-top">
          <h2>Envía un paquete simulado</h2>
          <span className="presentation-count">{ownCount} {ownCount === 1 ? "ruta" : "rutas"}</span>
        </div>
        <p>Elige el país de salida y el destino. Verás tu nombre y código en el proyector.</p>
        <form className="presentation-form" onSubmit={(event) => void submit(event)}>
          <label>
            País de origen
            <select value={originCountry} onChange={(event) => setOriginCountry(event.target.value)}>
              {countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
            </select>
          </label>
          <label>
            País de destino
            <select value={destinationCountry} onChange={(event) => setDestinationCountry(event.target.value)}>
              {countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
            </select>
          </label>
          <button className="primary-button" type="submit" disabled={saving || loading || !available || originCountry === destinationCountry}>
            {saving ? "Enviando…" : "Enviar al proyector"}
          </button>
        </form>
      </section>
      {loading && <p className="muted-text" role="status">Cargando presentación…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {feedback && <p className="presentation-feedback" role="status">{feedback}</p>}
      <Link to="/inicio" className="presentation-back">Volver a Inicio</Link>
    </main>
  )
}
