import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createUser } from '@/app/actions/super-admin'
import SubmitButton from '@/components/ui/SubmitButton'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function SuperAdminNewUserPage({ searchParams }: Props) {
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: institutes } = await supabase
    .from('institutes')
    .select('id, name')
    .eq('active', true)
    .order('name')

  async function handleCreate(formData: FormData) {
    'use server'
    const result = await createUser(formData)
    if (!result.success) {
      redirect(
        `/dashboard/super-admin/users/new?error=${encodeURIComponent(result.error ?? 'Error desconocido')}`,
      )
    }
    redirect('/dashboard/super-admin/users')
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard/super-admin/users"
          className="text-sm text-[var(--ag-text-muted)] hover:text-[var(--ag-text)] transition-colors"
        >
          ← Usuarios
        </Link>
        <span className="text-[var(--ag-text)]/20">/</span>
        <span className="text-sm font-medium text-[var(--ag-text)]">Nuevo usuario</span>
      </div>

      <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-1">Crear usuario</h1>
      <p className="text-[var(--ag-text-muted)] mb-8">
        Completá los datos para dar de alta un nuevo usuario en la plataforma.
      </p>

      <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm p-6">
        {error && (
          <div className="mb-5 rounded-lg bg-red-100/50 border border-red-300/50/70 px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        <form action={handleCreate} className="space-y-5">
          {/* Nombre completo */}
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              name="full_name"
              required
              placeholder="Ej: María García"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="Ej: maria@instituto.edu.ar"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
            />
            <p className="text-xs text-[var(--ag-text-muted)] mt-1">
              El usuario podrá cambiarla después de iniciar sesión.
            </p>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Rol <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              required
              defaultValue="alumno"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-surface)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
            >
              <option value="alumno">🎓 Alumno</option>
              <option value="profesor">👨‍🏫 Profesor</option>
              <option value="admin">⚙️ Admin</option>
              <option value="super_admin">👑 Super Admin</option>
            </select>
          </div>

          {/* Instituto */}
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Instituto{' '}
              <span className="text-[var(--ag-text)]/30 font-normal">(opcional)</span>
            </label>
            <select
              name="institute_id"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-surface)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
            >
              <option value="">Sin instituto asignado</option>
              {(institutes ?? []).map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <SubmitButton label="Crear usuario" loadingLabel="Creando..." />
            <Link
              href="/dashboard/super-admin/users"
              className="flex-1 py-2.5 rounded-xl border border-[var(--ag-border)] text-[var(--ag-text)]/70 font-