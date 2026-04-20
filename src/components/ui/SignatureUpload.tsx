'use client'

import { useRef, useState } from 'react'
import { FileSignature } from 'lucide-react'

interface Props {
  currentUrl: string | null
}

export function SignatureUpload({ currentUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="block text-sm font-medium text-[#050F1F]">Firma Electrónica</label>
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative w-48 h-20 rounded-xl border-2 border-dashed border-[#1A56DB]/30 bg-[#EFF6FF] overflow-hidden flex items-center justify-center group transition-colors hover:border-[#1A56DB] hover:bg-white"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Firma" className="max-w-full max-h-full object-contain p-2 mix-blend-multiply" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-[#1A56DB]/60 mix-blend-multiply">
              <FileSignature size={24} />
              <span className="text-xs font-semibold">Subir PNG sin fondo</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-medium">Reemplazar</span>
          </div>
        </button>
        <div className="flex-1 mt-1">
          <p className="text-xs text-[#050F1F]/50 mb-2 leading-relaxed">
            Subí una imagen de tu firma (idealmente en formato <strong>PNG transparente</strong>). 
            Se utilizará para validar certificados digitales aprobados.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs px-4 py-2 rounded-lg font-semibold border-2 border-black/5 text-[#050F1F]/60 hover:bg-black/5 transition-all"
          >
            Elegir archivo local
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          name="signature"
          accept="image/png"
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </div>
  )
}
