import {
  createContext,
  FormEvent,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  createBrowserRouter,
  Link,
  Navigate,
  NavLink,
  Outlet,
  RouterProvider,
  useLocation,
  useNavigate,
  useParams,
} from "react-router"
import { ApiError, apiFetch, supabase } from "./lib/supabase"
import { SESSION_REJECTED_EVENT } from "./lib/session"
import PresentationControl from "./presentation/Control"
import PresentationScreen from "./presentation/Screen"
import PresentationParticipant from "./presentation/Participant"
import { participantCode } from "./presentation/model"

type Role = "ADMIN" | "USER"
type Account = { id: string; email: string; name: string; role: Role }
type Owner = Pick<Account, "id" | "email" | "name">
type Shipment = {
  id: string
  guide: string
  ownerId: string
  recipient: string
  address: string
  city: string
  place: string
  description: string
  state: string
  tone: string
  events: { title: string; desc: string; time: string }[]
  createdAt: string
}
type AuthState = {
  account: Account | null
  checking: boolean
  error: string
  refresh: () => Promise<Account | null>
  logout: () => Promise<void>
}
type IconName = "box" | "search" | "clock" | "user" | "chevron" | "arrow" | "check" | "pin" | "copy" | "plus"
const AuthContext = createContext<AuthState | null>(null)
const guidePattern = /^ME-\d{4}-\d{8,}$/
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "No se pudo completar la solicitud."

