"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/app/actions/super-admin";

interface Institute {
  id: string;
  name: string;
}

const ROLES = [
  { value: "alumno",      label: "Alumno",      desc: "Puede inscribirse y cursar materias" },
  { value: "profesor",    label: "Profesor",     desc: "Puede crear y gestionar cursos" },
  { value: "admin",       label: "Admin",        desc: "Administra un instituto" },
  { value: "super_admin", label: "Super Admin",  desc: "Acceso total a la plataforma" },
];

const ROLE_COLORS: Record<string, string> = {
  alumno:      "border-sky-300 bg-sky-50 text-sky-700",
  profesor:    "border-blue-300 bg-blue-100/60 text-blue-700",
  admin:       "border-violet-300 bg-violet-50 text-violet-700",
  super_admin: "border-amber-300 bg-amber-100/60 text-amber-700",
};

export default function NewUserForm({ institutes }: { institutes: Institute[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("alumno");
  const [showPassword, setShowPassword] = useState(false);

  const needsInstitute = ["alumno", "profesor", "admin"].includes(selectedRole);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createUser(formData);
      if (result.success) {
        router.push("/dashboard/super-admin/users?created=1");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal info */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-[var(--ag-text-muted)] uppercase tracking-wider">
          Información personal
        </h2>

        <div>
          <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            name="full_name"
            required
            placeholder="Ej: María García"
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="usuario@ejemplo.com"
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
            Contraseña temporal <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-2.5 pr-12 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ag-text-muted)] hover:text-[var(--ag-text)] text-xs transition"
            >
              {showPassword ? "Ocultar" : "Ver"}
            </button>
          </div>
          <p className="text-xs text-[var(--ag-text-muted)] mt-1">
            El usuario puede cambiarla después desde su perfil.
          </p>
        </div>
      </div>

      {/* Role selector */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--ag-text-muted)] uppercase tracking-wider">
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
                  : "border-[var(--ag-border)] hover:border-black/20 text-[var(--ag-text)]/70"
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
          <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
            Instituto <span className="text-red-500">*</span>
          </label>
          {institutes.length === 0 ? (
            <p className="text-sm text-[var(--ag-text-muted)] bg-amber-100/50 border border-amber-300/50/70 rounded-xl p-3">
              No hay institutos activos. Creá uno primero.
            </p>
          ) : (
            <select
              name="institute_id"
              required={needsInstitute}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition bg-[var(--ag-surface)]"
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
        <div className="bg-red-100/50 border border-red-300/50/70 rounded-xl p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2.5 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-semibold hover:bg-[var(--ag-navy)]/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg "
        >
          {isPending ? "Creando usuario..." : "Crear usuario"}
        </button>
        <a
          href="/dashboard/super-admin/users"
          className="px-4 py-2.5 rounded-xl border border-[var(--ag-border)] text-s
