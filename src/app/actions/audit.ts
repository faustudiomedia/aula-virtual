'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'

type AuditEntityType = 'user' | 'course' | 'material' | 'assignment' | 'submission' | 'quiz' | 'enrollment' | 'institute' | 'announcement' | 'forum_thread' | 'forum_reply'
type AuditAction = 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'enroll' | 'unenroll' | 'grade' | 'submit' | 'login' | 'logout'

/**
 * Registra una acción en el audit_log.
 * Requiere service_role para bypassear RLS (audit_log solo permite INSERT via service_role).
 * Si no hay credenciales, falla silenciosamente para no interrumpir el flujo.
 */
export async function logAction(
  userId: string | null,
  entityType: AuditEntityType,
  entityId: string | null,
  action: AuditAction,
  changes?: Record<string, unknown>,
): Promise<void> {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceKey || !supabaseUrl) return  // silencioso

    const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

    await adminSupabase.from('audit_log').insert({
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      detailed_changes: changes ?? null,
    })
  } catch {
    // audit_log no debe interrumpir el flujo principal
  }
}