function useAccount() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("Falta el contexto de acceso.")
  return context
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState("")
  const sessionVersion = useRef(0)
  async function refresh() {
    const version = ++sessionVersion.current
    setChecking(true)
    setError("")
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (version !== sessionVersion.current) return null
      if (!session) {
        setAccount(null)
        return null
      }
      const current = (await apiFetch("/me")) as Account
      if (version !== sessionVersion.current) return null
      setAccount(current)
      return current
    } catch (cause) {
      if (version !== sessionVersion.current) return null
      setAccount(null)
      setError(errorMessage(cause))
      return null
    } finally {
      if (version === sessionVersion.current) setChecking(false)
    }
  }
  async function logout() {
    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" })
    if (signOutError) throw signOutError
    sessionVersion.current++
    setAccount(null)
    setError("")
    setChecking(false)
  }
  useEffect(() => {
    void refresh()
    const clearAccount = () => {
      sessionVersion.current++
      setAccount(null)
      setError("")
      setChecking(false)
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") clearAccount()
    })
    window.addEventListener(SESSION_REJECTED_EVENT, clearAccount)
    return () => {
      subscription.unsubscribe()
      window.removeEventListener(SESSION_REJECTED_EVENT, clearAccount)
    }
  }, [])
  return (
    <AuthContext.Provider value={{ account, checking, error, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    box: (
      <>
        <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" />
        <path d="m3 7.5 9 4.5 9-4.5M12 12v9" />
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
    check: <path d="m5 12 4 4L19 6" />,
    pin: (
      <>
        <path d="M12 21s6-5.6 6-11a6 6 0 1 0-12 0c0 5.4 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="11" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
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
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function Loading({ label }: { label: string }) {
  return (
    <main className="screen state-screen" role="status">
      <span className="loading-ring" />
      <p>{label}</p>
    </main>
  )
}
function EmptyState({
  title,
  detail,
  action,
}: {
  title: string
  detail: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name="box" />
      </div>
      <strong>{title}</strong>
      <p>{detail}</p>
      {action}
    </div>
  )
}

function Auth() {
  const { account, checking, refresh } = useAccount()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const destinationRef = useRef<string | null>(null)
  if (!destinationRef.current) {
    const requested = new URLSearchParams(location.search).get("next")
    destinationRef.current = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/inicio"
  }
  const destination = destinationRef.current
  if (checking) return <Loading label="Comprobando acceso…" />
  if (account) return <Navigate to={destination} replace />
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const displayName = name.replace(/\s+/g, " ").trim()
    if (!displayName || displayName.length > 40) {
      setError("Escribe un nombre de hasta 40 caracteres.")
      return
    }
    setPending(true)
    try {
      const { error: signInError } = await supabase.auth.signInAnonymously({
        options: { data: { full_name: displayName } },
      })
      if (signInError) {
        setError("No se pudo entrar. Intenta de nuevo en unos momentos.")
        return
      }
      const current = await refresh()
      if (!current)
        throw new Error(
          "No se pudo preparar tu espacio. Intenta de nuevo.",
        )
      navigate(destination, { replace: true })
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setPending(false)
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
      <section className="auth-card">
        <div className="eyebrow">PRESENTACIÓN INTERACTIVA</div>
        <h1>¿Cómo te llamas?</h1>
        <p>Escribe tu nombre o apodo para participar desde este celular.</p>
        <form className="form-stack" onSubmit={submit}>
          <label>
            Tu nombre
            <input
              type="text"
              id="entry-name"
              autoComplete="nickname"
              maxLength={40}
              required
              aria-invalid={!!error}
              aria-describedby={error ? "entry-error" : undefined}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Ana"
            />
          </label>
          {error && (
            <p className="form-error" id="entry-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button" disabled={pending} type="submit">
            {pending ? "Preparando…" : "Entrar"}
            <Icon name="arrow" />
          </button>
        </form>
        <p className="auth-help">
          Este navegador conservará una identidad distinta. Tu nombre o apodo podrá aparecer en el proyector.
        </p>
      </section>
    </main>
  )
}

function Protected() {
  const { account, checking, error, refresh, logout } = useAccount()
  const location = useLocation()
  if (checking) return <Loading label="Preparando tu espacio…" />
  if (error)
    return (
      <main className="screen state-screen">
        <h1>No se pudo preparar tu espacio</h1>
        <p className="form-error" role="alert">
          {error}
        </p>
        <button className="secondary-button" onClick={() => void refresh()}>
          Reintentar
        </button>
        <button className="text-button" onClick={() => void logout()}>
          Volver a entrar
        </button>
      </main>
    )
  if (!account) return <Navigate to={`/?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return <Shell />
}

function Shell() {
  const { account } = useAccount()
  const initials = (account?.name || account?.email || "ME")
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
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
        <Link to="/perfil" className="avatar" aria-label="Abrir perfil">
          {initials}
        </Link>
      </header>
      <Outlet />
      <nav className="bottom-nav" aria-label="Navegación principal">
        <NavLink to="/inicio">
          <Icon name="box" />
          <span>Inicio</span>
        </NavLink>
        <NavLink to="/consulta">
          <Icon name="search" />
          <span>Consultar</span>
        </NavLink>
        <NavLink to="/historial">
          <Icon name="clock" />
          <span>Paquetes</span>
        </NavLink>
        <NavLink to="/registrar">
          <Icon name="plus" />
          <span>Registrar</span>
        </NavLink>
        <NavLink to="/perfil">
          <Icon name="user" />
          <span>Perfil</span>
        </NavLink>
      </nav>
    </div>
  )
}

function PackageCard({ item }: { item: Shipment }) {
  return (
    <Link
      to={`/envio/${encodeURIComponent(item.guide)}`}
      className="package-card"
    >
      <div className={`package-icon ${item.tone}`}>
        <Icon name="box" />
      </div>
      <div className="package-copy">
        <small>{item.guide}</small>
        <strong>{item.city}</strong>
        <span className={`status ${item.tone}`}>{item.state}</span>
      </div>
      <Icon name="chevron" className="chevron" />
    </Link>
  )
}
function useShipments() {
  const [items, setItems] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  async function reload() {
    setLoading(true)
    setError("")
    try {
      setItems((await apiFetch("/shipments")) as Shipment[])
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void reload()
  }, [])
  return { items, loading, error, reload }
}

function Home() {
  const { account } = useAccount()
  const navigate = useNavigate()
  const [guide, setGuide] = useState("")
  const { items, loading, error, reload } = useShipments()
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate(`/consulta?guia=${encodeURIComponent(guide.trim().toUpperCase())}`)
  }
  return (
    <main className="screen home-screen">
      <div className="greeting">
        <div>
          <div className="eyebrow">OPERACIONES · HOY</div>
          <h1>Hola, {account?.name.split(" ")[0] || "equipo"}.</h1>
        </div>
        <span className="online-dot">En línea</span>
      </div>
      <form className="tracking-search" onSubmit={search}>
        <Icon name="search" />
        <input
          aria-label="Número de guía"
          required
          value={guide}
          onChange={(event) => setGuide(event.target.value)}
          placeholder="Ingresa tu número de guía"
        />
        <button type="submit" aria-label="Buscar guía">
          <Icon name="arrow" />
        </button>
      </form>
      <section className="section">
        <div className="section-title">
          <div>
            <div className="eyebrow">ACTIVIDAD</div>
            <h2>Paquetes recientes</h2>
          </div>
          <Link to="/historial">Ver todo</Link>
        </div>
        {loading ? (
          <p className="muted-text" role="status">
            Cargando paquetes…
          </p>
        ) : error ? (
          <div className="inline-error">
            <p className="form-error" role="alert">
              {error}
            </p>
            <button onClick={() => void reload()}>Reintentar</button>
          </div>
        ) : items.length ? (
          <div className="package-list">
            {items.slice(0, 5).map((item) => (
              <PackageCard key={item.guide} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin paquetes todavía"
            detail="Cuando se registre un paquete aparecerá aquí."
            action={<Link to="/registrar" className="secondary-button">Registrar paquete</Link>}
          />
        )}
      </section>
      <section className="section">
        <div className="section-title">
          <div>
            <div className="eyebrow">PARA LA PRESENTACIÓN</div>
            <h2>Envíos entre países</h2>
          </div>
        </div>
        <p className="muted-text">Inicia una presentación o únete desde tu celular con el enlace compartido.</p>
        <Link to="/presentacion/control" className="secondary-button">Iniciar presentación</Link>
      </section>
    </main>
  )
}

function Lookup() {
  const navigate = useNavigate()
  const initial = new URLSearchParams(window.location.search).get("guia") ?? ""
  const [guide, setGuide] = useState(initial)
  const [requestedGuide, setRequestedGuide] = useState(initial)
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notFound, setNotFound] = useState(false)
  async function lookup(value: string) {
    const normalized = value.trim().toUpperCase()
    setRequestedGuide(normalized)
    setShipment(null)
    setError("")
    setNotFound(false)
    if (!guidePattern.test(normalized)) {
      setError("La guía debe tener el formato ME-AAAA-########.")
      return
    }
    setLoading(true)
    try {
      setShipment(
        (await apiFetch(
          `/shipments/${encodeURIComponent(normalized)}`,
        )) as Shipment,
      )
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 404) setNotFound(true)
      else setError(errorMessage(cause))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (initial) void lookup(initial)
  }, [])
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = guide.trim().toUpperCase()
    navigate(`/consulta?guia=${encodeURIComponent(normalized)}`, {
      replace: true,
    })
    void lookup(normalized)
  }
  return (
    <main className="screen">
      <div className="eyebrow">RASTREO SEGURO</div>
      <h1>Consultar paquete</h1>
      <p className="muted-text">
        Busca con la guía confirmada al registrar el paquete.
      </p>
      <form className="lookup-form" onSubmit={submit}>
        <label htmlFor="lookup-guide">Número de guía</label>
        <div>
          <input
            id="lookup-guide"
            required
            value={guide}
            onChange={(event) => setGuide(event.target.value)}
            placeholder="ME-2026-00000001"
            autoCapitalize="characters"
          />
          <button className="primary-button" type="submit" disabled={loading}>
            <Icon name="search" />
            <span>Buscar</span>
          </button>
        </div>
      </form>
      <section className="section lookup-result" aria-live="polite">
        <div className="section-title">
          <div>
            <div className="eyebrow">RESULTADO</div>
            <h2>Estado de la consulta</h2>
          </div>
        </div>
        {loading ? (
          <div className="result-panel" role="status">
            <span className="loading-ring" /> Consultando guía…
          </div>
        ) : notFound ? (
          <EmptyState
            title="Guía no encontrada"
            detail="No existe un paquete con esa guía. Comprueba el número e intenta de nuevo."
          />
        ) : error ? (
          <div className="result-panel result-error">
            <strong>No se pudo mostrar el paquete</strong>
            <p className="form-error" role="alert">
              {error}
            </p>
            {guidePattern.test(requestedGuide) && (
              <button
                className="secondary-button"
                onClick={() => void lookup(requestedGuide)}
              >
                Reintentar
              </button>
            )}
          </div>
        ) : shipment ? (
          <div className="result-panel">
            <span className="status violet">{shipment.state}</span>
            <h3>{shipment.guide}</h3>
            <p>Destino: {shipment.city}</p>
            <p>Destinatario: {shipment.recipient}</p>
            <Link
              className="primary-button"
              to={`/envio/${encodeURIComponent(shipment.guide)}`}
            >
              Ver detalle <Icon name="arrow" />
            </Link>
          </div>
        ) : (
          <EmptyState
            title="Esperando una guía"
            detail="Escribe una guía para consultar los datos permitidos de tu paquete."
          />
        )}
      </section>
    </main>
  )
}

function ShipmentDetail() {
  const navigate = useNavigate()
  const { guide = "" } = useParams()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  async function reload() {
    setLoading(true)
    setError("")
    try {
      setShipment(
        (await apiFetch(`/shipments/${encodeURIComponent(guide)}`)) as Shipment,
      )
    } catch (cause) {
      setShipment(null)
      setError(errorMessage(cause))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void reload()
  }, [guide])
  return (
    <main className="screen">
      <div className="back-row">
        <button
          onClick={() => navigate(-1)}
          className="round-button"
          aria-label="Volver"
        >
          ←
        </button>
        <div>
          <div className="eyebrow">DETALLE DE PAQUETE</div>
          <h2>{guide}</h2>
        </div>
      </div>
      {loading ? (
        <div className="result-panel" role="status">
          Consultando paquete…
        </div>
      ) : error ? (
        <div className="result-panel result-error">
          <p className="form-error" role="alert">
            {error}
          </p>
          <button className="secondary-button" onClick={() => void reload()}>
            Reintentar
          </button>
          <Link to="/consulta">Nueva consulta</Link>
        </div>
      ) : (
        shipment && (
          <>
            <section className="destination-card">
              <div className="pin-wrap">
                <Icon name="pin" />
              </div>
              <div>
                <small>DESTINO</small>
                <strong>{shipment.address}</strong>
                <span>{shipment.city}</span>
              </div>
            </section>
            <section className="detail-card">
              <div>
                <small>DESTINATARIO</small>
                <strong>{shipment.recipient}</strong>
              </div>
              <div>
                <small>DESCRIPCIÓN</small>
                <strong>{shipment.description}</strong>
              </div>
            </section>
            <section className="section timeline-section">
              <div className="section-title">
                <div>
                  <div className="eyebrow">SEGUIMIENTO</div>
                  <h2>Estado del paquete</h2>
                </div>
                <span className={`status ${shipment.tone}`}>
                  {shipment.state}
                </span>
              </div>
              <div className="timeline">
                {shipment.events.map((event, index) => (
                  <div
                    className="timeline-item active"
                    key={`${event.title}-${index}`}
                  >
                    <div className="track">
                      <span>
                        <Icon name="check" />
                      </span>
                    </div>
                    <div>
                      <strong>{event.title}</strong>
                      <p>{event.desc}</p>
                      <small>{event.time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )
      )}
    </main>
  )
}

function History() {
  const { items, loading, error, reload } = useShipments()
  const [filter, setFilter] = useState("Todos")
  const statuses = [
    "Todos",
    ...Array.from(new Set(items.map((item) => item.state))),
  ]
  const visible =
    filter === "Todos" ? items : items.filter((item) => item.state === filter)
  return (
    <main className="screen">
      <div className="eyebrow">CONSULTA OPERATIVA</div>
      <h1>Paquetes</h1>
      <div className="filter-chips" aria-label="Filtrar por estado">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={filter === status ? "active" : ""}
          >
            {status}
          </button>
        ))}
      </div>
      <div className="history-count">{visible.length} paquetes encontrados</div>
      {loading ? (
        <p className="muted-text" role="status">
          Cargando paquetes…
        </p>
      ) : error ? (
        <div className="inline-error">
          <p className="form-error" role="alert">
            {error}
          </p>
          <button onClick={() => void reload()}>Reintentar</button>
        </div>
      ) : visible.length ? (
        <div className="package-list">
          {visible.map((item) => (
            <PackageCard key={item.guide} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hay paquetes"
          detail="No se encontraron paquetes para este filtro."
        />
      )}
    </main>
  )
}

function Register() {
  const { account } = useAccount()
  const [owners, setOwners] = useState<Owner[]>([])
  const [ownersError, setOwnersError] = useState("")
  const [ownersLoading, setOwnersLoading] = useState(true)
  const [form, setForm] = useState({
    ownerId: account?.id ?? "",
    recipient: "",
    address: "",
    city: "",
    description: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [created, setCreated] = useState<Shipment | null>(null)
  const [copyState, setCopyState] = useState("")
  useEffect(() => {
    if (!account) return
    if (account.role !== "ADMIN") {
      setForm((current) => ({ ...current, ownerId: account.id }))
      setOwnersLoading(false)
      return
    }
    apiFetch("/users")
      .then((users: Owner[]) => {
        setOwners(users)
        setForm((current) => ({ ...current, ownerId: users[0]?.id ?? "" }))
      })
      .catch((cause) => setOwnersError(errorMessage(cause)))
      .finally(() => setOwnersLoading(false))
  }, [account?.id, account?.role])
  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const ownerId = account?.role === "ADMIN" ? form.ownerId : account?.id ?? ""
    if (!ownerId || [form.recipient, form.address, form.city, form.description].some((value) => !value.trim())) {
      setError("Completa todos los campos antes de registrar el paquete.")
      return
    }
    setSaving(true)
    try {
      const shipment = (await apiFetch("/shipments", {
        method: "POST",
        body: JSON.stringify({
          ownerId,
          recipient: form.recipient.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          description: form.description.trim(),
        }),
      })) as Shipment
      setCreated(shipment)
      setCopyState("")
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setSaving(false)
    }
  }
  async function copyGuide() {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.guide)
      setCopyState("Guía copiada al portapapeles.")
    } catch {
      setCopyState(
        "No se pudo copiar automáticamente. Selecciona la guía en el campo para copiarla.",
      )
      const field = document.getElementById(
        "confirmed-guide",
      ) as HTMLInputElement | null
      field?.focus()
      field?.select()
    }
  }
  if (created)
    return (
      <main className="screen">
        <div className="eyebrow">REGISTRO COMPLETADO</div>
        <h1>Paquete registrado</h1>
        <p className="muted-text">
          Esta guía fue confirmada y guardada por el servidor.
        </p>
        <section className="confirmation-card">
          <div className="success-icon">
            <Icon name="check" />
          </div>
          <span>GUÍA ÚNICA</span>
          <input
            id="confirmed-guide"
            className="confirmed-guide"
            value={created.guide}
            readOnly
            onFocus={(event) => event.target.select()}
            aria-label="Guía confirmada"
          />
          <button className="secondary-button" onClick={() => void copyGuide()}>
            <Icon name="copy" /> Copiar guía
          </button>
          {copyState && (
            <p className="copy-feedback" role="status">
              {copyState}
            </p>
          )}
        </section>
        <Link
          className="primary-button"
          to={`/envio/${encodeURIComponent(created.guide)}`}
        >
          Consultar paquete <Icon name="arrow" />
        </Link>
        <button
          className="text-button"
          onClick={() => {
            setCreated(null)
            setForm({
              ownerId: account?.role === "ADMIN" ? owners[0]?.id ?? "" : account?.id ?? "",
              recipient: "",
              address: "",
              city: "",
              description: "",
            })
          }}
        >
          Registrar otro paquete
        </button>
      </main>
    )
  return (
    <main className="screen">
      <div className="eyebrow">NUEVO PAQUETE</div>
      <h1>Registrar paquete</h1>
      <p className="muted-text">La guía se genera al guardar el paquete.</p>
      <form className="register-form" onSubmit={submit}>
        {account?.role === "ADMIN" ? (
          <label>
            Propietario
            <select
              value={form.ownerId}
              onChange={(event) => update("ownerId", event.target.value)}
              required
              disabled={ownersLoading || !!ownersError}
            >
              <option value="">
                {ownersLoading ? "Cargando usuarios…" : "Selecciona un usuario"}
              </option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} · {owner.email || "sin correo"}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="muted-text">Este paquete quedará a nombre de {account?.name} en este celular.</p>
        )}
        {ownersError && (
          <p className="form-error" role="alert">
            {ownersError}
          </p>
        )}
        <label>
          Destinatario
          <input
            required
            maxLength={160}
            value={form.recipient}
            onChange={(event) => update("recipient", event.target.value)}
            placeholder="Nombre de quien recibe"
          />
        </label>
        <label>
          Dirección
          <input
            required
            maxLength={240}
            value={form.address}
            onChange={(event) => update("address", event.target.value)}
            placeholder="Calle, número y colonia"
          />
        </label>
        <label>
          Ciudad
          <input
            required
            maxLength={120}
            value={form.city}
            onChange={(event) => update("city", event.target.value)}
            placeholder="Ciudad de destino"
          />
        </label>
        <label>
          Descripción
          <textarea
            required
            maxLength={2000}
            rows={3}
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="Contenido del paquete"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="primary-button"
          type="submit"
          disabled={saving || ownersLoading || !!ownersError || (account?.role === "ADMIN" && !owners.length)}
        >
          {saving ? "Guardando…" : "Guardar y generar guía"}
          <Icon name="arrow" />
        </button>
      </form>
    </main>
  )
}

function Profile() {
  const { account, logout } = useAccount()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  async function signOut() {
    try {
      await logout()
      navigate("/", { replace: true })
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }
  return (
    <main className="screen">
      <div className="eyebrow">CUENTA</div>
      <h1>Perfil</h1>
      <div className="profile-card">
        <div className="profile-avatar">
          {account?.name[0]?.toUpperCase() || "M"}
        </div>
        <strong>{account?.name}</strong>
        {account?.email && <span>{account.email}</span>}
        {account?.id && <span>Código de este navegador: {participantCode(account.id)}</span>}
        <span className="role-badge">
          {account?.role === "ADMIN" ? "Organizador" : "Participante"}
        </span>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        onClick={() => void signOut()}
        className="secondary-button"
        style={{ marginTop: 20 }}
      >
        Cambiar participante
      </button>
      <p className="muted-text">Al cambiar de participante aquí se perderá el acceso a los paquetes anteriores de este navegador.</p>
    </main>
  )
}

function PresentationControlRoute() {
  return <PresentationControl />
}

function PresentationParticipantRoute() {
  const { account } = useAccount()
  return account ? <PresentationParticipant participant={account} /> : null
}

const router = createBrowserRouter([
  { path: "/", Component: Auth },
  { path: "/presentacion/pantalla/:runId", Component: PresentationScreen },
  {
    Component: Protected,
    children: [
      { path: "/inicio", Component: Home },
      { path: "/consulta", Component: Lookup },
      { path: "/envio/:guide", Component: ShipmentDetail },
      { path: "/historial", Component: History },
      { path: "/registrar", Component: Register },
      { path: "/perfil", Component: Profile },
      { path: "/presentacion/control", Component: PresentationControlRoute },
      { path: "/presentacion/control/:runId", Component: PresentationControlRoute },
      { path: "/presentacion/participar/:runId", Component: PresentationParticipantRoute },
    ],
  },
  { path: "*", element: <Navigate to="/inicio" replace /> },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
