import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ConversationClient } from './ConversationClient'

interface Props { params: Promise<{ id: string }> }

export default async function ConversationPage({ params }: Props) {
  const { id: otherUserId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: otherProfile } = await supabase
    .from('profiles').select('id, full_name, role').eq('id', otherUserId).single()
  if (!otherProfile) redirect('/dashboard/messages')

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at, read_at')
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
    )
    .order('created_at')

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 p-5 bg-white border-b border-black/5 flex-shrink-0">
        <Link href="/dashboard/messages" className="text-[var(--ag-text-muted)] hover:text-[var(--ag-text)] transition-colors">
          ←
        </Link>
        <div className="w-9 h-9 rounded-full bg-[rgba(30,58,95,0.08)] flex items-center justify-center text-[var(--ag-navy)] font-semibold text-sm">
          {otherProfile.full_name?.charAt(0) ?? '?'}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--ag-text)]">{otherProfile.full_name}</p>
          <p className="text-xs text-[var(--ag-text-muted)] capitalize">{otherProfile.role === 'profesor' ? 'Profesor' : 'Alumno'}</p>
        </div>
      </div>

      <ConversationClient
        currentUserId={user.id}
        otherUserId={otherUserId}
        initialMessages={(messages ?? []) as { id: string; sender_id: string; content: string; created_at: string; read_at: string | null }[]}
      />
    </div>
  )
}
