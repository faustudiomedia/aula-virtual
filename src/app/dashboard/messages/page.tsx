import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function MessagesInboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // All messages involving this user
  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, recipient_id, content, read_at, created_at')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  // Build conversations grouped by the other participant
  const conversationMap = new Map<string, {
    userId: string
    lastMessage: string
    lastAt: string
    unread: number
  }>()

  for (const m of messages ?? []) {
    const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id
    if (!conversationMap.has(otherId)) {
      conversationMap.set(otherId, {
        userId: otherId,
        lastMessage: m.content,
        lastAt: m.created_at,
        unread: (!m.read_at && m.recipient_id === user.id) ? 1 : 0,
      })
    } else {
      const existing = conversationMap.get(otherId)!
      if (!m.read_at && m.recipient_id === user.id) existing.unread++
    }
  }

  const conversations = [...conversationMap.values()]

  // Fetch names for all other participants
  const otherIds = conversations.map(c => c.userId)
  const { data: otherProfiles } = otherIds.length
    ? await supabase.from('profiles').select('id, full_name, role').in('id', otherIds)
    : { data: [] }

  const profileMap = new Map((otherProfiles ?? []).map(p => [p.id, p]))

  // For teachers: load students from their courses; for students: load their teachers
  let contactSuggestions: { id: string; full_name: string; role: string }[] = []

  if (profile.role === 'profesor') {
    const { data: courses } = await supabase
      .from('courses').select('id').eq('teacher_id', user.id)
    const courseIds = (courses ?? []).map((c: { id: string }) => c.id)
    if (courseIds.length) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id, profiles(id, full_name, role)')
        .in('course_id', courseIds)
      const seen = new Set<string>()
      for (const e of enrollments ?? []) {
        const p = e.profiles as unknown as { id: string; full_name: string; role: string } | null
        if (p && !seen.has(p.id)) {
          seen.add(p.id)
          contactSuggestions.push(p)
        }
      }
    }
  } else if (profile.role === 'alumno') {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id, courses(teacher_id, profiles(id, full_name, role))')
      .eq('student_id', user.id)
    const seen = new Set<string>()
    for (const e of enrollments ?? []) {
      const c = e.courses as unknown as { teacher_id: string; profiles: { id: string; full_name: string; role: string } | null } | null
      if (c?.profiles && !seen.has(c.profiles.id)) {
        seen.add(c.profiles.id)
        contactSuggestions.push(c.profiles)
      }
    }
  }

  const newContacts = contactSuggestions.filter(c => !conversationMap.has(c.id))

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-1">Mensajes</h1>
      <p className="text-[#050F1F]/50 mb-6">Conversaciones directas.</p>

      {conversations.length === 0 && newContacts.length === 0 && (
        <div className="text-center py-16 text-[#050F1F]/40">
          <p className="text-4xl mb-3">✉️</p>
          <p className="text-sm">No tenés conversaciones todavía.</p>
        </div>
      )}

      {/* Active conversations */}
      {conversations.length > 0 && (
        <div className="space-y-2 mb-8">
          {conversations.map(conv => {
            const other = profileMap.get(conv.userId)
            if (!other) return null
            return (
              <Link
                key={conv.userId}
                href={`/dashboard/messages/${conv.userId}`}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-black/5 shadow-sm hover:border-[#1A56DB]/20 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#1A56DB] font-semibold text-sm flex-shrink-0">
                  {other.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#050F1F]">{other.full_name}</p>
                  <p className="text-xs text-[#050F1F]/50 truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#1A56DB] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {conv.unread}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* New contacts */}
      {newContacts.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#050F1F]/30 mb-3">Contactos disponibles</p>
          <div className="space-y-2">
            {newContacts.map(c => (
              <Link
                key={c.id}
                href={`/dashboard/messages/${c.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-black/5 shadow-sm hover:border-[#1A56DB]/20 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center text-green-600 font-semibold text-sm flex-shrink-0">
                  {c.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#050F1F]">{c.full_name}</p>
                  <p className="text-xs text-[#050F1F]/40">{c.role === 'profesor' ? 'Profesor' : 'Alumno'}</p>
                </div>
                <span className="text-xs text-[#1A56DB]">Iniciar chat →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
