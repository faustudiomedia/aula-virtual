'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/app/actions/courses'
import { logAction } from '@/app/actions/audit'

export type { ActionState }


const inviteSchema = z.object({
  email: z.string().email('El correo electrónico no es válido'),
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.enum(['profesor', 'alumno'] as const, { message: 'Rol inválido' }),
  institute_id: z.string().uuid('Instituto inválido'),
})

// ── Invite a user via email (requires service_role key) ───────────────────
export async function inviteUser(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autenticado' }

    // 🔒 Only admins can invite
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { success: false, error: 'No tienes permisos para invitar usuarios' }
    }

    const payload = {
      email: formData.get('email'),
      full_name: formData.get('full_name'),
      role: formData.get('role'),
      institute_id: formData.get('institute_id'),
    }

    const parsed = inviteSchema.safeParse(payload)
    if (!parsed.success) {
      return { success: false, error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }
    }

    // Use service_role key to bypass RLS for admin operations
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
      return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY no configurada. Revisá tu .env.local' }
    }

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(parsed.data.email, {
      data: {
        full_name: parsed.data.full_name,
        role: parsed.data.role,
        institute_id: parsed.data.institute_id,
      },
    })

    if (inviteError) {
      if (inviteError.message.includes('already been registered')) {
        return { success: false, error: 'Este correo ya tiene una cuenta registrada' }
      }
      return { success: false, error: inviteError.message }
    }

    // 📋 Audit log
    await logAction(user.id, 'user', null, 'CREATE', {
      invited_email: parsed.data.email,
      role: parsed.data.role,
      institute_id: parsed.data.institute_id,
    })

    revalidatePath('/dashboard/admin/invitations')
    return { success: true }
  } catch {
    return { success: false, error: 'Error inesperado al enviar la invitación' }
  }
}
