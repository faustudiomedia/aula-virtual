'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { logAction } from '@/app/actions/audit'

export type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

// ─── SCHEMAS ──────────────────────────────────────────────────────

const courseSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  published: z.boolean().optional(),
  schedule: z.string().optional(),
})

const materialSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  file_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  file_type: z.string().optional(),
  order_index: z.coerce.number().min(0).optional(),
})

const instituteSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug: z.string().regex(/^[a-z0-9\-]+$/, 'El slug solo puede contener minúsculas, números y guiones'),
  domain: z.string().optional(),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
})

// ─── HELPER: Verificar ownership de un curso ───────────────────────────────
async function verifyCourseOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseId: string,
  teacherId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('teacher_id', teacherId)
    .single()
  return !!data
}

// ─── HELPER: Verificar ownership de un material (via curso) ───────────────
async function verifyMaterialOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  materialId: string,
  teacherId: string,
): Promise<{ owned: boolean; courseId?: string }> {
  const { data: material } = await supabase
    .from('materials')
    .select('course_id')
    .eq('id', materialId)
    .single()

  if (!material?.course_id) return { owned: false }

  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('id', material.course_id)
    .eq('teacher_id', teacherId)
    .single()

  return { owned: !!course, courseId: material.course_id }
}

// ─── COURSES ────────────────────────────────────────────────────

export async function createCourse(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autenticado' }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, institute_id')
      .eq('id', user.id)
      .single()
    if (profileError || !profile) return { success: false, error: 'Perfil no encontrado' }

    // 🔒 Solo profesores pueden crear cursos
    if (profile.role !== 'profesor') return { success: false, error: 'Sin permisos para crear cursos' }

    const payload = {
      title: formData.get('title'),
      description: formData.get('description'),
      published: formData.get('published') === 'on' || formData.get('published') === 'true',
      schedule: formData.get('schedule') || undefined,
    }

    const parsed = courseSchema.safeParse(payload)
    if (!parsed.success) {
      return { success: false, error: 'Campos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const { data: newCourse, error } = await supabase.from('courses').insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      teacher_id: user.id,
      institute_id: profile.institute_id,
      published: parsed.data.published ?? false,
      schedule: parsed.data.schedule || null,
    }).select('id').single()

    if (error) return { success: false, error: error.message }

    // 📋 Audit log
    await logAction(user.id, 'course', newCourse?.id ?? null, 'CREATE', { title: parsed.data.title })

    return { success: true }
  } catch {
    return { success: false, error: 'Error inesperado al crear el curso' }
  }
}

export async function updateCourse(courseId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autenticado' }

    const payload = {
      title: formData.get('title'),
      description: formData.get('description'),
      published: formData.get('published') === 'on' || formData.get('published') === 'true',
      schedule: formData.get('schedule') || undefined,
    }

    const parsed = courseSchema.safeParse(payload)
    if (!parsed.success) {
      return { success: false, error: 'Campos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const { error } = await supabase
      .from('courses')
      .update({
        title: parsed.data.title,
        description: parsed.data.description || null,
        published: parsed.data.published ?? false,
        schedule: parsed.data.schedule || null,
      })
      .eq('id', courseId)
      .eq('teacher_id', user.id)   // 🔒 ownership enforced in query

    if (error) return { success: false, error: error.message }

    // 📋 Audit log
    await logAction(user.id, 'course', courseId, 'UPDATE', { title: parsed.data.title })

    return { success: true }
  } catch {
    return { success: false, error: 'Error inesperado al actualizar el curso' }
  }
}

export async function deleteCourse(courseId: string): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autenticado' }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
      .eq('teacher_id', user.id)   // 🔒 ownership enforced in query

    if (error) return { success: false, error: error.message }

    // 📋 Audit log
    await logAction(user.id, 'course', courseId, 'DELETE')

    return { success: true }
  } catch {
    return { success: false, error: 'Error inesperado al eliminar el curso' }
  }
}

// ─── MATERIALS ──────────────────────────────────────────────────

export async function addMaterial(courseId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autenticado' }

    // 🔒 Verificar que el curso pertenece al profesor
    const isOwner = await verifyCourseOwnership(supabase, courseId, user.id)
    if (!isOwner) return { success: false, error: 'No tenés permiso para agregar materiales a este curso' }

    const payload = {
      title: formData.get('title'),
      description: formData.get('description'),
      file_url: formData.get('file_url'),
      file_type: formData.get('file_type'),
      order_index: formData.get('order_index'),
    }

    const parsed = materialSchema.safeParse(payload)
    if (!parsed.success) {
      return { success: false, error: 'Campos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const { data: newMaterial, error } = await supabase.from('materials').insert({
      course_id: courseId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      file_url: parsed.data.file_url || null,
      file_type: parsed.data.file_type || null,
      order_index: parsed.data.order_index ?? 0,
    }).select('id').single()

    if (error) return { success: false, error: error.message }

    // 📋 Audit log
    await logAction(user.id, 'material', newMaterial?.id ?? null, 'CREATE', { title: parsed.data.title, courseId })

    revalidatePath(`/dashboard/teacher/courses/${courseId}/materials`)
    return { success: true }
  } catch {
    return { success: false, error: 'Error inesperado al agregar el material' }
  }
}

