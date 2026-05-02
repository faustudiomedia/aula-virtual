import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createInstitute } from '@/app/actions/super-admin'
import SubmitButton from '@/components/ui/SubmitButton'

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function NewInstitutePage({ searchParams }: Props) {
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  async function handleCreate(formData: FormData) {
    'use server'
    const result = await createInstitute(formData)
    if (!result.success) {
      redirect(`/dashboard/super-admin/institutes/new?error=${encodeURIComponent(result.error ?? 'Error desconocido')}`)
    }
    redirect('/dashboard/super-admin/institutes')
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--ag-text)]">Crear instituto</h1>
        <p className="text-[var(--ag-text-muted)] mt-1">
          Completá los datos para dar de alta un nuevo instituto en la plataforma.
        </p>
      </div>

      <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm p-6">
        {error && (
          <div className="mb-5 rounded-lg bg-red-100/50 border border-red-300/50/70 px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        <form action={handleCreate} className="space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Nombre del instituto <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="Ej: Instituto San Martín"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Slug (identificador URL) <span className="text-red-500">*</span>
            </label>
            <input
              name="slug"
              required
              placeholder="Ej: san-martin"
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              title="Solo letras minúsculas, números y guiones"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
            />
            <p className="text-xs text-[var(--ag-text-muted)] mt-1">Solo minúsculas, números y guiones. Ej: san-martin</p>
          </div>

          {/* Dominio */}
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Dominio personalizado <span className="text-[var(--ag-text)]/30 font-normal">(opcional)</span>
            </label>
            <input
              name="domain"
              placeholder="Ej: aula.sanmartin.edu.ar"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition-all"
            />
          </div>

          {/* Colores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
                Color primario
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="primary_color"
                  defaultValue="var(--ag-navy)"
                  className="w-10 h-10 rounded-lg border border-[var(--ag-border)] cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  defaultValue="var(--ag-navy)"
                  placeholder="var(--ag-navy)"
                  className="flex-1 px-3 py-2 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
                  readOnly
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
                Color secundario
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="secondary_color"
                  defaultValue="var(--ag-navy)"
                  className="w-10 h-10 rounded-lg border border-[var(--ag-border)] cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  defaultValue="var(--ag-navy)"
                  placeholder="var(--ag-navy)"
                  className="flex-1 px-3 py-2 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Activo */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              name="active"
              defaultChecked
              className="w-4 h-4 rounded accent-[var(--ag-navy)]"
            />
            <label htmlFor="active" className="text-sm font-medium text-[var(--ag-text)]">
              Activar instituto inmediatamente
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <SubmitButton label="Crear instituto" loadingLabel="Crea
