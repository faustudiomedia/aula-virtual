import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CourseNavTabs } from '@/components/ui/CourseNavTabs'
import { createAssignment } from '@/app/actions/assignments'
import SubmitButton from '@/components/ui/SubmitButton'
import Link from 'next/link'

interface Props {
  params: Promise<{ courseId: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function NewAssignmentPage({ params, searchParams }: Props) {
  const { courseId } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'profesor' && profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: course } = await supabase
    .from('courses').select('title').eq('id', courseId).single()
  if (!course) redirect('/dashboard/teacher')

  async function handleCreate(formData: FormData) {
    'use server'
    const result = await createAssignment(courseId, formData)
    if (!result.success) {
      redirect(`/dashboard/teacher/courses/${courseId}/assignments/new?error=${encodeURIComponent(result.error)}`)
    }
    redirect(`/dashboard/teacher/courses/${courseId}/assignments`)
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

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 max-w-2xl">
        <h2 className="text-base font-semibold text-[var(--ag-text)] mb-5">Nueva tarea</h2>

        {error && (
          <div className="mb-5 rounded-lg bg-red-100/50 border border-red-300/50/70 px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        <form action={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              required
              placeholder="Ej: Trabajo práctico N°1"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">Consigna</label>
            <textarea
              name="description"
              rows={6}
              placeholder="Describí la tarea, los objetivos y los criterios de evaluación..."
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[var(--ag-text)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">Fecha de entrega</label>
              <input
                name="due_date"
                type="datetime-local"
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">Puntaje máximo</label>
              <input
                name="max_score"
                type="number"
                min={1}
                max={1000}
                defaultValue={100}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <SubmitButton label="Crear tarea" loadingLabel="Creando..." />
            <Link
              href={`/dashboard/teacher/courses/${courseId}/assignments`}
              className="flex-1 py-2.5 rounded-xl border border-black/10 text-[var(--ag-text)]/70 font-semibold text-sm text-center hover:bg-black/5 transition-a