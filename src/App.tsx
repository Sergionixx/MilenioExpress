import { type FormEvent, type ReactNode, useEffect, useState } from "react"

import {
  apiFetch,
  getRole,
  setRole,
  logout,
  normalizeGuide,
  resetDemo,
  statuses,
  type Shipment as ShipmentData,
  type Role,
} from "./lib/demo"

import {
  createBrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  RouterProvider,
  useNavigate,
  useParams,
} from "react-router"

type IconName = "box" | "scan" | "search" | "clock" | "user" | "chevron" | "arrow" | "camera" | "check" | "filter" | "pin" | "eye"

function Icon({ name, className = "" }: {
  name: IconName
  className?: string
}) {
  const paths: Record<IconName, ReactNode> = {
    box: (
      <>
        <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" />
        <path d="m3 7.5 9 4.5 9-4.5M12 12v9" />
      </>
    ),

    scan: (
      <>
        <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
        <path d="M8 12h8M9 9v6M12 9v6M15 9v6" />
      </>
    ),

    search: (
      <>
        <circle cx="10.8" cy="10.8" r="5.8" />
        <path d="m16 16 4 4" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20c.7-3.2 3-5 7-5s6.3 1.8 7 5" />
      </>
    ),

    chevron: <path d="m9 18 6-6-6-6" />,
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),

    camera: (
      <>
        <path d="M4 8h3l1.4-2h7.2L17 8h3v11H4V8Z" />
        <circle cx="12" cy="13" r="3.2" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,
    filter: (
      <>
        <path d="M4 6h16M7 12h10M10 18h4" />
      </>
    ),

    pin: (
      <>
        <path d="M12 21s6-5.6 6-11a6 6 0 1 0-12 0c0 5.4 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    eye: (
      <>
        <path d="M3 12s3-5 9-5 9 5 9 5-3 5-9 5-9-5-9-5Z" />
        <circle cx="12" cy="12" r="2" />
      </>
    ),
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p className="form-error" role="alert">
      {message}
    </p>
  ) : null
}
function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudo completar la operación."
}
function date(value: string) {
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}
function Back({ title }: { title: string }) {
  return (
    <div className="back-row">
      <Link to="/inicio" className="round-button" aria-label="Volver al inicio">
        ←
      </Link>
      <h2>{title}</h2>
    </div>
  )
}
function Auth() {
  const nav = useNavigate()
  const [error, setError] = useState("")
  function enter(role: Role) {
    try {
      setRole(role)
      nav("/inicio")
    } catch {
      setError("Habilita el almacenamiento del navegador para entrar.")
    }
  }
  return (
    <main className="auth-shell">
      <section className="auth-top">
        <div className="brand-mark">
          <Icon name="box" />
        </div>
        <span className="brand-name">
          milenio<span>express</span>
        </span>
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
      </section>
      <section className="auth-card role-card">
        <div className="eyebrow">PROYECTO FINAL · DEMOSTRACIÓN</div>
        <h1>Tu envío, paso a paso.</h1>
        <p>Elige un perfil para explorar el recorrido de un paquete.</p>
        <div className="role-actions">
          <button
            className="role-button client-role"
            onClick={() => enter("cliente")}
          >
            <span className="role-icon">
              <Icon name="user" />
            </span>
            <span>
              <strong>Iniciar como cliente</strong>
              <small>Consulta tus guías y el historial</small>
            </span>
            <Icon name="chevron" />
          </button>
          <button
            className="role-button driver-role"
            onClick={() => enter("repartidor")}
          >
            <span className="role-icon">
              <Icon name="box" />
            </span>
            <span>
              <strong>Acceso de repartidor</strong>
              <small>Registra paquetes y confirma entregas</small>
            </span>
            <Icon name="chevron" />
          </button>
        </div>
        <ErrorMessage message={error} />
        <p className="role-note">
          Datos de ejemplo guardados en este navegador. Los perfiles simulan una
          sesión para la exposición.
        </p>
      </section>
    </main>
  )
}
function Shell() {
  if (!getRole()) return <Navigate to="/" replace />
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/inicio" className="mini-brand">
          <div>
            <Icon name="box" />
          </div>
          <b>
            milenio<span>express</span>
          </b>
        </Link>
        <Link to="/perfil" className="avatar" aria-label="Ver perfil">
          <Icon name="user" />
        </Link>
      </header>
      <div className="demo-banner">
        DEMO ACADÉMICA · {getRole() === "repartidor" ? "Repartidor" : "Cliente"}{" "}
        · Datos locales
      </div>
      <Outlet />
      <nav className="bottom-nav" aria-label="Navegación principal">
        <NavLink to="/inicio">
          <Icon name="search" />
          <span>Rastrear</span>
        </NavLink>
        <NavLink to="/historial">
          <Icon name="clock" />
          <span>Historial</span>
        </NavLink>
        <NavLink to="/perfil">
          <Icon name="user" />
          <span>Perfil</span>
        </NavLink>
      </nav>
    </div>
  )
}
function DriverOnly() {
  return getRole() === "repartidor" ? (
    <Outlet />
  ) : (
    <Navigate to="/inicio" replace />
  )
}
function PackageCard({ item }: { item: ShipmentData }) {
  return (
    <Link to={`/envio/${encodeURIComponent(item.id)}`} className="package-card">
      <div className={`package-icon ${item.tone}`}>
        <Icon name="box" />
      </div>
      <div className="package-copy">
        <small>{item.id}</small>
        <strong>{item.place}</strong>
        <span className={`status ${item.tone}`}>{item.state}</span>
      </div>
      <Icon name="chevron" className="chevron" />
    </Link>
  )
}
function useShipments() {
  const [items, setItems] = useState<ShipmentData[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let mounted = true
    apiFetch("/shipments")
      .then((data) => {
        if (mounted) setItems(data)
      })
      .catch((e) => {
        if (mounted) setError(errorText(e))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])
  return { items, error, loading }
}
function Home() {
  const nav = useNavigate()
  const [code, setCode] = useState("")
  const { items, error, loading } = useShipments()
  function search(e: FormEvent) {
    e.preventDefault()
    if (code.trim()) nav(`/envio/${encodeURIComponent(normalizeGuide(code))}`)
  }
  return (
    <main className="screen home-screen">
      <div className="greeting">
        <div>
          <div className="eyebrow">CADA PAQUETE TIENE UNA HISTORIA</div>
          <h1>
            {getRole() === "repartidor"
              ? "Tus entregas de hoy"
              : "¿Dónde está tu envío?"}
          </h1>
        </div>
      </div>
      <form className="tracking-search" onSubmit={search}>
        <Icon name="search" />
        <input
          required
          aria-label="Número de guía"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ingresa tu número de guía"
        />
        <button type="submit" aria-label="Rastrear guía">
          <Icon name="arrow" />
        </button>
      </form>
      {getRole() === "repartidor" && (
        <Link className="primary-button deliver-button" to="/nuevo">
          <Icon name="box" />
          Registrar paquete
        </Link>
      )}
      <section className="section">
        <div className="section-title">
          <div>
            <div className="eyebrow">ACTIVIDAD</div>
            <h2>Paquetes recientes</h2>
          </div>
          <Link to="/historial">Ver todo</Link>
        </div>
        <ErrorMessage message={error} />
        {loading ? (
          <p role="status">Cargando envíos…</p>
        ) : (
          <div className="package-list">
            {items.slice(0, 5).map((item) => (
              <PackageCard key={item.id} item={item} />
            ))}
            {!error && !items.length && <p>No hay paquetes registrados.</p>}
          </div>
        )}
      </section>
    </main>
  )
}
function Shipment() {
  const { id = "" } = useParams()
  const [shipment, setShipment] = useState<ShipmentData>()
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    let mounted = true
    setShipment(undefined)
    setError("")
    setActionError("")
    apiFetch(`/shipments/${encodeURIComponent(id)}`)
      .then((data) => {
        if (mounted) setShipment(data)
      })
      .catch((e) => {
        if (mounted) setError(errorText(e))
      })
    return () => {
      mounted = false
    }
  }, [id])
  if (error)
    return (
      <main className="screen">
        <Back title="Consultar envío" />
        <ErrorMessage message={error} />
        <Link to="/inicio" className="secondary-button">
          Buscar otra guía
        </Link>
      </main>
    )
  if (!shipment)
    return (
      <main className="screen">
        <p role="status">Consultando envío…</p>
      </main>
    )
  const next = statuses[statuses.indexOf(shipment.state) + 1]
  async function advance() {
    setSaving(true)
    setActionError("")
    try {
      setShipment(
        await apiFetch(`/shipments/${encodeURIComponent(id)}/status`, {
          method: "POST",
          body: JSON.stringify({ state: next }),
        }),
      )
    } catch (e) {
      setActionError(errorText(e))
    } finally {
      setSaving(false)
    }
  }
  return (
    <main className="screen">
      <Back title="Detalle del envío" />
      <div className="guide-label">
        <small>NÚMERO DE GUÍA</small>
        <strong>{shipment.id}</strong>
        <p>Usa este número en Rastrear para consultar el envío.</p>
      </div>
      <section className="destination-card">
        <div className="pin-wrap">
          <Icon name="pin" />
        </div>
        <div>
          <small>DESTINO · {shipment.recipient}</small>
          <strong>{shipment.address}</strong>
          <span>{shipment.place}</span>
        </div>
      </section>
      <p className="muted">{shipment.description}</p>
      <section className="section timeline-section">
        <div className="section-title">
          <h2>Estado del envío</h2>
          <span className={`status ${shipment.tone}`}>{shipment.state}</span>
        </div>
        <div className="timeline">
          {shipment.events.map((step, i) => (
            <div className="timeline-item active" key={`${step.time}-${i}`}>
              <div className="track">
                <span>
                  <Icon name="check" />
                </span>
                {i < shipment.events.length - 1 && <i />}
              </div>
              <div>
                <strong>{step.title}</strong>
                <p>{step.desc}</p>
                <small>
                  {date(step.time)} · {step.actor}
                </small>
              </div>
            </div>
          ))}
        </div>
      </section>
      {shipment.evidence && (
        <section className="proof-block">
          <h2>Evidencia de entrega</h2>
          <img
            className="evidence-image"
            src={shipment.evidence.photo}
            alt={`Entrega recibida por ${shipment.evidence.recipient}`}
          />
          <p>Recibió: {shipment.evidence.recipient}</p>
        </section>
      )}
      <ErrorMessage message={actionError} />
      {getRole() === "repartidor" &&
        next &&
        (next === "Entregado" ? (
          <Link
            className="primary-button"
            to={`/entrega/${encodeURIComponent(shipment.id)}`}
          >
            Confirmar entrega <Icon name="arrow" />
          </Link>
        ) : (
          <button
            className="primary-button full-width"
            disabled={saving}
            onClick={advance}
          >
            {saving ? "Guardando…" : `Avanzar a ${next.toLowerCase()}`}
            <Icon name="arrow" />
          </button>
        ))}
    </main>
  )
}
function NewPackage() {
  const nav = useNavigate()
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget))
    setSaving(true)
    setError("")
    try {
      const shipment = await apiFetch("/shipments", {
        method: "POST",
        body: JSON.stringify(data),
      })
      nav(`/envio/${encodeURIComponent(shipment.id)}`)
    } catch (e) {
      setError(errorText(e))
    } finally {
      setSaving(false)
    }
  }
  return (
    <main className="screen">
      <Back title="Registrar paquete" />
      <p className="muted">Completa los datos para generar una guía única.</p>
      <form className="form-stack" onSubmit={submit}>
        {[
          {
            name: "recipient",
            title: "Nombre del destinatario",
            placeholder: "Ej. Mariana Cárdenas",
          },
          {
            name: "address",
            title: "Dirección de entrega",
            placeholder: "Calle, número y colonia",
          },
          {
            name: "place",
            title: "Ciudad y estado",
            placeholder: "Ej. Monterrey, NL",
          },
          {
            name: "description",
            title: "Descripción del paquete",
            placeholder: "Ej. Caja de libros",
          },
        ].map((field) => (
          <label key={field.name}>
            {field.title}
            <input
              name={field.name}
              placeholder={field.placeholder}
              required
              minLength={3}
              maxLength={180}
            />
          </label>
        ))}
        <ErrorMessage message={error} />
        <button className="primary-button" disabled={saving}>
          {saving ? "Registrando…" : "Generar guía"}
          <Icon name="arrow" />
        </button>
      </form>
    </main>
  )
}
function History() {
  const [filter, setFilter] = useState("Todos")
  const { items, error, loading } = useShipments()
  const list =
    filter === "Todos" ? items : items.filter((x) => x.state === filter)
  return (
    <main className="screen">
      <div className="eyebrow">CADA ETAPA, EN UN SOLO LUGAR</div>
      <h1>Historial</h1>
      <div className="filters">
        <div className="filter-chips">
          {["Todos", ...statuses].map((x) => (
            <button
              key={x}
              aria-pressed={filter === x}
              onClick={() => setFilter(x)}
              className={filter === x ? "active" : ""}
            >
              {x}
            </button>
          ))}
        </div>
      </div>
      <div className="history-count">
        <span>{list.length} envíos encontrados</span>
        <Icon name="filter" />
      </div>
      <ErrorMessage message={error} />
      {loading ? (
        <p role="status">Cargando historial…</p>
      ) : (
        <div className="package-list">
          {list.map((item) => (
            <PackageCard key={item.id} item={item} />
          ))}
          {!error && !list.length && (
            <p className="empty-state">No hay envíos con este estado.</p>
          )}
        </div>
      )}
    </main>
  )
}
function Delivery() {
  const { id = "" } = useParams()
  const nav = useNavigate()
  const [name, setName] = useState("")
  const [photo, setPhoto] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [reading, setReading] = useState(false)
  async function choosePhoto(file?: File) {
    setPhoto("")
    setError("")
    if (!file) return
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 1_000_000
    ) {
      setError("Elige una imagen JPG, PNG o WebP de hasta 1 MB.")
      return
    }
    setReading(true)
    try {
      const bitmap = await createImageBitmap(file)
      bitmap.close()
      const result = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error("No se pudo leer la imagen."))
        reader.readAsDataURL(file)
      })
      setPhoto(result)
    } catch {
      setError("No se pudo abrir la fotografía. Elige otra imagen.")
    } finally {
      setReading(false)
    }
  }
  async function complete(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      await apiFetch(`/shipments/${encodeURIComponent(id)}/deliver`, {
        method: "POST",
        body: JSON.stringify({ evidence: { recipient: name, photo } }),
      })
      nav(`/envio/${encodeURIComponent(id)}`)
    } catch (e) {
      setError(errorText(e))
    } finally {
      setSaving(false)
    }
  }
  return (
    <main className="screen delivery">
      <Back title="Confirmar entrega" />
      <p className="guide-label">{id}</p>
      <p className="muted">
        El paquete debe estar en reparto. Adjunta una foto de prueba para
        completar la entrega de demostración.
      </p>
      <form className="form-stack" onSubmit={complete}>
        <label>
          Nombre de quien recibe
          <input
            required
            minLength={3}
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre y apellido"
          />
        </label>
        <label>
          Fotografía de entrega (máximo 1 MB)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={reading || saving}
            onChange={(e) => {
              void choosePhoto(e.target.files?.[0])
            }}
          />
        </label>
        {reading && <p role="status">Leyendo fotografía…</p>}
        {photo && (
          <img
            className="evidence-image"
            src={photo}
            alt="Vista previa de la evidencia"
          />
        )}
        <ErrorMessage message={error} />
        <button
          disabled={!photo || name.trim().length < 3 || saving || reading}
          className="primary-button"
        >
          {saving ? "Guardando…" : "Completar entrega"}
          <Icon name="check" />
        </button>
      </form>
    </main>
  )
}
function Profile() {
  const nav = useNavigate()
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState("")
  return (
    <main className="screen">
      <div className="eyebrow">DEMOSTRACIÓN</div>
      <h1>Perfil</h1>
      <div className="profile-card">
        <div className="profile-avatar">
          <Icon name="user" />
        </div>
        <strong>
          {getRole() === "repartidor" ? "Repartidor" : "Cliente"} de
          demostración
        </strong>
        <span>Proyecto final · Milenio Express</span>
      </div>
      <p className="muted">
        Los datos se conservan en este navegador. Puedes cambiar de perfil y
        consultar los mismos paquetes. Este prototipo no realiza envíos reales.
      </p>
      <button
        onClick={() => {
          logout()
          nav("/")
        }}
        className="secondary-button"
      >
        Cambiar de perfil
      </button>
      <section className="section">
        <h2>Preparar otra exposición</h2>
        <p className="muted">
          Restablecer elimina los paquetes y fotografías locales y recupera los
          ejemplos iniciales.
        </p>
        {confirmReset ? (
          <div className="reset-actions">
            <button
              className="secondary-button"
              onClick={() => setConfirmReset(false)}
            >
              Cancelar
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                resetDemo()
                setConfirmReset(false)
                setMessage("Demostración restablecida.")
              }}
            >
              Sí, restablecer
            </button>
          </div>
        ) : (
          <button
            className="secondary-button"
            onClick={() => setConfirmReset(true)}
          >
            Restablecer demostración
          </button>
        )}
        <p role="status">{message}</p>
      </section>
    </main>
  )
}
const router = createBrowserRouter([
  { path: "/", Component: Auth },
  {
    Component: Shell,
    children: [
      { path: "/inicio", Component: Home },
      { path: "/envio/:id", Component: Shipment },
      { path: "/historial", Component: History },
      { path: "/perfil", Component: Profile },
      {
        Component: DriverOnly,
        children: [
          { path: "/nuevo", Component: NewPackage },
          { path: "/entrega/:id", Component: Delivery },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
])
export default function App() {
  return <RouterProvider router={router} />
}
