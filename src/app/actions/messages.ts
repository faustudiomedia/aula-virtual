'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  revalidatePath('/dashboard/messages')
}
