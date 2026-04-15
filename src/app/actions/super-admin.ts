'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ── Schemas de validación ─────────────────────────────────────────────────────

const instituteSchema = z.object({
  name:            z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug:            z.string()
                     .min(2)
                     .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones'),
  domain:          z.string().optional().nullable(),
  primary_color:   z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#1A56DB'),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#38BDF8'),
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
    primary_color:   (formData.get('primary_color') as string) || '#1A56DB',
    secondary_color: (formData.get('secondary_color') as string) || '#38BDF8',
    active:          formData.get('active') === 'on',
  }

  const parsed = instituteSchema.safeParse(raw)
  if (!parsed.success) {
    const msgs = parsed.error.issues.map((e: {message: string}) => e.message).join('. ')
    return { success: false, error: msgs }
  }

  // Verificar slug único
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
    primary_color:   (formData.get('primary_color') as string) || '#1A56DB',
    secondary_color: (formData.get('secondary_color') as string) || '#38BDF8',
    active:          formData.get('active') === 'on',
  }

  const parsed = instituteSchema.safeParse(raw)
  if (!parsed.success) {
    const msgs = parsed.error.issues.map((e: {message: string}) => e.message).join('. ')
    return { success: false, error: msgs }
  }

  // Verificar slug único (excluyendo el propio)
  const { data: existing } = await auth.supabase
    .from('institutes')
    .select('id')
    .eq('slug', parsed.data.slug)
    .neq('id', id)
    .maybeSingle()

  if (existing) return { success: false, error: `El slug "${parsed.data.slug}" ya está en uso.` }

  const { error } = await auth.supabase
    .from('institutes')
    .update(parsed.data)
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
