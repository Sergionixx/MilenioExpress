import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { apiFetch } from "../lib/supabase"
import { countries, countryName, type PresentationShipment } from "./model"
import "./presentation.css"

export default function PresentationControl() {
  const { runId } = useParams()
  const navigate = useNavigate()
  const [originCountry, setOriginCountry] = useState("MX")
  const [destinationCountry, setDestinationCountry] = useState("US")
  const [shipments, setShipments] = useState<PresentationShipment[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState("")
  const screenUrl = runId ? `${window.location.origin}/presentacion/pantalla/${runId}` : ""
  const participantUrl = runId ? `${window.location.origin}/presentacion/participar/${runId}` : ""

  useEffect(() => {
    if (!runId) return
    let active = true
    setLoading(true)
    setError("")
    void apiFetch(`/presentation/runs/${encodeURIComponent(runId)}/shipments`)
      .then((result) => { if (active) setShipments(result as PresentationShipment[]) })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "No se pudo cargar la presentación.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [runId])

  async function createRun() {
    setSaving(true)
    setError("")
    setFeedback("")
    try {
      const run = await apiFetch("/presentation/runs", { method: "POST" }) as { id: string }
      navigate(`/presentacion/control/${run.id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo iniciar la presentación.")
    } finally {
      setSaving(false)
    }
  }

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
      setShipments((items) => [...items, created])
      setFeedback(`Envío ${countryName(originCountry)} → ${countryName(destinationCountry)} añadido al proyector.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo registrar el envío.")
    } finally {
      setSaving(false)
    }
  }

  async function copyUrl(url: string, label: string) {
    try {
      await navigator.clipboard.writeText(url)
      setFeedback(`Enlace para ${label} copiado.`)
    } catch {
      setFeedback("Selecciona y copia el enlace del campo.")
    }
  }

  return (
    <main className="screen presentation-control">
      <div className="eyebrow">DINÁMICA EN VIVO</div>
      <h1>Control de presentación</h1>
      <p className="muted-text">Cada envío es una simulación entre países y aparece como una línea nueva en el proyector.</p>

      {!runId ? (
        <section className="presentation-panel">
          <h2>Preparar el proyector</h2>
          <p>Crea una presentación y abre su enlace en la computadora conectada al proyector.</p>
          <button className="primary-button" type="button" disabled={saving} onClick={() => void createRun()}>
            {saving ? "Preparando…" : "Iniciar nueva presentación"}
          </button>
        </section>
      ) : (
        <>
          <section className="presentation-panel">
            <div className="presentation-panel-top">
              <h2>Pantalla del proyector</h2>
              <span className="presentation-count">{shipments.length} {shipments.length === 1 ? "envío" : "envíos"}</span>
            </div>
            <label className="presentation-url-label">
              Enlace para el proyector
              <input readOnly value={screenUrl} onFocus={(event) => event.currentTarget.select()} />
            </label>
            <div className="presentation-actions">
              <button className="secondary-button" type="button" onClick={() => void copyUrl(screenUrl, "el proyector")}>Copiar enlace</button>
              <a className="secondary-button" href={screenUrl} target="_blank" rel="noreferrer">Abrir pantalla</a>
            </div>
          </section>

          <section className="presentation-panel">
            <h2>Enlace para los celulares</h2>
            <p>Compártelo con los participantes. Cada persona escribe su nombre y elige sus países desde su propio celular.</p>
            <label className="presentation-url-label">
              Enlace para participar
              <input readOnly value={participantUrl} onFocus={(event) => event.currentTarget.select()} />
            </label>
            <div className="presentation-actions">
              <button className="secondary-button" type="button" onClick={() => void copyUrl(participantUrl, "los participantes")}>Copiar enlace</button>
              <a className="secondary-button" href={participantUrl} target="_blank" rel="noreferrer">Probar en este dispositivo</a>
            </div>
          </section>

          <form className="presentation-panel presentation-form" onSubmit={(event) => void submit(event)}>
            <h2>Nuevo envío simulado</h2>
            <p>También puedes añadir una ruta desde este dispositivo. Aparecerá con tu nombre y código.</p>
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
            <button className="primary-button" type="submit" disabled={saving || loading || originCountry === destinationCountry}>
              {saving ? "Añadiendo…" : "Enviar al proyector"}
            </button>
          </form>
          <button className="text-button" type="button" disabled={saving} onClick={() => void createRun()}>
            Iniciar otra presentación
          </button>
        </>
      )}
      {loading && <p className="muted-text" role="status">Cargando presentación…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {feedback && <p className="presentation-feedback" role="status">{feedback}</p>}
      <Link to="/inicio" className="presentation-back">Volver a Inicio</Link>
    </main>
  )
}
