import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CourseNavTabs } from '@/components/ui/CourseNavTabs'
import { createAnnouncement, deleteAnnouncement } from '@/app/actions/announcements'
import Link from 'next/link'
import type { Announcement } from '@/lib/types'

interface Props {
  params: Promise<{ courseId: string }>
  searchParams: Promise<{ error?: string; success?: string }>
}

export default async function TeacherAnnouncementsPage({ params, searchParams }: Props) {
  const { courseId } = await params
  const { error, success } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'profesor' && profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: course } = await supabase
    .from('courses').select('title').eq('id', courseId).single()
  if (!course) redirect('/dashboard/teacher')

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  async function handleCreate(formData: FormData) {
    'use server'
    const result = await createAnnouncement(courseId, formData)
    if (!result.success) {
      redirect(`/dashboard/teacher/courses/${courseId}/announcements?error=${encodeURIComponent(result.error)}`)
    }
    redirect(`/dashboard/teacher/courses/${courseId}/announcements?success=1`)
  }

  async function handleDelete(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    await deleteAnnouncement(id)
    redirect(`/dashboard/teacher/courses/${courseId}/announcements`)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-2">
        <Link href="/dashboard/teacher" className="text-sm text-[var(--ag-text-muted)] hover:text-[var(--ag-text)] transition-colors">
          ← Mis cursos
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-6">{course.title}</h1>

      <CourseNavTabs courseId={courseId} />

      {/* Form */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-[var(--ag-text)] mb-4">Nuevo anuncio</h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            ✓ Anuncio publicado correctamente.
          </div>
        )}

        <form action={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              required
              placeholder="Ej: Recordatorio de entrega"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">Contenido</label>
            <textarea
              name="content"
              rows={4}
              placeholder="Escribí el contenido del anuncio..."
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[var(--ag-text)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-semibold hover:bg-[var(--ag-navy)]/90 transition-all"
          >
            Publicar anuncio
          </button>
        </form>
      </div>

      {/* List */}
      <div className="space-y-4">
        {(announcements as Announcement[] ?? []).map((a) => (
          <div key={a.id} className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-semibold text-[var(--ag-text)] mb-1">{a.title}</h3>
                {a.content && (
                  <p className="text-sm text-[var(--ag-text-muted)] whitespace-pre-wrap">{a.content}</p>
                )}
                <p className="text-xs text-[var(--ag-text)]/30 mt-2">
                  {new Date(a.created_at).toLocaleDateString('es-AR', { dateStyle: 'long' })}
                </p>
              </div>
              <form action={handleDelete} className="flex-shrink-0">
                <input type="hidden" name="id" value={a.id} />
                <button
                  type="submit"
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </form>
            </div>
          </div>
        ))}
        {(announcements ?? []).length === 0 && (
          <div className="text-center py-12 text-[var(--ag-text-muted)] text-sm">
            No hay anuncios todavía. Publicá el primero arriba.
          </div>
        )}
      </div>
    </div>
  )
}
