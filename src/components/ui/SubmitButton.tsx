"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  label?: string;
  loadingLabel?: string;
  className?: string;
  disabled?: boolean;
}

export default function SubmitButton({
  label = "Guardar",
  loadingLabel = "Guardando...",
  className = "",
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`flex-1 py-2.5 rounded-xl bg-[#1A56DB] text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {pending ? loadingLabel : label}
    </button>
  );
}
