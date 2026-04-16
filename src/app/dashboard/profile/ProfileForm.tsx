"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";
import FormError from "@/components/ui/FormError";

interface Props {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

export default function ProfileForm({ fullName, email, avatarUrl, role }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const roleLabel: Record<string, string> = {
    alumno: "Alumno",
    profesor: "Profesor",
    admin: "Administrador",
    super_admin: "Super Admin",
  };

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <FormError message={error} />
      {success && (
        <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
          Perfil actualizado correctamente.
        </div>
      )}

      {/* Email (read-only) */}
      <div>
        <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
          Correo electrónico
        </label>
        <input
          value={email}
          disabled
          className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#050F1F]/50 bg-black/5 cursor-not-allowed"
        />
      </div>

      {/* Role (read-only) */}
      <div>
        <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Rol</label>
        <input
          value={roleLabel[role] ?? role}
          disabled
          className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#050F1F]/50 bg-black/5 cursor-not-allowed"
        />
      </div>

      {/* Full name */}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-[#050F1F] mb-1.5">
          Nombre completo <span className="text-red-500">*</span>
        </label>
        <input
          id="full_name"
          name="full_name"
          required
          defaultValue={fullName}
          placeholder="Tu nombre completo"
          className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#050F1F] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition-all"
        />
      </div>

      {/* Avatar URL */}
      <div>
        <label htmlFor="avatar_url" className="block text-sm font-medium text-[#050F1F] mb-1.5">
          URL de avatar{" "}
          <span className="text-[#050F1F]/30 font-normal">(opcional)</span>
        </label>
        <input
          id="avatar_url"
          name="avatar_url"
          type="url"
          defaultValue={avatarUrl ?? ""}
          placeholder="https://..."
          className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#050F1F] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-2.5 rounded-xl bg-[#1A56DB] text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60 shadow-lg shadow-[#1A56DB]/20"
      >
        {isPending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
