'use client'

import { useOptimistic, useTransition } from 'react'
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notifications'
import type { Notification } from '@/lib/types'
import Link from 'next/link'

interface Props {
  notifications: Notification[]
}

export default function NotificationsClient({ notifications }: Props) {
  const [optimisticNotifs, updateOptimistic] = useOptimistic(
    notifications,
    (prev: Notification[], id: string | 'all') => {
      if (id === 'all') return prev.map((n) => ({ ...n, is_read: true }))
      return prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
    }
  )

  const [, startTransition] = useTransition()

  const handleRead = (notifId: string) => {
    startTransition(async () => {
      updateOptimistic(notifId)
      await markNotificationAsRead(notifId)
    })
  }

  const handleReadAll = () => {
    startTransition(async () => {
      updateOptimistic('all')
      await markAllNotificationsAsRead()
    })
  }

  const unreadCount = optimisticNotifs.filter((n) => !n.is_read).length

  if (optimisticNotifs.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[var(--ag-border-light)] p-12 text-center">
        <p className="text-4xl mb-3">🔔</p>
        <p className="text-[var(--ag-text-muted)]">No tenés notificaciones todavía.</p>
      </div>
    )
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleReadAll}
            className="text-sm text-[var(--ag-navy)] hover:underline font-medium"
          >
            Marcar todas como leídas
          </button>
        </div>
      )}

      <div className="space-y-2">
        {optimisticNotifs.map((notif) => (
          <div
            key={notif.id}
            className={`rounded-xl border p-4 flex items-start gap-4 transition-all ${
              notif.is_read
                ? 'bg-white border-black/5'
                : 'bg-[rgba(30,58,95,0.08)] border-[var(--ag-border-light)]'
            }`}
          >
            {/* unread dot */}
            <div className="mt-1 flex-shrink-0">
              {!notif.is_read ? (
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--ag-navy)] block" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-transparent block" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${notif.is_read ? 'text-[var(--ag-text)]/70' : 'text-[var(--ag-text)]'}`}>
                {notif.title}
              </p>
              <p className="text-sm text-[var(--ag-text-muted)] mt-0.5">{notif.message}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-[var(--ag-text)]/30">
                  {new Date(notif.created_at).toLocaleDateString('es-AR', { dateStyle: 'medium' })}{' '}
                  {new Date(notif.created_at).toLocaleTimeString('es-AR', { timeStyle: 'short' })}
                </span>
                {notif.link_url && (
                  <Link
                    href={notif.link_url}
                    className="text-xs text-[var(--ag-navy)] hover:underline font-medium"
                  >
                    Ver →
                  </Link>
                )}
              </div>
            </div>

            {!notif.is_read && (
              <button
                onClick={() => handleRead(notif.id)}
                className="flex-shrink-0 text-xs text-[var(--ag-text-muted)] hover:text-[var(--ag-navy)] transition-colors mt-0.5"
                aria-label="Marcar como leída"
              >
                ✓ Leída
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
