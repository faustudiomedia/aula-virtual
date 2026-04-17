import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createMeeting, endMeeting, deleteMeeting } from '@/app/actions/meetings'

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
    .select('id, display_name, active, created_at, host_id, profiles(full_name)')
    .order('created_at', { ascending: false })

  const active = (meetings ?? []).filter(m => m.active)
  const past   = (meetings ?? []).filter(m => !m.active)

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-1">Reuniones</h1>
      <p className="text-[#050F1F]/50 mb-8">Videollamadas en tiempo real.</p>

      {/* Create meeting — teachers only */}
      {isTeacher && (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 mb-8">
          <h2 className="text-sm font-semibold text-[#050F1F] mb-3">Nueva reunión</h2>
          <form action={createMeeting} className="flex gap-3">
            <input
              name="display_name"
              required
              className="flex-1 px-3 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30"
              placeholder="Ej: Clase de Matemáticas, Repaso Final..."
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold hover:bg-[#1A56DB]/90 transition-all whitespace-nowrap"
            >
              Crear sala
            </button>
          </form>
        </div>
      )}

      {/* Active meetings */}
      <h2 className="text-sm font-semibold uppercase tracking-widest text-[#050F1F]/30 mb-3">En curso</h2>
      {active.length === 0 ? (
        <div className="text-center py-10 text-[#050F1F]/30 text-sm mb-8">
          No hay reuniones activas ahora.
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {active.map(m => {
            const host = m.profiles as { full_name: string } | null
            const isHost = m.host_id === user.id
            return (
              <div key={m.id} className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl flex-shrink-0">🎥</div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-[#050F1F]">{m.display_name}</p>
                  <p className="text-xs text-[#050F1F]/40">
                    Iniciada por {host?.full_name ?? 'Desconocido'} · {new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {isHost && isTeacher && (
                    <form action={endMeeting.bind(null, m.id)}>
                      <button
                        type="submit"
                        className="text-xs px-3 py-1.5 rounded-lg border border-black/10 text-[#050F1F]/50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                      >
                        Finalizar
                      </button>
                    </form>
                  )}
                  <Link
                    href={`/dashboard/meetings/${m.id}`}
                    className="px-4 py-1.5 rounded-lg bg-[#1A56DB] text-white text-xs font-semibold hover:bg-[#1A56DB]/90 transition-all"
                  >
                    Unirse
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Past meetings */}
      {past.length > 0 && (
        <>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[#050F1F]/30 mb-3">Finalizadas</h2>
          <div className="space-y-2">
            {past.map(m => {
              const host = m.profiles as { full_name: string } | null
              const isHost = m.host_id === user.id
              return (
                <div key={m.id} className="bg-white rounded-2xl border border-black/5 p-4 flex items-center gap-4 opacity-60">
                  <div className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center text-lg flex-shrink-0">🎥</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#050F1F]">{m.display_name}</p>
                    <p className="text-xs text-[#050F1F]/40">{host?.full_name ?? 'Desconocido'} · {new Date(m.created_at).toLocaleDateString('es-AR')}</p>
                  </div>
                  {(isHost || profile.role === 'admin' || profile.role === 'super_admin') && (
                    <form action={deleteMeeting.bind(null, m.id)}>
                      <button
                        type="submit"
                        className="text-xs px-2.5 py-1 rounded-lg border border-black/10 text-[#050F1F]/30 hover:bg-red-50 hover:text-red-500 transition-all"
                      >
                        ✕
                      </button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