export async function updateMaterial(materialId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autenticado' }

    // 🔒 Verificar ownership del material via curso
    const { owned, courseId } = await verifyMaterialOwnership(supabase, materialId, user.id)
    if (!owned) return { success: false, error: 'No tenés permiso para editar este material' }

    const payload = {
      title: formData.get('title'),
      description: formData.get('description'),
      file_url: formData.get('file_url'),
      file_type: formData.get('file_type'),
      order_index: formData.get('order_index'),
    }

    const parsed = materialSchema.safeParse(payload)
    if (!parsed.success) {
      return { success: false, error: 'Campos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const { error } = await supabase
      .from('materials')
      .update({
        title: parsed.data.title,
        description: parsed.data.description || null,
        file_url: parsed.data.file_url || null,
        file_type: parsed.data.file_type || null,
        order_index: parsed.data.order_index ?? 0,
      })
      .eq('id', materialId)

    if (error) return { success: false, error: error.message }

    // 📋 Audit log
    await logAction(user.id, 'material', materialId, 'UPDATE', { title: parsed.data.title })

    if (courseId) revalidatePath(`/dashboard/teacher/courses/${courseId}/materials`)
    return { success: true }
  } catch {
    return { success: false, error: 'Error inesperado al actualizar el material' }
  }
}

export async function deleteMaterial(materialId: string): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autenticado' }

    // 🔒 Verificar ownership del material via curso antes de eliminar
    const { owned, courseId } = await verifyMaterialOwnership(supabase, materialId, user.id)
    if (!owned) return { success: false, error: 'No tenés permiso para eliminar este material' }

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', materialId)

    if (error) return { success: false, error: error.message }

    // 📋 Audit log
    await logAction(user.id, 'material', materialId, 'DELETE')

    if (courseId) revalidatePath(`/dashboard/teacher/courses/${courseId}/materials`)
    return { success: true }
  } catch {
    return { success: false, error: 'Error inesperado al eliminar el material' }
  }
}

// ─── ENROLLMENTS ────────────────────────────────────────────────

export async function enrollInCourse(courseId: string): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autenticado' }

    // 🔒 Verificar que el alumno pertenece al mismo instituto que el curso
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, institute_id')
      .eq('id', user.id)
      .single()

    if (!profile) return { success: false, error: 'Perfil no encontrado' }
    if (profile.role !== 'alumno') return { success: false, error: 'Solo los alumnos pueden inscribirse' }

    const { data: course } = await supabase
      .from('courses')
      .select('institute_id, published')
      .eq('id', courseId)
      .single()

    if (!course) return { success: false, error: 'Curso no encontrado' }
    if (!course.published) return { success: false, error: 'Este curso no está disponible' }

    // 🔒 Validar mismo instituto
    if (course.institute_id !== profile.institute_id) {
      return { success: false, error: 'No podés inscribirte en cursos de otro instituto' }
    }

    const { error } = await supabase.from('enrollments').insert({
      student_id: user.id,
      course_id: courseId,
      progress: 0,
      completed: false,
    })
    if (error) {
      if (error.code === '23505') return { success: false, error: 'Ya estás inscripto en este curso' }
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch {
    return { success: false, error: 'Error inesperado al inscribirse' }
  }
}

export async function unenrollFromCourse(courseId: string): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autenticado' }

    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('student_id', user.id)   // 🔒 can only delete own enrollment
      .eq('course_id', courseId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch {
    return { success: false, error: 'Error inesperado al desinscribirse' }
  }
}

export async function updateMaterialProgress(enrollmentId: string, materialsSeen: number, totalMaterials: number): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autenticado' }

    const progress = totalMaterials > 0 ? Math.round((materialsSeen / totalMaterials) * 100) : 0
    const completed = progress >= 100

    const { error } = await supabase
      .from('enrollments')
      .update({ progress, completed })
      .eq('id', enrollmentId)
      .eq('student_id', user.id)   // 🔒 can only update own enrollment
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch {
    return { success: false, error: 'Error inesperado al actualizar el progreso' }
  }
}

// ─── INSTITUTES ─────────────────────────────────────────────────

export async function createInstitute(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autenticado' }

    // 🔒 Solo admins pueden crear institutos
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') return { success: false, error: 'Sin permisos para crear institutos' }

    const payload = {
      name: formData.get('name'),
      slug: (formData.get('slug') as string)?.toLowerCase().replace(/\s+/g, '-').trim(),
      domain: formData.get('domain'),
      primary_color: formData.get('primary_color') || '#1A56DB',
      secondary_color: formData.get('secondary_color') || '#38BDF8',
    }

    const parsed = instituteSchema.safeParse(payload)
    if (!parsed.success) {
      return { success: false, error: 'Campos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const { data: newInstitute, error } = await supabase.from('institutes').insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      domain: parsed.data.domain || null,
      primary_color: parsed.data.primary_color,
      secondary_color: parsed.data.secondary_color,
      active: true,
    }).select('id').single()

    if (error) {
      if (error.code === '23505') return { success: false, error: 'Ya existe un instituto con ese slug o dominio' }
      return { success: false, error: error.message }
    }

    // 📋 Audit log
    await logAction(user.id, 'institute', newInstitute?.id ?? null, 'CREATE', { name: parsed.data.name })

    revalidatePath('/dashboard/admin')
    return { success: true }
  } catch {
    return { success: false, error: 'Error inesperado al crear el instituto' }
  }
}