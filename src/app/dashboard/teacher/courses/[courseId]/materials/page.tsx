import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Material, Announcement } from '@/lib/types'
import MaterialForm from '@/components/ui/MaterialForm'
import { EditMaterialButton, DeleteMaterialButton } from '@/components/ui/MaterialActions'
import AnnouncementSection from '@/components/ui/AnnouncementSection'

interface Props {
  params: Promise<{ courseId: string }>
}

export default async function MaterialsPage({ params }: Props) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .eq('teacher_id', user.id)
    .single()

  if (!course) notFound()

  const { data: materials } = await supabase
    .from('materials')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index')

  const materialList = (materials ?? []) as Material[]

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*, author:profiles!announcements_author_id_fkey(full_name, email, avatar_url)')
    .eq('course_id', courseId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
  const annList = (announcements ?? []) as unknown as Announcement[]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <a href="/dashboard/teacher" className="text-[#1A56DB] hover:underline text-sm">← Mis cursos</a>
      </div>
      <h1 className="text-2xl font-bold text-[#050F1F] mb-1">{course.title}</h1>
      <p className="text-[#050F1F]/50 mb-8">Gestión académica del curso</p>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4 mb-8">
         <Link href={`/dashboard/teacher/courses/${courseId}/forum`} className="bg-white rounded-xl border border-black/5 p-4 flex items-center gap-4 hover:border-[#1A56DB] hover:shadow-sm transition group">
            <span className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl text-[#1A56DB]">💬</span>
            <div>
               <h3 className="font-semibold text-[#050F1F] group-hover:text-[#1A56DB] transition">Foro de Discusión</h3>
               <p className="text-xs text-[#050F1F]/50 mt-0.5">Gestión de consultas</p>
            </div>
         </Link>
         <Link href={`/dashboard/teacher/courses/${courseId}/assignments`} className="bg-white rounded-xl border border-black/5 p-4 flex items-center gap-4 hover:border-[#D97706] hover:shadow-sm transition group">
            <span className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-xl text-[#D97706]">📦</span>
            <div>
               <h3 className="font-semibold text-[#050F1F] group-hover:text-[#D97706] transition">Trabajos Prácticos</h3>
               <p className="text-xs text-[#050F1F]/50 mt-0.5">Entregas y correcciones</p>
            </div>
         </Link>
      </div>

      <AnnouncementSection announcements={annList} courseId={courseId} isTeacher={true} />

      <h2 className="text-lg font-semibold text-[#050F1F] mb-4">📚 Materiales</h2>
      <MaterialForm courseId={courseId} orderIndex={materialList.length} />

      {materialList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
          <p className="text-[#050F1F]/50">Este curso aún no tiene materiales.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {materialList.map((m, idx) => (
            <div key={m.id} className="bg-white rounded-xl border border-black/5 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-200">
              <span className="w-8 h-8 rounded-lg bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-xs font-bold text-[#1A56DB] flex-shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#050F1F] text-sm">{m.title}</p>
                {m.description && <p className="text-xs text-[#050F1F]/50 mt-0.5">{m.description}</p>}
              </div>
              {m.file_type && (
                <span className="px-2 py-0.5 rounded-full bg-[#F0F9FF] border border-[#BAE6FD] text-[#1A56DB] text-xs font-medium flex-shrink-0">
                  {m.file_type}
                </span>
              )}
              {m.file_url && (
                <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                  className="text-[#1A56DB] hover:underline text-xs flex-shrink-0">
                  Ver →
                </a>
              )}
              <div className="flex gap-1 flex-shrink-0">
                <EditMaterialButton material={m} />
                <DeleteMaterialButton materialId={m.id} materialTitle={m.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}