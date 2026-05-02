"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { registerStudent } from "@/app/actions/auth";

interface Institute {
  id: string;
  name: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-2.5 px-4 rounded-lg text-white font-semibold text-sm shadow-lg transition-all mt-2 ${
        pending
          ? "bg-white/20 cursor-not-allowed shadow-none"
          : "bg-gradient-to-r bg-[var(--ag-navy)]  hover:opacity-90 active:scale-[0.98]"
      }`}
    >
      {pending ? "Creando cuenta..." : "Crear cuenta"}
    </button>
  );
}

const inputClass =
  "w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 focus:border-transparent transition-all text-sm";

export default function RegisterForm({ institutes }: { institutes: Institute[] }) {
  const [state, formAction] = useActionState(registerStudent, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-white/80 mb-1.5">
          Nombre completo
        </label>
        <input id="full_name" name="full_name" type="text" required placeholder="Ej: María García" className={inputClass} />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1.5">
          Correo electrónico
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="usuario@instituto.edu" className={inputClass} />
      </div>

      <div>
        <label htmlFor="institute_id" className="block text-sm font-medium text-white/80 mb-1.5">
          Instituto
        </label>
        <select
          id="institute_id"
          name="institute_id"
          required
          defaultValue=""
          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 focus:border-transparent transition-all text-sm"
        >
          <option value="" disabled className="text-gray-400 bg-[var(--ag-text)]">Seleccioná tu instituto</option>
          {institutes.map((inst) => (
            <option key={inst.id} value={inst.id} className="bg-[var(--ag-text)]">
              {inst.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1.5">
          Contraseña
        </label>
        <input id="password" name="password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres" className={inputClass} />
      </div>

      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-white/80 mb-1.5">
          Confirmar contraseña
        </label>
        <input id="confirm" name="confirm" type="password" required minLength={6} placeholder="Repetí la contraseña" className={inputClass} />
      </div>

      <SubmitButton />

      <div className="text-center pt-2">
        <Link href="/login" className="text-sm text-white/80/60 hover:text-white/80 transition">
          ¿Ya tenés cuenta? Iniciá sesión
        </Link>
      </div>
    </form>
  );
}
