'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
  const suffix = Math.random().toString(36).slice(2, 7)
  return `agorify-${base}-${suffix}`
}

export async function createMeeting(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, institute_id').eq('id', user.id).single()
  if (!profile || !['profesor','admin','super_admin'].includes(profile.role)) return

  const displayName = (formData.get('display_name') as string)?.trim()
  if (!displayName) return

  const scheduledAt = (formData.get('scheduled_at') as string) || null
  const isScheduled = scheduledAt && new Date(scheduledAt) > new Date()
  const externalUrl = (formData.get('external_url') as string)?.trim() || null

  await supabase.from('meetings').insert({
    display_name: displayName,
    room_slug: generateSlug(displayName),
    host_id: user.id,
    institute_id: profile.institute_id,
    scheduled_at: scheduledAt || null,
    active: !isScheduled,
    external_url: externalUrl,
  })

  revalidatePath('/dashboard/meetings')
  revalidatePath('/dashboard/teacher/calendar')
  revalidatePath('/dashboard/student/calendar')
}

async function assertMeetingHost(meetingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  const { data: meeting } = await supabase
    .from('meetings').select('host_id').eq('id', meetingId).maybeSingle()
  if (!meeting) return null

  const isHost = meeting.host_id === user.id
  const isPrivileged = profile?.role === 'admin' || profile?.role === 'super_admin'
  if (!isHost && !isPrivileged) return null

  return supabase
}

export async function startMeeting(id: string) {
  const supabase = await assertMeetingHost(id)
  if (!supabase) return

  await supabase.from('meetings').update({ active: true }).eq('id', id)
  revalidatePath('/dashboard/meetings')
}

export async function endMeeting(id: string) {
  const supabase = await assertMeetingHost(id)
  if (!supabase) return

  await supabase.from('meetings').update({ active: false }).eq('id', id)
  revalidatePath('/dashboard/meetings')
}

export async function deleteMeeting(id: string) {
  const supabase = await assertMeetingHost(id)
  if (!supabase) return

  await supabase.from('meetings').delete().eq('id', id)
  revalidatePath('/dashboard/meetings')
  revalidatePath('/dashboard/teacher/calendar')
  revalidatePath('/dashboard/student/calendar')
}
