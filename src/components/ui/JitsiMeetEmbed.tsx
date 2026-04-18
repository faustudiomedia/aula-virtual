'use client'

import { useState } from 'react'
import { MeetingChatPanel } from './MeetingChatPanel'

interface Props {
  roomName: string
  displayName: string
  courseTitle: string
  meetingId: string
  userId: string
}

export function JitsiMeetEmbed({ roomName, displayName, courseTitle, meetingId, userId }: Props) {
  const [joined, setJoined] = useState(false)

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#EFF6FF] flex items-center justify-center text-4xl mb-6">
          🎥
        </div>
        <h2 className="text-xl font-bold text-[#050F1F] mb-2">Sala de reunión</h2>
        <p className="text-[#050F1F]/50 text-sm mb-1">{courseTitle}</p>
        <p className="text-xs text-[#050F1F]/30 mb-8 max-w-xs">
          Al unirte se activará tu cámara y micrófono. Podés desactivarlos dentro de la reunión.
        </p>
        <button
          onClick={() => setJoined(true)}
          className="px-8 py-3 rounded-xl bg-[#1A56DB] text-white font-semibold text-sm hover:bg-[#1A56DB]/90 transition-all shadow-lg shadow-[#1A56DB]/20"
        >
          Unirse a la reunión
        </button>
      </div>
    )
  }

  const src = `https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(displayName)}"&config.prejoinPageEnabled=false`

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={() => setJoined(false)}
          className="text-xs px-3 py-1.5 rounded-lg border border-black/10 text-[#050F1F]/50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
        >
          Salir de la reunión
        </button>
      </div>
      <div className="flex gap-4 flex-1 min-h-0">
        <iframe
          src={src}
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          className="flex-1 rounded-2xl border border-black/10 shadow-sm"
          style={{ border: 'none' }}
        />
        <div className="w-72 flex-shrink-0">
          <MeetingChatPanel meetingId={meetingId} userId={userId} displayName={displayName} />
        </div>
      </div>
    </div>
  )
}
