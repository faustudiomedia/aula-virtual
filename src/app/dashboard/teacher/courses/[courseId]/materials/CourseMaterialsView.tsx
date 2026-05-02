"use client";

import { useTransition, useRef, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCourse, useCourseMaterials, queryKeys } from "@/lib/hooks/use-data";
import { addMaterial } from "@/app/actions/courses";
import SubmitButton from "@/components/ui/SubmitButton";
import FormError from "@/components/ui/FormError";
import FileUpload from "@/components/ui/FileUpload";
import {
  EditMaterialButton,
  DeleteMaterialButton,
} from "@/components/ui/MaterialActions";
import type { Material } from "@/lib/types";

interface Props {
  courseId: string;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; bg: string; color: string; border: string }
> = {
  pdf: {
    label: "PDF",
    icon: "📄",
    bg: "rgba(239,68,68,0.08)",
    color: "#DC2626",
    border: "rgba(239,68,68,0.18)",
  },
  video: {
    label: "Video",
    icon: "🎬",
    bg: "rgba(124,58,237,0.08)",
    color: "#7C3AED",
    border: "rgba(124,58,237,0.18)",
  },
  image: {
    label: "Imagen",
    icon: "🖼️",
    bg: "rgba(16,185,129,0.08)",
    color: "#059669",
    border: "rgba(16,185,129,0.18)",
  },
  link: {
    label: "Enlace",
    icon: "🔗",
    bg: "rgba(59,130,246,0.08)",
    color: "#2563EB",
    border: "rgba(59,130,246,0.18)",
  },
};
const DEFAULT_TYPE = {
  label: "Archivo",
  icon: "📎",
  bg: "rgba(107,114,128,0.08)",
  color: "#6B7280",
  border: "rgba(107,114,128,0.18)",
};

function typeCfg(t?: string | null) {
  return TYPE_CONFIG[t ?? ""] ?? DEFAULT_TYPE;
}

