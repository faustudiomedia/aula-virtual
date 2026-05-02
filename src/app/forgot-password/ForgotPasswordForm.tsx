"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";

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
      {pending ? "Enviando..." : "Enviar instrucciones"}
    </button>
  );
}

export default function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordReset, null);

  if (state?.success) {
    return (
      <div className="text-center py-4">
        <p className="text-3xl mb-3">📧</p>
        <p className="text-white font-semibold mb-2">Revisá tu correo</p>
        <p className="text-white/80 text-sm">
          Si existe una cuenta con ese email, vas a recibir un enlace para
          restablecer tu contraseña.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-white/80 hover:text-white transition underline"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {state.error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1.5">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="usuario@instituto.edu"
          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30
                     focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 focus:border-transparent transition-all text-sm"
        />
      </div>
      <SubmitButton />
      <div className="text-center pt-2">
        <Link href="/login" className="text-sm text-white/80/60 hover:text-white/80 transition">
          ← Volver al inicio de sesión
        </Link>
      </div>
    </form>
  );
}
