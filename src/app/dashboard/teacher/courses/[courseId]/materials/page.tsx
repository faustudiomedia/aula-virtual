import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Material } from '@/lib/types'

async function addMaterial(courseId: string, formData: FormData) {
  'use server'
  const supabase = await createClient()
  await supabase.from('materials').insert({
    course_id: courseId,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    file_url: formData.get('file_url') as string || null,
    file_type: formData.get('file_type') as string || null,
    order_index: Number(formData.get('order_index') ?? 0),
  })
  redirect(`/dashboard/teacher/courses/${courseId}/materials`)
}

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
  const boundAddMaterial = addMaterial.bind(null, courseId)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <a href="/dashboard/teacher" className="text-[#1A56DB] hover:underline text-sm">← Mis cursos</a>
      </div>
      <h1 className="text-2xl font-bold text-[#050F1F] mb-1">{course.title}</h1>
      <p className="text-[#050F1F]/50 mb-8">Materiales del curso</p>

      {/* Add material form */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-[#050F1F] mb-4">Agregar material</h2>
        <form action={boundAddMaterial} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              name="title"
              required
              placeholder="Título *"
              className="px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
            <select
              name="file_type"
              className="px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-white"
            >
              <option value="">Tipo de archivo</option>
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
              <option value="link">Enlace</option>
              <option value="image">Imagen</option>
            </select>
          </div>
          <input
            name="description"
            placeholder="Descripción (opcional)"
            className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
          />
          <div className="flex gap-3">
            <input
              name="file_url"
              placeholder="URL del archivo o enlace"
              className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
            <input
              name="order_index"
              type="number"
              min="0"
              defaultValue={materialList.length}
              placeholder="Orden"
              className="w-24 px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-[#1A56DB] text-white text-sm font-semibold hover:opacity-90 transition-all"
          >
            Agregar
          </button>
        </form>
      </div>

      {/* Materials list */}
      {materialList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
          <p className="text-[#050F1F]/50">Este curso aún no tiene materiales.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {materialList.map((m, idx) => (
            <div key={m.id} className="bg-white rounded-xl border border-black/5 p-4 flex items-center gap-4 shadow-sm">
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
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1A56DB] hover:underline text-xs flex-shrink-0"
                >
                  Ver →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
