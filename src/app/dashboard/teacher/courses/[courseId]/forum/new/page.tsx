import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CourseNavTabs } from '@/components/ui/CourseNavTabs'
import { createThread } from '@/app/actions/forum'

interface Props { params: Promise<{ courseId: string }> }

export default async function NewThreadPage({ params }: Props) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'profesor' && profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: course } = await supabase
    .from('courses').select('id, title').eq('id', courseId).single()
  if (!course) redirect('/dashboard/teacher')

  async function handleCreate(formData: FormData) {
    'use server'
    await createThread(courseId, formData)
    redirect(`/dashboard/teacher/courses/${courseId}/forum`)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-1">{course.title}</h1>
      <CourseNavTabs courseId={courseId} />

      <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-[var(--ag-text)] mb-5">Nuevo tema</h2>
        <form action={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)]/70 mb-1.5">Título</label>
            <input
              name="title"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
              placeholder="Tema del hilo..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)]/70 mb-1.5">Contenido</label>
            <textarea
              name="content"
              required
              rows={5}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 resize-none"
              placeholder="Descripción o pregunta..."
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-medium hover:bg-[var(--ag-navy)]/90 transition-all"
            >
              Publicar
            </button>
            <a
              href={`/dashboard/teacher/courses/${courseId}/forum`}
              className="px-5 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm font-medium text-[var(--ag-text-muted)] hover:bg-[var(--ag-surface-alt)] transition-all"
            >
              Cancelar
            </a>
   
