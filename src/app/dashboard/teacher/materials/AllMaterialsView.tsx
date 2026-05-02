"use client";

import Link from "next/link";
import { useTeacherCourses } from "@/lib/hooks/use-data";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Course, Material } from "@/lib/types";

interface Props {
  teacherId: string;
}

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
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

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

  const byType = materials.reduce<Record<string, number>>((acc, m) => {
    const t = m.file_type ?? "otro";
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: "clamp(1rem, 3vw, 2rem)", maxWidth: "860px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--ag-text)", margin: 0 }}>
          Materiales
        </h1>
        <p style={{ color: "var(--ag-text-muted)", marginTop: "4px", fontSize: "0.875rem" }}>
          {isLoading
            ? "Cargando…"
            : `${totalMaterials} material${totalMaterials !== 1 ? "es" : ""} en ${courses.length} curso${courses.length !== 1 ? "s" : ""}`}
        </p>
        {!isLoading && totalMaterials > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
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
                  {cfg.icon} {count} {cfg.label.toLowerCase()}{count !== 1 ? "s" : ""}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {isLoading ? (
        <Skeleton />
      ) : courses.length === 0 ? (
        <div
          style={{
            border: "2px dashed var(--ag-border)",
            borderRadius: "16px",
            padding: "3rem 2rem",
            textAlign: "center",
            marginTop: "2rem",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📚</div>
          <p style={{ color: "var(--ag-text-secondary)", fontWeight: 600, fontSize: "1rem", margin: "0 0 6px" }}>
            Todavía no tenés cursos
          </p>
          <p style={{ color: "var(--ag-text-muted)", fontSize: "0.875rem", margin: "0 0 20px" }}>
            Creá tu primer curso para empezar a cargar materiales.
          </p>
          <Link
            href="/dashboard/teacher/courses/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--ag-navy)",
              color: "#fff",
              padding: "8px 20px",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            ＋ Crear primer curso
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {courses.map((course: Course, courseIdx: number) => {
            const courseMaterials = materials.filter((m: Material) => m.course_id === course.id);
            const avatarGradients = [
              "linear-gradient(135deg, var(--ag-navy) 0%, var(--ag-navy-light) 100%)",
              "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
              "linear-gradient(135deg, #059669 0%, #34D399 100%)",
              "linear-gradient(135deg, #DC2626 0%, #FCA5A5 100%)",
              "linear-gradient(135deg, #D97706 0%, #FCD34D 100%)",
            ];
            const avatarGradient = avatarGradients[courseIdx % avatarGradients.length];

            return (
              <div key={course.id}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: avatarGradient,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {course.title.charAt(0).toUpperCase()}
                    </div>
                    <h2
                      style={{
                        fontSize: "0.9375rem",
                        fontWeight: 600,
                        color: "var(--ag-text)",
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {course.title}
                    </h2>
                    <span
                      style={{
                        background: "var(--ag-surface-alt)",
                        color: "var(--ag-text-muted)",
                        border: "1px solid var(--ag-border-light)",
                        padding: "1px 8px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 500,
                        flexShrink: 0,
                      }}
                    >
                      {courseMaterials.length}
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/teacher/courses/${course.id}/materials`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      background: "var(--ag-navy)",
                      color: "#fff",
                      padding: "5px 14px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      textDecoration: "none",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: "14px", lineHeight: 1 }}>＋</span>
                    Agregar
                  </Link>
                </div>

                {courseMaterials.length === 0 ? (
                  <div
                    style={{
                      border: "1.5px dashed var(--ag-border)",
                      borderRadius: "12px",
                      padding: "1.25rem 1.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "1.25rem" }}>📂</span>
                      <span style={{ color: "var(--ag-text-muted)", fontSize: "0.875rem" }}>
                        Este curso no tiene materiales aún.
                      </span>
                    </div>
                    <Link
                      href={`/dashboard/teacher/courses/${course.id}/materials`}
                      style={{
                        color: "var(--ag-navy)",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        textDecoration: "none",
                        flexShrink: 0,
                      }}
                    >
                      Agregar ahora →
                    </Link>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "var(--ag-surface)",
                      border: "1px solid var(--ag-border-light)",
                      borderRadius: "14px",
                      overflow: "hidden",
                    }}
                  >
                    {courseMaterials.map((m: Material, idx: number) => (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          padding: "12px 18px",
                          borderBottom:
                            idx < courseMaterials.length - 1
                              ? "1px solid var(--ag-border-light)"
                              : "none",
                        }}
                      >
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "9px",
                            background: (TYPE_CONFIG[m.file_type ?? ""] ?? DEFAULT_TYPE).bg,
                            border: `1px solid ${(TYPE_CONFIG[m.file_type ?? ""] ?? DEFAULT_TYPE).border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                            flexShrink: 0,
                          }}
                        >
                          {(TYPE_CONFIG[m.file_type ?? ""] ?? DEFAULT_TYPE).icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              color: "var(--ag-text)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {m.title}
                          </p>
                          {m.description && (
                            <p
                              style={{
                                margin: "2px 0 0",
                                fontSize: "0.75rem",
                                color: "var(--ag-text-muted)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {m.description}
                            </p>
                          )}
                        </div>
                        {m.file_type && <TypeBadge type={m.file_type} />}
                        {m.file_url && (
                          <a
                            href={m.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "var(--ag-navy)",
                              fontSize: "0.8125rem",
                              fontWeight: 600,
                              textDecoration: "none",
                              flexShrink: 0,
                            }}
                          >
                            Ver ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
