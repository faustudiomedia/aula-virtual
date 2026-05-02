import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateInstitute, toggleInstituteStatus } from '@/app/actions/super-admin'
import SubmitButton from '@/components/ui/SubmitButton'
import { SignatureUpload } from '@/components/ui/SignatureUpload'
import Link from 'next/link'

interface Props {
  params: Promise<{ instituteId: string }>
  searchParams: Promise<{ error?: string; success?: string }>
}

export default async function EditInstitutePage({ params, searchParams }: Props) {
  const { instituteId } = await params
  const { error, success } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: institute } = await supabase
    .from('institutes')
    .select('*')
    .eq('id', instituteId)
    .single()

  if (!institute) notFound()

  // Stats del instituto
  const [
    { count: usersCount },
    { count: coursesCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('institute_id', instituteId),
    supabase.from('courses').select('*',  { count: 'exact', head: true }).eq('institute_id', instituteId),
  ])

  async function handleUpdate(formData: FormData) {
    'use server'
    formData.append('id', instituteId)
    const result = await updateInstitute(formData)
    if (!result.success) {
      redirect(`/dashboard/super-admin/institutes/${instituteId}?error=${encodeURIComponent(result.error ?? 'Error')}`)
    }
    redirect(`/dashboard/super-admin/institutes/${instituteId}?success=1`)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard/super-admin/institutes"
          className="text-sm text-[var(--ag-text-muted)] hover:text-[var(--ag-text)] transition-colors"
        >
          ← Institutos
        </Link>
        <span className="text-[var(--ag-text)]/20">/</span>
        <span className="text-sm font-medium text-[var(--ag-text)]">{institute.name}</span>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[var(--ag-surface-alt)] rounded-xl border border-[var(--ag-border-light)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--ag-text)]">{usersCount ?? 0}</p>
          <p className="text-xs text-[var(--ag-text-muted)] mt-1">Usuarios</p>
        </div>
        <div className="bg-[var(--ag-surface-alt)] rounded-xl border border-[var(--ag-border-light)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--ag-text)]">{coursesCount ?? 0}</p>
          <p className="text-xs text-[var(--ag-text-muted)] mt-1">Cursos</p>
        </div>
      </div>

      <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm p-6">
        <h1 className="text-lg font-bold text-[var(--ag-text)] mb-5">Editar instituto</h1>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {error}</div>
        )}
        {success && (
          <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">✓ Cambios guardados correctamente</div>
        )}

        <form action={handleUpdate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">Nombre Institución <span className="text-red-500">*</span></label>
            <input name="name" required defaultValue={institute.name}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">Slug <span className="text-red-500">*</span></label>
            <input name="slug" required defaultValue={institute.slug}
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30" />
          </div>
          <div className="pt-4 border-t border-[var(--ag-border-light)]">
             <h2 className="text-sm font-bold text-[var(--ag-text)] mb-4">Autoridad y Certificaciones</h2>
             <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">Nombre del Director / Institución</label>
                <input name="director_name" defaultValue={institute.director_name ?? ''}
                  placeholder="Ej: Ing. Juan Pérez / Universidad"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30" />
             </div>
             <SignatureUpload currentUrl={institute.director_signature_url || null} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">Dominio personalizado</label>
            <input name="domain" defaultValue={institute.domain ?? ''}
              placeholder="aula.instituto.edu.ar"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">Color primario</label>
              <input type="color" name="primary_color" defaultValue={institute.primary_color}
                className="w-full h-10 rounded-xl border border-[var(--ag-border)] cursor-pointer p-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">Color secundario</label>
              <input type="color" name="secondary_color" defaultValue={institute.secondary_color}
                className="w-full h-10 rounded-xl border border-[var(--ag-border)] cursor-pointer p-1" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <SubmitButton label="Guardar cambios" loadingLabel="Guardando..." />
          </div>
        </form>
      </div>

      {/* Toggle estado */}
      <div className="mt-4 bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--ag-text)]">
              Estado: <span className={institute.active ? 'text-green-600' : 'text-red-500'}>
                {institute.active ? 'Activo' : 'Inactivo'}
              </span>
            </p>
            <p className="text-xs text-[var(--ag-text-muted)] mt-0.5">
              {institute.active
                ? 'Los usuarios de este instituto pueden acceder a la plataforma.'
                : 'Los usuarios de este instituto no pueden iniciar sesión.'}
            </p>
          </div>
          <form action={async () => {
            'use server'
            await toggleInstituteStatus(instituteId, !institute.active)
            redirect(`/dashboard/super-admin/institutes/${instituteId}?success=1`)
          }}>
            <button
              type="submit"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                institute.active
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              {institute.active ? 'Desactivar' : 'Activar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
