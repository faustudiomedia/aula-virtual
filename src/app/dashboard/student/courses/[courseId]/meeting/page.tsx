import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentCourseNavTabs } from '@/components/ui/StudentCourseNavTabs'
import { JitsiMeetEmbed } from '@/components/ui/JitsiMeetEmbed'

interface Props { params: Promise<{ courseId: string }> }

export default async function StudentMeetingPage({ params }: Props) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'alumno' && profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: course } = await supabase
    .from('courses').select('id, title').eq('id', courseId).single()
  if (!course) redirect('/dashboard/student/courses')

  const roomName = `mavic-${courseId.slice(0, 8)}`

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-1">{course.title}</h1>
      <StudentCourseNavTabs courseId={courseId} />
      <JitsiMeetEmbed
        roomName={roomName}
        displayName={profile?.full_name ?? 'Alumno'}
        courseTitle={course.title}
      />
    </div>
  )
}
