import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { z } from 'zod'

const updateInstituteSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  domain: z.string().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional(),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional(),
  active: z.boolean(),
})

async function updateInstitute(instituteId: string, formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const payload = {
    name: formData.get('name') as string,
    domain: (formData.get('domain') as string) || undefined,
    primary_color: formData.get('primary_color') as string,
    secondary_color: formData.get('secondary_color') as string,
    active: formData.get('active') === 'on',
  }

  const parsed = updateInstituteSchema.safeParse(payload)
  if (!parsed.success) redirect('/dashboard/admin')

  await supabase.from('institutes').update({
    name: parsed.data.name,
    domain: parsed.data.domain || null,
    primary_color: parsed.data.primary_color,
    secondary_color: parsed.data.secondary_color,
    active: parsed.data.active,
  }).eq('id', instituteId)

  redirect('/dashboard/admin')
}

interface Props {
  params: Promise<{ instituteId: string }>
}

export default async function InstituteDetailPage({ params }: Props) {
  const { instituteId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard/admin')

  const { data: institute } = await supabase
    .from('institutes')
    .select('*')
    .eq('id', instituteId)
    .single()

  if (!institute) notFound()

  // ── Profesores del instituto ──────────────────────────────────
  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('institute_id', instituteId)
    .eq('role', 'profesor')
    .order('full_name')

  const teacherList = (teachers ?? []) as { id: string; full_name: string; email: string; avatar_url: string | null }[]

  // ── Cursos del instituto con profesor ─────────────────────────
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, published, schedule, teacher_id, profiles(full_name, email)')
    .eq('institute_id', instituteId)
    .order('created_at', { ascending: false })

  type CourseRow = {
    id: string; title: string; published: boolean; schedule: string | null; teacher_id: string
    profiles: { full_name: string; email: string } | null
  }
  const courseList = (courses ?? []) as unknown as CourseRow[]

  // ── Alumnos del instituto con sus inscripciones ───────────────
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('institute_id', instituteId)
    .eq('role', 'alumno')
    .order('full_name')

  const studentList = (students ?? []) as { id: string; full_name: string; email: string; avatar_url: string | null }[]

  // Enrollment data for students
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, course_id, progress, completed, courses(title)')
    .in('student_id', studentList.length > 0 ? studentList.map(s => s.id) : [''])

  type EnrollRow = {
    student_id: string; course_id: string; progress: number; completed: boolean
    courses: { title: string } | null
  }
  const enrollmentList = (enrollments ?? []) as unknown as EnrollRow[]

  // Group enrollments by student
  const enrollsByStudent: Record<string, EnrollRow[]> = {}
  enrollmentList.forEach((e) => {
    if (!enrollsByStudent[e.student_id]) enrollsByStudent[e.student_id] = []
    enrollsByStudent[e.student_id].push(e)
  })

  // Count enrollments per course
  const enrollCountByCourse: Record<string, number> = {}
  enrollmentList.forEach((e) => {
    enrollCountByCourse[e.course_id] = (enrollCountByCourse[e.course_id] ?? 0) + 1
  })

  // Courses per teacher
  const coursesByTeacher: Record<string, string[]> = {}
  courseList.forEach((c) => {
    if (!coursesByTeacher[c.teacher_id]) coursesByTeacher[c.teacher_id] = []
    coursesByTeacher[c.teacher_id].push(c.title)
  })

  const boundUpdate = updateInstitute.bind(null, instituteId)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#050F1F]/50 mb-6">
        <Link href="/dashboard/admin" className="hover:text-[#1A56DB] transition-colors">Panel Admin</Link>
        <span>/</span>
        <span className="text-[#050F1F] font-medium">{institute.name}</span>
      </div>

      {/* Header con branding */}
      <div className="rounded-2xl overflow-hidden border border-black/5 shadow-sm mb-8">
        <div className="h-3" style={{ background: `linear-gradient(to right, ${institute.primary_color}, ${institute.secondary_color})` }} />
        <div className="bg-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
              style={{ background: `linear-gradient(135deg, ${institute.primary_color}, ${institute.secondary_color})` }}
            >
              {institute.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#050F1F]">{institute.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-[#050F1F]/50">
                <span className="font-mono">/{institute.slug}</span>
                {institute.domain && <span>🌐 {institute.domain}</span>}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${institute.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {institute.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Profesores', value: teacherList.length, icon: '👩‍🏫', color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'Alumnos', value: studentList.length, icon: '🎒', color: '#1A56DB', bg: '#EFF6FF' },
          { label: 'Cursos', value: courseList.length, icon: '📚', color: '#D97706', bg: '#FFFBEB' },
          { label: 'Inscripciones', value: enrollmentList.length, icon: '📝', color: '#059669', bg: '#ECFDF5' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5 border border-black/5" style={{ background: s.bg }}>
            <span className="text-xl">{s.icon}</span>
            <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-sm text-[#050F1F]/60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── PROFESORES ────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#050F1F] mb-4 flex items-center gap-2">
          👩‍🏫 Profesores
          <span className="text-sm font-normal text-[#050F1F]/40">({teacherList.length})</span>
        </h2>
        {teacherList.length === 0 ? (
          <p className="text-sm text-[#050F1F]/40 bg-[#F5F3FF]/50 rounded-xl p-4 border border-purple-100">No hay profesores asignados a este instituto.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F5F3FF] border-b border-black/5">
                <tr>
                  <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Profesor</th>
                  <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Email</th>
                  <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Cursos a cargo</th>
                  <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {teacherList.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F5F3FF]/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {t.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-[#050F1F]">{t.full_name || 'Sin nombre'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#050F1F]/50">{t.email}</td>
                    <td className="px-5 py-3.5">
                      {(coursesByTeacher[t.id] ?? []).length === 0 ? (
                        <span className="text-[#050F1F]/30 text-xs">Sin cursos</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {coursesByTeacher[t.id].map((title, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] text-xs font-medium">{title}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/dashboard/messages?to=${t.id}`}
                        className="px-3 py-1.5 rounded-lg bg-[#F0F9FF] hover:bg-[#BAE6FD]/40 text-[#1A56DB] text-xs font-medium transition-colors border border-[#BAE6FD]"
                      >
                        📨 Mensaje
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── CURSOS ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#050F1F] mb-4 flex items-center gap-2">
          📚 Cursos
          <span className="text-sm font-normal text-[#050F1F]/40">({courseList.length})</span>
        </h2>
        {courseList.length === 0 ? (
          <p className="text-sm text-[#050F1F]/40 bg-[#FFFBEB]/50 rounded-xl p-4 border border-amber-100">No hay cursos en este instituto.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#FFFBEB] border-b border-black/5">
                <tr>
                  <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Curso</th>
                  <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Profesor</th>
                  <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Horario</th>
                  <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Alumnos</th>
                  <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {courseList.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FFFBEB]/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D97706] to-[#F59E0B] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.title.charAt(0)}
                        </div>
                        <span className="font-medium text-[#050F1F]">{c.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#050F1F]/60">{c.profiles?.full_name || c.profiles?.email || '—'}</td>
                    <td className="px-5 py-3.5 text-[#050F1F]/50 text-xs">
                      {c.schedule ?? <span className="text-[#050F1F]/30 italic">Sin horario</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-[#1A56DB]">{enrollCountByCourse[c.id] ?? 0}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {c.published ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── ALUMNOS ────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#050F1F] mb-4 flex items-center gap-2">
          🎒 Alumnos
          <span className="text-sm font-normal text-[#050F1F]/40">({studentList.length})</span>
        </h2>
        {studentList.length === 0 ? (
          <p className="text-sm text-[#050F1F]/40 bg-[#EFF6FF]/50 rounded-xl p-4 border border-blue-100">No hay alumnos en este instituto.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#EFF6FF] border-b border-black/5">
                <tr>
                  <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Alumno</th>
                  <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Email</th>
                  <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Cursos inscriptos</th>
                  <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {studentList.map((s) => {
                  const myEnrollments = enrollsByStudent[s.id] ?? []
                  return (
                    <tr key={s.id} className="hover:bg-[#EFF6FF]/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(s.full_name || s.email).charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-[#050F1F]">{s.full_name || 'Sin nombre'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#050F1F]/50">{s.email}</td>
                      <td className="px-5 py-3.5">
                        {myEnrollments.length === 0 ? (
                          <span className="text-[#050F1F]/30 text-xs">Sin inscripciones</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {myEnrollments.map((e) => (
                              <span key={e.course_id} className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                e.completed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {e.courses?.title ?? 'Curso'} ({e.progress}%)
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/dashboard/messages?to=${s.id}`}
                          className="px-3 py-1.5 rounded-lg bg-[#F0F9FF] hover:bg-[#BAE6FD]/40 text-[#1A56DB] text-xs font-medium transition-colors border border-[#BAE6FD]"
                        >
                          📨 Mensaje
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── CONFIGURACIÓN DEL INSTITUTO ───────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-[#050F1F] mb-4">⚙️ Configuración</h2>
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
          <form action={boundUpdate} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Nombre *</label>
                <input
                  name="name"
                  required
                  defaultValue={institute.name}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Slug</label>
                <input
                  value={institute.slug}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm bg-black/5 text-[#050F1F]/50 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Dominio personalizado</label>
              <input
                name="domain"
                defaultValue={institute.domain ?? ''}
                placeholder="Ej: miinstituto.edu.ar"
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Color primario</label>
                <input
                  type="color"
                  name="primary_color"
                  defaultValue={institute.primary_color}
                  className="w-full h-10 rounded-xl border border-black/10 cursor-pointer p-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Color secundario</label>
                <input
                  type="color"
                  name="secondary_color"
                  defaultValue={institute.secondary_color}
                  className="w-full h-10 rounded-xl border border-black/10 cursor-pointer p-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                name="active"
                defaultChecked={institute.active}
                className="w-4 h-4 rounded accent-[#1A56DB]"
              />
              <label htmlFor="active" className="text-sm font-medium text-[#050F1F]">Instituto activo</label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#1A56DB] text-white font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-[#1A56DB]/20"
            >
              Guardar cambios
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
