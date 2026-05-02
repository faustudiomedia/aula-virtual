"use client";

import Link from "next/link";
import { useTeacherCourses } from "@/lib/hooks/use-data";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Course, Material } from "@/lib/types";

interface Props {
  teacherId: string;
}

// ── Type badge config ────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  pdf: {
    label: "PDF",
    icon: "📄",
    bg: "rgba(239,68,68,0.08)",
    text: "#DC2626",
    border: "rgba(239,68,68,0.18)",
  },
  video: {
    label: "Video",
    icon: "🎬",
    bg: "rgba(124,58,237,0.08)",
    text: "#7C3AED",
    border: "rgba(124,58,237,0.18)",
  },
  image: {
    label: "Imagen",
    icon: "🖼️",
    bg: "rgba(16,185,129,0.08)",
    text: "#059669",
    border: "rgba(16,185,129,0.18)",
  },
  link: {
    label: "Enlace",
    icon: "🔗",
    bg: "rgba(59,130,246,0.08)",
    text: "#2563EB",
    border: "rgba(59,130,246,0.18)",
  },
};

const DEFAULT_TYPE = {
  label: "Archivo",
  icon: "📎",
  bg: "rgba(107,114,128,0.08)",
  text: "#6B7280",
  border: "rgba(107,114,128,0.18)",
};

function TypeBadge({ type }: { type?: string | null }) {
  const cfg = TYPE_CONFIG[type ?? ""] ?? DEFAULT_TYPE;
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.02em",
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: "10px" }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
      {[0, 1].map((si) => (
        <div key={si}>
          <div
            style={{
              height: "20px",
              width: "200px",
              background: "var(--ag-surface-alt)",
              borderRadius: "6px",
              marginBottom: "12px",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: "64px",
                  background: "var(--ag-surface)",
                  border: "1px solid var(--ag-border-light)",
                  borderRadius: "12px",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AllMaterialsView({ teacherId }: Props) {
  const { data: courses = [], isLoading: loadingCourses } =
    useTeacherCourses(teacherId);

  const courseIds = courses.map((c: Course) => c.id);

  const { data: materials = [], isLoading: loadingMaterials } = useQuery({
    queryKey: ["materials", "teacher", teacherId, courseIds],
    queryFn: async () => {
      if (!courseIds.length) return [] as Material[];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .in("course_id", courseIds)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Material[];
    },
    enabled: courseIds.length > 0,
  });

  const isLoading = loadingCourses || (courseIds.length > 0 && loadingMaterials);
  const totalMaterials = materials.length;

  // Count by type for summary chips
  const byType = materials.reduce<Record<string, number>>((acc, m) => {
    const t = m.file_type ?? "otro";
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: "clamp(1rem, 3vw, 2rem)", maxWidth: "860px", margin: "0 auto" }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--ag-text)",
            margin: 0,
          }}
        >
          Materiales
        </h1>
        <p
          style={{
            color: "var(--ag-text-muted)",
            marginTop: "4px",
            fontSize: "0.875rem",
          }}
        >
          {isLoading
            ? "Cargando…"
            : `${totalMaterials} material${totalMaterials !== 1 ? "es" : ""} en ${courses.length} curso${courses.length !== 1 ? "s" : ""}`}
        </p>

        {/* Type summary chips — only when there are materials */}
        {!isLoading && totalMaterials > 0 && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginTop: "12px",
            }}
          >
            {Object.entries(byType).map(([type, count]) => {
              const cfg = TYPE_CONFIG[type] ?? DEFAULT_TYPE;
              return (
                <span
                  key={type}
                  style={{
                    background: cfg.bg,
                    color: cfg.text,
                    border: `1px solid ${cfg.border}`,
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  {cfg.icon} {count} {cfg.label.toLowerCase()}
                  {count !== 1 ? "s" : ""}
                </span>
              );
            })}
          </d