"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { deleteMaterial, updateMaterial } from "@/app/actions/courses";
import type { Material } from "@/lib/types";
import FormError from "./FormError";

export function DeleteMaterialButton({
  materialId,
  materialTitle,
}: {
  materialId: string;
  materialTitle: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMaterial(materialId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
          <p className="text-4xl mb-3">🗑️</p>
          <h2 className="text-lg font-bold text-[var(--ag-text)] mb-2">
            ¿Eliminar material?
          </h2>
          <p className="text-sm text-[var(--ag-text-muted)] mb-4">
            Se eliminará <strong>{materialTitle}</strong>. Esta acción no se
            puede deshacer.
          </p>
          <FormError message={error} />
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 py-2 rounded-xl bg-red-600 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60"
            >
              {isPending ? "Eliminando..." : "Sí, eliminar"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 py-2 rounded-xl border border-black/10 text-[var(--ag-text)]/70 font-semibold text-sm hover:bg-black/5 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition border border-red-200"
    >
      🗑️
    </button>
  );
}

export function EditMaterialButton({ material }: { material: Material }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (!(fd.get("title") as string)?.trim()) {
      setFieldErrors({ title: "El título es requerido" });
      return;
    }
    setFieldErrors({});
    startTransition(async () => {
      const result = await updateMaterial(material.id, fd);
      if (!result.success) {
        setError(result.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      router.refresh();
      setEditing(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setEditing(true)}
        className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium transition border border-amber-200"
      >
        ✏️
      </button>
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-[var(--ag-text)] mb-4">
              Editar material
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <FormError message={error} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    name="title"
                    defaultValue={material.title}
                    placeholder="Título *"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 ${fieldErrors.title ? "border-red-400" : "border-black/10"}`}
                  />
                  {fieldErrors.title && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.title}
                    </p>
                  )}
                </div>
                <select
                  name="file_type"
                  defaultValue={material.file_type ?? ""}
                  className="px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 bg-white"
                >
                  <option value="">Tipo de archivo</option>
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                  <option value="link">Enlace</option>
                  <option value="image">Imagen</option>
                </select>
              </div>
              <input
                name="description"
                defaultValue={material.description ?? ""}
                placeholder="Descripción (opcional)"
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
              />
              <div className="flex gap-3">
                <input
                  name="file_url"
                  defaultValue={material.file_url ?? ""}
                  placeholder="URL del archivo o enlace"
                  className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
                />
                <input
                  name="order_index"
                  type="number"
                  min="0"
                  defaultValue={material.order_index}
                  placeholder="Orden"
                  className="w-24 px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 rounded-xl bg-[var(--ag-navy)] text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60"
                >
                  {isPending ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2 rounded-xl border border-black/10 text-[var(--ag-text)]/70 font-semibold text-sm hover:bg-black/5 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
