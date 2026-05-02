'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import type { ActionState } from './courses'

// ── Marcar una notificación como leída ───────────────────────────
export async function markNotificationAsRead(notifId: string): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return { success: false, error: 'No autenticado' }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId)
      .eq('user_id', user.id)   // 🔒 RLS + query-level: solo puede marcar las suyas

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/notifications')
    return { success: true }
  } catch {
    return { success: false, error: 'Error inesperado' }
  }
}

// ── Marcar todas las notificaciones del usuario como leídas ─────
export async function markAllNotificationsAsRead(): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return { success: false, error: 'No autenticado' }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)   // 🔒 solo las propias
      .eq('is_read', false)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/notifications')
    return { success: true }
  } catch {
    return { success: false, error: 'Error inesperado' }
  }
}

// ── Crear notificación desde server actions internos ────────────
// ⚠️ No exportado como Server Action público — uso interno únicamente.
// Se llama server-side desde acciones de admin/profesor, nunca desde el cliente.
export async function createNotification(
  targetUserId: string,
  title: string,
  message: string,
  linkUrl?: string,
): Promise<ActionState> {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceKey || !supabaseUrl) {
      // Sin service key, silenciar el error (notificaciones son opcionales)
      return { success: true }
    }

    const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

    const { error } = await adminSupabase
      .from('notifications')
      .insert({
        user_id: targetUserId,
        title,
        message,
        link_url: linkUrl ?? null,
        is_read: false,
      })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch {
    return { success: false, error: 'Error al crear notificación' }
  }
}

// ── Enviar notificación (solo admin o profesor) — Versión con auth ─
// Esta versión SÍ puede exponerse como Server Action porque verifica rol.
export async function sendNotification(
  targetUserId: string,
  title: string,
  message: string,
  linkUrl?: string,
): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return { success: false, error: 'No autenticado' }

    // 🔒 Solo admin o profesor pueden enviar notificaciones
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'profesor') {
      return { success: false, error: 'Sin permisos para enviar notificaciones' }
    }

    return createNotification(targetUserId, title, message, linkUrl)
  } catch {
    return { success: false, error: 'Error inesperado' }
  }
}

// ── Obtener conteo de notificaciones no leídas (para sidebar) ───
export async function getUnreadCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    return count ?? 0
  } catch {
    return 0
  }
}
