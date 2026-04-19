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
  try {
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

    let adminClient: ReturnType<typeof createAdminClient>
    try {
      adminClient = createAdminClient()
    } catch {
      return {
        success: false,
        error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en .env.local. Obtené la clave de servicio en Settings > API de tu proyecto Supabase.',
      }
    }

    const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
      email:         parsed.data.email,
      password:      parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.full_name },
    })

    if (authError) {
      if (authError.message === 'User not allowed') {
        return {
          success: false,
          error: 'Sin permisos para crear usuarios. Verificá que SUPABASE_SERVICE_ROLE_KEY en .env.local sea la clave "service_role" (no la clave anon/pública).',
        }
      }
      return { success: false, error: authError.message }
    }

    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id:           newUser.user.id,
        email:        parsed.data.email,
        full_name:    parsed.data.full_name,
        role:         parsed.data.role,
        institute_id: auth.institute_id,
      })

    if (profileError) {
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return { success: false, error: profileError.message }
    }

    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error inesperado'
    return { success: false, error: msg }
  }
}

// ── Cambiar rol de un usuario del propio instituto ────────────────────────────

// ── Cambiar rol de un usuario del propio instituto ────────────────────────────

export async function changeUserRoleAction(formData: FormData): Promise<void> {
  const { revalidatePath } = await import('next/cache')
  const auth = await assertAdmin()
  if (!auth.ok) return

  const userId  = formData.get('userId') as string
  const newRole = formData.get('role') as 'alumno' | 'profesor'
  if (!userId || !['alumno','profesor'].includes(newRole)) return

  const { data: target } = await auth.supabase
    .from('profiles').select('institute_id, role').eq('id', userId).maybeSingle()
  if (!target || target.institute_id !== auth.institute_id) return
  if (target.role === 'admin' || target.role === 'super_admin') return

  await auth.supabase.from('profiles').update({ role: newRole }).eq('id', userId)
  revalidatePath('/dashboard/admin/institutes/[instituteId]', 'page')
}

// ── Eliminar usuario del instituto ────────────────────────────────────────────

export async function removeUserFromInstituteAction(formData: FormData): Promise<void> {
  const { revalidatePath } = await import('next/cache')
  const auth = await assertAdmin()
  if (!auth.ok) return

  const userId = formData.get('userId') as string
  if (!userId) return

  const { data: target } = await auth.supabase
    .from('profiles').select('institute_id, role').eq('id', userId).maybeSingle()
  if (!target || target.institute_id !== auth.institute_id) return
  if (target.role === 'admin' || target.role === 'super_admin') return

  await auth.supabase.from('profiles').update({ institute_id: null }).eq('id', userId)
  revalidatePath('/dashboard/admin/institutes/[instituteId]', 'page')
}

// ── Eliminar instituto ────────────────────────────────────────────────────────

export async function deleteInstituteAction(formData: FormData): Promise<void> {
  const { redirect } = await import('next/navigation')
  const { revalidatePath } = await import('next/cache')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const instituteId = formData.get('instituteId') as string
  if (!instituteId) return

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') return

  await supabase.from('institutes').delete().eq('id', instituteId)
  revalidatePath('/dashboard/admin')
  redirect('/dashboard/admin')
}
