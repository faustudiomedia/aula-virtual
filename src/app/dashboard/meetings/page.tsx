import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createMeeting, startMeeting, endMeeting, deleteMeeting } from '@/app/actions/meetings'

export default async function MeetingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, institute_id, full_name').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const isTeacher = ['profesor','admin','super_admin'].includes(profile.role)

  const { data: meetings } = await supabase
    .from('meetings')
    .select('id, display_name, active, scheduled_at, created_at, host_id, external_url, profiles(full_name)')
    .order('scheduled_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  const now = new Date()
  const scheduled = (meetings ?? []).filter(m => !m.active && m.scheduled_at && new Date(m.scheduled_at) > now)
  const active    = (meetings ?? []).filter(m => m.active)
  const past      = (meetings ?? []).filter(m => !m.active && (!m.scheduled_at || new Date(m.scheduled_at) <= now))

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ag-text)]">Reuniones</h1>
          <p className="text-[var(--ag-text-muted)] mt-0.5 text-sm">
            {active.length > 0
              ? `${active.length} reunión en curso ahora`
              : scheduled.length > 0
                ? `${scheduled.length} reunión${scheduled.length > 1 ? 'es' : ''} programada${scheduled.length > 1 ? 's' : ''}`
                : 'Sin reuniones activas'}
          </p>
        </div>
        {/* Stats pills */}
        <div className="hidden sm:flex items-center gap-2">
          {active.length > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500 text-white text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              EN VIVO
            </span>
          )}
          <span className="px-3 py-1.5 rounded-full bg-black/5 text-[var(--ag-text-muted)] text-xs font-medium">
            {(meetings ?? []).length} total
          </span>
        </div>
      </div>

      {/* ── Active meetings ─────────────────────────────── */}
      {active.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-green-600">En curso ahora</h2>
          </div>
          <div className="space-y-3">
            {active.map(m => {
              const host = m.profiles as unknown as { full_name: string } | null
              return <ActiveMeetingCard key={m.id} m={m} host={host} userId={user.id} isTeacher={isTeacher} />
            })}
          </div>
        </div>
      )}

      {/* ── Scheduled meetings ─────────────────────────── */}
      {scheduled.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--ag-text-muted)]">Programadas</h2>
          </div>
          <div className="space-y-3">
            {scheduled.map(m => {
              const host = m.profiles as unknown as { full_name: string } | null
              return <ScheduledMeetingCard key={m.id} m={m} host={host} userId={user.id} isTeacher={isTeacher} />
            })}
          </div>
        </div>
      )}

      {/* ── No meetings at all ─────────────────────────── */}
      {active.length === 0 && scheduled.length === 0 && (
        <div className="mb-8 rounded-2xl border-2 border-dashed border-[var(--ag-border-light)] p-12 text-center">
          <p className="text-4xl mb-3">🎥</p>
          <p className="font-semibold text-[var(--ag-text)] mb-1">No hay reuniones activas</p>
          <p className="text-sm text-[var(--ag-text-muted)]">
            {isTeacher ? 'Creá una reunión para empezar.' : 'Cuando un profesor inicie una reunión aparecerá aquí.'}
          </p>
        </div>
      )}

      {/* ── Create form — teachers only ─────────────────── */}
      {isTeacher && (
        <div className="mb-8 bg-[var(--ag-navy)]/5 to-[var(--ag-navy)]/5 rounded-2xl border border-[var(--ag-navy)]/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[var(--ag-navy)]/10 flex items-center justify-center text-base">📅</div>
            <h2 className="text-sm font-bold text-[var(--ag-text)]">Nueva reunión</h2>
          </div>
          <form action={createMeeting} className="space-y-3">
            <input
              name="display_name"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 placeholder:text-[var(--ag-text)]/30"
              placeholder="Nombre: ej. Clase de Historia, Repaso Final…"
            />
            <input
              name="external_url"
              type="url"
              className="w-full px-3 py-2.5 rounded-xl border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 placeholder:text-[var(--ag-text)]/30"
              placeholder="Link externo: Zoom, Meet, Teams… (opcional)"
            />
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[var(--ag-text-muted)] mb-1">Programar para (opcional)</label>
                <input
                  type="datetime-local"
                  name="scheduled_at"
                  className="w-full px-3 py-2.5 rounded-xl border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-bold hover:bg-[#1648c4] transition-all shadow-lg  whitespace-nowrap"
              >
                Crear sala →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Past meetings ─────────────────────────────── */}
      {past.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[var(--ag-text)]/20" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--ag-text)]/30">Historial</h2>
          </div>
          <div className="space-y-2">
            {past.map(m => {
              const host = m.profiles as unknown as { full_name: string } | null
              return <PastMeetingRow key={m.id} m={m} host={host} userId={user.id} isTeacher={isTeacher} />
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Active meeting card ──────────────────────────────────────── */
function ActiveMeetingCard({ m, host, userId, isTeacher }: {
  m: { id: string; display_name: string; created_at: string; host_id: string; external_url?: string | null }
  host: { full_name: string } | null
  userId: string
  isTeacher: boolean
}) {
  const isHost = m.host_id === userId
  const since = new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-5 shadow-lg shadow-green-500/20">
      {/* Animated glow ring */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-green-400/40 animate-pulse pointer-events-none" />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">
            🎥
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                ● EN VIVO
              </span>
              <span className="text-xs text-white/60">desde {since}</span>
            </div>
            <p className="text-base font-bold text-white truncate">{m.display_name}</p>
            <p className="text-xs text-white/60">Anfitrión: {host?.full_name ?? 'Desconocido'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isHost && isTeacher && (
            <form action={endMeeting.bind(null, m.id)}>
              <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-red-500/80 hover:text-white border border-white/20 transition-all font-medium">
                Finalizar
              </button>
            </form>
          )}
          {m.external_url ? (
            <a
              href={m.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 rounded-xl bg-white text-green-700 text-sm font-bold hover:bg-green-50 transition-all shadow-md"
            >
              Unirse →
            </a>
          ) : (
            <Link
              href={`/dashboard/meetings/${m.id}`}
              className="px-5 py-2 rounded-xl bg-white text-green-700 text-sm font-bold hover:bg-green-50 transition-all shadow-md"
            >
              Unirse →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Scheduled meeting card ───────────────────────────────────── */
function ScheduledMeetingCard({ m, host, userId, isTeacher }: {
  m: { id: string; display_name: string; scheduled_at: string | null; host_id: string; external_url?: string | null }
  host: { full_name: string } | null
  userId: string
  isTeacher: boolean
}) {
  const isHost = m.host_id === userId
  const date = m.scheduled_at ? new Date(m.scheduled_at) : null

  const dayStr = date?.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) ?? ''
  const timeStr = date?.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) ?? ''
  const dayNum = date?.getDate()
  const monthStr = date?.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase()

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all overflow-hidden">
      <div className="flex items-stretch">
        {/* Date badge */}
        <div className="flex flex-col items-center justify-center bg-amber-50 border-r border-amber-100 px-4 py-4 min-w-[64px]">
          <span className="text-xs font-bold text-amber-600 leading-none">{monthStr}</span>
          <span className="text-3xl font-black text-amber-500 leading-tight">{dayNum}</span>
          <span className="text-xs text-amber-400 font-medium leading-none">{timeStr}</span>
        </div>

        {/* Content */}
        <div className="flex items-center gap-3 flex-1 min-w-0 px-4 py-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl flex-shrink-0">🗓️</div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[var(--ag-text)] truncate">{m.display_name}</p>
            <p className="text-xs text-[var(--ag-text-muted)] capitalize truncate">
              {dayStr} · {host?.full_name ?? 'Desconocido'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-4 flex-shrink-0">
          {isHost && isTeacher && (
            <form action={startMeeting.bind(null, m.id)}>
              <button type="submit" className="text-xs px-3 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all font-bold whitespace-nowrap">
                Iniciar ▶
              </button>
            </form>
          )}
          {m.external_url ? (
            <a
              href={m.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[var(--ag-navy)] text-white text-xs font-bold hover:bg-[#1648c4] transition-all whitespace-nowrap"
            >
              Abrir →
            </a>
          ) : (
            <Link
              href={`/dashboard/meetings/${m.id}`}
              className="px-4 py-2 rounded-xl bg-[rgba(30,58,95,0.08)] text-[var(--ag-navy)] text-xs font-bold hover:bg-[#DBEAFE] transition-all border border-[#BFDBFE] whitespace-nowrap"
            >
              Ver sala
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Past meeting row ─────────────────────────────────────────── */
function PastMeetingRow({ m, host, userId, isTeacher }: {
  m: { id: string; display_name: string; created_at: string; host_id: string }
  host: { full_name: string } | null
  userId: string
  isTeacher: boolean
}) {
  const isHost = m.host_id === userId
  const dateStr = new Date(m.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-black/5 bg-white/50 hover:bg-white transition-all group opacity-60 hover:opacity-90">
      <div className="w-7 h-7 rounded-lg bg-black/5 flex items-center justify-center text-sm flex-shrink-0">🎬</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--ag-text)] truncate">{m.display_name}</p>
        <p className="text-xs text-[var(--ag-text-muted)]">{host?.full_name ?? 'Desconocido'} · {dateStr}</p>
      </div>
      {(isHost || isTeacher) && (
        <form action={deleteMeeting.bind(null, m.id)}>
          <button type="submit" className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg border border-black/10 text-[var(--ag-text)]/30 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
            ✕
          </button>
        </form>
      )}
    </div>
  )
}
