"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePassword } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-2.5 px-4 rounded-lg text-white font-semibold text-sm shadow-lg transition-all mt-2 ${
        pending
          ? "bg-white/20 cursor-not-allowed shadow-none"
          : "bg-gradient-to-r from-[#1A56DB] to-[#38BDF8] shadow-[#1A56DB]/30 hover:opacity-90 active:scale-[0.98]"
      }`}
    >
      {pending ? "Guardando..." : "Guardar nueva contraseña"}
    </button>
  );
}

export default function ResetPasswordForm() {
  const [state, formAction] = useActionState(updatePassword, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {state.error}
        </div>
      )}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[#BAE6FD] mb-1.5">
          Nueva contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30
                     focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent transition-all text-sm"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-[#BAE6FD] mb-1.5">
          Confirmar contraseña
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={6}
          placeholder="Repetí la nueva contraseña"
          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30
                     focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent transition-all text-sm"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
