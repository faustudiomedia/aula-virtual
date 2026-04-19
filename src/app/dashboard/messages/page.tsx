import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Message } from '@/lib/types'
import MessageList from '@/components/ui/MessageList'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, institute_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Mensajes recibidos
  const { data: received } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(full_name, email, role, avatar_url)')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Mensajes enviados
  const { data: sent } = await supabase
    .from('messages')
    .select('*, recipient:profiles!messages_recipient_id_fkey(full_name, email, role, avatar_url)')
    .eq('sender_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Contactos posibles (mismos instituto o todos si admin)
  let contactsQuery = supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url')
    .neq('id', user.id)
    .order('full_name')

  if (profile.role !== 'admin') {
    contactsQuery = contactsQuery.eq('institute_id', profile.institute_id)
  }

  const { data: contacts } = await contactsQuery

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#050F1F]">📨 Mensajería</h1>
        <p className="text-[#050F1F]/50 mt-1">Comunicación directa con profesores y alumnos.</p>
      </div>

      <MessageList
        received={(received ?? []) as Message[]}
        sent={(sent ?? []) as Message[]}
        contacts={(contacts ?? []) as { id: string; full_name: string; email: string; role: string; avatar_url: string | null }[]}
      />
    </div>
  )
}
