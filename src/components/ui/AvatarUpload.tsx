'use client'

import { useRef, useState } from 'react'

interface Props {
  currentUrl: string | null
  name: string
}

export function AvatarUpload({ currentUrl, name }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  const initial = (name || '?').charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 group"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white text-2xl font-bold">
            {initial}
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-xs font-medium">Cambiar</span>
        </div>
      </button>
      <div>
        <p className="text-sm font-medium text-[#050F1F] mb-1">Foto de perfil</p>
        <p className="text-xs text-[#050F1F]/40 mb-2">JPG, PNG o WebP · máx. 2 MB</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs px-3 py-1.5 rounded-lg border border-black/10 text-[#050F1F]/60 hover:bg-black/5 transition-all"
        >
          Subir foto
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        name="avatar"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
