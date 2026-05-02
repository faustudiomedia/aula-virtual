import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateUser } from '@/app/actions/admin'
import SubmitButton from '@/components/ui/SubmitButton'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function AdminEditUserPage({ params, searchParams }: Props) {
  const { id } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, institute_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/dashboard')
  if (!profile?.institute_id) redirect('/dashboard/super-admin/users')

  const { data: target } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, legajo')
    .eq('id', id)
    .eq('institute_id', profile.institute_id)
    .single()

  if (!target) redirect('/dashboard/admin/users')

  async function handleUpdate(formData: FormData) {
    'use server'
    const result = await updateUser(id, formData)
    if (!result.success) {
      redirect(
        `/dashboard/admin/users/${id}/edit?error=${encodeURIComponent(result.error ?? 'Error desconocido')}`,
      )
    }
    redirect('/dashboard/admin/users')
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard/admin/users"
          className="text-sm text-[var(--ag-text-muted)] hover:text-[var(--ag-text)] transition-colors"
        >
          ← Usuarios
        </Link>
        <span className="text-[var(--ag-text)]/20">/</span>
        <span className="text-sm font-medium text-[var(--ag-text)]">Editar usuario</span>
      </div>

      <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-1">Editar usuario</h1>
      <p className="text-[var(--ag-text-muted)] mb-8">
        Modificá los datos del usuario.
      </p>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        <form action={handleUpdate} className="space-y-5">
          {/* Nombre completo */}
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              name="full_name"
              required
              defaultValue={target.full_name ?? ''}
              placeholder="Ej: María García"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
            />
          </div>

          {/* Email (solo lectura) */}
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Email
            </label>
            <input
              value={target.email ?? ''}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[var(--ag-text-muted)] bg-black/[0.02] cursor-not-allowed"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Rol <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              required
              defaultValue={target.role}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[var(--ag-text)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
            >
              <option value="alumno">🎓 Alumno</option>
              <option value="profesor">👨‍🏫 Profesor</option>
            </select>
          </div>

          {/* Legajo */}
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Legajo
            </label>
            <input
              name="legajo"
              defaultValue={target.legajo ?? ''}
              placeholder="Ej: 12345"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
            />
            <p className="text-xs text-[var(--ag-text-muted)] mt-1">Número de legajo único del usuario en el instituto.</p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <SubmitButton label="Guardar cambios" loadingLabel="Guardando..." />
            <Link
              href="/dashboard/admin/users"
              className="flex-1 py-2.5 rounded-xl border border-black/10 text-[var(--ag-text)]/70 font-semibold text-sm text-center hover:bg-black/5 transition-all"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
