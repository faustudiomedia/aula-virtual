import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard/admin')

  // Todos los counts en la BD con exact count — sin loops de JS
  const [
    { count: totalInstitutes },
    { count: totalStudents },
    { count: totalTeachers },
    { count: totalCourses },
    { count: totalEnrollments },
    { data: progressStats },
  ] = await Promise.all([
    supabase.from('institutes').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'alumno'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'profesor'),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    // Query única para stats de progreso
    supabase.from('enrollments').select('progress, completed'),
  ])

  const enrollmentList = progressStats ?? []
  const avgProgress = enrollmentList.length
    ? Math.round(
        enrollmentList.reduce((s: number, e: { progress: number }) => s + e.progress, 0) /
          enrollmentList.length
      )
    : 0
  const completionRate = enrollmentList.length
    ? Math.round(
        (enrollmentList.filter((e: { completed: boolean }) => e.completed).length /
          enrollmentList.length) *
          100
      )
    : 0

  const stats = [
    { label: 'Institutos', value: totalInstitutes ?? 0, icon: '🏛️', color: '#1A56DB', bg: '#EFF6FF' },
    { label: 'Alumnos', value: totalStudents ?? 0, icon: '🎒', color: '#059669', bg: '#ECFDF5' },
    { label: 'Profesores', value: totalTeachers ?? 0, icon: '👩‍🏫', color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Cursos', value: totalCourses ?? 0, icon: '📚', color: '#D97706', bg: '#FFFBEB' },
    { label: 'Inscripciones', value: totalEnrollments ?? 0, icon: '✅', color: '#0891B2', bg: '#ECFEFF' },
    { label: 'Progreso promedio', value: `${avgProgress}%`, icon: '📊', color: '#4F46E5', bg: '#EEF2FF' },
    { label: 'Tasa de completitud', value: `${completionRate}%`, icon: '🏆', color: '#BE185D', bg: '#FDF2F8' },
  ]

  type Bucket = { label: string; filter: (p: number) => boolean; color: string }
  const buckets: Bucket[] = [
    { label: 'Sin iniciar (0%)', filter: (p) => p === 0, color: '#E5E7EB' },
    { label: 'Iniciado (1–33%)', filter: (p) => p >= 1 && p <= 33, color: '#FCA5A5' },
    { label: 'En progreso (34–66%)', filter: (p) => p >= 34 && p <= 66, color: '#38BDF8' },
    { label: 'Avanzado (67–99%)', filter: (p) => p >= 67 && p <= 99, color: '#1A56DB' },
    { label: 'Completado (100%)', filter: (p) => p === 100, color: '#059669' },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-2">Estadísticas globales</h1>
      <p className="text-[#050F1F]/50 mb-8">Métricas generales de toda la plataforma.</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-5 border border-black/5"
            style={{ background: stat.bg }}
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-3xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-sm text-[#050F1F]/60 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {enrollmentList.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#050F1F] mb-4">Distribución de progreso</h2>
          <div className="space-y-3">
            {buckets.map((bucket) => {
              const count = enrollmentList.filter(
                (e: { progress: number }) => bucket.filter(e.progress)
              ).length
              const pct = Math.round((count / enrollmentList.length) * 100)
              return (
                <div key={bucket.label} className="flex items-center gap-3">
                  <span className="text-xs text-[#050F1F]/50 w-44 flex-shrink-0">
                    {bucket.label}
                  </span>
                  <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: bucket.color }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[#050F1F]/60 w-10 text-right">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}