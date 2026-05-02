"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Palette, X, CheckCircle2 } from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";

// ── Extended institutional dark palette ──────────────────
export const ACCENT_PALETTE = [
  { id: "navy",       bg: "#1E3A5F", label: "Navy" },
  { id: "forest",     bg: "#1A4731", label: "Bosque" },
  { id: "purple",     bg: "#3D2A6B", label: "Púrpura" },
  { id: "teal",       bg: "#1A4A5C", label: "Teal" },
  { id: "terracotta", bg: "#7A3520", label: "Terracota" },
  { id: "slate",      bg: "#2D3748", label: "Slate" },
  { id: "olive",      bg: "#3D4A1A", label: "Oliva" },
  { id: "burgundy",   bg: "#6B1A2A", label: "Burdeos" },
  { id: "midnight",   bg: "#1A1A3D", label: "Medianoche" },
  { id: "pine",       bg: "#1A3D35", label: "Pino" },
  { id: "espresso",   bg: "#3D2210", label: "Espresso" },
  { id: "dusk",       bg: "#4A2D5C", label: "Crepúsculo" },
];

const STORAGE_KEY = "agorify_course_colors";

function getStoredColors(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}
function saveColor(enrollmentId: string, colorId: string) {
  const current = getStoredColors();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, [enrollmentId]: colorId }));
}

interface CourseCardProps {
  enrollmentId: string;
  courseId: string;
  title: string;
  description?: string | null;
  progress: number;
  completed: boolean;
  defaultAccentIdx: number;
}

export function CourseCard({
  enrollmentId, courseId, title, description, progress, completed, defaultAccentIdx,
}: CourseCardProps) {
  const defaultAccent = ACCENT_PALETTE[defaultAccentIdx % ACCENT_PALETTE.length];
  const [accent, setAccent] = useState(defaultAccent);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Load saved color
  useEffect(() => {
    const stored = getStoredColors()[enrollmentId];
    if (stored) {
      const found = ACCENT_PALETTE.find(a => a.id === stored);
      if (found) setAccent(found);
    }
  }, [enrollmentId]);

  // Close picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pickerOpen]);

  function handleColorSelect(a: typeof ACCENT_PALETTE[0]) {
    setAccent(a);
    saveColor(enrollmentId, a.id);
    setPickerOpen(false);
  }

  const initial = title.charAt(0).toUpperCase();

  return (
    <div className="group bg-[var(--ag-surface)] rounded-xl overflow-visible relative transition-all duration-200"
      style={{
        border: "1px solid var(--ag-border-light)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}>

      {/* ── Color picker ── */}
      <div ref={pickerRef} className="absolute top-2 right-2 z-20">
        <button
          onClick={(e) => { e.preventDefault(); setPickerOpen(v => !v); }}
          title="Cambiar color"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
          style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.85)" }}>
          {pickerOpen ? <X size={13} /> : <Palette size={13} />}
        </button>

        {pickerOpen && (
          <div className="absolute top-9 right-0 p-2.5 rounded-xl z-30"
            style={{
              background: "white",
              border: "1px solid var(--ag-border-light)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              width: 184,
            }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-0.5"
              style={{ color: "var(--ag-text-muted)" }}>
              Color de la materia
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {ACCENT_PALETTE.map((a) => (
                <button
                  key={a.id}
                  title={a.label}
                  onClick={() => handleColorSelect(a)}
                  className="w-6 h-6 rounded-md transition-transform hover:scale-110 relative"
                  style={{ background: a.bg }}>
                  {accent.id === a.id && (
                    <CheckCircle2 size={12} className="absolute inset-0 m-auto text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Card header ── */}
      <Link href={`/dashboard/student/courses/${courseId}`} className="block">
        <div className="h-16 flex items-end px-4 pb-3 relative rounded-t-xl overflow-hidden"
          style={{ background: accent.bg }}>
          {/* Watermark letter */}
          <span className="absolute right-2 top-1 text-5xl font-black opacity-[0.08] leading-none select-none"
            style={{ color: "white" }}>
            {initial}
          </span>

          {/* Status badge */}
          <span className="relative z-10 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1"
            style={{
              background: completed ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.14)",
              color: "rgba(255,255,255,0.9)",
            }}>
            {completed ? (
              <><CheckCircle2 size={11} /> Completado</>
            ) : (
              <><span className="w-1.5 h-1.5 rounded-full bg-[var(--ag-surface)]/60 inline-block" /> Inscripto</>
            )}
          </span>
        </div>

        {/* ── Card body ── */}
        <div className="p-4">
          <h3 className="font-semibold text-sm leading-snug mb-1"
            style={{ color: "var(--ag-text)" }}>
            {title}
          </h3>
          <p className="text-xs mb-3 line-clamp-1" style={{ color: "var(--ag-text-muted)" }}>
            {description ?? "Sin descripción"}
          </p>
          <ProgressBar value={progress} />
        </div>
      </Link>
    </div>
  );
}
