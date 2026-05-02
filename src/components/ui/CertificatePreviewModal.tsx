"use client";

import { useEffect } from "react";

interface Props {
  studentName: string;
  courseTitle: string;
  instituteName: string;
  logoUrl?: string | null;
  directorName?: string | null;
  directorSignatureUrl?: string | null;
  teacherSignatureUrl?: string | null;
  code?: string | null;
  onClose: () => void;
}

export function CertificatePreviewModal({
  studentName,
  courseTitle,
  instituteName,
  logoUrl,
  directorName,
  directorSignatureUrl,
  teacherSignatureUrl,
  code,
  onClose,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-black/5 relative"
        style={{ fontFamily: "'Georgia', serif" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[var(--ag-text-muted)] transition-all text-sm font-bold"
        >
          ✕
        </button>

        {/* Top accent bar */}
        <div className="h-2 bg-gradient-to-r from-[var(--ag-navy)] via-[var(--ag-navy)] to-[#2D6A4F]" />

        <div className="px-10 py-10">
          {/* Institute header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={instituteName} className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[var(--ag-navy)] flex items-center justify-center text-white font-bold text-xl">
                  {instituteName.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-[var(--ag-text)] text-base leading-none">{instituteName}</p>
                <p className="text-[10px] text-[var(--ag-text-muted)] mt-1 tracking-widest uppercase">Plataforma Educativa</p>
              </div>
            </div>
            {code && (
              <div className="text-right">
                <p className="text-[10px] text-[var(--ag-text)]/30 uppercase tracking-widest">Código</p>
                <p className="text-xs font-mono font-bold text-[var(--ag-navy)] mt-0.5">{code}</p>
              </div>
            )}
          </div>

          {/* Certificate body */}
          <div className="text-center mb-8">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--ag-navy)] font-semibold mb-2">
              Certificado de Finalización
            </p>
            <p className="text-[var(--ag-text-muted)] text-sm">Este certificado acredita que</p>
            <h1 className="text-3xl font-bold text-[var(--ag-text)] mt-3 mb-3 leading-tight">{studentName}</h1>
            <p className="text-[var(--ag-text-muted)] text-sm">ha completado satisfactoriamente el curso</p>
            <h2 className="text-xl font-bold text-[var(--ag-navy)] mt-2">{courseTitle}</h2>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[var(--ag-navy)]/20" />
            <div className="w-2 h-2 rounded-full bg-[var(--ag-navy)]/30" />
            <div className="w-3 h-3 rounded-full bg-[var(--ag-navy)]/50" />
            <div className="w-2 h-2 rounded-full bg-[var(--ag-navy)]/30" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[var(--ag-navy)]/20" />
          </div>

          {/* Signatures row */}
          <div className="flex items-end justify-between mt-6 gap-4">
            <div className="text-center">
              {directorSignatureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={directorSignatureUrl} alt="Firma" className="h-12 max-w-[140px] object-contain mx-auto mb-1 mix-blend-multiply" />
              ) : (
                <div className="h-10 mb-1" />
              )}
              <div className="w-36 border-b border-[var(--ag-border)]/20 mb-1.5" />
              <p className="text-xs text-[var(--ag-text-muted)]">{directorName ?? "Director/a"}</p>
              <p className="text-[10px] text-[var(--ag-text)]/30 uppercase tracking-widest mt-0.5">{instituteName}</p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-full border-2 border-[var(--ag-navy)]/30 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border border-[var(--ag-navy)]/20 flex items-center justify-center">
                  <span className="text-base">🎓</span>
                </div>
              </div>
              <p className="text-[9px] uppercase tracking-widest text-[var(--ag-text)]/30">Verificado</p>
            </div>

            {teacherSignatureUrl && (
              <div className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={teacherSignatureUrl} alt="Firma docente" className="h-12 max-w-[140px] object-contain mx-auto mb-1 mix-blend-multiply" />
                <div className="w-36 border-b border-[var(--ag-border)]/20 mb-1.5" />
                <p className="text-[10px] text-[var(--ag-text)]/30 uppercase tracking-widest mt-0.5">Docente</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-3 bg-white border-t border-black/5 flex items-center justify-between">
          <p className="text-[10px] text-[var(--ag-text)]/30 font-sans">Vista previa del certificado</p>
          {code && (
            <a
              href={`/certificates/${code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--ag-navy)] font-medium font-sans hover:underline"
            >
              Abrir diploma completo →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
