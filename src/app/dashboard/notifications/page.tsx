import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Notification } from '@/lib/types'
import NotificationsClient from '@/components/ui/NotificationsClient'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifList = (notifications ?? []) as Notification[]
  const unreadCount = notifList.filter((n) => !n.is_read).length

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ag-text)]">Notificaciones</h1>
          <p className="text-[var(--ag-text-muted)] mt-1">
            {unreadCount > 0
              ? `${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
              : 'Todo al día ✓'}
          </p>
        </div>
      </div>

      <NotificationsClient notifications={notifList} />
    </div>
  )
}
