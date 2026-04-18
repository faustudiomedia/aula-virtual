"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import FormError from "@/components/ui/FormError";

interface Props {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

const roleLabel: Record<string, string> = {
  alumno: "Alumno",
  profesor: "Profesor",
  admin: "Administrador",
  super_admin: "Super Admin",
};

export default function ProfileForm({ fullName, email, avatarUrl, role }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (!result.success) { setError(result.error); return; }
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

      <AvatarUpload currentUrl={avatarUrl} name={fullName} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Correo</label>
          <input
            value={email}
            disabled
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#050F1F]/50 bg-black/5 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Rol</label>
          <input
            value={roleLabel[role] ?? role}
            disabled
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#050F1F]/50 bg-black/5 cursor-not-allowed"
          />
        </div>
      </div>

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
          className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#050F1F] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-2.5 rounded-xl bg-[#1A56DB] text-white font-semibold text-sm hover:bg-[#1A56DB]/90 transition-all disabled:opacity-60 shadow-lg shadow-[#1A56DB]/20"
      >
        {isPending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
