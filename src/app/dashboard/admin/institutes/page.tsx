import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminInstitutesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, institute_id")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin"))
    redirect("/dashboard");

  // Admin only sees their own institute; super_admin sees all
  const query = supabase.from("institutes").select("*").order("name");
  if (profile.role === "admin" && profile.institute_id) {
    query.eq("id", profile.institute_id);
  }
  const { data: institutes } = await query;
  const list = institutes ?? [];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ag-text)]">Institutos</h1>
          <p className="text-[var(--ag-text-muted)] mt-1">
            Gestioná los datos y branding de tu instituto.
          </p>
        </div>
        {profile.role === "super_admin" && (
          <Link
            href="/dashboard/admin/institutes/new"
            className="px-4 py-2 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-semibold hover:opacity-90 transition shadow-lg "
          >
            + Nuevo instituto
          </Link>
        )}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--ag-border-light)] p-12 text-center">
          <p className="text-4xl mb-3">🏛️</p>
          <p className="text-[var(--ag-text-muted)]">No hay institutos disponibles.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map((inst: {
            id: string;
            name: string;
            slug: string;
            domain: string | null;
            active: boolean;
            primary_color: string;
            secondary_color: string;
          }) => (
            <Link
              key={inst.id}
              href={`/dashboard/admin/institutes/${inst.id}`}
              className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm p-5 flex items-center gap-5 hover:shadow-md transition-shadow"
            >
              {/* Color swatch */}
              <div
                className="w-12 h-12 rounded-xl flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${inst.primary_color}, ${inst.secondary_color})`,
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[var(--ag-text)]">{inst.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      inst.active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {inst.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="text-sm text-[var(--ag-text-muted)] mt-0.5 font-mono">
                  {inst.slug}
                  {inst.domain ? ` · ${inst.domain}` : ""}
                </p>
              </div>
              <span className="text-[var(--ag-navy)] text-sm font-medium flex-shrink-0">
                Editar →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
