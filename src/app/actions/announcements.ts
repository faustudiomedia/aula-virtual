'use server'

import { createClient } from '@/lib/supabase/server'

type Result = { success: true } | { success: false; error: string }

export async function createAnnouncement(courseId: string, formData: FormData): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'profesor' && profile?.role !== 'super_admin')
    return { success: false, error: 'Sin permisos' }

  const title = (formData.get('title') as string | null)?.trim()
  const content = (formData.get('content') as string | null)?.trim() ?? ''

  if (!title) return { success: false, error: 'El título es requerido' }

  const { error } = await supabase.from('announcements').insert({
    course_id: courseId,
    author_id: user.id,
    title,
    content,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteAnnouncement(announcementId: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', announcementId)
    .eq('author_id', user.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
