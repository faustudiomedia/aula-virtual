import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { JitsiMeetEmbed } from '@/components/ui/JitsiMeetEmbed'

interface Props { params: Promise<{ id: string }> }

export default async function MeetingRoomPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()

  const { data: meeting } = await supabase
    .from('meetings')
    .select('id, display_name, room_slug, active')
    .eq('id', id)
    .single()

  if (!meeting) redirect('/dashboard/meetings')

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/dashboard/meetings" className="text-[#050F1F]/40 hover:text-[#050F1F] transition-colors text-sm flex-shrink-0">
          ← Reuniones
        </Link>
        <span className="text-[#050F1F]/20">/</span>
        <h1 className="text-base font-bold text-[#050F1F] truncate">{meeting.display_name}</h1>
        {!meeting.active && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 text-[#050F1F]/40 flex-shrink-0">Finalizada</span>
        )}
      </div>

      <JitsiMeetEmbed
        roomName={meeting.room_slug}
        displayName={profile?.full_name ?? 'Usuario'}
        courseTitle={meeting.display_name}
        meetingId={meeting.id}
        userId={user.id}
      />
    </div>
  )
}
