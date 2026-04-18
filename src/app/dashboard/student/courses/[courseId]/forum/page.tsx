import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StudentCourseNavTabs } from '@/components/ui/StudentCourseNavTabs'
import { createThread } from '@/app/actions/forum'

interface Props { params: Promise<{ courseId: string }> }

export default async function StudentForumPage({ params }: Props) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'alumno' && profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: enrollment } = await supabase
    .from('enrollments').select('course_id').eq('course_id', courseId).eq('student_id', user.id).single()
  if (!enrollment && profile?.role !== 'super_admin') redirect('/dashboard/student/courses')

  const { data: course } = await supabase
    .from('courses').select('id, title').eq('id', courseId).single()
  if (!course) redirect('/dashboard/student/courses')

  const { data: threads } = await supabase
    .from('forum_threads')
    .select('id, title, content, pinned, created_at, author_id, profiles(full_name)')
    .eq('course_id', courseId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })

  async function handleCreate(formData: FormData) {
    'use server'
    await createThread(courseId, formData)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-1">{course.title}</h1>
      <StudentCourseNavTabs courseId={courseId} />

      <h2 className="text-lg font-semibold text-[#050F1F] mb-4">Foro del curso</h2>

      {/* Create thread form */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 mb-6">
        <h3 className="text-sm font-semibold text-[#050F1F] mb-3">Crear nuevo tema</h3>
        <form action={handleCreate} className="space-y-3">
          <input
            name="title"
            required
            className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30"
            placeholder="Título del tema..."
          />
          <textarea
            name="content"
            required
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 resize-none"
            placeholder="¿Cuál es tu pregunta o comentario?"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#1A56DB] text-white text-sm font-medium hover:bg-[#1A56DB]/90 transition-all"
          >
            Publicar
          </button>
        </form>
      </div>

      {(!threads || threads.length === 0) ? (
        <div className="text-center py-16 text-[#050F1F]/40">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm">No hay temas en el foro todavía. ¡Sé el primero en publicar!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((t) => {
            const author = t.profiles as unknown as { full_name: string } | null
            return (
              <Link
                key={t.id}
                href={`/dashboard/student/courses/${courseId}/forum/${t.id}`}
                className="block bg-white rounded-2xl border border-black/5 shadow-sm p-5 hover:border-[#1A56DB]/20 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  {t.pinned && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">📌 Fijado</span>
                  )}
                  <p className="text-base font-semibold text-[#050F1F] hover:text-[#1A56DB]">{t.title}</p>
                </div>
                <p className="text-sm text-[#050F1F]/50 line-clamp-2 mb-2">{t.content}</p>
                <p className="text-xs text-[#050F1F]/30">
                  {author?.full_name ?? 'Desconocido'} · {new Date(t.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
