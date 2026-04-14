import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TeacherDashboardView from './TeacherDashboardView'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'profesor') redirect('/dashboard')

  return (
    <TeacherDashboardView
      teacherId={user.id}
      teacherName={profile.full_name}
    />
  )
}
