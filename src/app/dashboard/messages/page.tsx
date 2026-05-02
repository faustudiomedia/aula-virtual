import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NewMessageModal } from './NewMessageModal'

interface Props {
  searchParams: Promise<{ tab?: string }>
}

const TABS = [
  { key: 'inbox',   label: 'Bandeja de entrada' },
  { key: 'unread',  label: 'No leídos' },
  { key: 'sent',    label: 'Enviados' },
  { key: 'starred', label: 'Destacados' },
] as const

type TabKey = typeof TABS[number]['key']

export default async function MessagesInboxPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const activeTab: TabKey = (TABS.some(t => t.key === tab) ? tab : 'inbox') as TabKey

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // Fetch all messages involving this user, with sender/recipient profiles joined
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      id, sender_id, recipient_id, content, read_at, created_at,
      sender:profiles!sender_id(id, full_name, role),
      recipient:profiles!recipient_id(id, full_name, role)
    `)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  type MsgProfile = { id: string; full_name: string; role: string }
  type Msg = {
    id: string; sender_id: string; recipient_id: string
    content: string; read_at: string | null; created_at: string
    sender: MsgProfile | null; recipient: MsgProfile | null
  }

  // Build per-conversation data + profile map simultaneously
  const conversationMap = new Map<string, {
    userId: string
    lastMessage: string
    lastAt: string
    unread: number
    lastSenderId: string
  }>()
  const profileMap = new Map<string, MsgProfile>()

  for (const m of (messages ?? []) as Msg[]) {
    const isFromMe = m.sender_id === user.id
    const otherId = isFromMe ? m.recipient_id : m.sender_id
    const otherProfile = isFromMe ? m.recipient : m.sender
    if (otherProfile) profileMap.set(otherId, otherProfile)

    if (!conversationMap.has(otherId)) {
      conversationMap.set(otherId, {
        userId: otherId,
        lastMessage: m.content,
        lastAt: m.created_at,
        unread: (!m.read_at && m.recipient_id === user.id) ? 1 : 0,
        lastSenderId: m.sender_id,
      })
    } else {
      const ex = conversationMap.get(otherId)!
      if (!m.read_at && m.recipient_id === user.id) ex.unread++
    }
  }

  let conversations = [...conversationMap.values()]

  // Apply tab filter
  if (activeTab === 'unread')  conversations = conversations.filter(c => c.unread > 0)
  if (activeTab === 'sent')    conversations = conversations.filter(c => c.lastSenderId === user.id)
  if (activeTab === 'starred') conversations = []

  // Suggested new contacts
  let contactSuggestions: { id: string; full_name: string; role: string }[] = []
  if (profile.role === 'profesor') {
    const { data: courses } = await supabase.from('courses').select('id').eq('teacher_id', user.id)
    const courseIds = (courses ?? []).map((c: { id: string }) => c.id)
    if (courseIds.length) {
      const { data: enrollments } = await supabase
        .from('enrollments').select('student_id, profiles(id, full_name, role)').in('course_id', courseIds)
      const seen = new Set<string>()
      for (const e of enrollments ?? []) {
        const p = e.profiles as unknown as { id: string; full_name: string; role: string } | null
        if (p && !seen.has(p.id)) { seen.add(p.id); contactSuggestions.push(p) }
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
      if (c?.profiles && !seen.has(c.profiles.id)) { seen.add(c.profiles.id); contactSuggestions.push(c.profiles) }
    }
  }
  const newContacts = contactSuggestions.filter(c => !conversationMap.has(c.id))

  const totalUnread = [...conversationMap.values()].reduce((n, c) => n + c.unread, 0)

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ag-text)]">Mensajes</h1>
          {totalUnread > 0 && (
            <p className="text-xs text-[var(--ag-text-muted)] mt-0.5">
              {totalUnread} mensaje{totalUnread !== 1 ? 's' : ''} sin leer
            </p>
          )}
        </div>
        <NewMessageModal />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-6 p-1 bg-black/[0.03] rounded-xl flex-wrap">
        {TABS.map(t => {
          const isActive = activeTab === t.key
          const badge = t.key === 'unread' && totalUnread > 0 ? totalUnread : null
          return (
            <Link
              key={t.key}
              href={t.key === 'inbox' ? '/dashboard/messages' : `/dashboard/messages?tab=${t.key}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-[var(--ag-text)] shadow-sm'
                  : 'text-[var(--ag-text-muted)] hover:text-[var(--ag-text)]'
              }`}
            >
              {t.label}
              {badge && (
                <span className="w-4 h-4 rounded-full bg-[var(--ag-navy)] text-white text-[10px] flex items-center justify-center font-bold">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Empty state */}
      {conversations.length === 0 && (activeTab !== 'inbox' || newContacts.length === 0) && (
        <div className="text-center py-16 text-[var(--ag-text-muted)]">
          <p className="text-3xl mb-3">
            {activeTab === 'unread' ? '📭' : activeTab === 'starred' ? '⭐' : '✉️'}
          </p>
          <p className="text-sm">
            {activeTab === 'unread' ? 'No tenés mensajes sin leer.'
              : activeTab === 'sent' ? 'No enviaste mensajes todavía.'
              : activeTab === 'starred' ? 'No tenés mensajes destacados.'
              : 'No tenés conversaciones todavía.'}
          </p>
        </div>
      )}

      {/* Conversations list */}
      {conversations.length > 0 && (
        <div className="space-y-2 mb-8">
          {conversations.map(conv => {
            const other = profileMap.get(conv.userId)
            if (!other) return null
            const initial = other.full_name?.charAt(0) ?? '?'
            const roleLabel = other.role === 'profesor' ? 'Profesor' : other.role === 'admin' ? 'Admin' : 'Alumno'
            const date = new Date(conv.lastAt)
            const isToday = date.toDateString() === new Date().toDateString()
            const timeStr = isToday
              ? date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
              : date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })

            return (
              <Link
                key={conv.userId}
                href={`/dashboard/messages/${conv.userId}`}
                className={`flex items-center gap-4 p-4 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all ${
                  conv.unread > 0 ? 'border-[var(--ag-navy)]/20' : 'border-black/5 hover:border-[var(--ag-navy)]/20'
                }`}
              >
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  other.role === 'profesor'
                    ? 'bg-violet-100 text-violet-600'
                    : 'bg-[rgba(30,58,95,0.08)] text-[var(--ag-navy)]'
                }`}>
                  {initial}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-sm truncate ${conv.unread > 0 ? 'font-bold text-[var(--ag-text)]' : 'font-semibold text-[var(--ag-text)]'}`}>
                      {other.full_name}
                    </p>
                    <span className="text-[10px] text-[var(--ag-text)]/30 flex-shrink-0">{timeStr}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--ag-text)]/30 flex-shrink-0 bg-black/[0.04] px-1.5 py-0.5 rounded-full">
                      {roleLabel}
                    </span>
                    <p className={`text-xs truncate ${conv.unread > 0 ? 'text-[var(--ag-text)]/80 font-medium' : 'text-[var(--ag-text-muted)]'}`}>
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>

                {/* Unread badge */}
                {conv.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[var(--ag-navy)] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {conv.unread > 9 ? '9+' : conv.unread}
                  </span>
                )}
                {conv.unread === 0 && (
                  <span className="text-[var(--ag-text)]/20 flex-shrink-0">→</span>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* Suggested contacts — only on inbox tab */}
      {activeTab === 'inbox' && newContacts.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ag-text)]/30 mb-3">
            Contactos disponibles
          </p>
          <div className="space-y-2">
            {newContacts.map(c => (
              <Link
                key={c.id}
                href={`/dashboard/messages/${c.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-black/5 shadow-sm hover:border-[var(--ag-navy)]/20 hover:shadow-md transition-all"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  c.role === 'profesor' ? 'bg-violet-100 text-violet-600' : 'bg-[#F0FDF4] text-green-600'
                }`}>
                  {c.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ag-text)]">{c.full_name}</p>
                  <p className="text-xs text-[var(--ag-text-muted)]">
                    {c.role === 'profesor' ? 'Profesor' : 'Alumno'}
                  </p>
                </div>
                <span className="text-xs text-[var(--ag-navy)] font-medium">Iniciar chat →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
