import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * /dashboard — distribuye al panel correcto según el rol del usuario.
 * Sin esta página, el middleware genera un loop de redirección.
 */
export default async function DashboardIndexPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  switch (profile.role) {
    case 'admin':
      redirect('/dashboard/admin')
    case 'profesor':
      redirect('/dashboard/teacher')
    case 'alumno':
      redirect('/dashboard/student')
    default:
      // Rol desconocido — cerrar sesión y volver al login
      redirect('/login')
  }
}
