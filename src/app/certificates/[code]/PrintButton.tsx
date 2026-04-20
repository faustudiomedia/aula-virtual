"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs text-[#1A56DB] font-medium hover:underline"
    >
      Imprimir / Descargar PDF
    </button>
  );
}
