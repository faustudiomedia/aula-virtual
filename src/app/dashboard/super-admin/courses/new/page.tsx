import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCourse } from "@/app/actions/courses";
import SubmitButton from "@/components/ui/SubmitButton";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function SuperAdminNewCoursePage({ searchParams }: Props) {
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

  if (profile?.role !== "super_admin") redirect("/dashboard");

  const [{ data: institutes }, { data: teachers }] = await Promise.all([
    supabase
      .from("institutes")
      .select("id, name")
      .eq("active", true)
      .order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, email, institute_id")
      .in("role", ["profesor", "admin"])
      .order("full_name"),
  ]);

  async function handleCreate(formData: FormData) {
    "use server";
    const result = await createCourse({}, formData);
    if (!result.success) {
      redirect(
        `/dashboard/super-admin/courses/new?error=${encodeURIComponent(result.error)}`,
      );
    }
    redirect("/dashboard/super-admin/courses");
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <a
          href="/dashboard/super-admin/courses"
          className="text-[var(--ag-navy)] hover:underline text-sm"
        >
          ← Todos los cursos
        </a>
      </div>
      <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-2">
        Crear nuevo curso
      </h1>
      <p className="text-[var(--ag-text-muted)] mb-8">
        Completá los datos para publicar el curso.
      </p>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}
        <form action={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Título del curso <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              required
              placeholder="Ej: Inglés Nivel A2"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-[var(--ag-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Descripción
            </label>
            <textarea
              name="description"
              rows={4}
              placeholder="Describí brevemente de qué trata el curso..."
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-[var(--ag-text)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Instituto
            </label>
            <select
              name="institute_id"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-[var(--ag-text)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 focus:border-transparent transition-all"
            >
              <option value="">Sin instituto asignado</option>
              {(institutes ?? []).map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
              Profesor responsable
            </label>
            <select
              name="teacher_id"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-[var(--ag-text)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 focus:border-transparent transition-all"
            >
              <option value="">Sin profesor asignado</option>
              {(teachers ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name || t.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="published"
              name="published"
              className="w-4 h-4 rounded accent-[var(--ag-navy)]"
            />
            <label
              htmlFor="published"
              className="text-sm font-medium text-[var(--ag-text)]"
            >
              Publicar inmediatamente
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <SubmitButton label="Crear curso" loadingLabel="Creando..." />
            <a
              href="/dashboard/super-admin/courses"
              className="flex-1 py-2.5 rounded-xl border border-black/10 text-[var(--ag-text)]/70 font-semibold text-sm text-center hover:bg-black/5 transition-all"
            >
              Cancelar
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
