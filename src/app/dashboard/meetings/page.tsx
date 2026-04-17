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
    .select('id, display_name, active, scheduled_at, created_at, host_id, profiles(full_name)')
    .order('scheduled_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  const now = new Date()
  const scheduled = (meetings ?? []).filter(m => !m.active && m.scheduled_at && new Date(m.scheduled_at) > now)
  const active    = (meetings ?? []).filter(m => m.active)
  const past      = (meetings ?? []).filter(m => !m.active && (!m.scheduled_at || new Date(m.scheduled_at) <= now))

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-1">Reuniones</h1>
      <p className="text-[#050F1F]/50 mb-8">Videollamadas en tiempo real.</p>

      {/* Create form — teachers only */}
      {isTeacher && (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 mb-8">
          <h2 className="text-sm font-semibold text-[#050F1F] mb-3">Nueva reunión</h2>
          <form action={createMeeting} className="space-y-3">
            <input
              name="display_name"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30"
              placeholder="Ej: Clase de Matemáticas, Repaso Final..."
            />
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#050F1F]/50 mb-1">
                  Programar para (opcional)
                </label>
                <input
                  type="datetime-local"
                  name="scheduled_at"
                  className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold hover:bg-[#1A56DB]/90 transition-all whitespace-nowrap"
              >
                Crear sala
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active */}
      <Section title="En curso" empty="No hay reuniones activas ahora.">
        {active.map(m => {
          const host = m.profiles as { full_name: string } | null
          return (
            <MeetingRow key={m.id} m={m} host={host} userId={user.id} isTeacher={isTeacher} status="active" />
          )
        })}
      </Section>

      {/* Scheduled */}
      {scheduled.length > 0 && (
        <Section title="Programadas">
          {scheduled.map(m => {
            const host = m.profiles as { full_name: string } | null
            return (
              <MeetingRow key={m.id} m={m} host={host} userId={user.id} isTeacher={isTeacher} status="scheduled" />
            )
          })}
        </Section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <Section title="Finalizadas">
          {past.map(m => {
            const host = m.profiles as { full_name: string } | null
            return (
              <MeetingRow key={m.id} m={m} host={host} userId={user.id} isTeacher={isTeacher} status="past" />
            )
          })}
        </Section>
      )}
    </div>
  )
}

function Section({ title, empty, children }: { title: string; empty?: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children
  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[#050F1F]/30 mb-3">{title}</h2>
      {!hasChildren && empty ? (
        <p className="text-center py-8 text-sm text-[#050F1F]/30">{empty}</p>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </div>
  )
}

interface MeetingRowProps {
  m: { id: string; display_name: string; active: boolean; scheduled_at: string | null; created_at: string; host_id: string }
  host: { full_name: string } | null
  userId: string
  isTeacher: boolean
  status: 'active' | 'scheduled' | 'past'
}

function MeetingRow({ m, host, userId, isTeacher, status }: MeetingRowProps) {
  const isHost = m.host_id === userId
  const opacity = status === 'past' ? 'opacity-60' : ''

  return (
    <div className={`bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex items-center gap-4 ${opacity}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
        status === 'active' ? 'bg-green-50' : status === 'scheduled' ? 'bg-amber-50' : 'bg-black/5'
      }`}>
        🎥
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-[#050F1F]">{m.display_name}</p>
        <p className="text-xs text-[#050F1F]/40">
          {host?.full_name ?? 'Desconocido'}
          {status === 'scheduled' && m.scheduled_at && (
            <> · 📅 {new Date(m.scheduled_at).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} {new Date(m.scheduled_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</>
          )}
          {status === 'active' && (
            <> · Iniciada {new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</>
          )}
          {status === 'past' && (
            <> · {new Date(m.created_at).toLocaleDateString('es-AR')}</>
          )}
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {isHost && isTeacher && status === 'scheduled' && (
          <form action={startMeeting.bind(null, m.id)}>
            <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all font-medium">
              Iniciar ahora
            </button>
          </form>
        )}
        {isHost && isTeacher && status === 'active' && (
          <form action={endMeeting.bind(null, m.id)}>
            <button type="submit" className="text-xs px-3 py-1.5 rounded-lg border border-black/10 text-[#050F1F]/50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
              Finalizar
            </button>
          </form>
        )}
        {(isHost || isTeacher) && status === 'past' && (
          <form action={deleteMeeting.bind(null, m.id)}>
            <button type="submit" className="text-xs px-2.5 py-1 rounded-lg border border-black/10 text-[#050F1F]/30 hover:bg-red-50 hover:text-red-500 transition-all">✕</button>
          </form>
        )}
        {status !== 'past' && (
          <Link
            href={`/dashboard/meetings/${m.id}`}
            className="px-4 py-1.5 rounded-lg bg-[#1A56DB] text-white text-xs font-semibold hover:bg-[#1A56DB]/90 transition-all"
          >
            {status === 'active' ? 'Unirse' : 'Ver sala'}
          </Link>
        )}
      </div>
    </div>
  )
}
