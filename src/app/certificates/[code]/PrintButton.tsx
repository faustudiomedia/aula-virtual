"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs text-[var(--ag-navy)] font-medium hover:underline"
    >
      Imprimir / Descargar PDF
    </button>
  );
}
