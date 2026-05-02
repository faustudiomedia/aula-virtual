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

// ── Type config (same palette as AllMaterialsView) ───────────────────────────
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

// ── TypeBadge ────────────────────────────────────────────────────────────────
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

// ── Input helper ─────────────────────────────────────────────────────────────
function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label?: string;
}) {
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

// ── Add Material Form (collapsible) ──────────────────────────────────────────
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
  const [isPending, startTransition] = useTransition();
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
        <span style={{ fontSize: "16px", lineHeight: 1 }}>＋</span>
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
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--ag-text)",
          }}
        >
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
          ×
        </button>
      </div>

      <FormError message={formError} />

      <form
        ref={formRef}
        action={handleAdd}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        {/* Row 1: title + type */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: "10px" }}>
          <Field label="Título *">
            <input
              name="title"
              required
              placeholder="Ej: Clase 1 — Introducción"
              style={INPUT_STYLE}
            />
          </Field>
          <Field label="Tipo">
            <select name="file_type" style={{ ...INPUT_STYLE, background: "var(--ag-bg)" }}>
              <option value="">— Tipo —</option>
              <option value="pdf">📄 PDF</option>
              <option value="video">🎬 Video</option>
              <option value="link">🔗 Enlace</option>
              <option value="image">🖼️ Imagen</option>
            </select>
          </Field>
        </div>

        {/* Row 2: module number + module title */}
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "10px" }}>
          <Field label="Módulo #">
            <input
              name="module_number"
              type="number"
              min="1"
              placeholder="1"
              style={INPUT_STYLE}
            />
          </Field>
          <Field label="Título del módulo">
            <input
              name="module_title"
              placeholder="Ej: Introducción al curso"
              style={INPUT_STYLE}
            />
          </Field>
        </div>

        {/* Row 3: description */}
        <Field label="Descripción (opcional)">
          <input
            name="description"
            placeholder="Breve descripción del material"
            style={INPUT_STYLE}
          />
        </Field>

        {/* Row 4: URL / File toggle */}
        <Field label="Contenido">
          <div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
              {(["url", "file"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setUrlMode(mode);
                    setFileUrl("");
                    setUploadError(null);
                  }}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "7px",
                    border: "1px solid",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.12s",
                    ...(urlMode === mode
                      ? {
                          background: "var(--ag-navy)",
                          color: "#fff",
                          borderColor: "var(--ag-navy)",
                        }
                      : {
                          background: "transparent",
                          color: "var(--ag-text-muted)",
                          borderColor: "var(--ag-border)",
                        }),
                  }}
                >
                  {mode === "url" ? "🔗 URL / Enlace" : "📎 Subir archivo"}
                </button>
              ))}
            </div>

            {urlMode === "url" ? (
              <input
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://... (Google Drive, YouTube, etc.)"
                style={IN