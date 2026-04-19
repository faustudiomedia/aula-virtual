'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  currentUserId: string
  otherUserId: string
}

export function RealtimeMessages({ currentUserId, otherUserId }: Props) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`conv:${[currentUserId, otherUserId].sort().join(':')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          // Only refresh if the message is from the current conversation
          if (payload.new.sender_id === otherUserId) {
            router.refresh()
          }
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, otherUserId, router])

  return null
}
