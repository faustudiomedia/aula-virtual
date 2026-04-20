'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function searchUsers(query: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: me } = await supabase
    .from('profiles').select('institute_id').eq('id', user.id).single()
  if (!me?.institute_id) return []

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('institute_id', me.institute_id)
    .neq('id', user.id)
    .ilike('full_name', `%${query}%`)
    .limit(10)

  return data ?? []
}

export async function sendMessage(recipientId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const content = formData.get('content') as string
  if (!content?.trim()) return

  await supabase.from('messages').insert({
    sender_id: user.id,
    recipient_id: recipientId,
    content: content.trim(),
  })

  revalidatePath(`/dashboard/messages/${recipientId}`)
  revalidatePath('/dashboard/messages')
}

export async function toggleStarMessage(messageId: string, starred: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('messages')
    .update({ is_starred: !starred })
    .eq('id', messageId)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)

  revalidatePath('/dashboard/messages')
}

export async function markMessagesAsRead(otherUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', otherUserId)
    .eq('recipient_id', user.id)
    .is('read_at', null)
  // No revalidatePath here — this runs during Server Component render
  // The messages list refreshes via RealtimeMessages (router.refresh)
}
