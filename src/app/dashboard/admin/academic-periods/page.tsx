import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AcademicPeriodsView from './AcademicPeriodsView'

export default async function AcademicPeriodsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, institute_id').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role))
    redirect('/dashboard')

  const { data: periods } = await supabase
    .from('academic_periods')
    .select('*')
    .eq('institute_id', profile.institute_id!)
    .order('start_date', { ascending: false })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#050F1F]">Periodos Académicos</h1>
        <p className="text-[#050F1F]/50 mt-1">Administrá los periodos lectivos del instituto.</p>
      </div>
      <AcademicPeriodsView periods={periods ?? []} />
    </div>
  )
}
