import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import type { UserRole } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, institute_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Conteo de notificaciones no leídas (query rápida con head: true)
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  const headersList = await headers()
  const instituteName = headersList.get('x-institute-name') ?? 'MAVIC'
  const primaryColor = headersList.get('x-institute-primary') ?? '#1A56DB'

  return (
    <div className="flex min-h-screen bg-[#F0F9FF]">
      <Sidebar
        role={profile.role as UserRole}
        instituteName={instituteName}
        userName={profile.full_name || user.email || 'Usuario'}
        primaryColor={primaryColor}
        unreadNotifications={unreadCount ?? 0}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
