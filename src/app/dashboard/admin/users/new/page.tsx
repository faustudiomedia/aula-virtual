import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createUser } from "@/app/actions/admin";
import SubmitButton from "@/components/ui/SubmitButton";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminNewUserPage({ searchParams }: Props) {
  const { error } = await searchParams;

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
  if (!profile.institute_id) redirect("/dashboard/admin");

  // Fetch the admin's institute name to display
  const { data: institute } = await supabase
    .from("institutes")
    .select("name")
    .eq("id", profile.institute_id)
    .single();

  async function handleCreate(formData: FormData) {
    "use server";
    const result = await createUser(formData);
    if (!result.success) {
      redirect(
        `/dashboard/admin/users/new?error=${encodeURIComponent(result.error ?? "Error desconocido")}`,
      );
    }
    redirect("/dashboard/admin/users");
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard/admin/users"
          className="text-sm text-[#050F1F]/50 hover:text-[#050F1F] transition-colors"
        >
          ← Usuarios
        </Link>
        <span className="text-[#050F1F]/20">/</span>
        <span className="text-sm font-medium text-[#050F1F]">Nuevo usuario</span>
      </div>

      <h1 className="text-2xl font-bold text-[#050F1F] mb-1">Crear usuario</h1>
      <p className="text-[#050F1F]/50 mb-8">
        El usuario será creado dentro de{" "}
        <span className="font-medium text-[#050F1F]">
          {institute?.name ?? "tu instituto"}
        </span>
        .
      </p>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        <form action={handleCreate} className="space-y-5">
          {/* Nombre completo */}
          <div>
            <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              name="full_name"
              required
              placeholder="Ej: María García"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#050F1F] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="Ej: maria@instituto.edu.ar"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#050F1F] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition-all"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#050F1F] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition-all"
            />
            <p className="text-xs text-[#050F1F]/40 mt-1">
              El usuario podrá cambiarla después de iniciar sesión.
            </p>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
              Rol <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              required
              defaultValue="alumno"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#050F1F] bg-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition-all"
            >
              <option value="alumno">🎓 Alumno</option>
              <option value="profesor">👨‍🏫 Profesor</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <SubmitButton label="Crear usuario" loadingLabel="Creando..." />
            <Link
              href="/dashboard/admin/users"
              className="flex-1 py-2.5 rounded-xl border border-black/10 text-[#050F1F]/70 font-semibold text-sm text-center hover:bg-black/5 transition-all"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
