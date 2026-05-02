"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  folder: string;
  accept?: string;
  onUpload: (url: string) => void;
  onError?: (msg: string) => void;
}

export default function FileUpload({ folder, accept, onUpload, onError }: Props) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from("materials").upload(path, file);
    if (error) {
      onError?.(error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("materials").getPublicUrl(path);
    setFileName(file.name);
    onUpload(data.publicUrl);
    setUploading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-3 py-2 rounded-lg border border-black/10 bg-white text-sm text-[var(--ag-text)]/70 hover:bg-[rgba(30,58,95,0.06)] transition disabled:opacity-50 flex items-center gap-1.5"
      >
        <span>{uploading ? "⏳" : "📎"}</span>
        {uploading ? "Subiendo..." : "Seleccionar archivo"}
      </button>
      {fileName && (
        <span className="text-xs text-green-600 truncate max-w-[160px]">✓ {fileName}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
