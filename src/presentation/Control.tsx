import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { presentationFetch } from "./api"
import type { PresentationShipment } from "./model"
import "./presentation.css"
import ParticipantQr from "./Qr"

export default function PresentationControl() {
  const { runId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const organizerKey = new URLSearchParams(location.hash.slice(1)).get("key") ?? ""
  const [shipments, setShipments] = useState<PresentationShipment[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState("")
  const organizerHeaders = { "X-Presentation-Key": organizerKey }
  const screenUrl = runId ? `${window.location.origin}/presentacion/pantalla/${runId}#key=${encodeURIComponent(organizerKey)}` : ""
  const participantUrl = runId ? `${window.location.origin}/presentacion/participar/${runId}` : ""

  useEffect(() => {
    if (!runId || !organizerKey) return
    let active = true
    async function load() {
      try {
        const rows = await presentationFetch(`/runs/${encodeURIComponent(runId!)}/shipments`, {
          headers: { "X-Presentation-Key": organizerKey },
        }) as PresentationShipment[]
        if (active) { setShipments(rows); setError("") }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "No se pudo cargar la presentación.")
      }
    }
    void load()
    const interval = window.setInterval(() => void load(), 3000)
    return () => { active = false; window.clearInterval(interval) }
  }, [runId, organizerKey])

  async function createRun() {
    setSaving(true)
    setError("")
    try {
      const run = await presentationFetch("/runs", {
        method: "POST",
        headers: organizerHeaders,
      }) as { id: string }
      navigate(`/presentacion/control/${run.id}#key=${encodeURIComponent(organizerKey)}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo iniciar la presentación.")
    } finally {
      setSaving(false)
    }
  }

  async function copyUrl(url: string, label: string) {
    try {
      await navigator.clipboard.writeText(url)
      setFeedback(`Enlace ${label} copiado.`)
    } catch {
      setFeedback("Selecciona y copia el enlace del campo.")
    }
  }

  return (
    <main className="presentation-control">
      <div className="eyebrow">SOLO ORGANIZADOR</div>
      <h1>Presentación en vivo</h1>
      {!organizerKey ? (
        <p className="form-error" role="alert">Abre el enlace privado del organizador en esta computadora.</p>
      ) : !runId ? (
        <section className="presentation-panel">
          <h2>Preparar la presentación</h2>
          <p>Inicia una presentación y comparte sólo el enlace de participantes con los espectadores.</p>
          <button className="primary-button" type="button" disabled={saving} onClick={() => void createRun()}>
            {saving ? "Preparando…" : "Iniciar presentación"}
          </button>
        </section>
      ) : (
        <>
          <section className="presentation-panel">
            <div className="presentation-panel-top">
              <h2>1. Proyector</h2>
              <span className="presentation-count">{shipments.length} paquetes</span>
            </div>
            <p>Abre esta pantalla en la computadora. El enlace es privado; no lo compartas con los espectadores.</p>
            <label className="presentation-url-label">
              Enlace del proyector
              <input readOnly value={screenUrl} onFocus={(event) => event.currentTarget.select()} />
            </label>
            <div className="presentation-actions">
              <button className="secondary-button" type="button" onClick={() => void copyUrl(screenUrl, "del proyector")}>Copiar</button>
              <a className="secondary-button" href={screenUrl} target="_blank" rel="noreferrer">Abrir proyector</a>
            </div>
          </section>
          <section className="presentation-panel">
            <h2>2. Espectadores</h2>
            <ParticipantQr url={participantUrl}/>
            <p>Comparte este enlace. Cada persona puede crear paquetes y rastrear cualquier guía sin registrarse. Su lista muestra solo los paquetes creados desde su navegador.</p>
            <label className="presentation-url-label">
              Enlace para los celulares
              <input readOnly value={participantUrl} onFocus={(event) => event.currentTarget.select()} />
            </label>
            <button className="primary-button" type="button" onClick={() => void copyUrl(participantUrl, "para espectadores")}>Copiar enlace para espectadores</button>
          </section>
          <button className="text-button" type="button" disabled={saving} onClick={() => void createRun()}>Iniciar otra presentación</button>
        </>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      {feedback && <p className="presentation-feedback" role="status">{feedback}</p>}
    </main>
  )
}
