'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

// ── Schemas de validación ─────────────────────────────────────────────────────

const instituteSchema = z.object({
  name:            z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug:            z.string()
                     .min(2)
                     .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones'),
  domain:          z.string().optional().nullable(),
  primary_color:   z.string().regex(/^#[0-9A-Fa-f]{6}$/).default(var(--ag-navy)),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('var(--ag-navy)'),
  director_name:   z.string().optional().nullable(),
  active:          z.boolean().default(true),
})

type ActionResult = { success: true } | { success: false; error: string }

// ── Helper: verificar que el usuario es super_admin ───────────────────────────

async function assertSuperAdmin(): Promise<{ ok: true; supabase: Awaited<ReturnType<typeof createClient>> } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') return { ok: false, error: 'Sin permisos' }
  return { ok: true, supabase }
}

// ── Crear instituto ────────────────────────────────────────────────────────────

export async function createInstitute(formData: FormData): Promise<ActionResult> {
  const auth = await assertSuperAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const raw = {
    name:            formData.get('name') as string,
    slug:            formData.get('slug') as string,
    domain:          (formData.get('domain') as string) || null,
    primary_color:   (formData.get('primary_color') as string) || var(--ag-navy),
    secondary_color: (formData.get('secondary_color') as string) || 'var(--ag-navy)',
    active:          formData.get('active') === 'on',
  }

  const parsed = instituteSchema.safeParse(raw)
  if (!parsed.success) {
    const msgs = parsed.error.issues.map((e: {message: string}) => e.message).join('. ')
    return { success: false, error: msgs }
  }

  const { data: existing } = await auth.supabase
    .from('institutes')
    .select('id')
    .eq('slug', parsed.data.slug)
    .maybeSingle()

  if (existing) return { success: false, error: `El slug "${parsed.data.slug}" ya está en uso.` }

  const { error } = await auth.supabase
    .from('institutes')
    .insert(parsed.data)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── Actualizar instituto ───────────────────────────────────────────────────────

export async function updateInstitute(formData: FormData): Promise<ActionResult> {
  const auth = await assertSuperAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const id = formData.get('id') as string
  if (!id) return { success: false, error: 'ID de instituto requerido' }

  const raw = {
    name:            formData.get('name') as string,
    slug:            formData.get('slug') as string,
    domain:          (formData.get('domain') as string) || null,
    primary_color:   (formData.get('primary_color') as string) || var(--ag-navy),
    secondary_color: (formData.get('secondary_color') as string) || 'var(--ag-navy)',
    director_name:   (formData.get('director_name') as string) || null,
    active:          formData.get('active') === 'on',
  }

  const parsed = instituteSchema.safeParse(raw)
  if (!parsed.success) {
    const msgs = parsed.error.issues.map((e: {message: string}) => e.message).join('. ')
    return { success: false, error: msgs }
  }

  const { data: existing } = await auth.supabase
    .from('institutes')
    .select('id')
    .eq('slug', parsed.data.slug)
    .neq('id', id)
    .maybeSingle()

  if (existing) return { success: false, error: `El slug "${parsed.data.slug}" ya está en uso.` }

  let director_signature_url: string | undefined = undefined;
  const signatureFile = formData.get("signature") as File | null;
  if (signatureFile && signatureFile.size > 0) {
    const MAX_SIZE = 2 * 1024 * 1024;
    if (signatureFile.size > MAX_SIZE) return { success: false, error: "La firma no puede superar 2 MB" };
    const format = signatureFile.type;
    if (format !== 'image/png' && format !== 'image/webp') return { success: false, error: "La firma debe ser PNG o WebP sin fondo." };
    
    const ext = signatureFile.name.split('.').pop()?.toLowerCase() ?? 'png';
    const sigPath = `institute_sig_${id}.${ext}`;
    const bytes = await signatureFile.arrayBuffer();

    const { error: uploadError } = await auth.supabase.storage
      .from("avatars")
      .upload(sigPath, bytes, { contentType: signatureFile.type, upsert: true });

    if (uploadError) return { success: false, error: "Error al subir la firma: " + uploadError.message };

    const { data: { publicUrl } } = auth.supabase.storage.from("avatars").getPublicUrl(sigPath);
    director_signature_url = `${publicUrl}?t=${Date.now()}`;
  }

  const updatePayload = { ...parsed.data } as Record<string, any>;
  if (director_signature_url !== undefined) {
     updatePayload.director_signature_url = director_signature_url;
  }

  const { error } = await auth.supabase
    .from('institutes')
    .update(updatePayload)
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── Activar / desactivar instituto ───────────────────────────────────────────

export async function toggleInstituteStatus(id: string, active: boolean): Promise<ActionResult> {
  const auth = await assertSuperAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const { error } = await auth.supabase
    .from('institutes')
    .update({ active })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── Actualizar usuario ────────────────────────────────────────────────────────

const VALID_ROLES = ['alumno', 'profesor', 'admin', 'super_admin'] as const

const updateUserSchema = z.object({
  full_name:    z.string().min(1, 'El nombre es requerido'),
  role:         z.enum(VALID_ROLES, { message: 'Rol inválido' }),
  institute_id: z.string().uuid().nullable().optional(),
})

export async function updateUser(userId: string, formData: FormData): Promise<ActionResult> {
  const auth = await assertSuperAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const raw = {
    full_name:    (formData.get('full_name') as string)?.trim(),
    role:         formData.get('role') as string,
    institute_id: (formData.get('institute_id') as string) || null,
  }

  const parsed = updateUserSchema.safeParse(raw)
  if (!parsed.success) {
    const msgs = parsed.error.issues.map((e) => e.message).join('. ')
    return { success: false, error: msgs }
  }

  const { error } = await auth.supabase
    .from('profiles')
    .update({
      full_name:    parsed.data.full_name,
      role:         parsed.data.role,
      institute_id: parsed.data.institute_id ?? null,
    })
    .eq('id', userId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── Eliminar usuario ──────────────────────────────────────────────────────────

export async function deleteUser(userId: string): Promise<ActionResult> {
  const auth = await assertSuperAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  let adminClient: ReturnType<typeof createAdminClient>
  try {
    adminClient = createAdminClient()
  } catch {
    return { success: false, error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en .env.local.' }
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const userId = formData.get('userId') as string
  if (!userId) return
  await deleteUser(userId)
  redirect('/dashboard/super-admin/users')
}

// ── Crear usuario ─────────────────────────────────────────────────────────────

const createUserSchema = z.object({
  email:        z.string().email('Email inválido'),
  password:     z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  full_name:    z.string().min(1, 'El nombre es requerido'),
  role:         z.enum(VALID_ROLES, { message: 'Rol inválido' }),
  institute_id: z.string().uuid().nullable().optional(),
})

export async function createUser(formData: FormData): Promise<ActionResult> {
  try {
    const auth = await assertSuperAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const raw = {
      email:        (formData.get('email') as string)?.trim().toLowerCase(),
      password:     formData.get('password') as string,
      full_name:    (formData.get('full_name') as string)?.trim(),
      role:         formData.get('role') as string,
      institute_id: (formData.get('institute_id') as string) || null,
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
        institute_id: parsed.data.institute_id ?? null,
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