function TypeBadge({ type }: { type?: string | null }) {
  const cfg = typeCfg(type);
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        padding: "2px 9px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: "10px" }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid var(--ag-border)",
  background: "var(--ag-bg)",
  color: "var(--ag-text)",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

function Field({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {label && (
        <label
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--ag-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

function AddMaterialForm({
  courseId,
  totalMaterials,
  onSuccess,
}: {
  courseId: string;
  totalMaterials: number;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [urlMode, setUrlMode] = useState<"url" | "file">("url");
  const [fileUrl, setFileUrl] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleAdd(formData: FormData) {
    formData.set("file_url", fileUrl);
    formData.set("order_index", String(totalMaterials));
    setFormError(null);
    startTransition(async () => {
      const result = await addMaterial(courseId, formData);
      if (!result.success) {
        setFormError(result.error);
        return;
      }
      formRef.current?.reset();
      setFileUrl("");
      setUrlMode("url");
      setUploadError(null);
      onSuccess();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "var(--ag-navy)",
          color: "#fff",
          border: "none",
          padding: "8px 18px",
          borderRadius: "9px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "16px", lineHeight: 1 }}>+</span>
        Agregar material
      </button>
    );
  }

  return (
    <div
      style={{
        background: "var(--ag-surface)",
        border: "1px solid var(--ag-border)",
        borderRadius: "14px",
        padding: "20px",
        marginBottom: "28px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--ag-text)" }}>
          Nuevo material
        </p>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: "none",
            border: "none",
            color: "var(--ag-text-muted)",
            fontSize: "18px",
            cursor: "pointer",
            lineHeight: 1,
            padding: "2px 6px",
          }}
        >
          x
        </button>
      </div>

      <FormError message={formError} />

      <form
        ref={formRef}
        action={handleAdd}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: "10px" }}>
          <Field label="Titulo *">
            <input name="title" required placeholder="Ej: Clase 1 - Introduccion" style={INPUT_STYLE} />
          </Field>
          <Field label="Tipo">
            <select name="file_type" style={{ ...INPUT_STYLE, background: "var(--ag-bg)" }}>
              <option value="">Tipo</option>
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
              <option value="link">Enlace</option>
              <option value="image">Imagen</option>
            </select>
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "10px" }}>
          <Field label="Modulo #">
            <input name="module_number" type="number" min="1" placeholder="1" style={INPUT_STYLE} />
          </Field>
          <Field label="Titulo del modulo">
            <input name="module_title" placeholder="Ej: Introduccion al curso" style={INPUT_STYLE} />
          </Field>
        </div>

        <Field label="Descripcion (opcional)">
          <input name="description" placeholder="Breve descripcion del material" style={INPUT_STYLE} />
        </Field>

        <Field label="Contenido">
          <div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
              {(["url", "file"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { setUrlMode(mode); setFileUrl(""); setUploadError(null); }}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "7px",
                    border: "1px solid",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.12s",
                    ...(urlMode === mode
                      ? { background: "var(--ag-navy)", color: "#fff", borderColor: "var(--ag-navy)" }
                      : { background: "transparent", color: "var(--ag-text-muted)", borderColor: "var(--ag-border)" }),
                  }}
                >
                  {mode === "url" ? "URL / Enlace" : "Subir archivo"}
                </button>
              ))}
            </div>

            {urlMode === "url" ? (
              <input
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://... (Google Drive, YouTube, etc.)"
                style={INPUT_STYLE}
              />
            ) : (
              <div>
                <FileUpload
                  folder={`courses/${courseId}`}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.webm,.png,.jpg,.jpeg,.gif"
                  onUpload={(url) => { setFileUrl(url); setUploadError(null); }}
                  onError={(msg) => setUploadError(msg)}
                />
                {uploadError && (
                  <p style={{ color: "#DC2626", fontSize: "12px", marginTop: "4px" }}>{uploadError}</p>
                )}
                {fileUrl && urlMode === "file" && (
                  <p style={{ color: "#059669", fontSize: "12px", marginTop: "4px" }}>Archivo subido correctamente.</p>
                )}
              </div>
            )}
          </div>
        </Field>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "4px" }}>
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: "1px solid var(--ag-border)",
              background: "transparent",
              color: "var(--ag-text-secondary)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <SubmitButton label="Agregar material" loadingLabel="Agregando..." className="px-5 py-2 rounded-lg" />
        </div>
      </form>
    </div>
  );
}

function ModuleHeader({
  number, title, count, collapsed, onToggle,
}: {
  number: number | null;
  title: string | null;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "0",
        marginBottom: collapsed ? "0" : "8px",
        textAlign: "left",
      }}
    >
      {number !== null ? (
        <span
          style={{
            background: "var(--ag-navy)",
            color: "#fff",
            borderRadius: "7px",
            padding: "3px 10px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
        >
          M{number}
        </span>
      ) : (
        <span
          style={{
            background: "var(--ag-surface-alt)",
            color: "var(--ag-text-muted)",
            borderRadius: "7px",
            padding: "3px 10px",
            fontSize: "11px",
            fontWeight: 700,
            border: "1px solid var(--ag-border-light)",
            flexShrink: 0,
          }}
        >
          Sin modulo
        </span>
      )}
      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ag-text-secondary)", flex: 1 }}>
        {title ?? (number !== null ? `Modulo ${number}` : "Materiales sin modulo")}
      </span>
      <span
        style={{
          fontSize: "11px",
          color: "var(--ag-text-muted)",
          background: "var(--ag-surface-alt)",
          border: "1px solid var(--ag-border-light)",
          padding: "1px 8px",
          borderRadius: "999px",
          fontWeight: 500,
        }}
      >
        {count} material{count !== 1 ? "es" : ""}
      </span>
      <span
        style={{
          color: "var(--ag-text-muted)",
          fontSize: "12px",
          transition: "transform 0.2s",
          transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
          flexShrink: 0,
        }}
      >
        v
      </span>
    </button>
  );
}

