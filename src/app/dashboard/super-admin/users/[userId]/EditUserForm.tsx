"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUser } from "@/app/actions/super-admin";

interface Institute {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  institute_id: string | null;
}

const ROLES = [
  { value: "alumno",      label: "Alumno",      desc: "Puede inscribirse y cursar materias" },
  { value: "profesor",    label: "Profesor",     desc: "Puede crear y gestionar cursos" },
  { value: "admin",       label: "Admin",        desc: "Administra un instituto" },
  { value: "super_admin", label: "Super Admin",  desc: "Acceso total a la plataforma" },
];

const ROLE_COLORS: Record<string, string> = {
  alumno:      "border-sky-300 bg-sky-50 text-sky-700",
  profesor:    "border-blue-300 bg-blue-50 text-blue-700",
  admin:       "border-violet-300 bg-violet-50 text-violet-700",
  super_admin: "border-amber-300 bg-amber-50 text-amber-700",
};

export default function EditUserForm({
  profile,
  institutes,
}: {
  profile: Profile;
  institutes: Institute[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState(profile.role);

  const needsInstitute = ["alumno", "profesor", "admin"].includes(selectedRole);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateUser(formData);
      if (result.success) {
        router.push("/dashboard/super-admin/users?updated=1");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="id" value={profile.id} />

      {/* Personal info */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-[#050F1F]/60 uppercase tracking-wider">
          Información personal
        </h2>

        <div>
          <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
            Email
          </label>
          <input
            value={profile.email}
            disabled
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#050F1F]/40 bg-black/[0.02] cursor-not-allowed"
          />
          <p className="text-xs text-[#050F1F]/30 mt-1">El email no se puede cambiar desde aquí.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            name="full_name"
            required
            defaultValue={profile.full_name ?? ""}
            placeholder="Ej: María García"
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#050F1F] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition"
          />
        </div>
      </div>

      {/* Role selector */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[#050F1F]/60 uppercase tracking-wider">
          Rol
        </h2>
        <input type="hidden" name="role" value={selectedRole} />
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setSelectedRole(r.value)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                selectedRole === r.value
                  ? ROLE_COLORS[r.value]
                  : "border-black/10 hover:border-black/20 text-[#050F1F]/70"
              }`}
            >
              <p className="text-sm font-semibold">{r.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Institute selector */}
      {needsInstitute && (
        <div>
          <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
            Instituto <span className="text-red-500">*</span>
          </label>
          {institutes.length === 0 ? (
            <p className="text-sm text-[#050F1F]/50 bg-amber-50 border border-amber-200 rounded-xl p-3">
              No hay institutos activos.
            </p>
          ) : (
            <select
              name="institute_id"
              required={needsInstitute}
              defaultValue={profile.institute_id ?? ""}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#050F1F] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition bg-white"
            >
              <option value="">Seleccionar instituto...</option>
              {institutes.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2.5 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold hover:bg-[#1A56DB]/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#1A56DB]/20"
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
        <a
          href="/dashboard/super-admin/users"
          className="px-4 py-2.5 rounded-xl border border-black/10 text-sm font-medium text-[#050F1F]/60 hover:bg-black/5 transition text-center"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
