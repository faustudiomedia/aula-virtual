import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CourseForm from '@/components/ui/CourseForm'

export default async function NewCoursePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-2">Crear nuevo curso</h1>
      <p className="text-[#050F1F]/50 mb-8">Completá los datos para publicar tu curso.</p>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <CourseForm />
      </div>
    </div>
  )
}