function MaterialRow({ m, index, isLast }: { m: Material; index: number; isLast: boolean }) {
  const [hovered, setHovered] = useState(false);
  const cfg = typeCfg(m.file_type);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "11px 16px",
        borderBottom: isLast ? "none" : "1px solid var(--ag-border-light)",
        background: hovered ? "var(--ag-surface-alt)" : "transparent",
        transition: "background 0.12s",
      }}
    >
      <span
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "6px",
          background: "var(--ag-surface-alt)",
          border: "1px solid var(--ag-border-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--ag-text-muted)",
          flexShrink: 0,
        }}
      >
        {index + 1}
      </span>
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "8px",
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "15px",
          flexShrink: 0,
        }}
      >
        {cfg.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
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
              fontSize: "11px",
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
            fontSize: "12px",
            fontWeight: 600,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          Ver
        </a>
      )}
      <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
        <EditMaterialButton material={m} />
        <DeleteMaterialButton materialId={m.id} materialTitle={m.title} />
      </div>
    </div>
  );
}

export default function CourseMaterialsView({ courseId }: Props) {
  const queryClient = useQueryClient();
  const { data: course, isLoading: loadingCourse } = useCourse(courseId);
  const { data: materials = [], isLoading: loadingMaterials } = useCourseMaterials(courseId);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleCollapsed(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const groups = useMemo(() => {
    const map = new Map<string, { number: number | null; title: string | null; items: Material[] }>();
    for (const m of materials) {
      const key = m.module_number !== null ? String(m.module_number) : "__none__";
      if (!map.has(key)) {
        map.set(key, { number: m.module_number, title: m.module_title, items: [] });
      }
      map.get(key)!.items.push(m);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        if (a === "__none__") return 1;
        if (b === "__none__") return -1;
        return Number(a) - Number(b);
      })
      .map(([key, val]) => ({ key, ...val }));
  }, [materials]);

  const isLoading = loadingCourse || loadingMaterials;

  if (isLoading) {
    return (
      <div style={{ padding: "clamp(1rem, 3vw, 2rem)", maxWidth: "860px", margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[80, 200, 64, 64, 64].map((h, i) => (
            <div
              key={i}
              style={{
                height: `${h}px`,
                borderRadius: "10px",
                background: "var(--ag-surface)",
                border: "1px solid var(--ag-border-light)",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={{ padding: "2rem" }}>
        <p style={{ color: "var(--ag-text-muted)" }}>Curso no encontrado.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "clamp(1rem, 3vw, 2rem)", maxWidth: "860px", margin: "0 auto" }}>
      <a
        href="/dashboard/teacher"
        style={{
          color: "var(--ag-navy)",
          fontSize: "13px",
          fontWeight: 500,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          marginBottom: "12px",
        }}
      >
        Mis cursos
      </a>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "var(--ag-text)" }}>
            {course.title}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--ag-text-muted)" }}>
            {materials.length} material{materials.length !== 1 ? "es" : ""}
            {groups.length > 0 &&
              ` - ${groups.filter((g) => g.number !== null).length} modulo${
                groups.filter((g) => g.number !== null).length !== 1 ? "s" : ""
              }`}
          </p>
        </div>

        <AddMaterialForm
          courseId={courseId}
          totalMaterials={materials.length}
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: queryKeys.courseMaterials(courseId) })
          }
        />
      </div>

      {materials.length === 0 && (
        <div
          style={{
            border: "2px dashed var(--ag-border)",
            borderRadius: "14px",
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>📂</div>
          <p style={{ color: "var(--ag-text-secondary)", fontWeight: 600, margin: "0 0 6px" }}>
            Este curso no tiene materiales aun
          </p>
          <p style={{ color: "var(--ag-text-muted)", fontSize: "13px", margin: 0 }}>
            Usa el boton Agregar material para empezar a armar el contenido.
          </p>
        </div>
      )}

      {groups.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {groups.map((group) => (
            <div key={group.key}>
              <ModuleHeader
                number={group.number}
                title={group.title}
                count={group.items.length}
                collapsed={!!collapsed[group.key]}
                onToggle={() => toggleCollapsed(group.key)}
              />
              {!collapsed[group.key] && (
                <div
                  style={{
                    background: "var(--ag-surface)",
                    border: "1px solid var(--ag-border-light)",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  {group.items.map((m, idx) => (
                    <MaterialRow
                      key={m.id}
                      m={m}
                      index={idx}
                      isLast={idx === group.items.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
