'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

type ActionResult = { success: true } | { success: false; error: string }

// ── Helper: verificar que el usuario es admin y obtener su institute_id ────────

async function assertAdmin(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; institute_id: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, institute_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { ok: false, error: 'Sin permisos' }
  if (!profile.institute_id) return { ok: false, error: 'El administrador no tiene un instituto asignado' }

  return { ok: true, supabase, institute_id: profile.institute_id }
}

// ── Crear usuario (solo alumno / profesor del propio instituto) ───────────────

const ALLOWED_ROLES = ['alumno', 'profesor'] as const

const createUserSchema = z.object({
  email:     z.string().email('Email inválido'),
  password:  z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  full_name: z.string().min(1, 'El nombre es requerido'),
  role:      z.enum(ALLOWED_ROLES, { message: 'Rol inválido' }),
})

export async function createUser(formData: FormData): Promise<ActionResult> {
  const auth = await assertAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const raw = {
    email:     (formData.get('email') as string)?.trim().toLowerCase(),
    password:  formData.get('password') as string,
    full_name: (formData.get('full_name') as string)?.trim(),
    role:      formData.get('role') as string,
  }

  const parsed = createUserSchema.safeParse(raw)
  if (!parsed.success) {
    const msgs = parsed.error.issues.map((e) => e.message).join('. ')
    return { success: false, error: msgs }
  }

  const adminClient = createAdminClient()

  // Create the auth user (email auto-confirmed)
  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email:         parsed.data.email,
    password:      parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
  })

  if (authError) return { success: false, error: authError.message }

  // Update the auto-created profile with the chosen role and the admin's institute
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({
      full_name:    parsed.data.full_name,
      role:         parsed.data.role,
      institute_id: auth.institute_id,
    })
    .eq('id', newUser.user.id)

  if (profileError) {
    // Roll back: remove the auth user so there's no orphaned account
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return { success: false, error: profileError.message }
  }

  return { success: true }
}
