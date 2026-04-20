import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { markMessagesAsRead } from '@/app/actions/messages'
import { MessageInput } from './MessageInput'
import { ScrollToBottom } from './ScrollToBottom'
import { RealtimeMessages } from './RealtimeMessages'

interface Props { params: Promise<{ id: string }> }

export default async function ConversationPage({ params }: Props) {
  const { id: otherUserId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: otherProfile } = await supabase
    .from('profiles').select('id, full_name, role').eq('id', otherUserId).single()
  if (!otherProfile) redirect('/dashboard/messages')

  // Mark incoming messages as read
  await markMessagesAsRead(otherUserId)

  // Load conversation
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
      <div className="flex items-center gap-4 p-5 bg-white border-b border-black/5">
        <Link href="/dashboard/messages" className="text-[#050F1F]/40 hover:text-[#050F1F] transition-colors">
          ←
        </Link>
        <div className="w-9 h-9 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#1A56DB] font-semibold text-sm">
          {otherProfile.full_name?.charAt(0) ?? '?'}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#050F1F]">{otherProfile.full_name}</p>
          <p className="text-xs text-[#050F1F]/40">{otherProfile.role === 'profesor' ? 'Profesor' : 'Alumno'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#F8FAFC]">
        {(!messages || messages.length === 0) && (
          <p className="text-center text-sm text-[#050F1F]/40 py-8">
            No hay mensajes todavía. ¡Iniciá la conversación!
          </p>
        )}
        {(messages ?? []).map(m => {
          const isMine = m.sender_id === user.id
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  isMine
                    ? 'bg-[#1A56DB] text-white rounded-br-sm'
                    : 'bg-white text-[#050F1F] border border-black/5 rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-[#050F1F]/30'}`}>
                  {new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  {isMine && m.read_at && ' · Leído'}
                </p>
              </div>
            </div>
          )
        })}
        {/* Anchor to scroll to bottom */}
        <div id="messages-end" />
        <ScrollToBottom />
      </div>

      <MessageInput recipientId={otherUserId} />
      <RealtimeMessages currentUserId={user.id} otherUserId={otherUserId} />
    </div>
  )
}
