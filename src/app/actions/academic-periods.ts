'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ActionState = {
  success?: boolean
  error?: string
}

export async function createAcademicPeriod(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles').select('role, institute_id').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role))
    return { error: 'Sin permisos' }

  const name = (formData.get('name') as string)?.trim()
  const startDate = formData.get('start_date') as string
  const endDate = formData.get('end_date') as string

  if (!name) return { error: 'El nombre es requerido' }
  if (!startDate || !endDate) return { error: 'Las fechas son requeridas' }
  if (endDate <= startDate) return { error: 'La fecha de fin debe ser posterior a la de inicio' }

  const instituteId = profile.institute_id
  if (!instituteId) return { error: 'No tenés instituto asignado' }

  const { error } = await supabase.from('academic_periods').insert({
    name,
    start_date: startDate,
    end_date: endDate,
    institute_id: instituteId,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/academic-periods')
  return { success: true }
}

export async function toggleAcademicPeriod(id: string, isActive: boolean): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role))
    return { error: 'Sin permisos' }

  const { error } = await supabase
    .from('academic_periods').update({ is_active: isActive }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/academic-periods')
  return { success: true }
}

export async function deleteAcademicPeriod(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role))
    return { error: 'Sin permisos' }

  const { error } = await supabase.from('academic_periods').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/academic-periods')
  return { success: true }
}
