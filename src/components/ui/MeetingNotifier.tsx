'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface MeetingAlert {
  id: string
  display_name: string
}

export function MeetingNotifier() {
  const [alerts, setAlerts] = useState<MeetingAlert[]>([])
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('meeting-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'meetings' },
        (payload) => {
          const meeting = payload.new as { id: string; display_name: string; active: boolean }
          if (!meeting.active) return
          setAlerts(prev => [...prev, { id: meeting.id, display_name: meeting.display_name }])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  function join(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id))
    router.push(`/dashboard/meetings/${id}`)
  }

  function dismiss(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  if (alerts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className="bg-white border border-[#1A56DB]/20 rounded-2xl shadow-xl shadow-[#1A56DB]/10 p-4 flex items-start gap-3 animate-in slide-in-from-right-4"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-xl flex-shrink-0">
            🎥
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#1A56DB] uppercase tracking-wide mb-0.5">
              Reunión iniciada
            </p>
            <button
              onClick={() => join(alert.id)}
              className="text-sm font-bold text-[#050F1F] hover:text-[#1A56DB] transition-colors text-left leading-tight"
            >
              {alert.display_name} →
            </button>
            <p className="text-xs text-[#050F1F]/40 mt-1">Tocá el nombre para unirte</p>
          </div>
          <button
            onClick={() => dismiss(alert.id)}
            className="text-[#050F1F]/30 hover:text-[#050F1F] transition-colors flex-shrink-0 text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
