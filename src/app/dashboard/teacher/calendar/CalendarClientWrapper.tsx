'use client'

import { useTransition } from 'react'
import { CalendarView } from '@/components/ui/CalendarView'
import type { CalendarAssignment, CalendarMeeting, CalendarEvent } from '@/components/ui/CalendarView'
import { deleteCalendarEvent } from '@/app/actions/calendar'

interface Props {
  assignments: CalendarAssignment[]
  meetings: CalendarMeeting[]
  events: CalendarEvent[]
}

export function CalendarClientWrapper({ assignments, meetings, events }: Props) {
  const [, startTransition] = useTransition()

  function handleDelete(id: string) {
    startTransition(() => { deleteCalendarEvent(id) })
  }

  return (
    <CalendarView
      assignments={assignments}
      role="teacher"
      meetings={meetings}
      events={events}
      onDeleteEvent={handleDelete}
    />
  )
}
