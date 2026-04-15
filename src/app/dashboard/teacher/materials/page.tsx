import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AllMaterialsView from './AllMaterialsView'

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

  return <AllMaterialsView teacherId={user.id} />
}
