import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function createCourse(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('institute_id')
    .eq('id', user.id)
    .single()

  await supabase.from('courses').insert({
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    teacher_id: user.id,
    institute_id: profile?.institute_id,
    published: formData.get('published') === 'on',
  })

  redirect('/dashboard/teacher')
}

export default async function NewCoursePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-2">Crear nuevo curso</h1>
      <p className="text-[#050F1F]/50 mb-8">Completá los datos para publicar tu curso.</p>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <form action={createCourse} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
              Título del curso <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              required
              placeholder="Ej: Inglés Nivel A2"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-[#050F1F] text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
              Descripción
            </label>
            <textarea
              name="description"
              rows={4}
              placeholder="Describí brevemente de qué trata el curso..."
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-[#050F1F] text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="published"
              name="published"
              className="w-4 h-4 rounded accent-[#1A56DB]"
            />
            <label htmlFor="published" className="text-sm font-medium text-[#050F1F]">
              Publicar inmediatamente
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#1A56DB] text-white font-semibold text-sm
                         hover:opacity-90 transition-all shadow-lg shadow-[#1A56DB]/20"
            >
              Crear curso
            </button>
            <a
              href="/dashboard/teacher"
              className="flex-1 py-2.5 rounded-xl border border-black/10 text-[#050F1F]/70 font-semibold text-sm
                         text-center hover:bg-black/5 transition-all"
            >
              Cancelar
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
