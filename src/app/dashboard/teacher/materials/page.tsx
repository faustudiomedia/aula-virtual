import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AllMaterialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'profesor') redirect('/dashboard')

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .eq('teacher_id', user.id)

  const courseIds = (courses ?? []).map((c) => c.id)
  const courseMap: Record<string, string> = {}
  ;(courses ?? []).forEach((c) => { courseMap[c.id] = c.title })

  const { data: materials } = await supabase
    .from('materials')
    .select('*')
    .in('course_id', courseIds.length ? courseIds : [''])
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-2">Todos los materiales</h1>
      <p className="text-[#050F1F]/50 mb-8">Materiales cargados en todos tus cursos.</p>

      {(materials ?? []).length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
          <p className="text-[#050F1F]/50">Todavía no cargaste materiales.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(materials ?? []).map((m: any) => (
            <div key={m.id} className="bg-white rounded-xl border border-black/5 p-4 flex items-center gap-4 shadow-sm">
              <span className="text-2xl">
                {m.file_type === 'pdf' ? '📄' : m.file_type === 'video' ? '🎥' : m.file_type === 'image' ? '🖼️' : '🔗'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#050F1F] text-sm">{m.title}</p>
                <p className="text-xs text-[#050F1F]/40 mt-0.5">
                  Curso: {courseMap[m.course_id] ?? 'Desconocido'}
                </p>
              </div>
              <Link
                href={`/dashboard/teacher/courses/${m.course_id}/materials`}
                className="text-[#1A56DB] hover:underline text-xs"
              >
                Ver curso →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
