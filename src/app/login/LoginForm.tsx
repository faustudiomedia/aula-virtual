"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { login } from "@/app/actions/auth";
import { Eye, EyeOff } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className={`w-full py-2.5 px-4 text-white font-semibold text-sm mt-2 ag-btn-primary ${pending ? "opacity-50 cursor-not-allowed" : ""}`}>
      {pending ? "Ingresando..." : "Ingresar"}
    </button>
  );
}

interface Institute { id: string; name: string; }

export function LoginForm({ initialError, institutes }: { initialError?: string; institutes: Institute[] }) {
  const [state, formAction] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);
  const displayError = state?.error || initialError;

  const inputClass = "w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-all";
  const inputStyle = {
    background: "var(--ag-surface-alt)",
    borderColor: "var(--ag-border)",
    color: "var(--ag-text)",
  };

  return (
    <form action={formAction} className="space-y-4">
      {displayError && (
        <div className="px-4 py-3 rounded-lg text-sm"
          style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA" }}>
          {displayError}
        </div>
      )}

      {/* Instituto */}
      <div>
        <label htmlFor="institute_id" className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--ag-text-secondary)" }}>
          Instituto
        </label>
        <select id="institute_id" name="institute_id"
          className={inputClass} style={inputStyle}>
          <option value="">Seleccioná tu instituto...</option>
          {institutes.map((inst) => (
            <option key={inst.id} value={inst.id}>{inst.name}</option>
          ))}
        </select>
        {state?.fieldErrors?.institute_id && (
          <p className="mt-1 text-xs" style={{ color: "var(--ag-error)" }}>
            {state.fieldErrors.institute_id.join(", ")}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--ag-text-secondary)" }}>
          Correo electrónico
        </label>
        <input id="email" name="email" type="email" autoComplete="email"
          placeholder="usuario@instituto.edu"
          className={inputClass} style={inputStyle} />
        {state?.fieldErrors?.email && (
          <p className="mt-1 text-xs" style={{ color: "var(--ag-error)" }}>
            {state.fieldErrors.email.join(", ")}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--ag-text-secondary)" }}>
          Contraseña
        </label>
        <div className="relative">
          <input id="password" name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password" placeholder="••••••••"
            className={`${inputClass} pr-11`} style={inputStyle} />
          <button type="button" onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: "var(--ag-text-muted)" }}
            aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {state?.fieldErrors?.password && (
          <p className="mt-1 text-xs" style={{ color: "var(--ag-error)" }}>
            {state.fieldErrors.password.join(", ")}
          </p>
        )}
      </div>

      <SubmitButton />

      <div className="flex justify-between items-center pt-1">
        <a href="/forgot-password" className="text-xs transition-colors"
          style={{ color: "var(--ag-text-muted)" }}
          onMouseOver={e => (e.currentTarget.style.color = "var(--ag-navy)")}
          onMouseOut={e => (e.currentTarget.style.color = "var(--ag-text-muted)")}>
          ¿Olvidaste tu contraseña?
        </a>
        <a href="/register" className="text-xs transition-colors"
          style={{ color: "var(--ag-text-muted)" }}
          onMouseOver={e => (e.currentTarget.style.color = "var(--ag-navy)")}
          onMouseOut={e => (e.currentTarget.style.color = "var(--ag-text-muted)")}>
          Crear cuenta
        </a>
      </div>
    </form>
  );
}
