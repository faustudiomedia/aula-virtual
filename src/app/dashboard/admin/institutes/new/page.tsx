import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createInstitute } from "@/app/actions/courses";
import SubmitButton from "@/components/ui/SubmitButton";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewInstitutePage({ searchParams }: Props) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") redirect("/dashboard/admin");

  async function handleCreate(formData: FormData) {
    "use server";
    const result = await createInstitute(formData);
    if (!result.success) {
      redirect(
        `/dashboard/admin/institutes/new?error=${encodeURIComponent(result.error)}`,
      );
    }
    redirect("/dashboard/admin");
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <a
        href="/dashboard/admin"
        className="text-[var(--ag-navy)] hover:underline text-sm"
      >
        ← Institutos
      </a>
      <h1 className="text-2xl font-bold text-[var(--ag-text)] mt-3 mb-2">
        Crear nuevo instituto
      </h1>
      <p className="text-[var(--ag-text-muted)] mb-8">
        Configurá la identidad del nuevo instituto.
      </p>

      <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm p-6">
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}
        <form action={handleCreate} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                placeholder="Ej: Instituto San Martín"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                name="slug"
                required
                placeholder="san-martin"
                pattern="[a-z0-9\-]+"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Dominio personalizado
            </label>
            <input
              name="domain"
              type="text"
              placeholder="Ej: sanmartin.edu.ar"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition"
            />
            <p className="text-xs text-[var(--ag-text-muted)] mt-1">
              Opcional. Se usará para branding multi-dominio.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
                Color primario
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="primary_color"
                  defaultValue="var(--ag-navy)"
                  className="w-10 h-10 rounded-lg border border-[var(--ag-border)] cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  defaultValue="var(--ag-navy)"
                  readOnly
                  className="flex-1 px-3 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm bg-[rgba(30,58,95,0.06)] text-[var(--ag-text-muted)] font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
                Color secundario
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="secondary_color"
                  defaultValue="var(--ag-navy)"
                  className="w-10 h-10 rounded-lg border border-[var(--ag-border)] cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  defaultValue="var(--ag-navy)"
                  readOnly
                  className="flex-1 px-3 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm bg-[rgba(30,58,95,0.06)] text-[var(--ag-text-muted)] font-mono"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <SubmitButton label="Crear instituto" loadingLabel="Creando..." />
            <a
              href="/dashboard/admin"
              className="flex-1 py-2.5 rounded-xl border border-[var(--ag-border)] text-[var(--ag-text-muted)] font-semibold text-sm text-center hover:bg-[var(--ag-surface-alt)] transition"
            >
              Cancelar
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
