'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAction } from '@/app/actions/audit'

export type MessageActionState = {
  success?: boolean
  error?: string
}

// ─── ENVIAR MENSAJE ─────────────────────────────────────────────
export async function sendMessage(
  recipientId: string,
  subject: string,
  body: string,
): Promise<MessageActionState> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autenticado' }

    if (!body.trim()) return { success: false, error: 'El mensaje no puede estar vacío' }
    if (recipientId === user.id) return { success: false, error: 'No podés enviarte un mensaje a vos mismo' }

    // Verificar que el destinatario existe
    const { data: recipient } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', recipientId)
      .single()

    if (!recipient) return { success: false, error: 'Destinatario no encontrado' }

    const { data: msg, error } = await supabase.from('messages').insert({
      sender_id: user.id,
      recipient_id: recipientId,
      subject: subject.trim() || '(Sin asunto)',
      body: body.trim(),
    }).select('id').single()

    if (error) return { success: false, error: error.message }

    await logAction(user.id, 'message', msg?.id ?? null, 'CREATE', { recipientId, subject })

    revalidatePath('/dashboard/messages')
    return { success: true }
  } catch {
    return { success: false, error: 'Error inesperado al enviar el mensaje' }
  }
}

// ─── MARCAR COMO LEÍDO ──────────────────────────────────────────
export async function markMessageRead(messageId: string): Promise<MessageActionState> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autenticado' }

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('recipient_id', user.id) // 🔒 solo el destinatario

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/messages')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al marcar como leído' }
  }
}

// ─── CONTAR NO LEÍDOS ───────────────────────────────────────────
export async function getUnreadCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false)

    return count ?? 0
  } catch {
    return 0
  }
}
