import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteUserAction } from "@/app/actions/admin";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import DeleteUserButton from "@/components/ui/DeleteUserButton";
import Link from "next/link";

interface ProfileWithInstitute {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  legajo: string | null;
  created_at: string;
  institutes: { name: string } | null;
}

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { q, page } = await searchParams;
  const currentPage = Number(page) || 1;
  const pageSize = 10;

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
  if (profile?.role !== "admin" && profile?.role !== "super_admin") redirect("/dashboard");
  if (!profile?.institute_id) redirect("/dashboard/super-admin/users");

  let query = supabase
    .from("profiles")
    .select("*, institutes(name)", { count: "exact" })
    .eq("institute_id", profile.institute_id)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data: users, count } = await query;

  const userList = (users as unknown as ProfileWithInstitute[]) ?? [];
  const totalPages = count ? Math.ceil(count / pageSize) : 1;

  const roleLabels: Record<string, { label: string; color: string }> = {
    alumno:   { label: "Alumno",   color: "bg-sky-50 text-sky-700" },
    profesor: { label: "Profesor", color: "bg-blue-100 text-blue-700" },
    admin:    { label: "Admin",    color: "bg-violet-100 text-violet-700" },
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-1">Usuarios</h1>
          <p className="text-[var(--ag-text-muted)]">
            {count ?? 0} usuarios en tu instituto.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput placeholder="Buscar por nombre o correo..." />
          <Link
            href="/dashboard/admin/users/new"
            className="px-4 py-2 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-semibold hover:bg-[var(--ag-navy)]/90 transition-all shadow-lg  whitespace-nowrap"
          >
            + Nuevo usuario
          </Link>
        </div>
      </div>

      <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[rgba(30,58,95,0.06)] border-b border-[var(--ag-border-light)] whitespace-nowrap">
              <tr>
                <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">Usuario</th>
                <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">Rol</th>
                <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">Instituto</th>
                <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">Registro</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ag-border-light)]">
              {userList.map((u) => {
                const roleInfo = roleLabels[u.role] ?? { label: u.role, color: "bg-gray-100 text-[var(--ag-text-muted)]" };
                return (
                  <tr key={u.id} className="hover:bg-[rgba(30,58,95,0.06)]/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--ag-navy)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-inner">
                          {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--ag-text)] truncate">{u.full_name || "Sin nombre"}</p>
                          <p className="text-xs text-[var(--ag-text-muted)] truncate">{u.email}</p>
                          {u.legajo && <p className="text-xs text-[var(--ag-text)]/30">Leg. {u.legajo}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--ag-text-muted)]">
                      {u.institutes?.name ?? <span className="text-[var(--ag-text)]/30">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-[var(--ag-text-muted)]">
                      {new Date(u.created_at).toLocaleDateString("es-AR", { dateStyle: "short" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/dashboard/admin/users/${u.id}/edit`}
                          className="px-3 py-1 rounded-lg text-xs font-medium text-[var(--ag-navy)] border border-[var(--ag-navy)]/20 hover:bg-[var(--ag-navy)]/5 transition-all"
                        >
                          Editar
                        </Link>
                        <DeleteUserButton userId={u.id} action={deleteUserAction} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {userList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[var(--ag-text-muted)]">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}
