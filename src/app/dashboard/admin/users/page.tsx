import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";

interface ProfileWithInstitute {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
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
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard/admin");

  // Build query
  let query = supabase
    .from("profiles")
    .select("*, institutes(name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    // using or to search both full_name and email
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  // Pagination
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data: users, count } = await query;

  const userList = (users as unknown as ProfileWithInstitute[]) ?? [];
  const totalPages = count ? Math.ceil(count / pageSize) : 1;

  const roleColors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    profesor: "bg-blue-100 text-blue-700",
    alumno: "bg-green-100 text-green-700",
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#050F1F] mb-1">Usuarios</h1>
          <p className="text-[#050F1F]/50">
            {count ?? 0} usuarios encontrados.
          </p>
        </div>
        <SearchInput placeholder="Buscar por nombre o correo..." />
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F0F9FF] border-b border-black/5 whitespace-nowrap">
              <tr>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">
                  Usuario
                </th>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">
                  Rol
                </th>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">
                  Instituto
                </th>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">
                  Registro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {userList.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-[#F0F9FF]/50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-inner">
                        {(u.full_name || u.email || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[#050F1F] truncate">
                          {u.full_name || "Sin nombre"}
                        </p>
                        <p className="text-xs text-[#050F1F]/40 truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[u.role] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#050F1F]/60">
                    {u.institutes?.name ?? (
                      <span className="text-[#050F1F]/30">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-[#050F1F]/40">
                    {new Date(u.created_at).toLocaleDateString("es-AR", {
                      dateStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
              {userList.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-[#050F1F]/40"
                  >
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
