"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login } from "@/app/actions/auth";

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
      {pending ? "Ingresando..." : "Ingresar"}
    </button>
  );
}

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction] = useActionState(login, null);

  const displayError = state?.error || initialError;

  return (
    <form action={formAction} className="space-y-4">
      {displayError && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {displayError}
        </div>
      )}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[#BAE6FD] mb-1.5"
        >
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="usuario@instituto.edu"
          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30
                     focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent
                     transition-all text-sm"
        />
        {state?.fieldErrors?.email && (
          <p className="mt-1 text-xs text-red-400">
            {state.fieldErrors.email.join(", ")}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-[#BAE6FD] mb-1.5"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30
                     focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent
                     transition-all text-sm"
        />
        {state?.fieldErrors?.password && (
          <p className="mt-1 text-xs text-red-400">
            {state.fieldErrors.password.join(", ")}
          </p>
        )}
      </div>

      <SubmitButton />

      <div className="flex justify-between items-center pt-2">
        <a href="/forgot-password" className="text-xs text-[#BAE6FD]/60 hover:text-[#BAE6FD] transition">
          ¿Olvidaste tu contraseña?
        </a>
        <a href="/register" className="text-xs text-[#BAE6FD]/60 hover:text-[#BAE6FD] transition">
          Crear cuenta
        </a>
      </div>
    </form>
  );
}
